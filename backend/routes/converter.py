import subprocess
import tempfile
import os
from PIL import Image
import io
from fpdf import FPDF
import shutil
import platform
import fitz
import time
import sys

# ------------------------------
# IMPROVED LIBREOFFICE PATH DETECTION
# ------------------------------
def get_libreoffice_path():
    """Find LibreOffice executable with better path detection"""
    
    # Common installation paths
    candidates = []
    
    if platform.system() == "Windows":
        # Common Windows paths
        candidates = [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
            r"C:\Program Files\LibreOffice 7\program\soffice.exe",
            r"C:\Program Files\LibreOffice 6\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice 7\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice 6\program\soffice.exe",
        ]
        
        # Check if LibreOffice is in PATH
        which_result = shutil.which("soffice") or shutil.which("libreoffice")
        if which_result:
            candidates.insert(0, which_result)
    
    elif platform.system() == "Darwin":  # macOS
        candidates = [
            "/Applications/LibreOffice.app/Contents/MacOS/soffice",
            "/Applications/LibreOffice.app/Contents/MacOS/libreoffice",
            shutil.which("soffice"),
            shutil.which("libreoffice")
        ]
    
    else:  # Linux
        candidates = [
            "/usr/bin/libreoffice",
            "/usr/bin/soffice",
            "/usr/local/bin/libreoffice",
            "/usr/local/bin/soffice",
            "/snap/bin/libreoffice",
            shutil.which("libreoffice"),
            shutil.which("soffice")
        ]
    
    # Check each candidate
    for candidate in candidates:
        if candidate and os.path.exists(candidate):
            print(f"[PDF-CONVERT] Found LibreOffice at: {candidate}")
            return candidate
    
    # Try to find with 'which' command as last resort
    try:
        result = subprocess.run(
            ["which", "libreoffice"], 
            capture_output=True, 
            text=True, 
            timeout=5
        )
        if result.returncode == 0 and result.stdout.strip():
            path = result.stdout.strip()
            print(f"[PDF-CONVERT] Found LibreOffice via which: {path}")
            return path
    except:
        pass
    
    print("[PDF-CONVERT] WARNING: LibreOffice not found. Office document conversion will fail.")
    return None


LIBREOFFICE_PATH = get_libreoffice_path()


