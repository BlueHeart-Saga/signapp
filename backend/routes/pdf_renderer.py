# import fitz  # PyMuPDF
# import base64
# from io import BytesIO
# from PIL import Image


# def decode_base64_image(b64_string: str) -> bytes:
#     """Decode a Base64 PNG signature into raw image bytes."""
#     signature_bytes = base64.b64decode(b64_string)
#     return signature_bytes


# def apply_signature_to_pdf(pdf_bytes: bytes, signatures: list):
#     """
#     Apply one or more signatures onto a LIVE PDF.

#     Expected signature format:
#     {
#         "image": base64_string,
#         "page": 0-based page index,
#         "x": int,
#         "y": int,
#         "width": int,
#         "height": int
#     }

#     Returns:
#         PDF bytes with applied signatures.
#     """

#     if not signatures or len(signatures) == 0:
#         # No stamping needed — return original PDF
#         return pdf_bytes

#     # Load PDF
#     pdf = fitz.open(stream=pdf_bytes, filetype="pdf")

#     for sig in signatures:
#         try:
#             img_b64 = sig.get("image")
#             page_index = sig.get("page", 0)
#             x = sig.get("x", 0)
#             y = sig.get("y", 0)
#             w = sig.get("width", 150)
#             h = sig.get("height", 50)

#             if not img_b64:
#                 continue

#             # Decode base64 → PIL image
#             raw_bytes = decode_base64_image(img_b64)
#             img = Image.open(BytesIO(raw_bytes)).convert("RGBA")

#             # Resize to target
#             img = img.resize((int(w), int(h)), Image.LANCZOS)

#             # Convert to PNG bytes for PyMuPDF
#             buffer = BytesIO()
#             img.save(buffer, format="PNG")
#             png_bytes = buffer.getvalue()

#             # Apply to target page
#             page = pdf[page_index]
#             rect = fitz.Rect(x, y, x + w, y + h)

#             page.insert_image(rect, stream=png_bytes)

#         except Exception as err:
#             print("Signature placement error:", err)
#             continue

#     # Export PDF
#     final_pdf_bytes = pdf.tobytes()
#     pdf.close()

#     return final_pdf_bytes
