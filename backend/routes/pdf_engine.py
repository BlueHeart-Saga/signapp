import fitz  # PyMuPDF
import base64
import json
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont, ImageChops
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
import re
import os
from bson import ObjectId


class PDFEngine:
    """
    Complete PDF Engine with full support for all field types.
    """
    
    # Field type constants
    FIELD_TYPES = {
        "signature": "image",
        "initials": "image_or_text", 
        "date": "text",
        "textbox": "text",
        "checkbox": "boolean",
        "radio": "selection",
        "dropdown": "selection",
        "attachment": "file",
        "approval": "boolean",
        "witness_signature": "image",
        "stamp": "image",
        "mail": "text"
    }
    
    @staticmethod
    def decode_base64_image(b64_string: str) -> Optional[bytes]:
        """Safely decode Base64 image data. Returns None if invalid."""
        try:
            if not b64_string:
                return None

            # Must be string
            if not isinstance(b64_string, str):
                return None

            # Must look like image base64
            if not b64_string.startswith("data:image"):
                return None

            # Split header
            try:
                header, data = b64_string.split(",", 1)
            except ValueError:
                return None

            # Remove whitespace
            data = re.sub(r"\s+", "", data)

            # Ensure valid base64 length by adding padding if missing
            missing_padding = len(data) % 4
            if missing_padding:
                data += '=' * (4 - missing_padding)

            # Base64 length must be valid (at least some content)
            if len(data) < 8:
                return None

            return base64.b64decode(data, validate=False)  # validate=False to allow slightly malformed but readable data

        except Exception as e:
            # 🔕 Silent fail (no noisy logs in prod)
            return None

    
    @staticmethod
    def convert_stored_to_pdf_coordinates(field: Dict, page_width: float, page_height: float, page_rect=None) -> Dict[str, float]:
        """
        Bullet-proof coordinate conversion for all coordinate systems.
        Returns top-based coordinates for PyMuPDF.
        """
        def safe_float(value, default=0.0):
            try:
                return float(value) if value is not None else float(default)
            except:
                return float(default)

        # Get absolute offsets if available (PyMuPDF pages can have non-zero origins)
        x0 = page_rect.x0 if page_rect else 0
        y0 = page_rect.y0 if page_rect else 0
        
        path_taken = "none"
        res_x = 0
        res_y = 0
        res_w = 100
        res_h = 40

        # Priority 1: Use PDF coordinates if available (BACKEND-CALCULATED / SOURCE OF TRUTH)
        # These are absolute points in the PDF's coordinate system
        if field.get("pdf_x") is not None and field.get("pdf_y") is not None:
            path_taken = "Priority 1 (Stored PDF Points)"
            x_stored = safe_float(field.get("pdf_x"))
            y_stored = safe_float(field.get("pdf_y")) # Stored as bottom-based
            res_w = safe_float(field.get("pdf_width"), 100)
            res_h = safe_float(field.get("pdf_height"), 40)
            
            # Convert bottom-based to top-based + add offset
            res_x = x0 + x_stored
            res_y = y0 + (page_height - y_stored - res_h)
        
        # Priority 2: Use canvas coordinates with conversion context (SCALING FALLBACK)
        # These are scale-independent relative to the UI canvas used to place them
        elif "canvas_x" in field and "canvas_y" in field and field.get("canvas_width") and field.get("canvas_height"):
            path_taken = "Priority 2 (Canvas Ratio)"
            canvas_x = safe_float(field.get("canvas_x"))
            canvas_y = safe_float(field.get("canvas_y"))
            canvas_width = safe_float(field.get("canvas_width"), 794.0)
            canvas_height = safe_float(field.get("canvas_height"), 1123.0)
            
            field_width_px = safe_float(field.get("width"), 160.0)
            field_height_px = safe_float(field.get("height"), 32.0)
            
            # Map normalized proportions to actual page size + offset
            res_x = x0 + (canvas_x / canvas_width) * page_width
            res_y = y0 + (canvas_y / canvas_height) * page_height
            
            # 🔥 FIX: Use exact PDF units for size if provided, otherwise scale pixels
            # This prevents "shrunken" textboxes when canvas ratio != pdf ratio
            if field.get("pdf_width") and field.get("pdf_height"):
                res_w = safe_float(field.get("pdf_width"))
                res_h = safe_float(field.get("pdf_height"))
            else:
                res_w = (field_width_px / canvas_width) * page_width
                res_h = (field_height_px / canvas_height) * page_height
        
        # Priority 3: Fallback to standard x/y
        else:
            path_taken = "Priority 3 (Base x/y Fallback)"
            res_x = x0 + safe_float(field.get("x"))
            y_val = safe_float(field.get("y"))
            res_w = safe_float(field.get("width"), 100)
            res_h = safe_float(field.get("height"), 40)
            
            # If x/y looks like PDF points (usually < 1000) and we don't have canvas height, assume bottom-based
            # BUT if we have reason to believe it's from the UI (top-based pixels), we should flip it
            # The most common case here is fields missing pdf_y but having top-based 'y'
            if y_val < page_height + 100: # Within or slightly outside page bounds
                 # We assume bottom-based if it's from an older save that used Priority 1 logic
                 # but if it's from a modern UI save without pdf_y, it's top-based
                 # ⚡ DEFAULTING TO TOP-BASED for safety when in Priority 3
                 res_y = y0 + y_val 
            else:
                 res_y = y0 + y_val # Trust the value provided if it's large (though unusual)
        
        # LOG THE TRACE for pixel-perfect debugging
        field_id = str(field.get('id') or field.get('_id', 'new'))
        print(f"[PDF-COORD-TRACE] Field: {field.get('type', 'field')} ({field_id})")
        print(f"  - Path Taken: {path_taken}")
        print(f"  - Scaling context: Page={page_width}x{page_height}, Canvas={field.get('canvas_width')}x{field.get('canvas_height')}")
        print(f"  - Final (Top-Down): x={res_x:.2f}, y={res_y:.2f}, w={res_w:.2f}, h={res_h:.2f}")

        # Clamp to page bounds to prevent rendering off-screen
        res_x = max(x0, min(res_x, x0 + page_width - res_w))
        res_y = max(y0, min(res_y, y0 + page_height - res_h))
        
        return {
            "x": res_x,
            "y": res_y,
            "width": res_w,
            "height": res_h
        }
    
    @staticmethod
    def open_pdf(pdf_bytes: bytes) -> fitz.Document:
        """Open PDF from bytes."""
        return fitz.open(stream=pdf_bytes, filetype="pdf")
    
    @staticmethod
    def get_page_index(field: Dict, total_pages: int) -> int:
        """
        Safely get page index from field.
        Returns 0-indexed page index within PDF bounds.
        """
        # Field page should be 0-indexed
        page_index = field.get("page", 0)
        
        # Safety check: if someone sent 1-indexed, convert
        if page_index > 0 and page_index > total_pages:
            page_index = page_index - 1
        
        # Ensure page_index is within bounds
        page_index = max(0, min(page_index, total_pages - 1))
        
        return page_index
    
    @staticmethod
    def apply_all_fields(pdf_bytes: bytes, fields: List[Dict]) -> bytes:
        """
        Apply all field types to PDF with proper page handling.
        """
        if not fields:
            return pdf_bytes
        
        pdf = PDFEngine.open_pdf(pdf_bytes)
        total_pages = len(pdf)
        
        # Group fields by page for efficiency
        fields_by_page = {}
        for field in fields:
            page_index = PDFEngine.get_page_index(field, total_pages)
            
            if page_index not in fields_by_page:
                fields_by_page[page_index] = []
            
            fields_by_page[page_index].append(field)
        
        # Process each page
        for page_index, page_fields in fields_by_page.items():
            if page_index >= len(pdf):
                print(f"Warning: Page index {page_index} out of bounds. Skipping.")
                continue
            
            page = pdf[page_index]
            page_rect = page.rect
            
            for i, field in enumerate(page_fields):
                try:
                    # Convert coordinates
                    coords = PDFEngine.convert_stored_to_pdf_coordinates(
                        field,
                        page_rect.width,
                        page_rect.height,
                        page_rect=page_rect
                    )
                    
                    # Create rectangle
                    rect = fitz.Rect(
                        coords["x"],
                        coords["y"],
                        coords["x"] + coords["width"],
                        coords["y"] + coords["height"]
                    )
                    
                    # Apply field
                    handler = getattr(PDFEngine, f"_apply_{field.get('type', 'textbox')}_field", None)
                    if handler:
                        handler(page, rect, field.get("value"), field)
                    else:
                        PDFEngine._apply_textbox_field(page, rect, field.get("value"), field)
                        
                except Exception as e:
                    print(f"Error applying field: {e}")
                    continue
        
        result = pdf.tobytes(clean=True)
        pdf.close()
        return result
    
    @staticmethod
    def _parse_color_hex(color_val, default=(0, 0, 0)):
        """Parse hex color or tuple/list to RGB float tuple (0.0 - 1.0)."""
        if isinstance(color_val, (list, tuple)) and len(color_val) == 3:
            return tuple(color_val)
        if isinstance(color_val, str) and color_val.startswith("#"):
            c = color_val.lstrip("#")
            if len(c) == 6:
                try:
                    return (int(c[0:2], 16) / 255.0, int(c[2:4], 16) / 255.0, int(c[4:6], 16) / 255.0)
                except Exception:
                    pass
        return default

    @staticmethod
    def _get_signature_font_args(font_family=""):
        """
        Map requested font family to either a high-quality TrueType font file or built-in PDF font.
        PyMuPDF embeds TrueType font subsets into the PDF for crisp vector rendering on all devices.
        """
        family = (font_family or "").lower().strip()
        win_fonts = os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts")
        
        # Handwriting / Cursive fonts
        if any(k in family for k in ["script", "dance", "dancing", "pacifico", "vibes", "sacramento", "brush", "alex", "allura", "caveat", "satisfy", "cursive"]):
            candidates = [
                os.path.join(win_fonts, "segoesc.ttf"),      # Segoe Script
                os.path.join(win_fonts, "BRUSHSCI.TTF"),     # Brush Script MT
                os.path.join(win_fonts, "FREESCPT.TTF"),     # Freestyle Script
            ]
            for c in candidates:
                if os.path.exists(c):
                    return {"fontfile": c}
            return {"fontname": "Times-Italic"}
        
        # Formal / Serif fonts
        if any(k in family for k in ["times", "georgia", "serif", "formal"]):
            times_path = os.path.join(win_fonts, "timesi.ttf")
            if os.path.exists(times_path):
                return {"fontfile": times_path}
            return {"fontname": "Times-Italic"}
            
        # Monospace
        if any(k in family for k in ["courier", "mono"]):
            cour_path = os.path.join(win_fonts, "couri.ttf")
            if os.path.exists(cour_path):
                return {"fontfile": cour_path}
            return {"fontname": "Courier-Oblique"}
            
        # Modern / Sans fonts (Arial, Roboto, Calibri, Verdana, etc.)
        if any(k in family for k in ["arial", "roboto", "calibri", "verdana", "sans"]):
            arial_path = os.path.join(win_fonts, "ariali.ttf")
            if os.path.exists(arial_path):
                return {"fontfile": arial_path}
            return {"fontname": "Helvetica-Oblique"}
            
        # Default handwriting fallback: Segoe Script if available, else Times-Italic
        segoe_path = os.path.join(win_fonts, "segoesc.ttf")
        if os.path.exists(segoe_path):
            return {"fontfile": segoe_path}
        brush_path = os.path.join(win_fonts, "BRUSHSCI.TTF")
        if os.path.exists(brush_path):
            return {"fontfile": brush_path}
        return {"fontname": "Times-Italic"}

    @staticmethod
    def _render_vector_signature_text(page, rect, text: str, font_family: str = "", font_color=(0, 0, 0)):
        """
        Renders native vector text into the given bounding box with crisp, infinite-resolution glyphs.
        Auto-scales font size to fit within bounds and centers horizontally/vertically.
        """
        if not text:
            return
            
        font_args = PDFEngine._get_signature_font_args(font_family)
        font_file = font_args.get("fontfile")
        font_name = font_args.get("fontname")
        
        fitz_font = None
        if font_file and os.path.exists(font_file):
            try:
                fitz_font = fitz.Font(fontfile=font_file)
            except Exception:
                font_file = None
                font_name = "Times-Italic"
                
        def measure(txt, sz):
            if fitz_font:
                try:
                    return fitz_font.text_length(txt, fontsize=sz)
                except Exception:
                    pass
            try:
                return fitz.get_text_length(txt, fontname=font_name or "Times-Italic", fontsize=sz)
            except Exception:
                return len(txt) * sz * 0.55

        pad_x = 6.0
        max_w = max(10.0, rect.width - (pad_x * 2))
        fontsize = min(30.0, rect.height * 0.72)
        min_size = 7.0
        
        while fontsize > min_size:
            w = measure(text, fontsize)
            if w <= max_w:
                break
            fontsize -= 0.5
            
        if fontsize < min_size:
            fontsize = min_size
            
        tw = measure(text, fontsize)
        if tw > max_w:
            # Expand rect to the right so signature text is never cut off
            new_w = tw + (pad_x * 2)
            rect = fitz.Rect(rect.x0, rect.y0, rect.x0 + new_w, rect.y1)
            
        start_x = rect.x0 + max(pad_x, (rect.width - tw) / 2.0)
        # Baseline positioning: center of box + ~33% of font size
        base_y = rect.y0 + (rect.height / 2.0) + (fontsize * 0.33)
        
        kw = {"fontfile": font_file} if (font_file and fitz_font) else {"fontname": font_name or "Times-Italic"}
        try:
            page.insert_text(
                fitz.Point(start_x, base_y),
                text,
                fontsize=fontsize,
                color=font_color,
                overlay=True,
                **kw
            )
        except Exception as e:
            print(f"Error inserting vector signature text: {e}")
            page.insert_textbox(
                rect,
                text,
                fontsize=fontsize,
                fontname="Helvetica",
                color=font_color,
                align=1,
                overlay=True
            )

    @staticmethod
    def _crop_and_optimize_signature_image(image_bytes: bytes, max_dim: int = 2400) -> bytes:
        """
        Auto-trims empty margins from signature images and preserves high resolution.
        Avoids downscaling to 72 DPI, preserving crisp vector-like stroke fidelity.
        """
        try:
            img = Image.open(BytesIO(image_bytes))
            if img.mode != "RGBA":
                img = img.convert("RGBA")
            
            alpha = img.split()[-1]
            min_a, max_a = alpha.getextrema()
            
            bbox = None
            if min_a < 250:
                # Transparent canvas image (draw or transparent PNG)
                bbox = alpha.getbbox()
            else:
                # Opaque image (e.g. JPG with white background)
                bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
                diff = ImageChops.difference(img, bg).convert("L")
                diff_thresh = diff.point(lambda p: 255 if p > 25 else 0)
                bbox = diff_thresh.getbbox()
                
            if bbox:
                # Add a subtle safety margin (3-4%) around the bounding box
                pad_x = max(4, int((bbox[2] - bbox[0]) * 0.04))
                pad_y = max(4, int((bbox[3] - bbox[1]) * 0.04))
                crop_box = (
                    max(0, bbox[0] - pad_x),
                    max(0, bbox[1] - pad_y),
                    min(img.width, bbox[2] + pad_x),
                    min(img.height, bbox[3] + pad_y)
                )
                img = img.crop(crop_box)
                
            # Cap maximum dimension only if exceptionally large (e.g. camera photo)
            if img.width > max_dim or img.height > max_dim:
                img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                
            buf = BytesIO()
            img.save(buf, format="PNG", optimize=True)
            return buf.getvalue()
        except Exception as e:
            print(f"Error optimizing signature image: {e}")
            return image_bytes

    @staticmethod
    def _apply_signature_field(page, rect, value, field):
        """Apply signature - supports native vector text and high-definition cropped image overlays."""
        is_completed = field.get("_render_completed", False) or field.get("is_completed", False)
        
        # Normalize nested value if present
        actual_val = value
        if isinstance(value, dict) and "value" in value:
            inner = value.get("value")
            if isinstance(inner, dict):
                actual_val = inner
        
        # Extract fields
        sig_type = ""
        text_content = ""
        font_family = "Dancing Script"
        font_color = (0, 0, 0)
        image_data = None
        
        if isinstance(actual_val, dict):
            sig_type = actual_val.get("signature_type", "")
            text_content = actual_val.get("text", "")
            font_family = actual_val.get("font_family") or "Dancing Script"
            font_color = PDFEngine._parse_color_hex(actual_val.get("font_color"), (0, 0, 0))
            
            if "image" in actual_val:
                image_data = PDFEngine.decode_base64_image(actual_val["image"])
            elif "data" in actual_val and actual_val.get("type") == "image":
                image_data = PDFEngine.decode_base64_image(actual_val["data"])
        elif isinstance(actual_val, str):
            if actual_val.startswith("data:image"):
                image_data = PDFEngine.decode_base64_image(actual_val)
            else:
                sig_type = "type"
                text_content = actual_val

        # Check if typed signature
        is_typed = (sig_type == "type") or (bool(text_content) and not image_data)
        
        # 1. Native vector text signature
        if is_typed and text_content and str(text_content).strip():
            PDFEngine._render_vector_signature_text(
                page, rect, str(text_content).strip(), font_family=font_family, font_color=font_color
            )
            return

        # 2. Incomplete placeholder
        if not actual_val and not is_completed:
            page.draw_rect(
                rect,
                color=(0.8, 0, 0),
                width=1,
                dashes=[3, 3],
                overlay=True
            )
            
            fontsize = min(12, rect.height * 0.6)
            vertical_padding = (rect.height - fontsize) / 2
            placeholder_rect = rect
            if vertical_padding > 0:
                placeholder_rect = fitz.Rect(rect.x0, rect.y0 + vertical_padding, rect.x1, rect.y1)

            page.insert_textbox(
                placeholder_rect,
                "Signature",
                fontsize=fontsize,
                fontname="Helvetica",
                color=(0.5, 0.5, 0.5),
                align=1,
                overlay=True
            )
            return
            
        # 3. Image-based signature (draw or upload) - high-res with auto-crop
        if image_data:
            try:
                opt_png = PDFEngine._crop_and_optimize_signature_image(image_data)
                page.insert_image(
                    rect,
                    stream=opt_png,
                    keep_proportion=True,
                    overlay=True
                )
                return
            except Exception as e:
                print(f"Error inserting signature image: {e}")
                page.insert_textbox(
                    rect,
                    "✓ Signed",
                    fontsize=min(12, rect.height * 0.6),
                    fontname="Helvetica",
                    color=(0, 0.5, 0),
                    align=1,
                    overlay=True
                )
                return
        elif actual_val:
            val_str = str(actual_val)
            if val_str and not val_str.startswith("data:image"):
                PDFEngine._render_vector_signature_text(
                    page, rect, val_str, font_family=font_family, font_color=font_color
                )
            else:
                page.insert_textbox(
                    rect,
                    "✓ Signed",
                    fontsize=min(12, rect.height * 0.6),
                    fontname="Helvetica",
                    color=(0, 0.5, 0),
                    align=1,
                    overlay=True
                )
            return

    @staticmethod
    def _apply_initials_field(page, rect, value, field):
        """Apply initials (supports typed vector text and high-definition cropped image overlays)."""
        is_completed = field.get("_render_completed", False) or field.get("is_completed", False)
        
        # Extract value based on format
        actual_val = value if value is not None else field.get("value")
        image_data = None
        text_value = None
        sig_type = ""
        font_family = "Dancing Script"
        font_color = (0, 0, 0)
        
        if isinstance(actual_val, dict):
            sig_type = actual_val.get("signature_type") or actual_val.get("type", "")
            font_family = actual_val.get("font_family") or "Dancing Script"
            font_color = PDFEngine._parse_color_hex(actual_val.get("font_color"), (0, 0, 0))
            
            # Check all possible image locations
            raw_img = actual_val.get("image") or actual_val.get("data")
            if not raw_img and isinstance(actual_val.get("value"), dict):
                raw_img = actual_val["value"].get("image") or actual_val["value"].get("data")
            elif not raw_img and isinstance(actual_val.get("value"), str) and str(actual_val.get("value")).startswith("data:image"):
                raw_img = actual_val["value"]
                
            if raw_img and isinstance(raw_img, str) and raw_img.startswith("data:image"):
                image_data = PDFEngine.decode_base64_image(raw_img)
                
            # Check all possible text locations
            if actual_val.get("text"):
                text_value = str(actual_val.get("text"))
            elif actual_val.get("value") and not isinstance(actual_val.get("value"), dict):
                val_s = str(actual_val.get("value"))
                if not val_s.startswith("data:image"):
                    text_value = val_s
            elif isinstance(actual_val.get("value"), dict):
                sub_val = actual_val["value"].get("text") or actual_val["value"].get("value")
                if sub_val and not str(sub_val).startswith("data:image"):
                    text_value = str(sub_val)
                    
        elif isinstance(actual_val, str):
            if actual_val.startswith("data:image"):
                image_data = PDFEngine.decode_base64_image(actual_val)
            else:
                sig_type = "type"
                text_value = actual_val

        # If not found yet, check field dict directly
        if not image_data and not text_value and field:
            raw_field_val = field.get("value")
            if isinstance(raw_field_val, dict):
                raw_img = raw_field_val.get("image") or raw_field_val.get("data")
                if raw_img and isinstance(raw_img, str) and raw_img.startswith("data:image"):
                    image_data = PDFEngine.decode_base64_image(raw_img)
                sub_t = raw_field_val.get("text") or raw_field_val.get("value")
                if sub_t and not str(sub_t).startswith("data:image"):
                    text_value = str(sub_t)
            elif isinstance(raw_field_val, str):
                if raw_field_val.startswith("data:image"):
                    image_data = PDFEngine.decode_base64_image(raw_field_val)
                else:
                    text_value = raw_field_val

        # 1. Image initials (drawn or uploaded): auto-trim & high-res insertion
        if image_data:
            try:
                opt_png = PDFEngine._crop_and_optimize_signature_image(image_data)
                page.insert_image(
                    rect,
                    stream=opt_png,
                    keep_proportion=True,
                    overlay=True
                )
                return
            except Exception as e:
                print("Initials image error:", e)

        # 2. Typed initials: render as crisp native vector text
        if text_value and str(text_value).strip() and not str(text_value).startswith("data:image"):
            initials = str(text_value).strip().upper()[:4]
            PDFEngine._render_vector_signature_text(
                page, rect, initials, font_family=font_family, font_color=font_color
            )
            return

        # 3. Completed field fallback: derive from recipient name if available, otherwise cleanly return (never render 'XX')
        if is_completed:
            fallback_name = field.get("recipient_name") or field.get("signer_name") or field.get("name")
            if fallback_name and str(fallback_name).strip():
                parts = str(fallback_name).strip().split()
                initials = "".join([p[0].upper() for p in parts if p])[:4]
                if initials:
                    PDFEngine._render_vector_signature_text(
                        page, rect, initials, font_family=font_family, font_color=font_color
                    )
            return
        
        # INCOMPLETE FIELD
        # For preview/final distinction, use consistent logic:
        show_as_placeholder = field.get("is_placeholder", False) or not is_completed
        
        if show_as_placeholder:
            # Draw placeholder border
            page.draw_rect(
                rect,
                color=(0.8, 0.4, 0),  # Orange for initials
                width=1,
                dashes=[2, 2],
                overlay=True
            )
            
            # Add placeholder text
            font_size = min(12, rect.height * 0.6)
            
            # Show "Initials" or extracted initials if available
            placeholder_text = "Initials"
            if text_value and text_value.strip():
                initials = str(text_value).upper()[:3]
                placeholder_text = f"({initials})"
            
            vertical_padding = (rect.height - font_size) / 2
            placeholder_rect = rect
            if vertical_padding > 0:
                placeholder_rect = fitz.Rect(rect.x0, rect.y0 + vertical_padding, rect.x1, rect.y1)

            page.insert_textbox(
                placeholder_rect,
                placeholder_text,
                fontsize=font_size,
                fontname="Helvetica",
                color=(0.8, 0.4, 0),
                align=1,
                overlay=True
            )
    
    @staticmethod
    def _apply_textbox_field(page, rect, value, field):
        """
        Apply text field (textbox, mail, etc.) with robust value extraction.
        """
        # 🔥 CRITICAL: Extract actual text value correctly
        actual_text = ""
        
        if isinstance(value, dict):
            # Try all possible keys where the text could be stored
            actual_text = (value.get("value") or 
                        value.get("text") or 
                        value.get("email") or
                        "")
        elif isinstance(value, str):
            actual_text = value
        elif value is not None:
            actual_text = str(value)
        
        # For mail fields, ensure we have the email
        if field.get("type") == "mail" and not actual_text:
            # Try to get from field value if available
            actual_text = field.get("value", "")
            if isinstance(actual_text, dict):
                actual_text = actual_text.get("value", "")
        
        # Determine if we show as value or placeholder
        # 🔥 FIX: For completed fields, always show the value (even if empty)
        is_completed = field.get("_render_completed", False) or field.get("is_completed", False)
        
        if is_completed:
            # For completed fields, show the value if it exists, otherwise show nothing
            if not actual_text or actual_text.strip() == "":
                return
            
            display_text = actual_text
            text_color = (0, 0, 0)  # Black
        else:
            # Incomplete field - show placeholder
            is_placeholder = not actual_text or actual_text.strip() == ""
            
            if is_placeholder:
                display_text = field.get("placeholder") or "Enter text here"
                text_color = (0.5, 0.5, 0.5)  # Gray
            else:
                display_text = actual_text
                text_color = (0, 0, 0)  # Black
        
        if not display_text:
            return
            
        # Calculate font and styling
        custom_font_size = None
        custom_font_family = "Helvetica"
        custom_text_color = text_color

        if isinstance(value, dict):
            custom_font_size = value.get("font_size")
            custom_font_family = value.get("font_family", "Helvetica")
            color_hex = value.get("font_color")
            if color_hex and color_hex.startswith("#") and not is_placeholder:
                try:
                    c = color_hex.lstrip("#")
                    r = int(c[0:2], 16) / 255
                    g = int(c[2:4], 16) / 255
                    b = int(c[4:6], 16) / 255
                    custom_text_color = (r, g, b)
                except:
                    pass

        font_size = custom_font_size or field.get("font_size", 12)
        target_font = min(font_size, rect.height * 0.8)
        current_font = custom_font_family if custom_font_family in ["Helvetica", "Times-Roman", "Courier"] else "Helvetica"
        
        # 🔥 Auto-expand rect width if word count / text length increases, up to right page margin
        try:
            needed_text_width = fitz.get_text_length(str(display_text), fontname=current_font, fontsize=target_font)
            if needed_text_width > (rect.width - 6):
                max_allowed_x1 = page.rect.width - 15
                new_x1 = min(max_allowed_x1, rect.x0 + needed_text_width + 10)
                if new_x1 > rect.x1:
                    rect = fitz.Rect(rect.x0, rect.y0, new_x1, rect.y1)
        except Exception:
            pass

        max_font = target_font
        # Auto-shrink font only if it still doesn't fit within the expanded rect / page bounds
        while max_font > 6:
            try:
                text_width = fitz.get_text_length(str(display_text), fontname=current_font, fontsize=max_font)
                if text_width <= (rect.width - 6):
                    break
                max_font -= 0.5
            except:
                break
        
        # 🔥 Use insert_text for single lines (more robust, matches date field success)
        # Use insert_textbox for actual multiline text
        is_multiline = "\n" in str(display_text)
        
        if not is_multiline:
            # Center horizontally
            try:
                current_font = custom_font_family if custom_font_family in ["Helvetica", "Times-Roman", "Courier"] else "Helvetica"
                text_width = fitz.get_text_length(display_text, fontname=current_font, fontsize=max_font)
                start_x = rect.x0 + (rect.width - text_width) / 2
            except:
                start_x = rect.x0 + 3
            
            # Use centered alignment for text fields
            text_y = rect.y0 + (rect.height + max_font) / 2 - 1.5
            page.insert_text(
                fitz.Point(start_x, text_y),
                display_text,
                fontsize=max_font,
                fontname=custom_font_family if custom_font_family in ["Helvetica", "Times-Roman", "Courier"] else "Helvetica",
                color=custom_text_color,
                overlay=True
            )
        else:
            # Estimate multiline height and center vertically
            num_lines = len(str(display_text).splitlines())
            estimated_height = num_lines * max_font * 1.25
            vertical_padding = (rect.height - estimated_height) / 2
            textbox_rect = rect
            if vertical_padding > 0:
                textbox_rect = fitz.Rect(rect.x0, rect.y0 + vertical_padding, rect.x1, rect.y1)

            page.insert_textbox(
                textbox_rect,
                display_text,
                fontsize=max_font,
                fontname=custom_font_family if custom_font_family in ["Helvetica", "Times-Roman", "Courier"] else "Helvetica",
                color=custom_text_color,
                align=1, # Centered
                overlay=True
            )
    
    
    @staticmethod
    def _apply_date_field(page, rect, value, field):
        """Apply date field with formatting."""
        date_text = ""
        
        if isinstance(value, dict):
            # Also check for 'value' key, which is used in recipient_signing.py
            date_text = value.get("value", value.get("date", value.get("text", "")))
        elif isinstance(value, str):
            date_text = value
        
        if not date_text:
            # If field is completed but empty, don't show any placeholder
            is_completed = field.get("_render_completed", False) or field.get("is_completed", False)
            if is_completed:
                return
            date_text = field.get("placeholder", "Date:")
        
        # Try to format date nicely
        try:
            # Parse common date formats
            for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y%m%d"]:
                try:
                    dt = datetime.strptime(date_text[:10], fmt)
                    date_text = dt.strftime("%d/%m/%Y")
                    break
                except:
                    continue
        except:
            pass
        
        font_size = min(field.get("font_size", 12), rect.height * 0.75)
        # Center horizontally
        try:
            text_width = fitz.get_text_length(date_text, fontname="Helvetica", fontsize=font_size)
            start_x = rect.x0 + (rect.width - text_width) / 2
        except:
            start_x = rect.x0 + 3

        # Center vertically
        text_y = rect.y0 + (rect.height + font_size) / 2 - 1.5

        page.insert_text(
            fitz.Point(start_x, text_y),
            date_text,
            fontsize=font_size,
            fontname="Helvetica",
            color=(0, 0, 0),
            overlay=True
        )
    
    @staticmethod
    def _apply_checkbox_field(page, rect, value, field):
        """Apply checkbox field with proper sizing."""
        checked = False
        
        # Determine if checkbox is checked
        if isinstance(value, bool):
            checked = value
        elif isinstance(value, dict):
            # Support both 'value' and 'checked' keys
            checked = value.get("value") if "value" in value else value.get("checked", False)
            if isinstance(checked, str):
                checked = checked.lower() in ["true", "yes", "checked", "1", "✓", "✔", "on"]
        elif isinstance(value, str):
            checked = value.lower() in ["true", "yes", "checked", "1", "✓", "✔", "on"]
        elif value is not None:
            # Any non-None value means checked
            checked = True
        
        is_completed = field.get("_render_completed", False) or field.get("is_completed", False)
        
        # COMPLETED FIELD
        if is_completed:
            # Draw checkmark only if checked
            if checked:
                # Calculate checkmark position (center of field)
                cx = rect.x0 + rect.width / 2
                cy = rect.y0 + rect.height / 2
                check_size = min(rect.width, rect.height) * 0.6
                
                # Draw checkmark
                page.draw_line(
                    fitz.Point(cx - check_size/3, cy),
                    fitz.Point(cx, cy + check_size/3),
                    color=(0, 0, 0),
                    width=2,
                    overlay=True
                )
                page.draw_line(
                    fitz.Point(cx, cy + check_size/3),
                    fitz.Point(cx + check_size/2, cy - check_size/3),
                    color=(0, 0, 0),
                    width=2,
                    overlay=True
                )
            # If not checked and completed, show nothing
            return
        
        # INCOMPLETE FIELD
        # Determine if we should show as placeholder
        show_as_placeholder = field.get("is_placeholder", False) or not is_completed
        
        if not show_as_placeholder:
            return
        
        # Draw checkbox border (smaller than field)
        checkbox_size = min(rect.width, rect.height) * 0.7
        padding = (min(rect.width, rect.height) - checkbox_size) / 2
        
        checkbox_rect = fitz.Rect(
            rect.x0 + padding,
            rect.y0 + padding,
            rect.x0 + padding + checkbox_size,
            rect.y0 + padding + checkbox_size
        )
        
        # Draw border
        page.draw_rect(
            checkbox_rect,
            color=(0.3, 0.3, 0.3),
            width=1,
            overlay=True
        )
        
        # Draw checkmark if checked
        if checked:
            check_size = checkbox_size * 0.6
            cx = checkbox_rect.x0 + checkbox_size / 2
            cy = checkbox_rect.y0 + checkbox_size / 2
            
            page.draw_line(
                fitz.Point(cx - check_size/3, cy),
                fitz.Point(cx, cy + check_size/3),
                color=(0.3, 0.3, 0.3),
                width=1.5,
                overlay=True
            )
            page.draw_line(
                fitz.Point(cx, cy + check_size/3),
                fitz.Point(cx + check_size/2, cy - check_size/3),
                color=(0.3, 0.3, 0.3),
                width=1.5,
                overlay=True
            )
        
        # Add label if needed
        if field.get("label") and rect.height > 25:
            label_rect = fitz.Rect(
                rect.x0,
                rect.y1 - 10,
                rect.x1,
                rect.y1
            )
            page.insert_textbox(
                label_rect,
                field.get("label"),
                fontsize=8,
                fontname="Helvetica",
                color=(0.5, 0.5, 0.5),
                align=1,
                overlay=True
            )


    
    @staticmethod
    def _apply_radio_field(page, rect, value, field):
        # Professional Radio Button Rendering
        is_completed = field.get("_render_completed", False) or field.get("is_completed", False)
        
        # Extract values
        selected_val = ""
        has_value = False
        if isinstance(value, dict):
            val = value.get("value")
            if isinstance(val, bool): 
                has_value = True
                selected_val = "Yes" if val else "No"
            elif isinstance(val, str): 
                selected_val = val.strip()
                has_value = bool(selected_val)
        elif isinstance(value, bool): 
            has_value = True
            selected_val = "Yes" if value else "No"
        elif isinstance(value, str): 
            selected_val = value.strip()
            has_value = bool(selected_val)
        
        # Calculate center and radius (smaller and more refined)
        cx = rect.x0 + rect.width / 2
        cy = rect.y0 + rect.height / 2
        radius = min(rect.width, rect.height) * 0.35
        
        # 1. Draw the base circle (professional thin border)
        page.draw_circle(
            fitz.Point(cx, cy),
            radius,
            color=(0.2, 0.2, 0.2),
            width=0.8,
            overlay=True
        )
        
        # 2. If no value, we're done
        if not has_value:
            return
            
        # 3. Handle selection marks based on value
        val_lower = selected_val.lower().strip()
        
        if val_lower in ["yes", "true", "1", "checked", "selected"]:
            # Fill with professional dot
            page.draw_circle(
                fitz.Point(cx, cy),
                radius * 0.6,
                color=(0, 0, 0),
                fill=(0, 0, 0),
                width=0,
                overlay=True
            )
        elif val_lower in ["no", "false", "0", "unchecked"]:
            # Leave as empty circle (as requested: "No color not fill")
            pass
        elif val_lower in ["maybe", "not sure"]:
            # Draw professional dash (-)
            dash_w = radius * 0.8
            page.draw_line(
                fitz.Point(cx - dash_w, cy),
                fitz.Point(cx + dash_w, cy),
                color=(0, 0, 0),
                width=1.5,
                overlay=True
            )
        elif val_lower in ["not applicable", "n/a", "na", "cross", "x"]:
            # Draw professional cross (X)
            cross_s = radius * 0.6
            page.draw_line(
                fitz.Point(cx - cross_s, cy - cross_s),
                fitz.Point(cx + cross_s, cy + cross_s),
                color=(0, 0, 0),
                width=1.2,
                overlay=True
            )
            page.draw_line(
                fitz.Point(cx + cross_s, cy - cross_s),
                fitz.Point(cx - cross_s, cy + cross_s),
                color=(0, 0, 0),
                width=1.2,
                overlay=True
            )
        else:
            # Fallback for other values: standard dot
            page.draw_circle(
                fitz.Point(cx, cy),
                radius * 0.6,
                color=(0, 0, 0),
                fill=(0, 0, 0),
                width=0,
                overlay=True
            )


    
    @staticmethod
    def _apply_dropdown_field(page, rect, value, field):
        """Apply dropdown field with proper completed / placeholder logic."""
        
        is_completed = field.get("_render_completed", False) or field.get("is_completed", False)

        selected_text = ""

        if isinstance(value, dict):
            selected_text = (
                value.get("selected") or
                value.get("value") or
                (value.get("value", {}).get("value") if isinstance(value.get("value"), dict) else "")
            )
        elif isinstance(value, str):
            selected_text = value

        options = field.get("dropdown_options", [])

        # ---------------------------------
        # COMPLETED FIELD - DESIGN: NO box, NO arrow
        # ---------------------------------
        if is_completed:
            if selected_text:
                font_size = min(11, rect.height * 0.75)
                
                # Auto-shrink for dropdown completed values
                while font_size > 6:
                    text_width = fitz.get_text_length(selected_text, fontname="Helvetica", fontsize=font_size)
                    if text_width <= (rect.width - 6):
                        break
                    font_size -= 0.5

                # Center vertically and horizontally for completed state
                text_y = rect.y0 + (rect.height + font_size) / 2 - 1.5
                
                page.insert_text(
                    fitz.Point(rect.x0 + 3, text_y),
                    selected_text,
                    fontsize=font_size,
                    fontname="Helvetica",
                    color=(0, 0, 0),
                    overlay=True
                )
            return  # 🚫 NO border, NO arrow, and NO text if empty for completed fields

        # ---------------------------------
        # 🟡 INCOMPLETE / PREVIEW FIELD
        # ---------------------------------
        # Placeholder text
        if not selected_text:
            selected_text = field.get("placeholder") or (
                options[0] if options else "Select option"
            )

        # Draw dropdown box
        page.draw_rect(
            rect,
            color=(0.4, 0.4, 0.4),
            width=1,
            overlay=True
        )

        # Draw text
        text_rect = fitz.Rect(
            rect.x0 + 4,
            rect.y0,
            rect.x1 - rect.height,
            rect.y1
        )

        # Center vertically as well
        font_size_incomplete = min(12, rect.height * 0.7)
        
        # Auto-shrink for dropdown placeholders
        while font_size_incomplete > 6:
            text_width = fitz.get_text_length(selected_text, fontname="Helvetica", fontsize=font_size_incomplete)
            if text_width <= (text_rect.width - 4):
                break
            font_size_incomplete -= 0.5

        v_offset_incomplete = (rect.height - font_size_incomplete) / 2
        centered_text_rect = fitz.Rect(text_rect.x0, text_rect.y0 + v_offset_incomplete, text_rect.x1, text_rect.y1)

        page.insert_textbox(
            centered_text_rect,
            selected_text,
            fontsize=font_size_incomplete,
            fontname="Helvetica",
            color=(0.5, 0.5, 0.5),
            align=1,  # Center align
            overlay=True
        )

        # Draw arrow ▼
        arrow_x = rect.x1 - rect.height / 2
        arrow_y = rect.y0 + rect.height / 2
        arrow_size = rect.height * 0.25

        page.draw_line(
            fitz.Point(arrow_x - arrow_size, arrow_y - arrow_size),
            fitz.Point(arrow_x, arrow_y),
            color=(0.4, 0.4, 0.4),
            width=1,
            overlay=True
        )
        page.draw_line(
            fitz.Point(arrow_x, arrow_y),
            fitz.Point(arrow_x - arrow_size, arrow_y + arrow_size),
            color=(0.4, 0.4, 0.4),
            width=1,
            overlay=True
        )

    
    @staticmethod
    def _apply_attachment_field(page, rect, value, field):
        """
        Apply attachment field as a simple clickable text link.
        NO border, NO box - just the filename.
        """
        filename = ""
        url = ""
        
        if isinstance(value, dict):
            filename = value.get("filename") or value.get("value", "")
            url = value.get("url", "")
        elif isinstance(value, str):
            filename = value
        
        # If no filename, simply return - do not show "Attached File" placeholder
        if not filename:
            return

        # Show filename as a clickable link
        # Truncate filename if too long for the field box
        display_name = filename
        if len(display_name) > 35:
            display_name = display_name[:32] + "..."
            
        # Font size based on field height
        font_size = min(10, rect.height * 0.7)
        
        # Link Blue color
        link_color = (0, 0, 1) 
        
        # Insert text (with a small clip icon prefix)
        text_to_insert = f"{display_name}"
        
        # Calculate text position (aligned to bottom of vertical center)
        text_point = fitz.Point(
            rect.x0 + 2,
            rect.y0 + (rect.height + font_size) / 2 - 1
        )
        
        page.insert_text(
            text_point,
            text_to_insert,
            fontsize=font_size,
            fontname="Helvetica",
            color=link_color,
            overlay=True
        )

        # Draw real underline to look like a link
        try:
            text_len = fitz.get_text_length(text_to_insert, fontname="Helvetica", fontsize=font_size)
            page.draw_line(
                fitz.Point(text_point.x, text_point.y + 1.5),
                fitz.Point(text_point.x + text_len, text_point.y + 1.5),
                color=link_color,
                width=0.8,
                overlay=True
            )
        except:
            pass

        # INSERT CLICKABLE LINK over the entire field area
        if url:
            # Ensure URL is absolute for local PDF viewers
            if url.startswith("/") and not url.startswith("//"):
                try:
                    from config import BACKEND_URL
                    url = f"{BACKEND_URL.rstrip('/')}{url}"
                except:
                    pass

            print(f"🔗 PDF Engine: Inserting hyperlink for {filename}: {url}")
            
            # Use kind=fitz.LINK_URI (2)
            page.insert_link({
                "from": rect,
                "uri": url,
                "kind": 2  # fitz.LINK_URI is 2
            })
    
    @staticmethod
    def _apply_approval_field(page, rect, value, field):
        """Apply approval field with proper sizing."""
        approved = False
        
        if isinstance(value, bool):
            approved = value
        elif isinstance(value, dict):
            # Support both 'value' and 'approved' keys
            approved = value.get("value") if "value" in value else value.get("approved", False)
            if isinstance(approved, str):
                approved = approved.lower() in ["true", "yes", "approved", "1", "✓", "✔"]
        elif isinstance(value, str):
            approved = value.lower() in ["true", "yes", "approved", "1", "✓", "✔"]
        
        # Reduce the size of the approval checkbox
        checkbox_size = min(rect.width, rect.height) * 0.6  # 60% of field size
        padding = (min(rect.width, rect.height) - checkbox_size) / 2
        
        checkbox_rect = fitz.Rect(
            rect.x0 + padding,
            rect.y0 + padding,
            rect.x0 + padding + checkbox_size,
            rect.y0 + padding + checkbox_size
        )
        
        # For completed fields, just show the checkmark if approved
        is_completed = field.get("_render_completed", False) or field.get("is_completed", False)
        if is_completed:
            if approved:
                # Draw checkmark
                check_size = checkbox_size * 0.7
                cx = checkbox_rect.x0 + checkbox_size / 2
                cy = checkbox_rect.y0 + checkbox_size / 2

                page.draw_line(
                    fitz.Point(cx - check_size / 2, cy),
                    fitz.Point(cx, cy + check_size / 2),
                    color=(0, 0.5, 0),
                    width=2,
                    overlay=True
                )
                page.draw_line(
                    fitz.Point(cx, cy + check_size / 2),
                    fitz.Point(cx + check_size / 2, cy - check_size / 2),
                    color=(0, 0.5, 0),
                    width=2,
                    overlay=True
                )
            
            # Add "Approve" text below
            text_rect = fitz.Rect(
                rect.x0,
                rect.y1 + 2,
                rect.x1,
                rect.y1 + 12
            )
            
            if approved:
                page.insert_text(
                    text_rect.tl,
                    "Approved",
                    fontsize=8,
                    fontname="Helvetica",
                    color=(0, 0.5, 0),
                    overlay=True
                )
            return
        
        # For incomplete/preview mode
        if not field.get("is_placeholder", False):
            return  # Don't show for incomplete fields in final view
            
        # Draw checkbox with "Approve" label
        page.draw_rect(
            checkbox_rect,
            color=(0, 0.5, 0) if approved else (0.5, 0.5, 0.5),
            width=1,
            overlay=True
        )
        
        if approved:
            # Draw checkmark
            check_size = checkbox_size * 0.7
            x_center = checkbox_rect.x0 + checkbox_size / 2
            y_center = checkbox_rect.y0 + checkbox_size / 2
            
            page.draw_line(
                fitz.Point(x_center - check_size/2, y_center),
                fitz.Point(x_center, y_center + check_size/2),
                color=(0, 0.5, 0),
                width=2,
                overlay=True
            )
            page.draw_line(
                fitz.Point(x_center, y_center + check_size/2),
                fitz.Point(x_center + check_size/2, y_center - check_size/2),
                color=(0, 0.5, 0),
                width=2,
                overlay=True
            )
        
        # Avoid showing "Approve" placeholder text on PDF
        return
    
    @staticmethod
    def _apply_witness_signature_field(page, rect, value, field):
        """Apply witness signature (same as signature but with witness label)."""
        # Apply signature first
        PDFEngine._apply_signature_field(page, rect, value, field)
        
        # Add "Witness" label
        label_rect = fitz.Rect(
            rect.x0,
            rect.y1 + 2,
            rect.x1,
            rect.y1 + 10
        )
        
        page.insert_text(
            label_rect.tl,
            "Witness",
            fontsize=7,
            fontname="Helvetica",
            color=(0.5, 0.5, 0.5),
            overlay=True
        )
        


    @staticmethod
    def _apply_stamp_field(page, rect, value, field):
        """Apply stamp field with proper sizing."""
        is_completed = field.get("_render_completed", False)
        
        if not value:
            # Draw empty stamp only in preview mode
            if not field.get("is_placeholder", False):
                return
                
            page.draw_rect(
                rect,
                color=(0.8, 0, 0),
                width=2,
                dashes=[3, 3],
                overlay=True
            )
            
            page.insert_textbox(
                rect,
                "STAMP",
                fontsize=min(14, rect.height * 0.6),
                fontname="Helvetica-Bold",
                color=(0.8, 0, 0),
                align=1,
                overlay=True
            )
            return
        
        # Try to apply as image
        image_data = None
        stamp_text = ""
        stamp_color = "#e53935"
        stamp_shape = "circle"
        
        if isinstance(value, dict):
            # Extract stamp properties from the value dict
            if "image" in value:
                image_data = value["image"]
                if isinstance(image_data, str) and image_data.startswith("data:image"):
                    # Extract base64 data from data URL
                    import base64
                    if "base64," in image_data:
                        image_data = image_data.split("base64,")[1]
                    try:
                        image_data = base64.b64decode(image_data)
                    except:
                        image_data = None
            
            if "text" in value:
                stamp_text = value["text"]
            
            if "color" in value:
                stamp_color = value["color"]
            
            if "shape" in value:
                stamp_shape = value["shape"]
            
            # Also check if value is nested in 'value' key
            elif "value" in value and isinstance(value["value"], dict):
                nested = value["value"]
                if "image" in nested:
                    image_data = nested["image"]
                if "text" in nested:
                    stamp_text = nested["text"]
                if "color" in nested:
                    stamp_color = nested["color"]
        
        elif isinstance(value, str):
            # Try to decode as base64 image
            if value.startswith("data:image"):
                import base64
                try:
                    if "base64," in value:
                        image_data = value.split("base64,")[1]
                        image_data = base64.b64decode(image_data)
                    else:
                        image_data = base64.b64decode(value)
                except:
                    image_data = None
            else:
                # Treat as stamp text
                stamp_text = value
        
        if image_data:
            try:
                # Open and process the image
                img = Image.open(BytesIO(image_data)).convert("RGBA")
                
                # Calculate target dimensions
                target_width = rect.width
                target_height = rect.height
                
                # Calculate scaling to fit within field while maintaining aspect ratio
                img_width, img_height = img.size
                scale = min(target_width / img_width, target_height / img_height)
                
                new_width = int(img_width * scale)
                new_height = int(img_height * scale)
                
                # Resize the image
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                
                # Calculate position to center the image
                x_offset = int((target_width - new_width) / 2)
                y_offset = int((target_height - new_height) / 2)
                
                # Create a new transparent image with the target size
                result_img = Image.new("RGBA", (int(target_width), int(target_height)), (255, 255, 255, 0))
                
                # Paste the resized image onto the transparent background
                result_img.paste(img, (x_offset, y_offset), img if img.mode == 'RGBA' else None)
                
                # Convert to bytes
                buf = BytesIO()
                result_img.save(buf, format="PNG")
                
                # Insert image into PDF
                page.insert_image(
                    rect,
                    stream=buf.getvalue(),
                    keep_proportion=False,
                    overlay=True
                )
                
            except Exception as e:
                print(f"Error applying stamp image: {e}")
                # Fallback to text stamp
                PDFEngine._draw_text_stamp(page, rect, stamp_text or "STAMP", stamp_color, stamp_shape)
        
        elif stamp_text:
            # Draw text-based stamp
            PDFEngine._draw_text_stamp(page, rect, stamp_text, stamp_color, stamp_shape)
        
        else:
            # Draw default stamp
            PDFEngine._draw_text_stamp(page, rect, "STAMP", "#e53935", "circle")

    @staticmethod
    def _draw_text_stamp(page, rect, text, color="#e53935", shape="circle"):
        """Helper to draw text-based stamp."""
        try:
            # Parse color
            if color.startswith("#"):
                color = color.lstrip("#")
                r = int(color[0:2], 16) / 255
                g = int(color[2:4], 16) / 255
                b = int(color[4:6], 16) / 255
            else:
                r, g, b = 0.9, 0.2, 0.2  # Default red
        except:
            r, g, b = 0.9, 0.2, 0.2
        
        # Calculate center and size
        cx = rect.x0 + rect.width / 2
        cy = rect.y0 + rect.height / 2
        width = rect.width * 0.8  # Use 80% of field width
        height = rect.height * 0.8  # Use 80% of field height
        
        # Draw shape based on stamp_shape
        if shape == "square":
            # Draw square stamp
            square_rect = fitz.Rect(
                cx - width/2,
                cy - height/2,
                cx + width/2,
                cy + height/2
            )
            page.draw_rect(
                square_rect,
                color=(r, g, b),
                width=2,
                overlay=True
            )
            
            # Draw diagonal lines
            page.draw_line(
                fitz.Point(square_rect.x0, square_rect.y0),
                fitz.Point(square_rect.x1, square_rect.y1),
                color=(r, g, b),
                width=1,
                overlay=True
            )
            page.draw_line(
                fitz.Point(square_rect.x1, square_rect.y0),
                fitz.Point(square_rect.x0, square_rect.y1),
                color=(r, g, b),
                width=1,
                overlay=True
            )
            
        elif shape == "rectangular":
            # Draw rectangular stamp
            rect_rect = fitz.Rect(
                cx - width/2,
                cy - height/2,
                cx + width/2,
                cy + height/2
            )
            page.draw_rect(
                rect_rect,
                color=(r, g, b),
                width=2,
                overlay=True
            )
            
        else:  # circle (default)
            # Draw circular stamp
            radius = min(width, height) / 2
            page.draw_circle(
                fitz.Point(cx, cy),
                radius,
                color=(r, g, b),
                width=2,
                overlay=True
            )
        
        # Draw stamp text
        font_size = min(14, height * 0.3)
        
        # Split text into lines if it contains newlines
        lines = text.split("\n")
        line_height = font_size * 1.2
        
        # Calculate starting Y position
        total_height = len(lines) * line_height
        start_y = cy - total_height / 2 + font_size/2
        
        for i, line in enumerate(lines):
            if not line.strip():
                continue
                
            page.insert_text(
                fitz.Point(rect.x0 + (rect.width - fitz.get_text_length(line, fontname="Helvetica-Bold", fontsize=font_size))/2, start_y + (i * line_height) + font_size),
                line,
                fontsize=font_size,
                fontname="Helvetica-Bold",
                color=(r, g, b),
                overlay=True
            )

    @staticmethod
    def _apply_mail_field(page, rect, value, field):
        """Apply mail field - uses the robust textbox handler."""
        PDFEngine._apply_textbox_field(page, rect, value, field)

    @staticmethod
    def apply_signatures_with_field_positions(
        pdf_bytes: bytes, 
        signatures: List[Dict],
        fields_data: List[Dict] = None
    ) -> bytes:
        pdf = PDFEngine.open_pdf(pdf_bytes)
        total_pages = len(pdf)
        """
        Apply signatures using stored field positions.
        Now uses the unified coordinate system.
        """
        if not signatures:
            return pdf_bytes
        
        pdf = PDFEngine.open_pdf(pdf_bytes)
        
        for sig in signatures:
            try:
                sig_type = sig.get("signature_type", "")
                text_content = sig.get("text", "")
                image_str = sig.get("image", "")
                is_sig_typed = (sig_type == "type") or (bool(text_content) and not image_str)
                image_data = PDFEngine.decode_base64_image(image_str) if image_str else None
                
                if not is_sig_typed and not image_data:
                    continue

                # 🔧 FIND FIELD FIRST
                field_data = None
                field_id = sig.get("field_id")

                if field_id and fields_data:
                    for f in fields_data:
                        if str(f.get("id", f.get("_id", ""))) == str(field_id):
                            field_data = f
                            break

                # 🔧 GET PAGE INDEX SAFELY
                if field_data:
                    page_index = PDFEngine.get_page_index(field_data, total_pages)
                else:
                    page_index = sig.get("page", 0)

                if page_index >= len(pdf):
                    continue

                page = pdf[page_index]
                page_rect = page.rect

                # 🔧 GET COORDINATES
                if field_data:
                    coords = PDFEngine.convert_stored_to_pdf_coordinates(
                        field_data,
                        page_rect.width,
                        page_rect.height,
                        page_rect=page_rect
                    )
                elif all(k in sig for k in ["x", "y", "width", "height"]):
                    coords = PDFEngine.convert_stored_to_pdf_coordinates(
                        sig,
                        page_rect.width,
                        page_rect.height,
                        page_rect=page_rect
                    )
                else:
                    continue

                rect = fitz.Rect(
                    coords["x"],
                    coords["y"],
                    coords["x"] + coords["width"],
                    coords["y"] + coords["height"]
                )

                if is_sig_typed and text_content and str(text_content).strip():
                    font_family = sig.get("font_family") or "Dancing Script"
                    font_color = PDFEngine._parse_color_hex(sig.get("font_color"), (0, 0, 0))
                    PDFEngine._render_vector_signature_text(
                        page, rect, str(text_content).strip(), font_family=font_family, font_color=font_color
                    )
                elif image_data:
                    opt_png = PDFEngine._crop_and_optimize_signature_image(image_data)
                    page.insert_image(
                        rect,
                        stream=opt_png,
                        keep_proportion=True,
                        overlay=True
                    )

            except Exception as e:
                print(f"Error applying signature: {e}")
                continue

        
        result = pdf.tobytes(clean=True)
        pdf.close()
        return result
    
    @staticmethod
    def apply_form_fields_with_values(pdf_bytes: bytes, fields: List[Dict]) -> bytes:
        """
        Apply form fields with their values.
        Now uses the unified field application.
        """
        return PDFEngine.apply_all_fields(pdf_bytes, fields)
    
    @staticmethod
    def apply_choice_fields(pdf_bytes: bytes, fields: List[Dict]) -> bytes:
        """
        Apply checkbox, radio, and dropdown fields.
        """
        choice_fields = [f for f in fields if f.get("type") in ["checkbox", "radio", "dropdown"]]
        return PDFEngine.apply_all_fields(pdf_bytes, choice_fields)
    
    @staticmethod
    def apply_special_fields(pdf_bytes: bytes, fields: List[Dict]) -> bytes:
        """
        Apply special fields like attachment, approval, stamp.
        """
        special_fields = [f for f in fields if f.get("type") in ["attachment", "approval", "stamp"]]
        return PDFEngine.apply_all_fields(pdf_bytes, special_fields)
    
    @staticmethod
    def apply_field_placeholders(
        pdf_bytes: bytes, 
        fields: List[Dict], 
        include_labels: bool = True,
        show_values: bool = False,
        highlight_incomplete: bool = True,
        border_style: str = "professional",
        use_recipient_colors: bool = True
    ) -> bytes:
        """
        Apply field boundaries/placeholders to PDF for preview.
        Shows only placeholder text with mild recipient-colored background (no borders, no field type names).
        """
        pdf = PDFEngine.open_pdf(pdf_bytes)
        total_pages = len(pdf)
        
        # Filter out completed fields - we don't want placeholders for completed fields
        incomplete_fields = [f for f in fields if not f.get("is_completed", False)]
        
        # If there are no incomplete fields, return original PDF
        if not incomplete_fields:
            result = pdf.tobytes(clean=True)
            pdf.close()
            return result
        
        # Store recipient color cache
        recipient_color_cache = {}
        
        def get_recipient_color(recipient_data: dict) -> Tuple[float, float, float]:
            """
            Get or generate recipient color from recipient data.
            Returns pastel RGB colors for mild background.
            """
            if not recipient_data:
                return (0.9, 0.95, 1.0)  # Very light blue default
            
            # Try multiple ways to get email
            email = None
            
            if isinstance(recipient_data, dict):
                # Try different possible email fields
                email = (recipient_data.get("email") or 
                        recipient_data.get("recipient_email") or 
                        recipient_data.get("recipient", {}).get("email"))
                
                # If we have a direct color in the recipient data, use it
                if "color" in recipient_data:
                    color_str = recipient_data["color"]
                    if isinstance(color_str, str):
                        # Handle HSL format from generate_recipient_color function
                        if color_str.startswith("hsl"):
                            try:
                                import re
                                match = re.match(r"hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)", color_str)
                                if match:
                                    hue = int(match.group(1))
                                    sat = int(match.group(2)) / 100.0
                                    light = int(match.group(3)) / 100.0
                                    
                                    # Convert HSL to RGB (simplified for pastel)
                                    # For mild background, we'll lighten it further
                                    c = (1 - abs(2 * light - 1)) * sat
                                    x = c * (1 - abs((hue / 60) % 2 - 1))
                                    m = light - c/2
                                    
                                    if 0 <= hue < 60:
                                        r, g, b = c, x, 0
                                    elif 60 <= hue < 120:
                                        r, g, b = x, c, 0
                                    elif 120 <= hue < 180:
                                        r, g, b = 0, c, x
                                    elif 180 <= hue < 240:
                                        r, g, b = 0, x, c
                                    elif 240 <= hue < 300:
                                        r, g, b = x, 0, c
                                    else:
                                        r, g, b = c, 0, x
                                    
                                    # Add m and make pastel by lightening
                                    return (min(1.0, r + m + 0.3), 
                                            min(1.0, g + m + 0.3), 
                                            min(1.0, b + m + 0.3))
                            except:
                                pass
                        
                        # Handle hex format
                        elif color_str.startswith("#"):
                            try:
                                color_str = color_str.lstrip("#")
                                r = int(color_str[0:2], 16) / 255.0
                                g = int(color_str[2:4], 16) / 255.0
                                b = int(color_str[4:6], 16) / 255.0
                                # Make it pastel by lightening
                                return (r * 0.4 + 0.6, g * 0.4 + 0.6, b * 0.4 + 0.6)
                            except:
                                pass
                
                # If we have recipient nested, try to get email from there
                if "recipient" in recipient_data and isinstance(recipient_data["recipient"], dict):
                    nested_email = recipient_data["recipient"].get("email")
                    if nested_email:
                        email = nested_email
            elif isinstance(recipient_data, str):
                # If recipient_data is just a string, treat it as email
                email = recipient_data
            
            # Use email for consistent color generation
            if email:
                # Check cache first
                if email in recipient_color_cache:
                    return recipient_color_cache[email]
                
                # Generate consistent pastel color from email hash
                import hashlib
                hash_obj = hashlib.md5(email.encode())
                hash_int = int(hash_obj.hexdigest()[:6], 16)
                
                # Generate pastel colors (light, soft tones)
                r = ((hash_int >> 16) & 0xFF) / 512.0 + 0.6  # Scale to 0.6-1.0 range
                g = ((hash_int >> 8) & 0xFF) / 512.0 + 0.6
                b = (hash_int & 0xFF) / 512.0 + 0.6
                
                # Ensure colors are within pastel range
                color = (min(1.0, r), min(1.0, g), min(1.0, b))
                recipient_color_cache[email] = color
                return color
            
            return (0.9, 0.95, 1.0)  # Very light blue default
        
        # Pre-fetch all recipients for this document to avoid N+1 queries
        # Get unique document IDs from fields
        doc_ids = set()
        for field in fields:
            doc_id = field.get("document_id")
            if doc_id:
                doc_ids.add(doc_id)
        
        # Fetch all recipients for these documents
        recipients_by_id = {}
        recipients_by_email = {}
        
        if doc_ids and use_recipient_colors:
            try:
                from database import db  # Import your database
                doc_ids_list = [ObjectId(doc_id) if isinstance(doc_id, str) else doc_id for doc_id in doc_ids]
                
                # Check if cursor is iterable or async
                cursor = db.recipients.find({"document_id": {"$in": doc_ids_list}})
                if hasattr(cursor, "__iter__"):
                    all_recipients = list(cursor)
                    for rec in all_recipients:
                        rec_id = str(rec["_id"])
                        recipients_by_id[rec_id] = rec
                        if rec.get("email"):
                            recipients_by_email[rec["email"]] = rec
            except Exception:
                pass
        
        for field in fields:
            try:
                # Skip completed fields for placeholder rendering
                if field.get("is_completed", False):
                    continue
                    
                # Use helper function
                page_index = PDFEngine.get_page_index(field, total_pages)
                if page_index >= len(pdf):
                    continue
                
                page = pdf[page_index]
                page_rect = page.rect
                
                # Get coordinates with validation
                try:
                    coords = PDFEngine.convert_stored_to_pdf_coordinates(
                        field,
                        page_rect.width,
                        page_rect.height,
                        page_rect=page_rect
                    )
                    
                    # Validate rectangle dimensions
                    width = max(1.0, coords["width"])
                    height = max(1.0, coords["height"])
                    
                    # Ensure rectangle fits within page bounds
                    x = max(0.0, min(coords["x"], page_rect.width - width))
                    y = max(0.0, min(coords["y"], page_rect.height - height))
                    
                    rect = fitz.Rect(
                        x,
                        y,
                        x + width,
                        y + height
                    )
                    
                    if rect.width < 5 or rect.height < 5:
                        continue
                        
                except Exception as e:
                    print(f"Error calculating coordinates for field {field.get('type')}: {e}")
                    continue
                
                field_type = field.get("type", "textbox")
                
                # ===========================================
                # GET RECIPIENT COLOR FOR BACKGROUND
                # ===========================================
                
                # Try to find recipient data
                recipient_data = None
                recipient_id = field.get("recipient_id")
                
                if recipient_id:
                    # Convert to string for lookup
                    if isinstance(recipient_id, ObjectId):
                        recipient_id = str(recipient_id)
                    elif not isinstance(recipient_id, str):
                        recipient_id = str(recipient_id)
                    
                    # Look up in pre-fetched recipients
                    if recipient_id in recipients_by_id:
                        recipient_data = recipients_by_id[recipient_id]
                
                # If no recipient found by ID, try from field data
                if not recipient_data:
                    recipient_data = field.get("recipient")
                
                # If still no recipient, try from recipient_email
                if not recipient_data and field.get("recipient_email"):
                    email = field["recipient_email"]
                    if email in recipients_by_email:
                        recipient_data = recipients_by_email[email]
                    else:
                        recipient_data = {"email": email}
                
                # Get background color
                if use_recipient_colors:
                    bg_color = get_recipient_color(recipient_data)
                else:
                    bg_color = (0.95, 0.97, 1.0)  # Very light blue default
                
                # ===========================================
                # DRAW MILD BACKGROUND (NO BORDER)
                # ===========================================
                
                # Draw very light background fill with recipient color
                page.draw_rect(
                    rect,
                    color=None,  # No border
                    width=0,
                    fill=bg_color,
                    fill_opacity=0.25,  # Mild transparency
                    overlay=True
                )
                
                # ===========================================
                # DRAW FIELD VALUE OR PLACEHOLDER
                # ===========================================
                
                # Get field value for display
                display_value = ""
                if show_values:
                    value = field.get("display_value") or field.get("value")
                    if value:
                        if isinstance(value, dict):
                            display_value = value.get("text") or value.get("value") or ""
                        elif isinstance(value, str):
                            display_value = value
                
                if display_value:
                    # Show actual value
                    text_color = (0, 0, 0)  # Black
                    text_to_show = display_value
                    font_name = "Helvetica"
                    font_size_base = 10
                else:
                    # Show placeholder text
                    placeholder = field.get("placeholder") or "Click to fill"
                    text_to_show = placeholder
                    text_color = (0.5, 0.5, 0.5)  # Gray
                    font_name = "Helvetica-Oblique"  # Italic for placeholder
                    font_size_base = 9
                
                # Calculate text position (centered vertically)
                text_y = rect.y0 + rect.height / 2 + 4  # +4 for baseline adjustment
                
                # Only show text if field is tall enough
                if rect.height > 20:
                    page.insert_text(
                        fitz.Point(rect.x0 + 5, text_y),
                        text_to_show,
                        fontsize=font_size_base,
                        fontname=font_name,
                        color=text_color,
                        overlay=True
                    )
                
                # ===========================================
                # SPECIAL HANDLING FOR CHECKBOX/RADIO
                # ===========================================
                
                if field_type == "checkbox" or field_type == "radio":
                    # Draw checkbox/radio box (minimal)
                    box_size = min(rect.height, 15)
                    box_x = rect.x0 + 5
                    box_y = rect.y0 + (rect.height - box_size) / 2
                    
                    box_rect = fitz.Rect(
                        box_x,
                        box_y,
                        box_x + box_size,
                        box_y + box_size
                    )
                    
                    # Use darker version of bg_color for the box
                    box_color = (
                        max(0.2, bg_color[0] - 0.3),
                        max(0.2, bg_color[1] - 0.3),
                        max(0.2, bg_color[2] - 0.3)
                    )
                    
                    if field_type == "radio":
                        # Draw circle for radio
                        page.draw_circle(
                            fitz.Point(box_x + box_size/2, box_y + box_size/2),
                            box_size/2,
                            color=box_color,
                            width=1,
                            overlay=True
                        )
                    else:
                        # Draw square for checkbox
                        page.draw_rect(
                            box_rect,
                            color=box_color,
                            width=1,
                            overlay=True
                        )
                    
                    # If checked, draw checkmark
                    checked = False
                    value = field.get("value")
                    if isinstance(value, bool):
                        checked = value
                    elif isinstance(value, dict):
                        checked = value.get("checked", False)
                    elif isinstance(value, str):
                        checked = value.lower() in ["true", "yes", "checked", "1", "✓", "✔"]
                    
                    if checked:
                        if field_type == "radio":
                            # Fill circle for radio
                            page.draw_circle(
                                fitz.Point(box_x + box_size/2, box_y + box_size/2),
                                box_size/4,
                                color=box_color,
                                fill=box_color,
                                overlay=True
                            )
                        else:
                            # Draw checkmark for checkbox
                            cx = box_x + box_size/2
                            cy = box_y + box_size/2
                            check_size = box_size * 0.4
                            
                            page.draw_line(
                                fitz.Point(cx - check_size/2, cy),
                                fitz.Point(cx, cy + check_size/2),
                                color=box_color,
                                width=1.5,
                                overlay=True
                            )
                            page.draw_line(
                                fitz.Point(cx, cy + check_size/2),
                                fitz.Point(cx + check_size/2, cy - check_size/2),
                                color=box_color,
                                width=1.5,
                                overlay=True
                            )
                
                # ===========================================
                # ADD REQUIRED INDICATOR (optional)
                # ===========================================
                
                if field.get("required", True) and highlight_incomplete:
                    # Draw red asterisk in top-right corner
                    asterisk_x = rect.x1 - 10
                    asterisk_y = rect.y0 + 12
                    
                    page.insert_text(
                        fitz.Point(asterisk_x, asterisk_y),
                        "*",
                        fontsize=12,
                        fontname="Helvetica-Bold",
                        color=(0.9, 0.2, 0.2),  # Red
                        overlay=True
                    )
                        
            except Exception as e:
                print(f"Error drawing field placeholder {field.get('type')}: {e}")
                continue
        
        result = pdf.tobytes(clean=True)
        pdf.close()
        return result


    @staticmethod
    def _format_field_value_for_display(field: Dict) -> str:
        """Format field value for display in placeholder."""
        value = field.get("value")
        if not value:
            return ""
        
        field_type = field.get("type", "")
        
        if field_type == "signature":
            return "✓ Signed"
        elif field_type == "initials":
            if isinstance(value, dict):
                return value.get("text", "✓ Initialed")
            return "✓ Initialed"
        elif field_type == "checkbox":
            if isinstance(value, bool):
                return "✓" if value else "☐"
            return "✓" if str(value).lower() in ["true", "yes", "1"] else "☐"
        elif field_type == "radio":
            return "● Selected" if value else "○"
        elif field_type == "dropdown":
            if isinstance(value, dict):
                return str(value.get("selected", ""))
        elif field_type == "approval":
            return "Approved" if value else "❌"
        
        # Default: convert to string
        return str(value)[:30]
    
    @staticmethod
    def apply_watermark(
        pdf_bytes: bytes, 
        text: str, 
        color: str = "#666666",
        opacity: float = 0.12,
        angle: float = 0,
        font_size: int = 60,  # Add font_size parameter
        position: str = "center"  # Add position parameter
    ) -> bytes:
        """Apply a safe watermark."""
        
        pdf = PDFEngine.open_pdf(pdf_bytes)
        
        try:
            # Parse hex color
            color = color.lstrip("#")
            r = int(color[0:2], 16) / 255
            g = int(color[2:4], 16) / 255
            b = int(color[4:6], 16) / 255
        except:
            r, g, b = 0.6, 0.6, 0.6

        for page in pdf:
            rect = page.rect
            
            # Handle different positions
            if position == "bottom":
                wm_rect = fitz.Rect(
                    rect.x0 + rect.width * 0.1,
                    rect.y1 - 50,  # Near bottom
                    rect.x1 - rect.width * 0.1,
                    rect.y1 - 10
                )
                font_size = min(font_size, 14)  # Smaller for bottom
            else:  # center
                wm_rect = fitz.Rect(
                    rect.x0 + rect.width * 0.1,
                    rect.y0 + rect.height * 0.4,
                    rect.x1 - rect.width * 0.1,
                    rect.y1 - rect.height * 0.4
                )
            
            # If angle is specified, we need to use text rotation
            if angle != 0:
                # For rotated text, we need to use insert_text with matrix
                center_x = (rect.x0 + rect.x1) / 2
                center_y = (rect.y0 + rect.y1) / 2
                
                # Create transformation matrix for rotation
                # mat = fitz.Matrix(1, 0, 0, 1, 0, 0)
                # if angle != 0:
                #     mat = fitz.Matrix().pre_rotate(angle)
                
                # Calculate position
                text_width = len(text) * font_size * 0.6
                text_height = font_size
                
                page.insert_text(
                    fitz.Point(center_x - text_width/2, center_y),
                    text,
                    fontsize=font_size,
                    fontname="Helvetica-Bold",
                    color=(r, g, b),
                    fill_opacity=opacity,
                    # rotate=angle,
                    overlay=True
                )
            else:
                # Non-rotated text in rectangle
                page.insert_textbox(
                    wm_rect,
                    text,
                    fontsize=font_size,
                    fontname="Helvetica-Bold",
                    color=(r, g, b),
                    fill_opacity=opacity,
                    align=1,
                    overlay=True
                )

        result = pdf.tobytes(clean=True)
        pdf.close()
        return result

    
    @staticmethod
    def apply_audit_footer(
        pdf_bytes: bytes,
        signer_email: str,
        ip: str,
        timestamp: str,
        footer_text: str = None  # Add optional footer_text parameter
    ) -> bytes:
        """Add audit footer to each page."""
        pdf = PDFEngine.open_pdf(pdf_bytes)
        
        for page in pdf:
            rect = page.rect
            margin = 20
            footer_height = 30
            
            footer_rect = fitz.Rect(
                rect.x0 + margin,
                rect.y1 - footer_height,
                rect.x1 - margin,
                rect.y1 - 5
            )
            
            # Use custom footer_text if provided, otherwise use default
            if footer_text:
                display_text = footer_text
            else:
                display_text = (
                    f"Digitally signed by: {signer_email} | "
                    f"IP: {ip} | "
                    f"Timestamp: {timestamp}"
                )
            
            # Add separator line
            page.draw_line(
                fitz.Point(rect.x0 + margin, rect.y1 - footer_height - 5),
                fitz.Point(rect.x1 - margin, rect.y1 - footer_height - 5),
                color=(0.7, 0.7, 0.7),
                width=0.5,
                overlay=True
            )
            
            # Add footer text
            page.insert_textbox(
                footer_rect,
                display_text,
                fontsize=8,
                fontname="Helvetica",
                color=(0.5, 0.5, 0.5),
                align=1,  # Center
                overlay=True
            )
        
        result = pdf.tobytes(clean=True)
        pdf.close()
        return result
    
    @staticmethod
    def finalize_document(
        pdf_bytes: bytes,
        signatures: List[Dict] = None,
        fields: List[Dict] = None,
        watermark_text: str = None,
        add_footer: bool = False,
        signer_email: str = "",
        ip: str = "",
        timestamp: str = None,
        # New parameters for envelope header
        envelope_id: str = None,
        document_name: str = None,
        status: str = None,
        sender: str = None,
        created_date: str = None
    ) -> bytes:
        """
        Complete document processing pipeline with optional envelope header.
        """
        result = pdf_bytes
        
        # Apply clean minimal envelope header if envelope_id is provided
        if envelope_id:
            result = PDFEngine.apply_minimal_envelope_header(
                result,
                envelope_id=envelope_id,
                color="#000000"
            )
        
        # Apply all fields (including signatures and initials if they're in fields list)
        if fields:
            result = PDFEngine.apply_all_fields(result, fields)
        
        # Apply additional signatures only if not already applied in fields
        if signatures:
            applied_ids = {str(f.get("id", f.get("_id", ""))) for f in fields} if fields else set()
            extra_sigs = [s for s in signatures if str(s.get("field_id", "")) not in applied_ids]
            if extra_sigs:
                result = PDFEngine.apply_signatures_with_field_positions(result, extra_sigs, fields)
        
        # Apply watermark
        if watermark_text:
            result = PDFEngine.apply_watermark(result, watermark_text)
        
        # Apply footer
        if add_footer and signer_email:
            if not timestamp:
                timestamp = datetime.utcnow().isoformat()
            result = PDFEngine.apply_audit_footer(result, signer_email, ip, timestamp)
        
        return result
    
    

    
    @staticmethod
    def apply_envelope_header(
        pdf_bytes: bytes,
        envelope_id: str,
        document_name: str = None,
        status: str = None,
        sender: str = None,
        created_date: str = None,
        expires_date: str = None,
        color: str = "#000000"
    ) -> bytes:
        """
        Clean envelope header. Delegates to apply_minimal_envelope_header
        to maintain clean black envelope ID on each page and avoid unwanted
        blue banners, sender profiles, QR boxes, left arrow graphics, or page shifts.
        """
        return PDFEngine.apply_minimal_envelope_header(
            pdf_bytes,
            envelope_id=envelope_id,
            color="#000000"
        )

    @staticmethod
    def apply_minimal_envelope_header(
        pdf_bytes: bytes,
        envelope_id: str,
        color: str = "#000000"
    ) -> bytes:
        """
        Minimal envelope header (clean black ID on top of each page).
        Less intrusive, preserves exact page dimensions without shifting content.
        """
        if not envelope_id:
            return pdf_bytes

        try:
            pdf = PDFEngine.open_pdf(pdf_bytes)
            
            # Safety check: Ensure it's a valid PDF with pages
            if not pdf or not hasattr(pdf, "is_pdf") or not pdf.is_pdf or len(pdf) == 0:
                if pdf:
                    pdf.close()
                return pdf_bytes
        except Exception as e:
            print(f"Skipping envelope header: {e}")
            return pdf_bytes
        
        # Parse color (defaults to black)
        try:
            color_str = str(color).lstrip("#")
            r = int(color_str[0:2], 16) / 255
            g = int(color_str[2:4], 16) / 255
            b = int(color_str[4:6], 16) / 255
        except Exception:
            r, g, b = 0.0, 0.0, 0.0  # Black default
        
        env_upper = str(envelope_id).upper().strip()
        id_text = f"ESIGNIVA ID : {env_upper}"

        for page_num, page in enumerate(pdf):
            try:
                rect = page.rect
                
                # Check if envelope ID is already stamped on this page to prevent duplicate text
                page_text = page.get_text("text") or ""
                if env_upper in page_text.upper():
                    continue
                
                # Stamp clean black envelope ID on top
                page.insert_text(
                    fitz.Point(rect.x0 + 10, rect.y0 + 12),
                    id_text,
                    fontsize=9,
                    fontname="Helvetica-Bold",
                    color=(r, g, b),
                    overlay=True
                )
            except Exception as e:
                print(f"Error inserting header on page {page_num}: {e}")
                continue
        
        result = pdf.tobytes(clean=True)
        pdf.close()
        return result
    
    @staticmethod
    def encrypt_pdf(pdf_bytes, user_password, owner_password, permissions=None):
        """
        Encrypt PDF with password protection.
        
        Args:
            pdf_bytes: Raw PDF bytes
            user_password: Password required to open the PDF
            owner_password: Password for full access (can be same as user_password)
            permissions: Dictionary of allowed permissions
            
        Returns:
            Encrypted PDF bytes
        """
        from pypdf import PdfReader, PdfWriter
        
        reader = PdfReader(BytesIO(pdf_bytes))
        writer = PdfWriter()
        
        # Copy all pages
        for page in reader.pages:
            writer.add_page(page)
        
        # Copy metadata
        if reader.metadata:
            writer.add_metadata(reader.metadata)
        
        # Set permissions
        perm_config = permissions or {
            "print": True,
            "modify": False,
            "copy": False,
            "annotate": False
        }
        
        # Encrypt the PDF
        writer.encrypt(
            user_password=user_password,
            owner_password=owner_password,
            use_128bit=True,
            permissions_flag=perm_config
        )
        
        # Write to bytes
        output = BytesIO()
        writer.write(output)
        output.seek(0)
        
        return output.read()
    
    @staticmethod
    def optimize_for_printing(pdf_bytes):
        """
        Optimize PDF for printing.
        Removes interactive elements and flattens the PDF.
        
        Args:
            pdf_bytes: Raw PDF bytes
            
        Returns:
            Optimized PDF bytes
        """
        # For now, return the original PDF
        # You can implement PDF optimization using libraries like pikepdf
        return pdf_bytes
    
    @staticmethod
    def apply_print_footer(pdf_bytes, footer_text):
        """
        Add a print-specific footer to the PDF.
        
        Args:
            pdf_bytes: Raw PDF bytes
            footer_text: Text to add to footer
            
        Returns:
            PDF with footer added
        """
        # You can implement this using reportlab or similar
        # For now, return the original
        return pdf_bytes
    
    @staticmethod
    def create_summary_pdf(summary_data):
        """
        Create a professional, high-fidelity Document Summary Report (Certificate of Completion).
        Features a clean, enterprise-grade design with full audit trail and recipient status.
        Uses a robust data mapper to handle different summary data structures.
        """
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib import colors
        import io
        
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        
        # --- ROBUST DATA MAPPING ---
        # Handle both flat and nested structures
        doc_name = summary_data.get('document_name') or summary_data.get('document', {}).get('filename', 'N/A')
        env_id = summary_data.get('envelope_id') or summary_data.get('document', {}).get('envelope_id', 'N/A')
        doc_status = summary_data.get('document_status') or summary_data.get('document', {}).get('status', 'N/A')
        
        # --- BRAND COLORS & CONSTANTS ---
        TEAL = colors.HexColor("#0D9488")
        DARK = colors.HexColor("#111827")
        GRAY_TEXT = colors.HexColor("#374151")
        GRAY_BG = colors.HexColor("#F9FAFB")
        WHITE = colors.white
        
        # 1. PREMIUM HEADER SECTION
        c.setFillColor(TEAL)
        c.rect(0, height - 90, width, 90, fill=1, stroke=0)
        
        # Site Brand
        c.setFont("Helvetica-Bold", 26)
        c.setFillColor(WHITE)
        c.drawString(40, height - 50, "Esigniva")
        
        c.setFont("Helvetica", 10)
        c.setFillColor(WHITE)
        c.drawString(40, height - 68, "Official Summary & Completion Certificate")
        
        # Header Right Info
        status = str(doc_status).upper()
        c.setFont("Helvetica-Bold", 12)
        c.drawRightString(width - 40, height - 48, f"STATUS: {status}")
        
        timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
        c.setFont("Helvetica", 8)
        c.drawRightString(width - 40, height - 64, f"Generated On: {timestamp}")
        
        # 2. ENVELOPE SUMMARY CARD
        card_y = height - 210
        c.setFillColor(GRAY_BG)
        c.setStrokeColor(colors.HexColor("#D1D5DB"))
        c.roundRect(40, card_y, width - 80, 100, 4, fill=1, stroke=1)
        
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(DARK)
        c.drawString(55, card_y + 80, "ENVELOPE SUMMARY")
        
        # Envelope Data Points
        details = [
            ("Document Name:", doc_name),
            ("Envelope ID:", env_id),
            ("Sender:", f"{summary_data.get('owner_name', 'System')} <{summary_data.get('owner_email', 'N/A')}>"),
            ("Completed Date:", summary_data.get('completed_date', 'Pending Completion'))
        ]
        
        y_pos = card_y + 60
        for label, value in details:
            c.setFont("Helvetica-Bold", 9)
            c.setFillColor(GRAY_TEXT)
            c.drawString(55, y_pos, label)
            
            c.setFont("Helvetica", 9)
            c.setFillColor(DARK)
            c.drawString(160, y_pos, str(value)[:85])
            y_pos -= 15
            
        # 3. PARTICIPANTS TABLE
        c.setFont("Helvetica-Bold", 13)
        c.setFillColor(DARK)
        c.drawString(40, card_y - 35, "Participants & Signer Events")
        
        # Headers
        table_y = card_y - 60
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(GRAY_TEXT)
        c.drawString(40, table_y, "SIGNER INFO")
        c.drawString(300, table_y, "ROLE")
        c.drawString(380, table_y, "STATUS")
        c.drawString(470, table_y, "IP / DATE")
        
        c.setStrokeColor(TEAL)
        c.setLineWidth(1.5)
        c.line(40, table_y - 4, width - 40, table_y - 4)
        
        # Recipient Rows
        recipients = summary_data.get('all_recipients', [])
        curr_y = table_y - 25
        for p in recipients[:10]: # Up to 10 recipients
            c.setFont("Helvetica-Bold", 9)
            c.setFillColor(DARK)
            c.drawString(40, curr_y, p.get('name', 'N/A')[:40])
            
            c.setFont("Helvetica", 8)
            c.setFillColor(GRAY_TEXT)
            c.drawString(40, curr_y - 10, p.get('email', 'N/A')[:45])
            
            c.setFont("Helvetica", 9)
            c.drawString(300, curr_y, str(p.get('role', 'signer')).title())
            
            # Status Badge
            p_status = str(p.get('status', 'pending')).upper()
            if p_status == 'COMPLETED':
                c.setFillColor(colors.HexColor("#059669"))
            elif p_status in ['DECLINED', 'VOIDED']:
                c.setFillColor(colors.HexColor("#DC2626"))
            else:
                c.setFillColor(colors.HexColor("#D97706"))
            c.drawString(380, curr_y, p_status)
            
            # Action Info
            c.setFillColor(GRAY_TEXT)
            c.setFont("Helvetica", 7.5)
            ip_text = p.get('completed_ip') or p.get('last_ip', '0.0.0.0')
            c.drawString(470, curr_y, f"IP: {ip_text}")
            date_text = p.get('completed_at') or p.get('last_action_at', 'Pending')
            c.drawString(470, curr_y - 10, str(date_text))
            
            curr_y -= 30
            if curr_y < 80: # Break if too long
                break
            
        # 4. AUDIT FOOTER
        c.setFillColor(GRAY_BG)
        c.rect(0, 0, width, 50, fill=1, stroke=0)
        
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(TEAL)
        c.drawString(40, 20, "VERIFIED BY ESIGNIVA")
        
        c.setFont("Helvetica", 7)
        c.setFillColor(GRAY_TEXT)
        sum_id = summary_data.get('summary_id') or env_id
        c.drawRightString(width - 40, 25, f"Certificate ID: {sum_id}")
        c.drawRightString(width - 40, 15, "This is a legally-binding evidence summary of the signing transaction.")
        
        c.save()
        buffer.seek(0)
        return buffer.getvalue()

    
    

    @staticmethod
    def encrypt_pdf(pdf_bytes, user_password, owner_password, permissions=None):
        """
        Encrypt PDF with password protection.
        """
        try:
            from pypdf import PdfReader, PdfWriter
            import io  # Add this import
            
            reader = PdfReader(io.BytesIO(pdf_bytes))
            writer = PdfWriter()
            
            # Copy all pages
            for page in reader.pages:
                writer.add_page(page)
            
            # Copy metadata if available
            if reader.metadata:
                writer.add_metadata(reader.metadata)
            
            # Set default permissions if not provided
            if permissions is None:
                permissions = {
                    "print": True,
                    "modify": False,
                    "copy": False,
                    "annotate": False
                }
            
            # Convert permissions dict to integer flag if necessary
            # Standard PDF permissions bitmask
            # Bit 3: Print (4), Bit 4: Modify (8), Bit 5: Copy (16), Bit 6: Annotate (32)
            if isinstance(permissions, dict):
                perm_flag = -1024 # Standard base for 'allow everything else'
                # pypdf default permissions bitmask logic
                # For simplicity, we can just start with 0 and add bits
                perm_flag = 0
                if permissions.get("print", True): perm_flag |= 4
                if permissions.get("modify", False): perm_flag |= 8
                if permissions.get("copy", True): perm_flag |= 16
                if permissions.get("annotate", False): perm_flag |= 32
                if permissions.get("form_fill", True): perm_flag |= 256
                if permissions.get("extract", True): perm_flag |= 512
                permissions = perm_flag

            # Encrypt the PDF
            writer.encrypt(
                user_password=user_password,
                owner_password=owner_password,
                use_128bit=True,
                permissions_flag=permissions
            )
            
            # Write to bytes
            output = io.BytesIO()
            writer.write(output)
            output.seek(0)
            
            return output.read()
            
        except Exception as e:
            print(f"Error encrypting PDF: {str(e)}")
            # If encryption fails, return the original PDF
            return pdf_bytes
        
        
    @staticmethod
    def create_certificate_pdf(certificate_data):
        """
        Create a Certificate of Completion PDF.
        
        Args:
            certificate_data: Dictionary containing certificate information
            
        Returns:
            PDF bytes
        """
        try:
            from reportlab.lib.pagesizes import letter, landscape
            from reportlab.pdfgen import canvas
            from reportlab.lib.units import inch
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.enums import TA_CENTER
            import io
            
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            styles = getSampleStyleSheet()
            
            # Create custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#0d9488'),
                alignment=TA_CENTER,
                spaceAfter=20
            )
            
            subheader_style = ParagraphStyle(
                'Subheader',
                parent=styles['Heading2'],
                fontSize=14,
                textColor=colors.HexColor('#666666'),
                alignment=TA_CENTER,
                spaceAfter=10
            )
            
            normal_style = ParagraphStyle(
                'NormalCenter',
                parent=styles['Normal'],
                alignment=TA_CENTER,
                spaceAfter=10
            )
            
            # Build story
            story = []
            
            # Title
            story.append(Paragraph("CERTIFICATE OF COMPLETION", title_style))
            story.append(Spacer(1, 20))
            
            # Subtitle
            story.append(Paragraph("Digital Document Signing", subheader_style))
            story.append(Spacer(1, 30))
            
            # Main certificate text
            cert_text = f"This certifies that the document signing process for<br/>" \
                    f"<b>{certificate_data['document_name']}</b><br/>" \
                    f"has been successfully completed."
            story.append(Paragraph(cert_text, normal_style))
            story.append(Spacer(1, 30))
            
            # Envelope ID
            env_text = f"Envelope ID: <b>{certificate_data['envelope_id']}</b>"
            story.append(Paragraph(env_text, normal_style))
            story.append(Spacer(1, 20))
            
            # Completion date
            completed_at = certificate_data.get('completed_at', '').split('T')[0]
            date_text = f"Completed on: <b>{completed_at}</b>"
            story.append(Paragraph(date_text, normal_style))
            story.append(Spacer(1, 40))
            
            # Recipients table
            if certificate_data.get('recipients'):
                story.append(Paragraph("Signing Participants", subheader_style))
                story.append(Spacer(1, 10))
                
                # Prepare table data
                table_data = [['Name', 'Email', 'Role', 'Status', 'Completed']]
                
                for recipient in certificate_data['recipients']:
                    completed = '✓' if recipient.get('completed_at') else '—'
                    status = recipient.get('status', 'pending').title()
                    table_data.append([
                        recipient.get('name', ''),
                        recipient.get('email', ''),
                        recipient.get('role', '').replace('_', ' ').title(),
                        status,
                        completed
                    ])
                
                # Create table
                table = Table(table_data, colWidths=[1.5*inch, 2.2*inch, 1.2*inch, 1*inch, 0.8*inch])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0d9488')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                    ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                ]))
                
                story.append(table)
                story.append(Spacer(1, 40))
            
            # Footer
            footer_text = f"Generated by {certificate_data.get('platform_name', 'Esigniva')} " \
                        f"on {certificate_data.get('generated_at', '').split('T')[0]}"
            story.append(Paragraph(footer_text, ParagraphStyle(
                'Footer',
                parent=styles['Normal'],
                fontSize=8,
                textColor=colors.grey,
                alignment=TA_CENTER
            )))
            
            # Build PDF
            doc.build(story)
            buffer.seek(0)
            return buffer.read()
            
        except Exception as e:
            print(f"Error creating certificate PDF: {str(e)}")
            # Return a simple error PDF
            from reportlab.pdfgen import canvas
            import io
            buffer = io.BytesIO()
            c = canvas.Canvas(buffer, pagesize=letter)
            c.drawString(100, 700, "Certificate Generation Failed")
            c.drawString(100, 680, str(e))
            c.save()
            buffer.seek(0)
            return buffer.read()