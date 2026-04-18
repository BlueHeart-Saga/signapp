import fitz  # PyMuPDF
import base64
import json
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
import re
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

        # Priority 1: Use canvas coordinates with conversion context (MOST RELIABLE)
        # These are scale-independent relative to the UI canvas used to place them
        if "canvas_x" in field and "canvas_y" in field and field.get("canvas_width") and field.get("canvas_height"):
            path_taken = "Priority 1 (Canvas Ratio)"
            canvas_x = safe_float(field.get("canvas_x"))
            canvas_y = safe_float(field.get("canvas_y"))
            canvas_width = safe_float(field.get("canvas_width"), 794.0)
            canvas_height = safe_float(field.get("canvas_height"), 1123.0)
            
            field_width_px = safe_float(field.get("width"), 160.0)
            field_height_px = safe_float(field.get("height"), 32.0)
            
            # Map normalized proportions to actual page size + offset
            res_x = x0 + (canvas_x / canvas_width) * page_width
            res_y = y0 + (canvas_y / canvas_height) * page_height
            res_w = (field_width_px / canvas_width) * page_width
            res_h = (field_height_px / canvas_height) * page_height
        
        # Priority 2: Use PDF coordinates if available (BACKEND-CALCULATED)
        elif "pdf_x" in field and "pdf_y" in field:
            path_taken = "Priority 2 (Stored PDF Points)"
            x_stored = safe_float(field.get("pdf_x"))
            y_stored = safe_float(field.get("pdf_y")) # Stored as bottom-based
            res_w = safe_float(field.get("pdf_width"), 100)
            res_h = safe_float(field.get("pdf_height"), 40)
            
            # Convert bottom-based to top-based + add offset
            res_x = x0 + x_stored
            res_y = y0 + (page_height - y_stored - res_h)
        
        # Priority 3: Fallback to standard x/y
        else:
            path_taken = "Priority 3 (Fallback x/y)"
            res_x = x0 + safe_float(field.get("x"))
            y_val = safe_float(field.get("y"))
            res_w = safe_float(field.get("width"), 100)
            res_h = safe_float(field.get("height"), 40)
            
            # If x/y looks like PDF points, assume bottom-based
            if res_x < 2000 and y_val < 2000:
                 res_y = y0 + (page_height - y_val - res_h)
            else:
                 res_y = y0 + y_val # Assume top-based px if very large (unlikely but safe)
        
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
    def _apply_signature_field(page, rect, value, field):
        """Apply signature image - no border for completed fields."""
        is_completed = field.get("_render_completed", False) or field.get("is_completed", False)
        
        # 🚫 CRITICAL: If field is completed, just insert the image without any borders/background
        if is_completed and value:
            # Extract image from different value formats
            image_data = None
            
            if isinstance(value, dict):
                if "image" in value:
                    image_data = PDFEngine.decode_base64_image(value["image"])
                elif "data" in value and value.get("type") == "image":
                    image_data = PDFEngine.decode_base64_image(value["data"])
                elif "value" in value:
                    val = value.get("value")
                    if isinstance(val, str) and val.startswith("data:image"):
                        image_data = PDFEngine.decode_base64_image(val)
                    elif isinstance(val, dict) and val.get("image"):
                        image_data = PDFEngine.decode_base64_image(val.get("image"))
            elif isinstance(value, str):
                image_data = PDFEngine.decode_base64_image(value)
            
            if image_data:
                try:
                    img = Image.open(BytesIO(image_data)).convert("RGBA")
                    img = img.resize((int(rect.width), int(rect.height)), Image.Resampling.LANCZOS)
                    
                    buf = BytesIO()
                    img.save(buf, format="PNG")
                    page.insert_image(
                        rect,
                        stream=buf.getvalue(),
                        keep_proportion=False,
                        overlay=True
                    )
                except Exception as e:
                    print(f"Error inserting signature image: {e}")
                    # Fallback to text for completed fields
                    page.insert_textbox(
                        rect,
                        "✓ Signed",
                        fontsize=min(12, rect.height * 0.6),
                        fontname="Helvetica",
                        color=(0, 0.5, 0),
                        align=1,
                        overlay=True
                    )
            elif value and not image_data:
                # Value exists but couldn't decode as image - show text value
                # Extract color if available
                text_color = (0, 0.5, 0) # Default green for signature fallback
                font_color = value.get("font_color") if isinstance(value, dict) else None
                if font_color and isinstance(font_color, str):
                    try:
                        c = font_color.lstrip("#")
                        if len(c) == 6:
                            text_color = (int(c[0:2], 16)/255, int(c[2:4], 16)/255, int(c[4:6], 16)/255)
                    except:
                        pass

                page.insert_textbox(
                    rect,
                    str(value)[:20],
                    fontsize=min(12, rect.height * 0.6),
                    fontname="Helvetica",
                    color=text_color,
                    align=1,
                    overlay=True
                )
            
            # 🚫 IMPORTANT: Return immediately - NO borders for completed fields
            return
        
        # If no value and field is not completed, show placeholder
        if not value and not is_completed:
            # Show placeholder for empty signature field
            page.draw_rect(
                rect,
                color=(0.8, 0, 0),  # Red border for signature placeholder
                width=1,
                dashes=[3, 3],  # Dashed border
                overlay=True
            )
            
            page.insert_textbox(
                rect,
                "Signature",
                fontsize=min(12, rect.height * 0.6),
                fontname="Helvetica",
                color=(0.5, 0.5, 0.5),
                align=1,
                overlay=True
            )
            return
        
        image_data = None

        # Extract image from different value formats
        if isinstance(value, dict):
            if "image" in value:
                image_data = PDFEngine.decode_base64_image(value["image"])
            elif "data" in value and value.get("type") == "image":
                image_data = PDFEngine.decode_base64_image(value["data"])
        elif isinstance(value, str):
            image_data = PDFEngine.decode_base64_image(value)
        
        # 🚫 DO NOT draw any border if field has a signature (completed)
        # The signature image should appear without any border/background
        
        if image_data:
            try:
                img = Image.open(BytesIO(image_data)).convert("RGBA")
                img = img.resize((int(rect.width), int(rect.height)), Image.Resampling.LANCZOS)
                
                buf = BytesIO()
                img.save(buf, format="PNG")
                page.insert_image(
                    rect,
                    stream=buf.getvalue(),
                    keep_proportion=False,
                    overlay=True
                )
            except Exception as e:
                print(f"Error inserting signature image: {e}")
                # Fallback to text
                page.insert_textbox(
                    rect,
                    "✓ Signed",
                    fontsize=min(12, rect.height * 0.6),
                    fontname="Helvetica",
                    color=(0, 0.5, 0),
                    align=1,
                    overlay=True
                )
        elif value and not image_data:
            # Value exists but couldn't decode as image - show text value
            page.insert_textbox(
                rect,
                str(value)[:20],
                fontsize=min(12, rect.height * 0.6),
                fontname="Helvetica",
                color=(0, 0.5, 0),
                align=1,
                overlay=True
            )
    
    @staticmethod
    def _apply_initials_field(page, rect, value, field):
        """Apply initials (image preferred, fallback to text) with proper sizing."""
        is_completed = field.get("_render_completed", False)
        
        # Extract value based on format
        image_data = None
        text_value = None
        
        if isinstance(value, dict):
            # Handle dict format
            if "image" in value:
                image_data = PDFEngine.decode_base64_image(value.get("image"))
            if "text" in value:
                text_value = value.get("text")
            elif "value" in value:
                val = value.get("value")
                # Check for image data in value key
                if isinstance(val, str) and val.startswith("data:image"):
                    image_data = PDFEngine.decode_base64_image(val)
                elif isinstance(val, dict):
                    if "image" in val:
                        image_data = PDFEngine.decode_base64_image(val.get("image"))
                    if "text" in val:
                        text_value = val.get("text")
                    elif "value" in val:
                        text_value = str(val.get("value"))
                else:
                    text_value = str(val)
        elif isinstance(value, str):
            if value.startswith("data:image"):
                image_data = PDFEngine.decode_base64_image(value)
            else:
                text_value = value
        
        # COMPLETED FIELD - Always show something
        if is_completed:
            if image_data:
                try:
                    img = Image.open(BytesIO(image_data)).convert("RGBA")
                    # Resize to fit
                    img_width, img_height = img.size
                    field_width = int(rect.width)
                    field_height = int(rect.height)
                    
                    scale_w = field_width / img_width
                    scale_h = field_height / img_height
                    scale = min(scale_w, scale_h)
                    
                    new_width = int(img_width * scale)
                    new_height = int(img_height * scale)
                    
                    # Center image
                    x_offset = (field_width - new_width) // 2
                    y_offset = (field_height - new_height) // 2
                    
                    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                    result_img = Image.new("RGBA", (field_width, field_height), (255, 255, 255, 0))
                    result_img.paste(img, (x_offset, y_offset), img if img.mode == 'RGBA' else None)
                    
                    buf = BytesIO()
                    result_img.save(buf, format="PNG")
                    page.insert_image(rect, stream=buf.getvalue(), keep_proportion=False, overlay=True)
                    return
                except Exception as e:
                    print("Initials image error:", e)
                    # Fall through to text
            
            # TEXT FALLBACK
            if text_value:
                initials = str(text_value).upper()[:3]
            else:
                initials = "XX"  # Default placeholder
            
            # Extract color if available
            text_color = (0, 0, 0)
            font_color = value.get("font_color") if isinstance(value, dict) else None
            if font_color and isinstance(font_color, str):
                try:
                    c = font_color.lstrip("#")
                    if len(c) == 6:
                        text_color = (int(c[0:2], 16)/255, int(c[2:4], 16)/255, int(c[4:6], 16)/255)
                except:
                    pass

            font_size = min(16, rect.height * 0.7)
            page.insert_textbox(
                rect,
                initials,
                fontsize=font_size,
                fontname="Helvetica-Bold",
                color=text_color,
                align=1,  # Center
                overlay=True
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
            
            page.insert_textbox(
                rect,
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
            # For completed fields, we MUST show something
            if not actual_text or actual_text.strip() == "":
                # Show a default for empty completed fields
                if field.get("type") == "mail":
                    display_text = "Email provided"
                elif field.get("type") == "date":
                    display_text = "Date selected"
                else:
                    display_text = "Completed"
                text_color = (0.5, 0.5, 0.5)  # Gray
            else:
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
        max_font = min(font_size, rect.height * 0.8)
        
        # Auto-shrink font to fit
        while max_font > 6:
            try:
                current_font = custom_font_family if custom_font_family in ["Helvetica", "Times-Roman", "Courier"] else "Helvetica"
                text_width = fitz.get_text_length(display_text, fontname=current_font, fontsize=max_font)
                if text_width <= (rect.width - 6):
                    break
                max_font -= 0.5
            except:
                break
        
        # Center vertically
        text_y = rect.y0 + (rect.height + max_font) / 2 - 2
        
        # Use insert_text for robust single-line rendering, fallback to textbox for multi-line
        if rect.height < 35:
            page.insert_text(
                fitz.Point(rect.x0 + 2, text_y),
                display_text,
                fontsize=max_font,
                fontname=custom_font_family if custom_font_family in ["Helvetica", "Times-Roman", "Courier"] else "Helvetica",
                color=custom_text_color,
                overlay=True
            )
        else:
            page.insert_textbox(
                rect,
                display_text,
                fontsize=max_font,
                fontname=custom_font_family if custom_font_family in ["Helvetica", "Times-Roman", "Courier"] else "Helvetica",
                color=custom_text_color,
                align=0,
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
            date_text = field.get("placeholder", "Date")
        
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
        
        font_size = min(field.get("font_size", 12), rect.height * 0.7)
        # Center vertically
        text_y = rect.y0 + (rect.height + font_size) / 2 - 2

        page.insert_text(
            fitz.Point(rect.x0 + 2, text_y),
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
        if is_completed and selected_text:
            font_size = min(11, rect.height * 0.75)
            
            # Auto-shrink for dropdown completed values
            while font_size > 6:
                text_width = fitz.get_text_length(selected_text, fontname="Helvetica", fontsize=font_size)
                if text_width <= (rect.width - 6):
                    break
                font_size -= 0.5

            # Center vertically and horizontally for completed state
            text_y = rect.y0 + (rect.height + font_size) / 2 - 1
            
            page.insert_text(
                fitz.Point(rect.x0 + 3, text_y),
                selected_text,
                fontsize=font_size,
                fontname="Helvetica",
                color=(0, 0, 0),
                overlay=True
            )
            return  # 🚫 NO border, NO arrow for completed fields

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
        
        # If no filename, but it's completed, show a default
        if not filename:
            filename = "Attached File"

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
            
            page.insert_text(
                text_rect.tl,
                "Approved" if approved else "Not Approved",
                fontsize=8,
                fontname="Helvetica",
                color=(0, 0.5, 0) if approved else (0.5, 0.5, 0.5),
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
        
        # Add "Approve" text
        text_rect = fitz.Rect(
            rect.x0,
            rect.y1 + 2,
            rect.x1,
            rect.y1 + 12
        )
        
        page.insert_text(
            text_rect.tl,
            "Approve",
            fontsize=8,
            fontname="Helvetica",
            color=(0, 0.5, 0) if approved else (0.5, 0.5, 0.5),
            overlay=True
        )
    
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
                
            text_rect = fitz.Rect(
                rect.x0,
                start_y + (i * line_height),
                rect.x1,
                start_y + (i * line_height) + font_size
            )
            
            page.insert_textbox(
                text_rect,
                line,
                fontsize=font_size,
                fontname="Helvetica-Bold",
                color=(r, g, b),
                align=1,  # Center
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
                image_data = PDFEngine.decode_base64_image(sig.get("image", ""))
                if not image_data:
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

                img = Image.open(BytesIO(image_data)).convert("RGBA")
                img = img.resize((int(rect.width), int(rect.height)), Image.Resampling.LANCZOS)

                buf = BytesIO()
                img.save(buf, format="PNG")

                page.insert_image(
                    rect,
                    stream=buf.getvalue(),
                    keep_proportion=False,
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
            from database import db  # Import your database
            doc_ids_list = [ObjectId(doc_id) if isinstance(doc_id, str) else doc_id for doc_id in doc_ids]
            
            all_recipients = list(db.recipients.find({
                "document_id": {"$in": doc_ids_list}
            }))
            
            for rec in all_recipients:
                rec_id = str(rec["_id"])
                recipients_by_id[rec_id] = rec
                if rec.get("email"):
                    recipients_by_email[rec["email"]] = rec
        
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
        
        # Apply envelope header if envelope_id is provided
        if envelope_id:
            result = PDFEngine.apply_envelope_header(
                result,
                envelope_id=envelope_id,
                document_name=document_name,
                status=status,
                sender=sender,
                created_date=created_date,
                color="#1a73e8"
            )
        
        # Apply all fields (including signatures if they're in fields list)
        if fields:
            result = PDFEngine.apply_all_fields(result, fields)
        
        # Apply additional signatures
        if signatures:
            result = PDFEngine.apply_signatures_with_field_positions(result, signatures, fields)
        
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
        color: str = "#0d9488"  # Teal color
    ) -> bytes:
        """
        Add Docusign-like envelope header at top of first page.
        Includes envelope ID, document info, and status.
        """
        pdf = PDFEngine.open_pdf(pdf_bytes)
        
        if len(pdf) == 0:
            return pdf_bytes
        
        # Parse color
        try:
            color = color.lstrip("#")
            r = int(color[0:2], 16) / 255
            g = int(color[2:4], 16) / 255
            b = int(color[4:6], 16) / 255
        except:
            r, g, b = 0.05, 0.58, 0.53  # #0d9488 teal default
        
        for page_num, page in enumerate(pdf):
            rect = page.rect
            
            # Only add to first page, or add lighter version to subsequent pages
            if page_num == 0:
                # Full header for first page
                header_height = 80
                
                # Add separator line only (no background)
                page.draw_line(
                    fitz.Point(rect.x0, rect.y0 + header_height),
                    fitz.Point(rect.x1, rect.y0 + header_height),
                    color=(r * 0.7, g * 0.7, b * 0.7),
                    width=1,
                    overlay=True
                )
                
                # Logo/Icon area (left)
                logo_rect = fitz.Rect(
                    rect.x0 + 20,
                    rect.y0 + 15,
                    rect.x0 + 70,
                    rect.y0 + header_height - 15
                )
                
                # Draw envelope icon with text color
                page.draw_rect(
                    logo_rect,
                    color=(r, g, b),
                    width=1,
                    fill=None,
                    overlay=True
                )
                
                # Envelope icon (simplified)
                env_center_x = logo_rect.x0 + logo_rect.width / 2
                env_center_y = logo_rect.y0 + logo_rect.height / 2
                env_size = min(logo_rect.width, logo_rect.height) * 0.4
                
                # Envelope shape
                page.draw_polyline(
                    [
                        fitz.Point(env_center_x - env_size, env_center_y - env_size * 0.5),
                        fitz.Point(env_center_x, env_center_y + env_size * 0.5),
                        fitz.Point(env_center_x + env_size, env_center_y - env_size * 0.5),
                        fitz.Point(env_center_x - env_size, env_center_y - env_size * 0.5),
                    ],
                    color=(r, g, b),
                    width=2,
                    closePath=True,
                    overlay=True
                )
                
                # Document info area (center)
                info_rect = fitz.Rect(
                    logo_rect.x1 + 20,
                    rect.y0 + 15,
                    rect.x1 - 250,
                    rect.y0 + header_height - 15
                )
                
                # Envelope ID - large and prominent
                env_id_text = f"ENVELOPE ID: {envelope_id}"
                page.insert_textbox(
                    fitz.Rect(info_rect.x0, info_rect.y0, info_rect.x1, info_rect.y0 + 24),
                    env_id_text,
                    fontsize=16,
                    fontname="Helvetica-Bold",
                    color=(r, g, b),
                    align=0,
                    overlay=True
                )
                
                # Document name
                if document_name:
                    doc_name = f"Document: {document_name[:40]}{'...' if len(document_name) > 40 else ''}"
                    page.insert_textbox(
                        fitz.Rect(info_rect.x0, info_rect.y0 + 26, info_rect.x1, info_rect.y0 + 42),
                        doc_name,
                        fontsize=10,
                        fontname="Helvetica",
                        color=(0.2, 0.2, 0.2),  # Dark gray for readability
                        align=0,
                        overlay=True
                    )
                
                # Status and dates
                status_text = ""
                if status:
                    status_text = f"Status: {status.upper()}"
                if created_date:
                    status_text += f" | Created: {created_date}"
                if status_text:
                    page.insert_textbox(
                        fitz.Rect(info_rect.x0, info_rect.y0 + 44, info_rect.x1, info_rect.y0 + 58),
                        status_text,
                        fontsize=9,
                        fontname="Helvetica-Oblique",
                        color=(0.4, 0.4, 0.4),  # Medium gray
                        align=0,
                        overlay=True
                    )
                
                # Sender info (right side)
                sender_rect = fitz.Rect(
                    rect.x1 - 220,
                    rect.y0 + 15,
                    rect.x1 - 20,
                    rect.y0 + header_height - 15
                )
                
                if sender:
                    page.insert_textbox(
                        fitz.Rect(sender_rect.x0, sender_rect.y0, sender_rect.x1, sender_rect.y0 + 20),
                        f"From: {sender}",
                        fontsize=10,
                        fontname="Helvetica",
                        color=(0.2, 0.2, 0.2),  # Dark gray
                        align=2,
                        overlay=True
                    )
                
                # Expiry info
                if expires_date:
                    page.insert_textbox(
                        fitz.Rect(sender_rect.x0, sender_rect.y0 + 24, sender_rect.x1, sender_rect.y0 + 38),
                        f"Expires: {expires_date}",
                        fontsize=9,
                        fontname="Helvetica-Oblique",
                        color=(0.4, 0.4, 0.4),  # Medium gray
                        align=2,
                        overlay=True
                    )
                
                # Add QR code area for envelope ID (optional)
                qr_rect = fitz.Rect(
                    rect.x1 - 70,
                    rect.y0 + 15,
                    rect.x1 - 20,
                    rect.y0 + 65
                )
                
                page.draw_rect(
                    qr_rect,
                    color=(r, g, b),
                    width=1,
                    fill=None,
                    overlay=True
                )
                
                # Add "SCAN ME" text in teal color
                page.insert_textbox(
                    qr_rect,
                    "SCAN\nME",
                    fontsize=8,
                    fontname="Helvetica-Bold",
                    color=(r, g, b),
                    align=1,
                    overlay=True
                )
                
                # Shift all existing content down by header height
                try:
                    # Get existing content
                    page.wrap_contents()
                    
                    # Create a translation matrix to move content down
                    mat = fitz.Matrix(1, 0, 0, 1, 0, header_height)
                    page.set_rotation(0)
                    
                    # Get mediabox and cropbox
                    mediabox = page.mediabox
                    cropbox = page.cropbox
                    
                    # Adjust boxes to accommodate header
                    new_mediabox = fitz.Rect(
                        mediabox.x0,
                        mediabox.y0 + header_height,
                        mediabox.x1,
                        mediabox.y1 + header_height
                    )
                    
                    new_cropbox = fitz.Rect(
                        cropbox.x0,
                        cropbox.y0 + header_height,
                        cropbox.x1,
                        cropbox.y1 + header_height
                    )
                    
                    page.set_mediabox(new_mediabox)
                    page.set_cropbox(new_cropbox)
                    
                except Exception as e:
                    print(f"Warning: Could not shift content: {e}")
                    # Fallback: just add header without shifting content
                    # (content might be overlapped)
            
            else:
                # For subsequent pages, add a minimal header
                mini_header_height = 30
                
                # Add separator line only
                page.draw_line(
                    fitz.Point(rect.x0, rect.y0 + mini_header_height),
                    fitz.Point(rect.x1, rect.y0 + mini_header_height),
                    color=(r * 0.5, g * 0.5, b * 0.5),
                    width=0.5,
                    overlay=True
                )
                
                # Add envelope ID continuation
                continuation_text = f"Envelope ID: {envelope_id} - Page {page_num + 1} of {len(pdf)}"
                page.insert_textbox(
                    fitz.Rect(rect.x0 + 20, rect.y0 + 5, rect.x1 - 20, rect.y0 + 25),
                    continuation_text,
                    fontsize=9,
                    fontname="Helvetica",
                    color=(r, g, b),  # Teal color
                    align=0,
                    overlay=True
                )
                
                # Shift content for subsequent pages too
                try:
                    page.wrap_contents()
                    mat = fitz.Matrix(1, 0, 0, 1, 0, mini_header_height)
                    page.set_rotation(0)
                    
                    mediabox = page.mediabox
                    cropbox = page.cropbox
                    
                    new_mediabox = fitz.Rect(
                        mediabox.x0,
                        mediabox.y0 + mini_header_height,
                        mediabox.x1,
                        mediabox.y1 + mini_header_height
                    )
                    
                    new_cropbox = fitz.Rect(
                        cropbox.x0,
                        cropbox.y0 + mini_header_height,
                        cropbox.x1,
                        cropbox.y1 + mini_header_height
                    )
                    
                    page.set_mediabox(new_mediabox)
                    page.set_cropbox(new_cropbox)
                    
                except Exception as e:
                    print(f"Warning: Could not shift content on page {page_num}: {e}")
        
        result = pdf.tobytes(clean=True)
        pdf.close()
        return result

    @staticmethod
    def apply_minimal_envelope_header(
        pdf_bytes: bytes,
        envelope_id: str,
        color: str = "#000000"
    ) -> bytes:
        """
        Minimal envelope header (just ID and page numbers).
        Less intrusive, doesn't shift content.
        """
        try:
            pdf = PDFEngine.open_pdf(pdf_bytes)
            
            #  SAFETY CHECK: Ensure it's a valid PDF with pages
            if not pdf or not hasattr(pdf, "is_pdf") or not pdf.is_pdf or len(pdf) == 0:
                if pdf: pdf.close()
                return pdf_bytes
        except Exception as e:
            print(f"Skipping envelope header: {e}")
            return pdf_bytes
        
        # Parse color
        try:
            color = color.lstrip("#")
            r = int(color[0:2], 16) / 255
            g = int(color[2:4], 16) / 255
            b = int(color[4:6], 16) / 255
        except:
            r, g, b = 0.05, 0.58, 0.53  # #0d9488 teal
        
        for page_num, page in enumerate(pdf):
            try:
                rect = page.rect
                
                # Add header bar at top
                header_height = 20
                
                # Left side: Envelope ID in teal color
                id_text = f"SAFESIGN ID : {envelope_id.upper()}"
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
            
            # Right side: Page number in gray
            # page_text = f"Page {page_num + 1} of {len(pdf)}"
            # page.insert_text(
            #     fitz.Point(rect.x1 - 60, rect.y0 + 12),
            #     page_text,
            #     fontsize=9,
            #     fontname="Helvetica",
            #     color=(0.5, 0.5, 0.5),
            #     overlay=True
            # )
        
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
        c.drawString(40, height - 50, "SafeSign")
        
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
        c.drawString(40, 20, "VERIFIED BY SAFESIGN")
        
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
            footer_text = f"Generated by {certificate_data.get('platform_name', 'SafeSign')} " \
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