# ------------------------------
# IMPROVED OFFICE DOCUMENT CONVERSION
# ------------------------------
def convert_with_libreoffice(input_bytes, filename):
    """Convert office documents to PDF using LibreOffice with better error handling"""
    
    if not LIBREOFFICE_PATH:
        print("[PDF-CONVERT] LibreOffice not installed - cannot convert office documents")
        return None
    
    ext = filename.lower().rsplit(".", 1)[-1]
    print(f"[PDF-CONVERT] Converting {ext} document with LibreOffice")
    
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            # Use original filename to help LibreOffice detect the format
            input_path = os.path.join(tmpdir, filename)
            output_path = os.path.join(tmpdir, os.path.splitext(filename)[0] + ".pdf")
            
            # Write input file
            with open(input_path, "wb") as f:
                f.write(input_bytes)
            
            print(f"[PDF-CONVERT] Input file: {input_path}")
            print(f"[PDF-CONVERT] Expected output: {output_path}")
            
            # Build command with better parameters for Word documents
            cmd = [
                LIBREOFFICE_PATH,
                "--headless",
                "--norestore",
                "--invisible",
                "--nofirststartwizard",
                "--nologo",
                "--nodefault",
                "--convert-to", "pdf:writer_pdf_Export",
                "--outdir", tmpdir,
                input_path
            ]
            
            print(f"[PDF-CONVERT] Running command: {' '.join(cmd)}")
            
            # Run conversion with timeout
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=120,  # 2 minutes timeout
                text=True
            )
            
            print(f"[PDF-CONVERT] Return code: {result.returncode}")
            if result.stdout:
                print(f"[PDF-CONVERT] stdout: {result.stdout[:200]}")
            if result.stderr:
                print(f"[PDF-CONVERT] stderr: {result.stderr[:200]}")
            
            if result.returncode != 0:
                print(f"[PDF-CONVERT] LibreOffice conversion failed with code {result.returncode}")
                return None
            
            # Check if output exists
            if not os.path.exists(output_path):
                # Try to find any PDF in the temp directory
                pdf_files = [f for f in os.listdir(tmpdir) if f.endswith('.pdf')]
                if pdf_files:
                    output_path = os.path.join(tmpdir, pdf_files[0])
                    print(f"[PDF-CONVERT] Found alternative PDF: {output_path}")
                else:
                    print("[PDF-CONVERT] No PDF file generated")
                    return None
            
            # Read the generated PDF
            with open(output_path, "rb") as f:
                pdf_bytes = f.read()
            
            print(f"[PDF-CONVERT] Successfully converted to PDF ({len(pdf_bytes)} bytes)")
            return pdf_bytes

    except subprocess.TimeoutExpired:
        print("[PDF-CONVERT] LibreOffice conversion timed out after 120 seconds")
        return None
    except Exception as e:
        print(f"[PDF-CONVERT] LibreOffice error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


# ------------------------------
# IMPROVED TEXT TO PDF
# ------------------------------
def convert_text_to_pdf(text: str) -> bytes | None:
    """Convert text to PDF with better formatting"""
    try:
        pdf = FPDF(unit="mm", format="A4")
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font("Helvetica", size=11)
        
        # Add title
        pdf.set_font("Helvetica", style='B', size=14)
        pdf.cell(0, 10, "Document Conversion", ln=True, align='C')
        pdf.set_font("Helvetica", size=11)
        pdf.ln(10)
        
        # Add text content with word wrapping
        lines = text.split('\n')
        for line in lines:
            # Handle long lines
            while len(line) > 80:
                pdf.cell(0, 6, line[:80], ln=True)
                line = line[80:]
            pdf.cell(0, 6, line, ln=True)
        
        return pdf.output(dest="S").encode("latin-1")

    except Exception as e:
        print(f"[PDF-CONVERT] Text conversion error: {e}")
        return None


# ------------------------------
# IMPROVED IMAGE TO PDF
# ------------------------------
def convert_image_to_pdf(input_bytes: bytes) -> bytes | None:
    """Convert image to PDF with better scaling"""
    try:
        img = Image.open(io.BytesIO(input_bytes))
        
        # Convert to RGB if needed
        if img.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = rgb_img
        
        pdf = FPDF(unit="mm", format="A4")
        
        # Calculate scaling
        page_width_mm = 210  # A4 width
        page_height_mm = 297  # A4 height
        margin = 10
        
        img_width, img_height = img.size
        
        # Convert pixels to mm (assuming 96 DPI)
        dpi = 96
        img_width_mm = img_width * 25.4 / dpi
        img_height_mm = img_height * 25.4 / dpi
        
        # Calculate scale to fit within margins
        scale_x = (page_width_mm - 2 * margin) / img_width_mm
        scale_y = (page_height_mm - 2 * margin) / img_height_mm
        scale = min(scale_x, scale_y, 1.0)  # Don't enlarge beyond original size
        
        # Calculate centered position
        final_width = img_width_mm * scale
        final_height = img_height_mm * scale
        x = (page_width_mm - final_width) / 2
        y = (page_height_mm - final_height) / 2
        
        pdf.add_page()
        
        # Save image temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            img.save(tmp.name, "JPEG", quality=95)
            tmp_path = tmp.name
        
        # Add image to PDF
        pdf.image(tmp_path, x=x, y=y, w=final_width, h=final_height)
        
        # Clean up
        os.unlink(tmp_path)
        
        return pdf.output(dest="S").encode("latin-1")
        
    except Exception as e:
        print(f"[PDF-CONVERT] Image conversion error: {e}")
        return None


# ------------------------------
# UNIVERSAL CONVERTER (IMPROVED)
# ------------------------------
def convert_to_pdf(input_bytes: bytes, filename: str) -> bytes | None:
    """Universal document to PDF converter with improved error handling"""
    
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    
    print(f"[PDF-CONVERT] Converting: {filename} (extension: {ext}, size: {len(input_bytes)} bytes)")
    
    # 1. Already PDF
    if ext == "pdf":
        print("[PDF-CONVERT] File is already PDF")
        return input_bytes
    
    # 2. Images
    image_exts = ["jpg", "jpeg", "png", "bmp", "webp", "tiff", "tif", "gif"]
    if ext in image_exts:
        print(f"[PDF-CONVERT] Converting image: {ext}")
        result = convert_image_to_pdf(input_bytes)
        if result:
            print(f"[PDF-CONVERT] Image conversion successful: {len(result)} bytes")
            return result
        print("[PDF-CONVERT] Image conversion failed")
    
    # 3. Text formats
    text_exts = ["txt", "md", "csv", "json", "log", "xml", "rtf"]
    if ext in text_exts:
        print(f"[PDF-CONVERT] Converting text: {ext}")
        try:
            text = input_bytes.decode("utf-8", errors="ignore")
            result = convert_text_to_pdf(text)
            if result:
                print(f"[PDF-CONVERT] Text conversion successful: {len(result)} bytes")
                return result
        except Exception as e:
            print(f"[PDF-CONVERT] Text decoding error: {e}")
    
    # 4. Office documents (Word, Excel, PowerPoint)
    office_exts = ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "html", "htm"]
    if ext in office_exts:
        print(f"[PDF-CONVERT] Converting office document: {ext}")
        result = convert_with_libreoffice(input_bytes, filename)
        if result:
            print(f"[PDF-CONVERT] Office conversion successful: {len(result)} bytes")
            return result
        print("[PDF-CONVERT] Office conversion failed")
    
    # If all conversions failed
    print(f"[PDF-CONVERT] ERROR: Could not convert {ext} file to PDF")
    return None


# ------------------------------
# UTILITY FUNCTIONS
# ------------------------------
def get_pdf_page_count(pdf_bytes: bytes) -> int:
    """Get page count from PDF bytes"""
    try:
        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            if doc.is_encrypted:
                try:
                    doc.authenticate("")
                except:
                    return 0
            return doc.page_count
    except Exception as e:
        print(f"[PDF-CONVERT] Error getting page count: {e}")
        return 0


def is_libreoffice_available() -> bool:
    """Check if LibreOffice is available"""
    return LIBREOFFICE_PATH is not None


def test_libreoffice():
    """Test LibreOffice conversion with a simple file"""
    if not is_libreoffice_available():
        print("[PDF-CONVERT] LibreOffice is not available")
        return False
    
    print(f"[PDF-CONVERT] LibreOffice is available at: {LIBREOFFICE_PATH}")
    
    # Try to create a simple test file
    test_content = b"Test document content"
    test_filename = "test.txt"
    
    result = convert_with_libreoffice(test_content, test_filename)
    if result:
        print("[PDF-CONVERT] LibreOffice test successful")
        return True
    else:
        print("[PDF-CONVERT] LibreOffice test failed")
        return False


# Run test if executed directly
if __name__ == "__main__":
    print("[PDF-CONVERT] Testing converter...")
    print(f"LibreOffice path: {LIBREOFFICE_PATH}")
    print(f"LibreOffice available: {is_libreoffice_available()}")
    if is_libreoffice_available():
        test_libreoffice()