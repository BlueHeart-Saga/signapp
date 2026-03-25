import os
import smtplib
import random
import string
import zipfile
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from email.mime.application import MIMEApplication 
from email.mime.base import MIMEBase
from email import encoders
import io
import uuid
import re
from bson import ObjectId

from database import db
from config import SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, EMAIL_FROM, FRONTEND_URL, BACKEND_URL
from storage import storage  # Import Azure storage provider

from fastapi import APIRouter
router = APIRouter()

# Note: GridFS is removed - we now use Azure Blob Storage

# ======================
# PROFESSIONAL DOCUSIGN-STYLE SUMMARY ENGINE
# ======================

class SafeSignSummaryEngine:
    """Professional document summary generator - DocuSign inspired green, black & white design"""
    
    # Brand color palette - DocuSign inspired
    BRAND_PRIMARY = "#00A3A3"      # Teal green - primary brand (DocuSign teal)
    BRAND_SECONDARY = "#2C3E50"    # Dark blue-gray - secondary
    BRAND_ACCENT = "#357C7C"       # Darker teal - accent
    BRAND_LIGHT = "#E0F2F2"     # Light teal - backgrounds and highlights
    # Status colors
    SUCCESS = "#2E7D32"            # Forest green - completed/signed
    SUCCESS_LIGHT = "#E8F5E9"      # Light green - background
    WARNING = "#ED6C02"            # Orange - pending
    WARNING_LIGHT = "#FFF4E5"      # Light orange - background
    INFO = "#0288D1"              # Blue - info
    INFO_LIGHT = "#E1F5FE"       # Light blue - background
    VOID = "#757575"             # Gray - voided
    VOID_LIGHT = "#F5F5F5"       # Light gray - background
    
    # Neutral colors - professional black & white scale
    GRAY_50 = "#FAFAFA"
    GRAY_100 = "#F5F5F5"
    GRAY_200 = "#EEEEEE"
    GRAY_300 = "#E0E0E0"
    GRAY_400 = "#BDBDBD"
    GRAY_600 = "#757575"
    GRAY_700 = "#616161"
    GRAY_800 = "#424242"
    GRAY_900 = "#212121"
    BLACK = "#000000"
    WHITE = "#FFFFFF"
    
    @staticmethod
    def create_header(canvas, doc, title="DOCUMENT SUMMARY", envelope_id=None):
        canvas.saveState()

        HEADER_LIFT = 20  # ← Adjust this only

        canvas.setFillColor(colors.HexColor(SafeSignSummaryEngine.WHITE))
        canvas.rect(0, doc.height + 40 + HEADER_LIFT, doc.width + 80, 70, fill=1, stroke=0)

        canvas.setFillColor(colors.HexColor(SafeSignSummaryEngine.BRAND_PRIMARY))
        canvas.rect(0, doc.height + 110 + HEADER_LIFT, doc.width + 80, 4, fill=1, stroke=0)

        canvas.setStrokeColor(colors.HexColor(SafeSignSummaryEngine.BRAND_PRIMARY))
        canvas.setLineWidth(2)
        canvas.line(40, doc.height + 40 + HEADER_LIFT, doc.width + 40, doc.height + 40 + HEADER_LIFT)

        canvas.setFont("Helvetica-Bold", 24)
        canvas.setFillColor(colors.HexColor(SafeSignSummaryEngine.BLACK))
        canvas.drawString(40, doc.height + 80 + HEADER_LIFT, "SafeSign")

        canvas.setFont("Helvetica", 9)
        canvas.setFillColor(colors.HexColor(SafeSignSummaryEngine.GRAY_600))
        canvas.drawString(40, doc.height + 60 + HEADER_LIFT, "Secure Digital Signatures")

        canvas.setFont("Helvetica-Bold", 16)
        canvas.setFillColor(colors.HexColor(SafeSignSummaryEngine.BLACK))
        canvas.drawRightString(doc.width + 40, doc.height + 85 + HEADER_LIFT, title)

        if envelope_id:
            canvas.setFont("Helvetica", 8)
            canvas.setFillColor(colors.HexColor(SafeSignSummaryEngine.GRAY_600))
            canvas.drawRightString(doc.width + 40, doc.height + 65 + HEADER_LIFT, f"Envelope: {envelope_id}")

        canvas.restoreState()

    
    @staticmethod
    def create_footer(canvas, doc, certificate_id=None):
        """Create professional footer - clean black & white"""
        canvas.saveState()
        
        # Light gray line
        canvas.setStrokeColor(colors.HexColor(SafeSignSummaryEngine.GRAY_300))
        canvas.setLineWidth(0.5)
        canvas.line(40, 35, doc.width + 40, 35)
        
        # Footer text - Gray
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(colors.HexColor(SafeSignSummaryEngine.GRAY_600))
        timestamp = datetime.utcnow().strftime("%B %d, %Y at %I:%M:%S %p UTC")
        canvas.drawString(40, 20, f"Generated: {timestamp}")
        
        if certificate_id:
            canvas.drawString(40, 10, f"ID: {certificate_id}")
        
        # Green verification seal
        canvas.setFont("Helvetica-Bold", 7)
        canvas.setFillColor(colors.HexColor(SafeSignSummaryEngine.BRAND_PRIMARY))
        canvas.drawRightString(doc.width + 40, 20, "✓ Verified by SafeSign")
        
        # Page number - Gray
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(colors.HexColor(SafeSignSummaryEngine.GRAY_600))
        canvas.drawRightString(doc.width + 40, 10, f"Page {doc.page}")
        
        canvas.restoreState()
    
    @staticmethod
    def create_status_badge(text, status="completed"):
        """Create clean status badge - DocuSign style"""
        
        if status == "completed":
            color = SafeSignSummaryEngine.SUCCESS
            bg_color = SafeSignSummaryEngine.SUCCESS_LIGHT
        elif status == "pending":
            color = SafeSignSummaryEngine.WARNING
            bg_color = SafeSignSummaryEngine.WARNING_LIGHT
        elif status == "voided":
            color = SafeSignSummaryEngine.VOID
            bg_color = SafeSignSummaryEngine.VOID_LIGHT
        else:
            color = SafeSignSummaryEngine.GRAY_600
            bg_color = SafeSignSummaryEngine.GRAY_100
            
        return f"<font name='Helvetica-Bold' size='9' color='{color}'><back color='{bg_color}'>  {text}  </back></font>"
    
    @staticmethod
    def create_recipient_signature_block(recipient_data):
        """
        Create DocuSign-style signature block showing recipient's signature and initials
        """
        from reportlab.platypus import Table, TableStyle, Paragraph, Spacer, Image as RLImage
        from reportlab.lib import colors
        import base64
        import io
        from PIL import Image as PILImage
        
        styles = getSampleStyleSheet()
        story = []
        
        # Section header - Black, clean
        header_style = ParagraphStyle(
            'SignatureHeader',
            parent=styles['Heading3'],
            fontSize=13,
            textColor=colors.HexColor(SafeSignSummaryEngine.BLACK),
            spaceBefore=5,
            spaceAfter=10,
            fontName='Helvetica-Bold',
            leading=16
        )
        
        story.append(Paragraph("Signature & Initials", header_style))
        
        # Create signature table - clean borders
        sig_data = []
        
        # Signature row
        signature_value = recipient_data.get('signature_value')
        if signature_value and isinstance(signature_value, dict) and signature_value.get('image'):
            try:
                # Decode and process signature image
                img_data = signature_value['image']
                if ',' in img_data:
                    img_data = img_data.split(',')[1]
                
                img_bytes = base64.b64decode(img_data)
                img = PILImage.open(io.BytesIO(img_bytes))
                
                # Convert to RGB if needed
                if img.mode in ('RGBA', 'LA', 'P'):
                    rgb_img = PILImage.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        rgb_img.paste(img, (0, 0), img.convert('RGBA'))
                    else:
                        rgb_img.paste(img, (0, 0), img)
                    img = rgb_img
                
                # Resize to fit nicely
                img_buffer = io.BytesIO()
                img.save(img_buffer, format='PNG')
                img_buffer.seek(0)
                
                # Standard signature size
                display_width = 150
                display_height = 50
                
                rl_img = RLImage(img_buffer, width=display_width, height=display_height)
                
                sig_data.append([
                    Paragraph("<font name='Helvetica-Bold' size='9' color='#2C3E50'>Signature:</font>", styles['Normal']),
                    rl_img
                ])
            except Exception as e:
                print(f"Error processing signature: {e}")
                sig_data.append([
                    Paragraph("<font name='Helvetica-Bold' size='9' color='#2C3E50'>Signature:</font>", styles['Normal']),
                    Paragraph("<font name='Helvetica' size='9' color='#2E7D32'>✓ Signed</font>", styles['Normal'])
                ])
        else:
            sig_data.append([
                Paragraph("<font name='Helvetica-Bold' size='9' color='#2C3E50'>Signature:</font>", styles['Normal']),
                Paragraph("<font name='Helvetica' size='9' color='#757575'>Not signed</font>", styles['Normal'])
            ])
        
        # Initials row
        initials_value = recipient_data.get('initials_value')
        has_initials_field = recipient_data.get('has_initials_field', False)
        
        if initials_value and isinstance(initials_value, dict) and initials_value.get('image'):
            try:
                # Decode and process initials image
                img_data = initials_value['image']
                if ',' in img_data:
                    img_data = img_data.split(',')[1]
                
                img_bytes = base64.b64decode(img_data)
                img = PILImage.open(io.BytesIO(img_bytes))
                
                # Convert to RGB if needed
                if img.mode in ('RGBA', 'LA', 'P'):
                    rgb_img = PILImage.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        rgb_img.paste(img, (0, 0), img.convert('RGBA'))
                    else:
                        rgb_img.paste(img, (0, 0), img)
                    img = rgb_img
                
                img_buffer = io.BytesIO()
                img.save(img_buffer, format='PNG')
                img_buffer.seek(0)
                
                # Smaller size for initials
                display_width = 80
                display_height = 30
                
                rl_img = RLImage(img_buffer, width=display_width, height=display_height)
                
                sig_data.append([
                    Paragraph("<font name='Helvetica-Bold' size='9' color='#2C3E50'>Initials:</font>", styles['Normal']),
                    rl_img
                ])
            except Exception as e:
                print(f"Error processing initials: {e}")
                sig_data.append([
                    Paragraph("<font name='Helvetica-Bold' size='9' color='#2C3E50'>Initials:</font>", styles['Normal']),
                    Paragraph("<font name='Helvetica' size='9' color='#2E7D32'>✓ Initialed</font>", styles['Normal'])
                ])
        elif has_initials_field:
            sig_data.append([
                Paragraph("<font name='Helvetica-Bold' size='9' color='#2C3E50'>Initials:</font>", styles['Normal']),
                Paragraph("<font name='Helvetica' size='9' color='#ED6C02'>○ Pending</font>", styles['Normal'])
            ])
        
        if sig_data:
            # Clean table with minimal borders - DocuSign style
            sig_table = Table(sig_data, colWidths=[80, 350], hAlign='LEFT')
            sig_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(SafeSignSummaryEngine.WHITE)),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor(SafeSignSummaryEngine.BRAND_SECONDARY)),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor(SafeSignSummaryEngine.GRAY_200)),
            ]))
            story.append(sig_table)
            story.append(Spacer(1, 15))
        
        return story
    
    @staticmethod
    def create_document_summary_pdf(summary_data):
        """
        Generate professional DocuSign-style document summary PDF
        Clean green, black & white design with all detailed information
        """
        buffer = io.BytesIO()
        
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=45,
            leftMargin=45,
            topMargin=100,
            bottomMargin=60,
            title=f"SafeSign Summary - {summary_data.get('envelope_id', 'Document')}",
            author="SafeSign",
            subject="Document Summary"
        )
        
        styles = getSampleStyleSheet()
        story = []
        
        # ========== CUSTOM STYLES - DocuSign Inspired ==========
        
        # Main title - Black, clean
        styles.add(ParagraphStyle(
            name='DocuSignTitle',
            parent=styles['Heading1'],
            fontSize=22,
            textColor=colors.HexColor(SafeSignSummaryEngine.BLACK),
            alignment=TA_CENTER,
            spaceAfter=10,
            spaceBefore=0,
            fontName='Helvetica-Bold',
            leading=26
        ))
        
        # Section headers - Black, bold, clean
        styles.add(ParagraphStyle(
            name='DocuSignSection',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor(SafeSignSummaryEngine.BLACK),
            alignment=TA_LEFT,
            spaceBefore=25,
            spaceAfter=10,
            fontName='Helvetica-Bold',
            leading=18,
            keepWithNext=True
        ))
        
        # Sub-section headers - Dark gray
        styles.add(ParagraphStyle(
            name='DocuSignSubSection',
            parent=styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor(SafeSignSummaryEngine.GRAY_700),
            alignment=TA_LEFT,
            spaceBefore=15,
            spaceAfter=8,
            fontName='Helvetica-Bold',
            leading=16,
            keepWithNext=True
        ))
        
        # Body text - Gray
        styles.add(ParagraphStyle(
            name='DocuSignBody',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor(SafeSignSummaryEngine.GRAY_800),
            alignment=TA_LEFT,
            fontName='Helvetica',
            leading=13,
            spaceAfter=4
        ))
        
        # Label text - Light gray
        styles.add(ParagraphStyle(
            name='DocuSignLabel',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor(SafeSignSummaryEngine.GRAY_600),
            alignment=TA_LEFT,
            fontName='Helvetica',
            leading=12,
            spaceAfter=2
        ))
        
        # Value text - Black
        styles.add(ParagraphStyle(
            name='DocuSignValue',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor(SafeSignSummaryEngine.BLACK),
            alignment=TA_LEFT,
            fontName='Helvetica',
            leading=14,
            spaceAfter=2
        ))
        
        # ========== HEADER ==========
        story.append(Spacer(1, 5))
        story.append(Paragraph("Document Summary", styles['DocuSignTitle']))
        story.append(Spacer(1, 5))
        
        # Green accent line under title
        story.append(Spacer(1, 2))
        
        # ========== ENVELOPE INFO BAR - Clean gray background ==========
        envelope_id = summary_data.get('envelope_id', 'N/A')
        
        envelope_data = [
            [f"Envelope ID: {envelope_id}", 
             f"Status: {summary_data.get('document_status', 'unknown').upper()}",
             f"Completed: {summary_data.get('completed_date', 'Not completed')}"]
        ]
        
        envelope_bar = Table(envelope_data, colWidths=[200, 150, 200], hAlign='CENTER')
        envelope_bar.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(SafeSignSummaryEngine.GRAY_50)),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor(SafeSignSummaryEngine.GRAY_700)),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('RIGHTPADDING', (0, 0), (-1, -1), 15),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor(SafeSignSummaryEngine.GRAY_200)),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(envelope_bar)
        story.append(Spacer(1, 25))
        
        # ========== DOCUMENT INFO CARD - Clean white, gray border ==========
        story.append(Paragraph("Document Information", styles['DocuSignSection']))
        
        doc_info_data = [
            ["Document Name", ":", summary_data.get('document_name', 'N/A')],
            ["Created", ":", summary_data.get('created_date', 'N/A')],
            ["Owner", ":", summary_data.get('owner_name', summary_data.get('owner_email', 'N/A'))],
            ["Total Pages", ":", str(summary_data.get('total_pages', 0))],
        ]
        
        doc_info_table = Table(doc_info_data, colWidths=[120, 20, 360], hAlign='LEFT')
        doc_info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor(SafeSignSummaryEngine.GRAY_700)),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor(SafeSignSummaryEngine.BLACK)),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(doc_info_table)
        story.append(Spacer(1, 20))
        
        # ========== RECIPIENT SUMMARY CARD ==========
        story.append(Paragraph("Recipient Summary", styles['DocuSignSection']))
        
        current_recipient = summary_data.get('current_recipient', {})
        
        # Status badge
        status_text = current_recipient.get('status', 'pending').upper()
        status_badge = SafeSignSummaryEngine.create_status_badge(
            status_text, 
            'completed' if status_text == 'COMPLETED' else 'pending'
        )
        
        # Recipient info - Two column layout
        recipient_info_data = [
            ["Name", ":", current_recipient.get('name', 'N/A')],
            ["Email", ":", current_recipient.get('email', 'N/A')],
            ["Role", ":", current_recipient.get('role', 'signer').replace('_', ' ').title()],
            ["Status", ":", Paragraph(status_badge, styles['DocuSignBody'])],
            ["Completed", ":", current_recipient.get('completed_at', 'Not completed')[:10] if current_recipient.get('completed_at') else 'Not completed'],
            ["IP Address", ":", current_recipient.get('ip_address', 'Unknown')],
            ["Authentication", ":", "OTP Verified" if current_recipient.get('otp_verified') else "Pending"],
        ]
        
        recipient_table = Table(recipient_info_data, colWidths=[100, 20, 380], hAlign='LEFT')
        recipient_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor(SafeSignSummaryEngine.GRAY_700)),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor(SafeSignSummaryEngine.BLACK)),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(recipient_table)
        story.append(Spacer(1, 15))
        
        # ========== SIGNATURE & INITIALS BLOCK ==========
        # Get signature and initials from recipient fields
        recipient_fields = summary_data.get('assigned_fields', [])
        signature_value = None
        initials_value = None
        has_initials_field = False
        
        for field in recipient_fields:
            field_type = field.get('type', '')
            if field_type in ['signature', 'witness_signature'] and field.get('completed'):
                signature_value = field.get('raw_value')
            elif field_type == 'initials':
                has_initials_field = True
                if field.get('completed'):
                    initials_value = field.get('raw_value')
        
        # Add to recipient data
        current_recipient['signature_value'] = signature_value
        current_recipient['initials_value'] = initials_value
        current_recipient['has_initials_field'] = has_initials_field
        
        # Create signature block
        signature_block = SafeSignSummaryEngine.create_recipient_signature_block(current_recipient)
        if signature_block:
            story.extend(signature_block)
        
        story.append(Spacer(1, 10))
        
        # ========== FIELD COMPLETION SUMMARY ==========
        story.append(Paragraph("Field Completion Summary", styles['DocuSignSection']))
        
        # Field statistics cards
        stats = summary_data.get('statistics', {})
        
        stat_data = [
            ["Fields Assigned", "Fields Completed", "Completion Rate"],
            [
                str(stats.get('assigned_to_you', 0)),
                str(stats.get('completed_by_you', 0)),
                f"{stats.get('completion_percentage', 0)}%"
            ]
        ]
        
        stat_table = Table(stat_data, colWidths=[150, 150, 150], hAlign='LEFT')
        stat_table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(SafeSignSummaryEngine.GRAY_50)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor(SafeSignSummaryEngine.GRAY_700)),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            
            # Values
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, 1), 16),
            ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor(SafeSignSummaryEngine.BRAND_PRIMARY)),
            ('ALIGN', (0, 1), (-1, 1), 'CENTER'),
            
            ('BOTTOMPADDING', (0, 1), (-1, 1), 12),
            ('TOPPADDING', (0, 1), (-1, 1), 12),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor(SafeSignSummaryEngine.GRAY_200)),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(stat_table)
        story.append(Spacer(1, 20))
        
        # ========== DETAILED FIELDS TABLE ==========
        story.append(Paragraph("All Assigned Fields", styles['DocuSignSubSection']))
        
        fields = summary_data.get('assigned_fields', [])
        # Filter out signature/initials from detailed table (already shown above)
        other_fields = [f for f in fields if f.get('type') not in ['signature', 'initials', 'witness_signature']]
        
        if other_fields:
            # Split into chunks for multi-page handling
            MAX_FIELDS_PER_TABLE = 15
            field_chunks = [other_fields[i:i + MAX_FIELDS_PER_TABLE] for i in range(0, len(other_fields), MAX_FIELDS_PER_TABLE)]
            
            for chunk_index, field_chunk in enumerate(field_chunks):
                if chunk_index > 0:
                    story.append(Spacer(1, 15))
                    story.append(Paragraph(
                        f"<font name='Helvetica-Bold' size='10' color='{SafeSignSummaryEngine.GRAY_600}'>Fields (continued)</font>",
                        styles['Normal']
                    ))
                    story.append(Spacer(1, 5))
                
                field_data = [
                    ["Field Type", "Page", "Status", "Value", "Completed"]
                ]
                
                for field in field_chunk:
                    field_type = field.get('type', '').replace('_', ' ').title()
                    page = str(field.get('page', 0) + 1)
                    
                    # Status with color
                    if field.get('completed'):
                        status = "✓ Completed"
                        status_color = SafeSignSummaryEngine.SUCCESS
                    else:
                        status = "○ Pending"
                        status_color = SafeSignSummaryEngine.WARNING
                    
                    # Format value
                    value = field.get('value', '—')
                    if isinstance(value, dict):
                        if 'value' in value:
                            value = value['value']
                        elif 'image' in value:
                            value = '[Signature]'
                        else:
                            value = str(value)[:30]
                    
                    # Truncate if needed
                    if len(str(value)) > 25:
                        value = str(value)[:22] + "..."
                    
                    completed_at = field.get('completed_at', '—')
                    if completed_at != '—' and len(completed_at) > 10:
                        completed_at = completed_at[:10]
                    
                    field_data.append([
                        Paragraph(f"<font name='Helvetica' size='9'>{field_type}</font>", styles['DocuSignBody']),
                        Paragraph(f"<font name='Helvetica' size='9'>{page}</font>", styles['DocuSignBody']),
                        Paragraph(f"<font name='Helvetica' size='9' color='{status_color}'>{status}</font>", styles['DocuSignBody']),
                        Paragraph(f"<font name='Helvetica' size='9'>{value}</font>", styles['DocuSignBody']),
                        Paragraph(f"<font name='Helvetica' size='9'>{completed_at}</font>", styles['DocuSignBody']),
                    ])
                
                field_table = Table(field_data, colWidths=[100, 50, 100, 150, 80], hAlign='LEFT', repeatRows=1)
                field_table.setStyle(TableStyle([
                    # Header
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(SafeSignSummaryEngine.GRAY_50)),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor(SafeSignSummaryEngine.GRAY_700)),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('TOPPADDING', (0, 0), (-1, 0), 8),
                    
                    # Data rows
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(SafeSignSummaryEngine.GRAY_200)),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), 
                     [colors.HexColor(SafeSignSummaryEngine.WHITE), 
                      colors.HexColor(SafeSignSummaryEngine.GRAY_50)]),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
                    ('TOPPADDING', (0, 1), (-1, -1), 6),
                ]))
                
                story.append(field_table)
                story.append(Spacer(1, 10))
        else:
            story.append(Paragraph(
                f"<font name='Helvetica' size='10' color='{SafeSignSummaryEngine.GRAY_600}'>No additional fields assigned.</font>",
                styles['DocuSignBody']
            ))
        
        story.append(Spacer(1, 25))
        
        # ========== ALL PARTICIPANTS TABLE ==========
        story.append(Paragraph("Document Participants", styles['DocuSignSection']))
        
        participants = summary_data.get('all_recipients', [])
        if participants:
            # Split into chunks
            MAX_PARTICIPANTS_PER_TABLE = 15
            participant_chunks = [participants[i:i + MAX_PARTICIPANTS_PER_TABLE] for i in range(0, len(participants), MAX_PARTICIPANTS_PER_TABLE)]
            
            for chunk_index, participant_chunk in enumerate(participant_chunks):
                if chunk_index > 0:
                    story.append(Spacer(1, 15))
                    story.append(Paragraph(
                        f"<font name='Helvetica-Bold' size='10' color='{SafeSignSummaryEngine.GRAY_600}'>Participants (continued)</font>",
                        styles['Normal']
                    ))
                    story.append(Spacer(1, 5))
                
                participant_data = [
                    ["Name", "Email", "Role", "Status", "Completed"]
                ]
                
                for p in participant_chunk:
                    status = p.get('status', 'pending').upper()
                    status_color = SafeSignSummaryEngine.SUCCESS if status == 'COMPLETED' else SafeSignSummaryEngine.WARNING
                    
                    completed_date = p.get('completed_at', '—')
                    if completed_date != '—' and len(completed_date) > 10:
                        completed_date = completed_date[:10]
                    
                    participant_data.append([
                        Paragraph(f"<font name='Helvetica' size='9'>{p.get('name', 'N/A')}</font>", styles['DocuSignBody']),
                        Paragraph(f"<font name='Helvetica' size='9'>{p.get('email', 'N/A')}</font>", styles['DocuSignBody']),
                        Paragraph(f"<font name='Helvetica' size='9'>{p.get('role', 'signer').replace('_', ' ').title()}</font>", styles['DocuSignBody']),
                        Paragraph(f"<font name='Helvetica' size='9' color='{status_color}'>{status}</font>", styles['DocuSignBody']),
                        Paragraph(f"<font name='Helvetica' size='9'>{completed_date}</font>", styles['DocuSignBody']),
                    ])
                
                participant_table = Table(participant_data, colWidths=[100, 130, 80, 80, 90], hAlign='LEFT', repeatRows=1)
                participant_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(SafeSignSummaryEngine.GRAY_50)),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor(SafeSignSummaryEngine.GRAY_700)),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(SafeSignSummaryEngine.GRAY_200)),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), 
                     [colors.HexColor(SafeSignSummaryEngine.WHITE), 
                      colors.HexColor(SafeSignSummaryEngine.GRAY_50)]),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ]))
                
                story.append(participant_table)
                story.append(Spacer(1, 10))
        else:
            story.append(Paragraph(
                f"<font name='Helvetica' size='10' color='{SafeSignSummaryEngine.GRAY_600}'>No participants found.</font>",
                styles['DocuSignBody']
            ))
        
        story.append(Spacer(1, 25))
        
        # ========== ACTIVITY TIMELINE ==========
        story.append(Paragraph("Recent Activity", styles['DocuSignSection']))
        
        timeline = summary_data.get('recent_activity', [])
        if timeline:
            # Split into chunks
            MAX_TIMELINE_PER_TABLE = 10
            timeline_chunks = [timeline[i:i + MAX_TIMELINE_PER_TABLE] for i in range(0, len(timeline), MAX_TIMELINE_PER_TABLE)]
            
            for chunk_index, timeline_chunk in enumerate(timeline_chunks):
                if chunk_index > 0:
                    # story.append(Spacer(1, 15))
                    story.append(PageBreak())

                    story.append(Paragraph(
                        f"<font name='Helvetica-Bold' size='10' color='{SafeSignSummaryEngine.GRAY_600}'>Activity (continued)</font>",
                        styles['Normal']
                    ))
                    story.append(Spacer(1, 8))
                
                timeline_data = [
                    ["Date", "Event", "Participant", "Details"]
                ]
                
                for event in timeline_chunk:
                    timeline_data.append([
                        Paragraph(f"<font name='Helvetica' size='8'>{event.get('date', '')}</font>", styles['DocuSignBody']),
                        Paragraph(f"<font name='Helvetica-Bold' size='8'>{event.get('event', '')}</font>", styles['DocuSignBody']),
                        Paragraph(f"<font name='Helvetica' size='8'>{event.get('participant', '')}</font>", styles['DocuSignBody']),
                        Paragraph(f"<font name='Helvetica' size='8'>{event.get('details', '')}</font>", styles['DocuSignBody']),
                    ])
                
                timeline_table = Table(timeline_data, colWidths=[80, 100, 120, 200], hAlign='LEFT', repeatRows=1)
                timeline_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(SafeSignSummaryEngine.GRAY_50)),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor(SafeSignSummaryEngine.GRAY_700)),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(SafeSignSummaryEngine.GRAY_200)),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                ]))
                
                story.append(timeline_table)
                story.append(Spacer(1, 10))
        else:
            story.append(Paragraph(
                f"<font name='Helvetica' size='10' color='{SafeSignSummaryEngine.GRAY_600}'>No recent activity recorded.</font>",
                styles['DocuSignBody']
            ))
        
        # ========== VERIFICATION STATEMENT ==========
        # ========== CERTIFICATE OF AUTHENTICITY ==========
        story.append(PageBreak())

        story.append(Paragraph(
            "Certificate of Authenticity",
            ParagraphStyle(
                'AuthTitle',
                fontSize=18,
                textColor=colors.HexColor(SafeSignSummaryEngine.BLACK),
                fontName='Helvetica-Bold',
                spaceAfter=18,
                alignment=TA_LEFT
            )
        ))

        auth_style = ParagraphStyle(
            'AuthBody',
            fontSize=10,
            leading=15,
            textColor=colors.HexColor(SafeSignSummaryEngine.GRAY_800),
            fontName='Helvetica',
            spaceAfter=14
        )

        label_style = ParagraphStyle(
            'AuthLabel',
            fontSize=11,
            textColor=colors.HexColor(SafeSignSummaryEngine.BLACK),
            fontName='Helvetica-Bold',
            spaceAfter=4
        )

        # ---- Document Integrity ----
        story.append(Paragraph("Document Integrity", label_style))
        story.append(Paragraph(
            "This certificate attests that the document associated with this SafeSign "
            "envelope remains in the state in which it existed at the time of completion. "
            "SafeSign records cryptographic evidence and system metadata designed to detect "
            "post-signing modifications. Any alteration to the document after completion "
            "may invalidate the recorded signing evidence.",
            auth_style
        ))

        # ---- Signature Validity ----
        story.append(Paragraph("Signature Validity", label_style))
        story.append(Paragraph(
            "Electronic signatures captured within SafeSign are bound to the document "
            "through secure technical processes. Each signature event is recorded together "
            "with relevant contextual data, including timestamps and available network "
            "information, forming part of the system’s tamper-evident audit history.",
            auth_style
        ))

        # ---- Audit Trail ----
        story.append(Paragraph("Audit Trail", label_style))
        story.append(Paragraph(
            "SafeSign maintains a secure audit trail that logs recipient actions performed "
            "during the signing lifecycle. Recorded events may include document access, "
            "field interactions, authentication steps, approvals, and completion activities. "
            "This audit record provides traceability intended to support transaction review "
            "and verification.",
            auth_style
        ))

        # ---- Authentication ----
        story.append(Paragraph("Authentication", label_style))
        story.append(Paragraph(
            "Where identity verification mechanisms are enabled, SafeSign records "
            "authentication events associated with recipient activity. Such events may "
            "include one-time password (OTP) validation or other configured verification "
            "methods. Authentication records are stored as part of the envelope’s "
            "evidence history.",
            auth_style
        ))

        # ---- System Assurance ----
        story.append(Paragraph("System Assurance", label_style))
        story.append(Paragraph(
            "SafeSign applies technical and organizational safeguards intended to protect "
            "document integrity, signature data, and transaction records. System controls "
            "are designed to support reliability, consistency, and evidentiary preservation "
            "within the scope of the platform’s operational environment.",
            auth_style
        ))

        # ---- Limitation Clause (Important) ----
        story.append(Paragraph("Certificate Limitations", label_style))
        story.append(Paragraph(
            "This certificate is a system-generated summary derived from SafeSign "
            "transaction records. It does not constitute legal advice, nor does it "
            "independently validate the legal enforceability of electronic signatures "
            "under any specific jurisdiction. Enforceability is subject to applicable "
            "laws and regulations.",
            auth_style
        ))

        story.append(Spacer(1, 10))

        # Footer metadata
        story.append(Paragraph(
            f"Summary ID: {summary_data.get('summary_id', 'N/A')}<br/>"
            f"Generated: {datetime.utcnow().strftime('%B %d, %Y')}",
            ParagraphStyle(
                'AuthMeta',
                fontSize=9,
                textColor=colors.HexColor(SafeSignSummaryEngine.GRAY_600),
                fontName='Helvetica',
                spaceBefore=10
            )
        ))

        # ========== BUILD PDF ==========
        def on_page(canvas, doc):
            SafeSignSummaryEngine.create_header(
                canvas, 
                doc, 
                title="DOCUMENT SUMMARY",
                envelope_id=summary_data.get('envelope_id')
            )
            SafeSignSummaryEngine.create_footer(
                canvas, 
                doc,
                certificate_id=summary_data.get('summary_id')
            )
            
        def first_page(canvas, doc):
            SafeSignSummaryEngine.create_header(
                canvas,
                doc,
                title="DOCUMENT SUMMARY",
                envelope_id=summary_data.get('envelope_id')
            )

            SafeSignSummaryEngine.create_footer(
                canvas,
                doc,
                certificate_id=summary_data.get('summary_id')
            )
            
        def later_pages(canvas, doc):
            SafeSignSummaryEngine.create_footer(
                canvas,
                doc,
                certificate_id=summary_data.get('summary_id')
            )

        
        try:
            doc.build(story, onFirstPage=first_page, onLaterPages=later_pages)
        except Exception as e:
            print(f"Error building PDF: {e}")
            import traceback
            traceback.print_exc()
            return SafeSignSummaryEngine._create_fallback_pdf(summary_data)
        
        buffer.seek(0)
        return buffer.getvalue()
    
    @staticmethod
    def _create_fallback_pdf(summary_data):
        """Create simple fallback PDF - DocuSign style"""
        buffer = io.BytesIO()
        from reportlab.pdfgen import canvas
        
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        
        # White header with green bar
        c.setFillColor(colors.HexColor(SafeSignSummaryEngine.WHITE))
        c.rect(0, height - 60, width, 60, fill=1, stroke=0)
        c.setFillColor(colors.HexColor(SafeSignSummaryEngine.BRAND_PRIMARY))
        c.rect(0, height - 5, width, 5, fill=1, stroke=0)
        
        # Title
        c.setFont("Helvetica-Bold", 20)
        c.setFillColor(colors.HexColor(SafeSignSummaryEngine.BLACK))
        c.drawString(50, height - 40, "SafeSign")
        c.drawString(width - 200, height - 40, "Document Summary")
        
        # Content
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, height - 100, f"Document: {summary_data.get('document_name', 'Unknown')}")
        
        c.setFont("Helvetica", 10)
        c.drawString(50, height - 130, f"Envelope: {summary_data.get('envelope_id', 'N/A')}")
        c.drawString(50, height - 150, f"Recipient: {summary_data.get('current_recipient', {}).get('name', 'Unknown')}")
        c.drawString(50, height - 170, f"Status: {summary_data.get('current_recipient', {}).get('status', 'pending').upper()}")
        c.drawString(50, height - 190, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
        
        c.save()
        buffer.seek(0)
        return buffer.getvalue()


# ======================
# REDESIGNED PROFESSIONAL CERTIFICATE ENGINE - MATCHING SUMMARY STYLE
# ======================

class SafeSignCertificateEngine:
    """Professional Certificate of Completion - Matching Summary Document Style"""
    
    # Brand color palette - Consistent with summary
    BRAND_PRIMARY = "#00A3A3"      # Teal green - primary brand
    BRAND_SECONDARY = "#2C3E50"    # Dark blue-gray - secondary
    BRAND_ACCENT = "#357C7C"       # Darker teal - accent
    BRAND_LIGHT = "#E0F2F2"        # Light teal - backgrounds
    
    # Status colors
    SUCCESS = "#2E7D32"            # Forest green - completed/signed
    SUCCESS_LIGHT = "#E8F5E9"      # Light green - background
    INFO = "#0288D1"                # Blue - info
    INFO_LIGHT = "#E1F5FE"          # Light blue - background
    
    # Neutral colors - professional black & white scale
    GRAY_50 = "#FAFAFA"
    GRAY_100 = "#F5F5F5"
    GRAY_200 = "#EEEEEE"
    GRAY_300 = "#E0E0E0"
    GRAY_400 = "#BDBDBD"
    GRAY_600 = "#757575"
    GRAY_700 = "#616161"
    GRAY_800 = "#424242"
    GRAY_900 = "#212121"
    BLACK = "#000000"
    WHITE = "#FFFFFF"
    
    @staticmethod
    def create_header(canvas, doc, title="CERTIFICATE OF COMPLETION", envelope_id=None):
        """Create professional header matching summary style"""
        canvas.saveState()
        
        HEADER_LIFT = 20
        
        # White header background
        canvas.setFillColor(colors.HexColor(SafeSignCertificateEngine.WHITE))
        canvas.rect(0, doc.height + 40 + HEADER_LIFT, doc.width + 80, 70, fill=1, stroke=0)
        
        # Teal accent bar
        canvas.setFillColor(colors.HexColor(SafeSignCertificateEngine.BRAND_PRIMARY))
        canvas.rect(0, doc.height + 110 + HEADER_LIFT, doc.width + 80, 4, fill=1, stroke=0)
        
        # Subtle teal line
        canvas.setStrokeColor(colors.HexColor(SafeSignCertificateEngine.BRAND_PRIMARY))
        canvas.setLineWidth(2)
        canvas.line(40, doc.height + 40 + HEADER_LIFT, doc.width + 40, doc.height + 40 + HEADER_LIFT)
        
        # Logo/Title
        canvas.setFont("Helvetica-Bold", 24)
        canvas.setFillColor(colors.HexColor(SafeSignCertificateEngine.BLACK))
        canvas.drawString(40, doc.height + 80 + HEADER_LIFT, "SafeSign")
        
        canvas.setFont("Helvetica", 9)
        canvas.setFillColor(colors.HexColor(SafeSignCertificateEngine.GRAY_600))
        canvas.drawString(40, doc.height + 60 + HEADER_LIFT, "Secure Digital Signatures")
        
        # Certificate title
        canvas.setFont("Helvetica-Bold", 16)
        canvas.setFillColor(colors.HexColor(SafeSignCertificateEngine.BLACK))
        canvas.drawRightString(doc.width + 40, doc.height + 85 + HEADER_LIFT, title)
        
        if envelope_id:
            canvas.setFont("Helvetica", 8)
            canvas.setFillColor(colors.HexColor(SafeSignCertificateEngine.GRAY_600))
            canvas.drawRightString(doc.width + 40, doc.height + 65 + HEADER_LIFT, f"Envelope: {envelope_id}")
        
        canvas.restoreState()
    
    @staticmethod
    def create_footer(canvas, doc, certificate_id=None):
        """Create professional footer matching summary style"""
        canvas.saveState()
        
        # Light gray separator line
        canvas.setStrokeColor(colors.HexColor(SafeSignCertificateEngine.GRAY_300))
        canvas.setLineWidth(0.5)
        canvas.line(40, 35, doc.width + 40, 35)
        
        # Footer text
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(colors.HexColor(SafeSignCertificateEngine.GRAY_600))
        timestamp = datetime.utcnow().strftime("%B %d, %Y at %I:%M:%S %p UTC")
        canvas.drawString(40, 20, f"Generated: {timestamp}")
        
        if certificate_id:
            canvas.drawString(40, 10, f"Certificate ID: {certificate_id}")
        
        # Teal verification seal
        canvas.setFont("Helvetica-Bold", 7)
        canvas.setFillColor(colors.HexColor(SafeSignCertificateEngine.BRAND_PRIMARY))
        canvas.drawRightString(doc.width + 40, 20, "✓ Verified by SafeSign")
        
        # Page number
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(colors.HexColor(SafeSignCertificateEngine.GRAY_600))
        canvas.drawRightString(doc.width + 40, 10, f"Page {doc.page}")
        
        canvas.restoreState()
    
    @staticmethod
    def create_status_badge(text, status="completed"):
        """Create clean status badge"""
        if status == "completed":
            color = SafeSignCertificateEngine.SUCCESS
            bg_color = SafeSignCertificateEngine.SUCCESS_LIGHT
        else:
            color = SafeSignCertificateEngine.GRAY_600
            bg_color = SafeSignCertificateEngine.GRAY_100
            
        return f"<font name='Helvetica-Bold' size='8' color='{color}'><back color='{bg_color}'>  {text}  </back></font>"
    
    @staticmethod
    def create_certificate_pdf(certificate_data):
        """
        Generate professional Certificate of Completion matching summary style
        """
        buffer = io.BytesIO()
        
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=45,
            leftMargin=45,
            topMargin=100,
            bottomMargin=60,
            title=f"SafeSign Certificate - {certificate_data.get('envelope_id', 'Document')}",
            author="SafeSign",
            subject="Certificate of Completion"
        )
        
        styles = getSampleStyleSheet()
        story = []
        
        # ========== CUSTOM STYLES - Matching Summary ==========
        
        # Main title - Black, clean
        styles.add(ParagraphStyle(
            name='CertTitle',
            parent=styles['Heading1'],
            fontSize=22,
            textColor=colors.HexColor(SafeSignCertificateEngine.BLACK),
            alignment=TA_CENTER,
            spaceAfter=10,
            spaceBefore=0,
            fontName='Helvetica-Bold',
            leading=26
        ))
        
        # Section headers - Black, bold
        styles.add(ParagraphStyle(
            name='CertSection',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor(SafeSignCertificateEngine.BLACK),
            alignment=TA_LEFT,
            spaceBefore=20,
            spaceAfter=10,
            fontName='Helvetica-Bold',
            leading=18,
            keepWithNext=True
        ))
        
        # Sub-section headers - Dark gray
        styles.add(ParagraphStyle(
            name='CertSubSection',
            parent=styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor(SafeSignCertificateEngine.GRAY_700),
            alignment=TA_LEFT,
            spaceBefore=15,
            spaceAfter=8,
            fontName='Helvetica-Bold',
            leading=16,
            keepWithNext=True
        ))
        
        # Body text - Gray
        styles.add(ParagraphStyle(
            name='CertBody',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor(SafeSignCertificateEngine.GRAY_800),
            alignment=TA_LEFT,
            fontName='Helvetica',
            leading=13,
            spaceAfter=4
        ))
        
        # Label text - Light gray
        styles.add(ParagraphStyle(
            name='CertLabel',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor(SafeSignCertificateEngine.GRAY_600),
            alignment=TA_LEFT,
            fontName='Helvetica',
            leading=12,
            spaceAfter=2
        ))
        
        # Value text - Black
        styles.add(ParagraphStyle(
            name='CertValue',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor(SafeSignCertificateEngine.BLACK),
            alignment=TA_LEFT,
            fontName='Helvetica',
            leading=14,
            spaceAfter=2
        ))
        
        # ========== HEADER ==========
        story.append(Spacer(1, 5))
        story.append(Paragraph("CERTIFICATE OF COMPLETION", styles['CertTitle']))
        story.append(Spacer(1, 5))
        
        # ========== ENVELOPE INFO CARD ==========
        envelope_id = certificate_data.get('envelope_id', 'N/A')
        
        envelope_data = [
            [f"Envelope ID: {envelope_id}", 
             f"Status: COMPLETED",
             f"Completed: {certificate_data.get('completed_date', 'Not completed')}"]
        ]
        
        envelope_card = Table(envelope_data, colWidths=[200, 150, 200], hAlign='CENTER')
        envelope_card.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(SafeSignCertificateEngine.GRAY_50)),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor(SafeSignCertificateEngine.GRAY_700)),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('RIGHTPADDING', (0, 0), (-1, -1), 15),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor(SafeSignCertificateEngine.GRAY_200)),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(envelope_card)
        story.append(Spacer(1, 25))
        
        # ========== DOCUMENT INFORMATION ==========
        story.append(Paragraph("Document Information", styles['CertSection']))
        
        doc_info_data = [
            ["Document Name", ":", certificate_data.get('document_name', 'N/A')],
            ["Created", ":", certificate_data.get('created_date', 'N/A')],
            ["Sent", ":", certificate_data.get('sent_date', certificate_data.get('created_date', 'N/A'))],
            ["Completed", ":", certificate_data.get('completed_date', 'N/A')],
            ["Owner", ":", certificate_data.get('owner_name', certificate_data.get('owner_email', 'N/A'))],
            ["Total Pages", ":", str(certificate_data.get('page_count', 0))],
        ]
        
        doc_info_table = Table(doc_info_data, colWidths=[120, 20, 360], hAlign='LEFT')
        doc_info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor(SafeSignCertificateEngine.GRAY_700)),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor(SafeSignCertificateEngine.BLACK)),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(doc_info_table)
        story.append(Spacer(1, 20))
        
        # ========== DOCUMENT METRICS DASHBOARD ==========
        story.append(Paragraph("Document Summary", styles['CertSection']))
        
        stats = certificate_data.get('statistics', {})
        
        metrics_data = [
            ["Pages", "Fields", "Signatures", "Recipients"],
            [
                str(certificate_data.get('page_count', 0)),
                str(stats.get('total_fields', 0)),
                str(stats.get('total_signatures', 0)),
                str(stats.get('total_recipients', 0))
            ],
            [
                "document pages",
                f"{stats.get('completed_fields', 0)} completed",
                f"{stats.get('signatures_completed', 0)} signed",
                f"{stats.get('completed_recipients', 0)} completed"
            ]
        ]
        
        metrics_table = Table(metrics_data, colWidths=[120, 120, 120, 120], hAlign='LEFT')
        metrics_table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(SafeSignCertificateEngine.BRAND_PRIMARY)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor(SafeSignCertificateEngine.WHITE)),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            
            # Values
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, 1), 16),
            ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor(SafeSignCertificateEngine.BRAND_PRIMARY)),
            ('ALIGN', (0, 1), (-1, 1), 'CENTER'),
            
            # Descriptions
            ('FONTNAME', (0, 2), (-1, 2), 'Helvetica'),
            ('FONTSIZE', (0, 2), (-1, 2), 8),
            ('TEXTCOLOR', (0, 2), (-1, 2), colors.HexColor(SafeSignCertificateEngine.GRAY_600)),
            ('ALIGN', (0, 2), (-1, 2), 'CENTER'),
            
            ('GRID', (0, 0), (-1, 1), 0.5, colors.HexColor(SafeSignCertificateEngine.GRAY_200)),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor(SafeSignCertificateEngine.GRAY_300)),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 1), (-1, 1), 8),
            ('TOPPADDING', (0, 1), (-1, 1), 8),
        ]))
        
        story.append(metrics_table)
        story.append(Spacer(1, 25))
        
        # ========== SIGNER EVENTS TABLE ==========
        story.append(Paragraph("Signer Events", styles['CertSection']))
        
        recipients = certificate_data.get('recipients', [])
        if recipients:
            # Split into chunks for better page handling
            MAX_SIGNERS_PER_TABLE = 12
            signer_chunks = [recipients[i:i + MAX_SIGNERS_PER_TABLE] for i in range(0, len(recipients), MAX_SIGNERS_PER_TABLE)]
            
            for chunk_index, signer_chunk in enumerate(signer_chunks):
                if chunk_index > 0:
                    story.append(Spacer(1, 15))
                    story.append(Paragraph(
                        f"<font name='Helvetica-Bold' size='11' color='{SafeSignCertificateEngine.GRAY_600}'>Signer Events (continued)</font>",
                        styles['Normal']
                    ))
                    story.append(Spacer(1, 5))
                
                signer_data = [["Signer", "Email", "Role", "Action", "Date/Time", "IP Address"]]
                
                for signer in signer_chunk:
                    status = signer.get('status', '').upper()
                    
                    # Determine action text
                    role = signer.get('role', 'signer')
                    if status == 'COMPLETED':
                        if role in ['signer', 'in_person_signer']:
                            action = "Signed"
                        elif role == 'approver':
                            action = "Approved"
                        elif role == 'form_filler':
                            action = "Filled"
                        elif role == 'witness':
                            action = "Witnessed"
                        elif role == 'viewer':
                            action = "Viewed"
                        else:
                            action = "Completed"
                        action_color = SafeSignCertificateEngine.SUCCESS
                    else:
                        action = "Pending"
                        action_color = SafeSignCertificateEngine.GRAY_600
                    
                    signer_data.append([
                        Paragraph(f"<font name='Helvetica-Bold' size='8'>{signer.get('name', 'N/A')}</font>", styles['CertBody']),
                        Paragraph(f"<font name='Helvetica' size='8'>{signer.get('email', 'N/A')}</font>", styles['CertBody']),
                        Paragraph(f"<font name='Helvetica' size='8'>{role.replace('_', ' ').title()}</font>", styles['CertBody']),
                        Paragraph(f"<font name='Helvetica-Bold' size='8' color='{action_color}'>{action}</font>", styles['CertBody']),
                        Paragraph(f"<font name='Helvetica' size='8'>{signer.get('completed_at', '—')}</font>", styles['CertBody']),
                        Paragraph(f"<font name='Helvetica' size='8'>{signer.get('ip_address', 'Unknown')}</font>", styles['CertBody']),
                    ])
                
                signer_table = Table(signer_data, colWidths=[90, 110, 70, 70, 110, 100], hAlign='CENTER', repeatRows=1)
                signer_table.setStyle(TableStyle([
                    # Header
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(SafeSignCertificateEngine.BRAND_PRIMARY)),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor(SafeSignCertificateEngine.WHITE)),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 8),
                    ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
                    
                    # Data rows
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(SafeSignCertificateEngine.GRAY_200)),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), 
                     [colors.HexColor(SafeSignCertificateEngine.WHITE), 
                      colors.HexColor(SafeSignCertificateEngine.GRAY_50)]),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                ]))
                
                story.append(signer_table)
                story.append(Spacer(1, 10))
        else:
            story.append(Paragraph(
                f"<font name='Helvetica' size='11' color='{SafeSignCertificateEngine.GRAY_600}'>No signer events recorded.</font>",
                styles['Normal']
            ))
        
        story.append(Spacer(1, 15))
        
        # ========== ENVELOPE ORIGINATOR ==========
        story.append(Paragraph("Envelope Originator", styles['CertSection']))
        
        owner_data = [
            ["Name:", certificate_data.get('owner_name', 'Document Owner')],
            ["Email:", certificate_data.get('owner_email', 'N/A')],
            ["IP Address:", certificate_data.get('owner_ip', 'Unknown')],
            ["Sent:", certificate_data.get('sent_date', certificate_data.get('created_date', 'N/A'))],
        ]
        
        owner_table = Table(owner_data, colWidths=[100, 400], hAlign='LEFT')
        owner_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(SafeSignCertificateEngine.GRAY_50)),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor(SafeSignCertificateEngine.GRAY_700)),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor(SafeSignCertificateEngine.BLACK)),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.25, colors.HexColor(SafeSignCertificateEngine.GRAY_200)),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(owner_table)
        story.append(Spacer(1, 20))
        
        # ========== ELECTRONIC RECORD DISCLOSURE ==========
        story.append(Paragraph("Electronic Record and Signature Disclosure", styles['CertSection']))
        
        disclosure_recipients = [r for r in recipients if r.get('terms_accepted')]
        if disclosure_recipients:
            disclosure_data = [
                ["Recipient", "Email", "Action", "Date"],
            ]
            
            for recipient in disclosure_recipients[:15]:  # Limit to 15
                disclosure_data.append([
                    Paragraph(f"<font name='Helvetica' size='8'>{recipient.get('name', 'N/A')}</font>", styles['CertBody']),
                    Paragraph(f"<font name='Helvetica' size='8'>{recipient.get('email', 'N/A')}</font>", styles['CertBody']),
                    Paragraph(f"<font name='Helvetica-Bold' size='8' color='{SafeSignCertificateEngine.SUCCESS}'>Accepted</font>", styles['CertBody']),
                    Paragraph(f"<font name='Helvetica' size='8'>{recipient.get('terms_accepted_date', '—')[:10] if recipient.get('terms_accepted_date') else '—'}</font>", styles['CertBody']),
                ])
            
            disclosure_table = Table(disclosure_data, colWidths=[120, 160, 80, 140], hAlign='LEFT', repeatRows=1)
            disclosure_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(SafeSignCertificateEngine.GRAY_700)),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor(SafeSignCertificateEngine.WHITE)),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(SafeSignCertificateEngine.GRAY_200)),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), 
                 [colors.HexColor(SafeSignCertificateEngine.WHITE), 
                  colors.HexColor(SafeSignCertificateEngine.GRAY_50)]),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            
            story.append(disclosure_table)
        else:
            story.append(Paragraph(
                f"<font name='Helvetica' size='11' color='{SafeSignCertificateEngine.GRAY_600}'>No electronic record disclosures recorded.</font>",
                styles['Normal']
            ))
        
        story.append(Spacer(1, 20))
        
        # ========== FIELD COMPLETION HISTORY (if available) ==========
        field_history = certificate_data.get('field_history', [])
        if field_history:
            story.append(PageBreak())
            story.append(Paragraph("Field Completion History", styles['CertSection']))
            
            MAX_FIELDS_PER_TABLE = 15
            field_chunks = [field_history[i:i + MAX_FIELDS_PER_TABLE] for i in range(0, len(field_history), MAX_FIELDS_PER_TABLE)]
            
            for chunk_index, field_chunk in enumerate(field_chunks):
                if chunk_index > 0:
                    story.append(Spacer(1, 15))
                    story.append(Paragraph(
                        f"<font name='Helvetica-Bold' size='11' color='{SafeSignCertificateEngine.GRAY_600}'>Field History (continued)</font>",
                        styles['Normal']
                    ))
                    story.append(Spacer(1, 5))
                
                field_history_data = [["Field Type", "Signer", "Page", "Completed At", "IP Address"]]
                
                for field in field_chunk:
                    field_history_data.append([
                        Paragraph(f"<font name='Helvetica' size='7'>{field.get('type', '').replace('_', ' ').title()}</font>", styles['CertBody']),
                        Paragraph(f"<font name='Helvetica' size='7'>{field.get('signer_name', 'Unknown')}</font>", styles['CertBody']),
                        Paragraph(f"<font name='Helvetica' size='7'>{field.get('page', 1)}</font>", styles['CertBody']),
                        Paragraph(f"<font name='Helvetica' size='7'>{field.get('completed_at', '')[:16] if field.get('completed_at') else '—'}</font>", styles['CertBody']),
                        Paragraph(f"<font name='Helvetica' size='7'>{field.get('ip_address', 'Unknown')}</font>", styles['CertBody']),
                    ])
                
                history_table = Table(field_history_data, colWidths=[100, 120, 50, 130, 100], hAlign='LEFT', repeatRows=1)
                history_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(SafeSignCertificateEngine.BRAND_PRIMARY)),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor(SafeSignCertificateEngine.WHITE)),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(SafeSignCertificateEngine.GRAY_200)),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), 
                     [colors.HexColor(SafeSignCertificateEngine.WHITE), 
                      colors.HexColor(SafeSignCertificateEngine.GRAY_50)]),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ]))
                
                story.append(history_table)
                story.append(Spacer(1, 10))
        
        story.append(PageBreak())
        
        # ========== CERTIFICATE OF AUTHENTICITY ==========
        story.append(Paragraph(
            "Certificate of Authenticity",
            ParagraphStyle(
                'AuthTitle',
                parent=styles['Heading2'],
                fontSize=16,
                textColor=colors.HexColor(SafeSignCertificateEngine.BLACK),
                fontName='Helvetica-Bold',
                spaceAfter=15,
                alignment=TA_LEFT
            )
        ))
        
        auth_style = ParagraphStyle(
            'AuthBody',
            parent=styles['Normal'],
            fontSize=9,
            leading=14,
            textColor=colors.HexColor(SafeSignCertificateEngine.GRAY_800),
            fontName='Helvetica',
            spaceAfter=12
        )
        
        # Document Integrity
        story.append(Paragraph("Document Integrity", 
            ParagraphStyle('AuthLabel', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor(SafeSignCertificateEngine.BLACK), fontName='Helvetica-Bold', spaceAfter=4)))
        story.append(Paragraph(
            "This certificate attests that the document associated with this SafeSign "
            "envelope remains in the state in which it existed at the time of completion. "
            "SafeSign records cryptographic evidence and system metadata designed to detect "
            "post-signing modifications.",
            auth_style
        ))
        
        # Signature Validity
        story.append(Paragraph("Signature Validity", 
            ParagraphStyle('AuthLabel', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor(SafeSignCertificateEngine.BLACK), fontName='Helvetica-Bold', spaceAfter=4)))
        story.append(Paragraph(
            "Each electronic signature captured within SafeSign is uniquely bound to the "
            "signer and the document through secure technical processes. Signature events "
            "are recorded with timestamps and network information, forming a tamper-evident "
            "audit trail.",
            auth_style
        ))
        
        # Authentication
        story.append(Paragraph("Authentication", 
            ParagraphStyle('AuthLabel', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor(SafeSignCertificateEngine.BLACK), fontName='Helvetica-Bold', spaceAfter=4)))
        story.append(Paragraph(
            "Where identity verification was enabled, SafeSign recorded authentication events "
            "associated with recipient activity, including one-time password (OTP) validation "
            "or other configured verification methods.",
            auth_style
        ))
        
        # Legal Disclaimer
        story.append(Paragraph("Certificate Limitations", 
            ParagraphStyle('AuthLabel', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor(SafeSignCertificateEngine.BLACK), fontName='Helvetica-Bold', spaceAfter=4)))
        story.append(Paragraph(
            "This certificate is a system-generated summary of SafeSign transaction records. "
            "It does not constitute legal advice nor independently validate the legal "
            "enforceability of electronic signatures under any specific jurisdiction. "
            "Enforceability is subject to applicable laws and regulations.",
            auth_style
        ))
        
        story.append(Spacer(1, 20))
        
        # Certificate metadata
        cert_meta_data = [
            ["Certificate ID:", certificate_data.get('certificate_id', 'N/A')],
            ["Generated:", datetime.utcnow().strftime("%B %d, %Y at %I:%M:%S %p UTC")],
            ["Generated for:", f"{certificate_data.get('generated_by_name', 'Unknown')} ({certificate_data.get('generated_by', 'Unknown')})"],
        ]
        
        cert_meta_table = Table(cert_meta_data, colWidths=[100, 400], hAlign='LEFT')
        cert_meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(SafeSignCertificateEngine.GRAY_50)),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor(SafeSignCertificateEngine.GRAY_700)),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor(SafeSignCertificateEngine.BRAND_PRIMARY)),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor(SafeSignCertificateEngine.GRAY_200)),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(cert_meta_table)
        
        # ========== BUILD PDF ==========
        def first_page(canvas, doc):
            SafeSignCertificateEngine.create_header(
                canvas,
                doc,
                title="CERTIFICATE OF COMPLETION",
                envelope_id=certificate_data.get('envelope_id')
            )
            SafeSignCertificateEngine.create_footer(
                canvas,
                doc,
                certificate_id=certificate_data.get('certificate_id')
            )
        
        def later_pages(canvas, doc):
            SafeSignCertificateEngine.create_footer(
                canvas,
                doc,
                certificate_id=certificate_data.get('certificate_id')
            )
        
        try:
            doc.build(story, onFirstPage=first_page, onLaterPages=later_pages)
        except Exception as e:
            print(f"Error building certificate PDF: {e}")
            import traceback
            traceback.print_exc()
            return SafeSignCertificateEngine._create_fallback_pdf(certificate_data)
        
        buffer.seek(0)
        return buffer.getvalue()
    
    @staticmethod
    def _create_fallback_pdf(certificate_data):
        """Create simple fallback PDF"""
        buffer = io.BytesIO()
        from reportlab.pdfgen import canvas
        
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        
        # White header with teal bar
        c.setFillColor(colors.HexColor(SafeSignCertificateEngine.WHITE))
        c.rect(0, height - 60, width, 60, fill=1, stroke=0)
        c.setFillColor(colors.HexColor(SafeSignCertificateEngine.BRAND_PRIMARY))
        c.rect(0, height - 5, width, 5, fill=1, stroke=0)
        
        # Title
        c.setFont("Helvetica-Bold", 20)
        c.setFillColor(colors.HexColor(SafeSignCertificateEngine.BLACK))
        c.drawString(50, height - 40, "SafeSign")
        c.drawString(width - 250, height - 40, "Certificate of Completion")
        
        # Content
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, height - 100, f"Document: {certificate_data.get('document_name', 'Unknown')}")
        
        c.setFont("Helvetica", 10)
        c.drawString(50, height - 130, f"Envelope: {certificate_data.get('envelope_id', 'N/A')}")
        c.drawString(50, height - 150, f"Completed: {certificate_data.get('completed_date', 'N/A')}")
        c.drawString(50, height - 170, f"Certificate ID: {certificate_data.get('certificate_id', 'N/A')}")
        c.drawString(50, height - 190, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Footer
        c.setFont("Helvetica", 8)
        c.setFillColor(colors.HexColor(SafeSignCertificateEngine.GRAY_600))
        c.drawString(50, 50, "Verified by SafeSign Secure Digital Signature Platform")
        
        c.save()
        buffer.seek(0)
        return buffer.getvalue()


def generate_otp(length: int = 6) -> str:
    """Generate numeric OTP"""
    return ''.join(random.choices(string.digits, k=length))

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send email using SMTP"""
    try:
        # Create message
        msg = MIMEMultipart()
        msg['Subject'] = subject
        msg['From'] = EMAIL_FROM
        msg['To'] = to_email
        msg.attach(MIMEText(html_content, 'html'))
        
        # Connect to SMTP server and send
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ Email sent to {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {str(e)}")
        return False

def get_role_description(role: str) -> str:
    """Get description for recipient role"""
    role_descriptions = {
        "signer": "sign the document",
        "approver": "review and approve the document",
        "viewer": "view the document",
        "form_filler": "fill out the form fields",
        "witness": "witness the signing process",
        "in_person_signer": "sign in person"
    }
    return role_descriptions.get(role, "review the document")

def get_action_button_text(role: str) -> str:
    """Get action button text based on role"""
    action_texts = {
        "signer": "Sign Document Now",
        "approver": "Review & Approve",
        "viewer": "View Document",
        "form_filler": "Fill Form Now",
        "witness": "Witness Signing",
        "in_person_signer": "Prepare for In-Person Signing"
    }
    return action_texts.get(role, "Review Document")

# Add this function
def send_otp_email(recipient: dict, document: dict, otp: str, is_resend: bool = False) -> bool:
    """Send OTP email to recipient for verification with consistent UI design"""
    action_url = f"{FRONTEND_URL}/verify/{recipient['_id']}"
    role = recipient.get('role', 'signer')
    
    # Get branding info
    branding = db.branding.find_one({}) or {}
    platform_name = branding.get("platform_name", "SafeSign")
    logo_url = f"{BACKEND_URL}/branding/logo/file" if branding.get("logo_file_path") else None
    current_year = datetime.now().strftime('%Y')
    complaints_url = f"{FRONTEND_URL}/e-sign/complaints"
    login_url = f"{FRONTEND_URL}/login"
    
    # Get sender information
    sender = db.users.find_one({"_id": document["owner_id"]})
    sender_name = sender.get("full_name", "") or sender.get("name", "") if sender else document.get("owner_email", "")
    sender_email = document.get("owner_email", "")
    sender_organization = sender.get("organization_name", "") if sender else ""
    
    # Role-specific info
    role_description = get_role_description(role)
    action_button = get_action_button_text(role)
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>OTP Verification - {document['filename']}</title>
        <style>
            body {{
                font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #374151;
                margin: 0;
                padding: 0;
                background-color: #f9fafb;
            }}
            .email-wrapper {{
                max-width: 600px;
                margin: 0 auto;
                background: white;
            }}
            .brand-header {{
                text-align: center;
                padding: 30px 20px 20px 20px;
                background: #ffffff;
            }}
            .brand-logo {{
                height: 70px;
            }}
            .platform-name {{
                font-size: 18px;
                font-weight: 600;
                color: #0d9488;
                margin: 0 0 6px 0;
            }}
            .view-browser {{
                font-size: 13px;
                color: #6b7280;
                margin: 0 0 18px 0;
            }}
            .document-header {{
                background: #0d9488;
                color: white;
                padding: 24px 30px;
                text-align: center;
            }}
            .document-title {{
                font-size: 20px;
                font-weight: 500;
                margin: 0 0 12px 0;
            }}
            .role-badge {{
                display: inline-block;
                background: rgba(255, 255, 255, 0.2);
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 14px;
                text-transform: capitalize;
            }}
            .content-section {{
                padding: 30px;
            }}
            .greeting {{
                color: #111827;
                margin-bottom: 20px;
                font-size: 16px;
            }}
            .info-grid {{
                background: #f8fafc;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }}
            .info-table {{
                width: 100%;
                border-collapse: collapse;
                font-size: 14px;
            }}
            .info-table td {{
                padding: 10px 0;
                border-bottom: 1px solid #e5e7eb;
            }}
            .info-label {{
                color: #6b7280;
                width: 160px;
                vertical-align: top;
            }}
            .info-value {{
                color: #374151;
                font-weight: 500;
            }}
            .otp-container {{
                text-align: center;
                margin: 30px 0;
            }}
            .otp-box {{
                display: inline-block;
                background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%);
                
                border-radius: 12px;
                padding: 30px;
                min-width: 300px;
            }}
            .otp-code {{
                font-family: 'Courier New', monospace;
                font-size: 40px;
                font-weight: 700;
                color: #0d9488;
                letter-spacing: 10px;
                margin: 20px 0;
                padding: 15px;
                background: white;
                border-radius: 8px;
                display: inline-block;
                text-align: center;
            }}
            .otp-note {{
                color: #64748b;
                font-size: 14px;
                margin: 10px 0;
            }}
            .action-button {{
                display: inline-block;
                background: #0d9488;
                color: white;
                text-decoration: none;
                padding: 16px 36px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                border: none;
                cursor: pointer;
            }}
            .action-button:hover {{
                background: #0d9488;
                color: white;
            }}
            .instructions {{
                background: #f0fdfa;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
            }}
            .instructions h3 {{
                color: #0d9488;
                margin-top: 0;
            }}
            .instructions ol {{
                margin: 10px 0;
                padding-left: 20px;
            }}
            .instructions li {{
                margin-bottom: 8px;
            }}
            .support-section {{
                background: #ecfeff;
                border-radius: 14px;
                padding: 20px;
                margin: 30px 0;
                display: flex;
                align-items: center;
                gap: 16px;
            }}
            .support-icon {{
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: #e0f2fe;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                flex-shrink: 0;
            }}
            .support-text {{
                flex: 1;
            }}
            .support-text h4 {{
                margin: 0;
                color: #0f172a;
                font-size: 16px;
            }}
            .support-text p {{
                margin: 5px 0 0 0;
                color: #475569;
                font-size: 14px;
            }}
            .support-button {{
                background: #0ea5e9;
                color: white;
                text-decoration: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                white-space: nowrap;
            }}
            .footer {{
                background-color: #000;
                color: #fff;
                padding: 30px 20px;
            }}
            .footer-content {{
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
            }}
            .footer-left {{
                flex: 1;
                padding-right: 15px;
            }}
            .footer-logo {{
                height: 40px;
                margin-bottom: 10px;
            }}
            .footer-tagline {{
                font-size: 13px;
                color: #bbb;
                margin: 0;
            }}
            .footer-divider {{
                width: 1px;
                background-color: #333;
                margin: 0 20px;
            }}
            .footer-right {{
                flex: 1;
                padding-left: 15px;
            }}
            .footer-links a {{
                display: block;
                color: #fff;
                text-decoration: none;
                margin-bottom: 8px;
                font-size: 14px;
            }}
            .footer-links a:hover {{
                text-decoration: underline;
            }}
            .copyright {{
                text-align: center;
                font-size: 11px;
                color: #94a3b8;
                padding-top: 20px;
                border-top: 1px solid #333;
                margin-top: 20px;
            }}
            @media (max-width: 480px) {{
                .content-section {{
                    padding: 20px;
                }}
                .footer-content {{
                    flex-direction: column;
                }}
                .footer-divider {{
                    width: 100%;
                    height: 1px;
                    margin: 20px 0;
                }}
                .otp-code {{
                    font-size: 32px;
                    letter-spacing: 8px;
                    padding: 12px;
                }}
                .support-section {{
                    flex-direction: column;
                    text-align: center;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <!-- Brand Header -->
            <div class="brand-header">
                {f'<img src="{logo_url}" alt="{platform_name}" class="brand-logo">' if logo_url else ''}
                <div class="platform-name">{platform_name}</div>
                <div class="view-browser">view this email in your browser</div>
            </div>
            
            <!-- Document Header with Banner -->
            
            
                    <img 
                        src="{BACKEND_URL}/static/email/otp-banner.png" 
                        alt="OTP Verification" 
                        style="width: 100%;"
                    />
              
            <div class="document-header">
                
                <h1 class="document-title">Document Signing Verification</h1>
                <div class="role-badge">{role.replace('_', ' ').title()}</div>
            </div>
            
            <!-- Main Content -->
            <div class="content-section">
                <h2 class="greeting">Hello {recipient['name']},</h2>
                <p style="margin-bottom: 25px; color: #4b5563;">
                    You have {'requested a new OTP' if is_resend else 'been sent an OTP'} for document verification. 
                    Use the OTP below to verify your identity and access the document.
                </p>
                
                <!-- Zoho-like Document Information -->
                <div class="info-grid">
                    <table class="info-table">
                        <tr>
                            <td class="info-label"><strong>Document</strong></td>
                            <td class="info-value">{document['filename']}</td>
                        </tr>
                        
                        <tr>
                            <td class="info-label"><strong>Sender</strong></td>
                            <td class="info-value">
                                <a href="mailto:{sender_email}" style="color: #2563eb; text-decoration: none;">
                                    {sender_email}
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td class="info-label"><strong>Organization</strong></td>
                            <td class="info-value">{sender_organization or "-"}</td>
                        </tr>
                        <tr>
                            <td class="info-label"><strong>Expires</strong></td>
                            <td class="info-value">24 hours from now</td>
                        </tr>
                        <tr>
                            <td class="info-label"><strong>Status</strong></td>
                            <td class="info-value">
                                <span style="color: {'#059669' if is_resend else '#0d9488'}; font-weight: 600;">
                                    {'OTP Resent' if is_resend else 'New OTP Generated'}
                                </span>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <!-- OTP Display -->
                <div class="otp-container">
                    <div class="otp-box">
                        <h3 style="margin: 0 0 15px 0; color: #0d9488; font-size: 18px;">
                            One-Time Password (OTP)
                        </h3>
                        <div class="otp-code">{otp}</div>
                        
                    </div>
                </div>
                
                <!-- Action Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{action_url}" class="action-button" style="color: white; background-color: #0d9488; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
                        {action_button} →
                    </a>
                </div>
                
                
                
                <!-- Security Note -->
                <div style="
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 8px;
                    padding: 16px;
                    margin: 20px 0;
                    font-size: 14px;
                ">
                    <strong>Security Notice:</strong> 
                    Never share this OTP with anyone. {platform_name} staff will never ask for your OTP.
                    If you didn't request this OTP, please 
                    <a href="{complaints_url}" style="color: #dc2626; text-decoration: none;">report it immediately</a>.
                </div>
                
                <!-- Support Contact -->
                <div class="support-section">
                    <div class="support-icon">🎧</div>
                    <div class="support-text">
                        <h4>Need help with verification?</h4>
                        <p>Our support team is happy to assist you with any questions about the OTP or signing process.</p>
                    </div>
                    <a href="mailto:support@{platform_name.lower().replace(' ', '')}.com" class="support-button">
                        Contact Support
                    </a>
                </div>
                
                <!-- Additional Info -->
                <div style="
                    background: #f8fafc;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 16px;
                    margin-top: 25px;
                    font-size: 13px;
                    color: #64748b;
                ">
                    <p style="margin: 0;">
                        <strong>Note:</strong> This OTP was sent via {platform_name}'s secure email system. 
                        If you have any concerns about the legitimacy of this email, please verify the sender 
                        ({sender_email}) or contact us at 
                        <a href="mailto:security@{platform_name.lower().replace(' ', '')}.com" style="color: #0d9488;">
                            security@{platform_name.lower().replace(' ', '')}.com
                        </a>
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="footer-content">
                    <div class="footer-left">
                        {f'<img src="{logo_url}" alt="{platform_name}" class="footer-logo">' if logo_url else ''}
                        <p class="footer-tagline">Secure electronic signatures powered by AI</p>
                    </div>
                    
                    <div class="footer-divider"></div>
                    
                    <div class="footer-right">
                        <div class="footer-links">
                            <a href="{FRONTEND_URL}">Home</a>
                            <a href="{FRONTEND_URL}/aboutus">About Us</a>
                            <a href="{FRONTEND_URL}/contactus">Contact</a>
                            <a href="{FRONTEND_URL}/pricing">Pricing</a>
                            <a href="{FRONTEND_URL}/security">Security</a>
                        </div>
                    </div>
                </div>
                
                <div class="copyright">
                    © {current_year} {platform_name}. All rights reserved.<br>
                    This is an automated message — please do not reply to this email.
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    subject = f"{'🔁' if is_resend else '🔐'} {'New OTP' if is_resend else 'OTP'} for Document: {document['filename']}"
    return send_email(recipient['email'], subject, html_content)

def get_role_color(role: str, element: str = 'gradient') -> str:
    """Get color scheme based on role"""
    color_schemes = {
        "signer": {
            'gradient': '#667eea 0%, #764ba2 100%',
            'button': '#4f46e5',
            'otp': '#4f46e5',
            'border': '#4f46e5'
        },
        "approver": {
            'gradient': '#10b981 0%, #059669 100%',
            'button': '#059669',
            'otp': '#059669',
            'border': '#059669'
        },
        "viewer": {
            'gradient': '#6b7280 0%, #4b5563 100%',
            'button': '#6b7280',
            'otp': '#6b7280',
            'border': '#6b7280'
        },
        "form_filler": {
            'gradient': '#f59e0b 0%, #d97706 100%',
            'button': '#d97706',
            'otp': '#d97706',
            'border': '#d97706'
        },
        "witness": {
            'gradient': '#8b5cf6 0%, #7c3aed 100%',
            'button': '#7c3aed',
            'otp': '#7c3aed',
            'border': '#7c3aed'
        },
        "in_person_signer": {
            'gradient': '#ec4899 0%, #db2777 100%',
            'button': '#db2777',
            'otp': '#db2777',
            'border': '#db2777'
        }
    }
    return color_schemes.get(role, color_schemes["signer"])[element]

def get_role_icon(role: str) -> str:
    """Get icon for role"""
    icons = {
        "signer": "✍️",
        "approver": "✅",
        "viewer": "👁️",
        "form_filler": "📝",
        "witness": "👁️‍🗨️",
        "in_person_signer": "🤝"
    }
    return icons.get(role, "📄")

def get_role_emoji(role: str) -> str:
    """Get emoji for subject line"""
    emojis = {
        "signer": "✍️",
        "approver": "✅",
        "viewer": "👁️",
        "form_filler": "📝",
        "witness": "👁️‍🗨️",
        "in_person_signer": "🤝"
    }
    return emojis.get(role, "📄")

def send_role_based_email(recipient: dict, document: dict, otp: str, 
                         common_message: str = "", personal_message: str = "") -> bool:
    """Send role-based email to recipient with common and personal messages"""
    action_url = f"{FRONTEND_URL}/verify/{recipient['_id']}"
    role = recipient.get('role', 'signer')
    role_description = get_role_description(role)
    action_button = get_action_button_text(role)
    
    # Get branding info
    branding = db.branding.find_one({}) or {}
    platform_name = branding.get("platform_name", "SafeSign")
    logo_url = f"{BACKEND_URL}/branding/logo/file" if branding.get("logo_file_path") else None
    current_year = datetime.now().strftime('%Y')
    complaints_url = f"{FRONTEND_URL}/e-sign/complaints"
    login_url = f"{FRONTEND_URL}/login"
    
    # Get sender (owner) information
    sender = db.users.find_one({"_id": document["owner_id"]})
    sender_name = sender.get("full_name", "") or sender.get("name", "") if sender else document.get("owner_email", "")
    sender_email = document.get("owner_email", "")
    sender_organization = sender.get("organization_name", "") if sender else ""
    sender_profile_picture = f"{BACKEND_URL}/users/profile/{sender['_id']}/picture" if sender and sender.get("profile_picture") else None
    
    # Role-specific instructions
    role_instructions = {
        "signer": "Please review the document carefully before signing. Your electronic signature will be legally binding.",
        "approver": "You need to review and approve this document. Ensure all details are correct before approval.",
        "viewer": "You have been granted view-only access to this document. No signature is required.",
        "form_filler": "Please fill out the required form fields accurately. Your information will be recorded securely.",
        "witness": "Your role is to witness the signing process and verify the identity of the signer.",
        "in_person_signer": "You will sign this document in person under the supervision of the sender."
    }
    
    # Format messages section
    messages_html = ""
    if common_message or personal_message:
        messages_html = '<div class="messages-section">'
        
        if common_message:
            messages_html += f'''
            <div class="message common-message">
                <h3><span style="color: #0d9488;">📢 Message from Sender</span></h3>
                <p>{common_message}</p>
            </div>
            '''
        
        if personal_message:
            messages_html += f'''
            <div class="message personal-message">
                <h3><span style="color: #0d9488;">💌 Personal Message</span></h3>
                <p>{personal_message}</p>
            </div>
            '''
        
        messages_html += '</div>'
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Action Required: {document['filename']}</title>
        <style>
            body {{
                font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #374151;
                margin: 0;
                padding: 0;
                background-color: #f9fafb;
            }}
            .email-wrapper {{
                max-width: 600px;
                margin: 0 auto;
                background: white;
            }}
            .header {{
                color: white;
            }}
            .brand-section {{
                display: flex;
                border-bottom: 2px double;
                margin: 0 auto;
                align-items: center;
                flex-direction: column;

            }}
            .brand-logo {{
                height: 100px;
                width: auto;
            }}
            .brand-name {{
                font-size: 24px;
                font-weight: 600;
                color: #0d9488;
                margin: auto 0;
                margin-bottom: 20px;
            }}
            .document-title {{
                text-align: center;
                padding: 16px 0;
                background: #0d9488;
            }}
            .document-title h1 {{
                margin: 0;
                color: white;
                font-size: 20px;
                font-weight: 500;
            }}
            .role-badge {{
                display: inline-block;
                background: rgba(255, 255, 255, 0.2);
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 14px;
                margin-top: 8px;
            }}
            .content {{
                padding: 30px;
            }}
            .greeting {{
                color: #111827;
                margin-bottom: 20px;
            }}
            .doc-info-grid {{
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
                margin-top: 16px;
            }}
            .info-item {{
                display: inline;
                flex-direction: column;
            }}
            .info-label {{
                font-size: 12px;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
            }}
            .info-value {{
                font-weight: 600;
                color: #1e293b;
                font-size: 14px;
            }}
            .messages-section {{
                margin: 24px 0;
            }}
            .message {{
                
                border-left: 4px solid #0d9488;
                padding: 16px;
                margin: 12px 0;
                border-radius: 0 4px 4px 0;
            }}
            .message h3 {{
                margin: 0 0 8px 0;
                font-size: 14px;
                font-weight: 600;
            }}
            .role-task {{
                background: #f0fdfa;
                border: 1px solid #ccfbf1;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }}
            .role-task h3 {{
                color: #0d9488;
                margin-top: 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }}
            .otp-section {{
                background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%);
                border: 2px solid #0d9488;
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
                text-align: center;
            }}
            .otp-code {{
                font-family: 'Courier New', 'SF Mono', monospace;
                font-size: 36px;
                font-weight: 700;
                letter-spacing: 8px;
                color: #0d9488;
                margin: 16px 0;
                padding: 8px;
                background: white;
                border-radius: 6px;
                display: inline-block;
            }}
            .action-button {{
                display: inline-block;
                background: #0d9488;
                color: white;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                margin: 16px 0;
                border: none;
                cursor: pointer;
                text-align: center;
            }}
            .action-button:hover {{
                background: #0f766e;
            }}
            .security-note {{
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 16px;
                margin: 20px 0;
                font-size: 14px;
            }}
            
            .footer a {{
                color: #0d9488;
                text-decoration: none;
            }}
            .footer a:hover {{
                text-decoration: underline;
            }}
            @media (max-width: 480px) {{
                .content {{
                    padding: 20px;
                }}
                .doc-info-grid {{
                    grid-template-columns: 1fr;
                }}
                .otp-code {{
                    font-size: 28px;
                    letter-spacing: 6px;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <!-- Header with Branding -->
            <div class="header">
                            <div style="
                text-align:center;
                padding:30px 20px 20px 20px;
                background:#ffffff;
                font-family:Arial, sans-serif;
            ">

                <!-- Logo -->
                {f'''
                <img 
                    src="{logo_url}" 
                    alt="{platform_name}"
                    style="height:70px; margin-bottom:10px; display:block; margin-left:auto; margin-right:auto;"
                />
                ''' if logo_url else ''}

                <!-- Brand Name -->
                <p style="
                    font-size:18px;
                    font-weight:600;
                    color:#0d9488;
                    margin:0 0 6px 0;
                ">
                    {platform_name}
                </p>

                <!-- View in browser (optional) -->
                <p style="
                    font-size:13px;
                    color:#6b7280;
                    margin:0 0 18px 0;
                ">
                    view this email in your browser
                </p>

            </div>
                <div class="document-title">
                    <h1>Action Required: Please Sign Document</h1>
                    <div class="role-badge">{role.replace('_', ' ').title()}</div>
                </div>
                

            </div>
            <!-- Banner Image -->
                <div style="text-align: center;">
                    <img 
                        src="{BACKEND_URL}/static/email/banner.png"
                        alt="SafeSign Banner"
                        style="
                            width: 100%;
                            display: block;
                            margin: auto;
                        "
                    />
                </div>
            
            <!-- Main Content -->
            <div class="content">
                <h2 class="greeting">Hello {recipient['name']},</h2>
                <p>You have been requested to <strong>{role_description}</strong> for an important document.</p>
                
                <!-- Document Information -->
                
                
                <!-- Document Information (Zoho-style simple) -->
<div style="margin: 24px 0; font-family: Arial, sans-serif;">

    <!-- Intro Line -->
    <p style="
        font-size:15px;
        color:#374151;
        margin:0 0 16px 0;
        line-height:1.6;
    ">
        <strong>{sender_organization or sender_name}</strong> has requested you to review and sign
        <strong>{document['filename']}</strong>.
    </p>

    <!-- Info Table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="
        font-size:14px;
        color:#374151;
    ">
        <tr>
            <td style="padding:6px 0; width:160px; color:#6b7280;">
                <strong>Sender</strong>
            </td>
            <td style="padding:6px 0;">
                <a href="mailto:{sender_email}" style="color:#2563eb; text-decoration:none;">
                    {sender_email}
                </a>
            </td>
        </tr>

        <tr>
            <td style="padding:6px 0; color:#6b7280;">
                <strong>Organization Name</strong>
            </td>
            <td style="padding:6px 0;">
                {sender_organization or "-"}
            </td>
        </tr>

        <tr>
            <td style="padding:6px 0; color:#6b7280;">
                <strong>Document Name</strong>
            </td>
            <td style="padding:6px 0;">
                {document['filename']}
            </td>
        </tr>

        <tr>
            <td style="padding:6px 0; color:#6b7280;">
                <strong>Expires on</strong>
            </td>
            <td style="padding:6px 0;">
                {document.get('expires_at', '24 hours from now')}
            </td>
        </tr>

        <tr>
            <td style="padding:6px 0; color:#6b7280;">
                <strong>Message to all</strong>
            </td>
            <td style="padding:6px 0;">
                {common_message if common_message else "-"}
            </td>
        </tr>

        <tr>
            <td style="padding:6px 0; color:#6b7280; vertical-align:top;">
                <strong>Private Message</strong>
            </td>
            <td style="padding:6px 0; line-height:1.6;">
                {personal_message if personal_message else "-"}
            </td>
        </tr>
    </table>

</div>


                
                

                
                <!-- Messages Section -->
                {messages_html}
                
                <!-- Role Specific Task -->
                <div class="role-task">
                    <h3> Your Specific Task</h3>
                    <p>{role_instructions.get(role, 'Please review the document and take appropriate action.')}</p>
                    
                </div>
                
                <!-- OTP Section -->
                <div class="otp-section">
                    <h3 style="color: #0d9488; margin-top: 0;">One-Time Password</h3>
                    <div class="otp-code">{otp}</div>
                    <p style="color: #64748b; font-size: 14px; margin: 8px 0;">
                         Valid for 24 hours •  Single use only
                    </p>
                </div>
                
                <!-- Action Button -->
                <div style="text-align: center; margin: 24px 0;">
                    <a href="{action_url}" class="action-button" style="text-align: center; color: white;">
                        {action_button} →
                    </a>
                    
                </div>
                
                
            
            <!-- Help Support Box -->
<div style="
    background:#f8fafc;
    border:1px solid #e5e7eb;
    border-radius:14px;
    padding:20px;
    margin:30px 0;
    font-family:Arial, sans-serif;
">

    <!-- Support Help Box -->
<div style="
    display:flex;
    align-items:center;
    gap:16px;
    background:#ecfeff;
    border-radius:14px;
    padding:18px 20px;
    margin:30px 0;
    font-family:Arial, sans-serif;
">

    <!-- Left Icon / Avatar -->
    <div style="
        width:56px;
        height:56px;
        border-radius:50%;
        background:#e0f2fe;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:26px;
        flex-shrink:0;
    ">
        🎧
    </div>

    <!-- Text Content -->
    <div style="flex:1;">
        <p style="
            margin:0;
            font-size:16px;
            font-weight:600;
            color:#0f172a;
        ">
            Need help with signing?
        </p>
        <p style="
            margin:4px 0 0 0;
            font-size:14px;
            color:#475569;
            line-height:1.5;
        ">
            Our support team is happy to assist you with any questions.
        </p>
    </div>

    <!-- CTA Button -->
    <a href="mailto:support@safesign.com"
       style="
        display:inline-block;
        background:#0ea5e9;
        color:#ffffff;
        text-decoration:none;
        padding:10px 18px;
        border-radius:8px;
        font-size:14px;
        font-weight:600;
        white-space:nowrap;
       ">
        Email us
    </a>

</div>

            
            
            <div class="footer">
                <p style="margin: 0 0 12px 0;">
                    <strong>This email was sent via {platform_name}</strong>, a secure electronic signature service.
                    The document included requires your electronic signature, so please review it carefully before signing.
                </p>

                <p style="margin: 0 0 12px 0;">
                    This message was sent because a sender requested your signature using {platform_name}.
                    We use secure, encrypted connections to protect your data.
                    If you believe this email is not legitimate, you can
                    <a href="{complaints_url}" style="color:#0d9488; text-decoration:none;">report an issue</a>
                    or
                    <a href="{login_url}" style="color:#0d9488; text-decoration:none;">contact our platform</a>.
                </p>

                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;">
            </div>

            <!-- Footer -->
             
            <table width="100%" cellpadding="0" cellspacing="0" style="
                background-color:#000;
                padding:30px 20px;
                color:#fff;
                font-family:Arial, sans-serif;
            ">
                <tr>
                    <!-- LEFT: Logo + Tagline -->
                    <td width="45%" valign="top" style="padding-right:15px;">
                        {f'''
                        <img 
                            src="{logo_url}" 
                            alt="{platform_name}"
                            style="height:40px; display:block; margin-bottom:10px;"
                        />
                        ''' if logo_url else ''}
                        <p style="font-size:13px; color:#bbb; margin:0;">
                            Sign smarter with AI-powered e-signatures
                        </p>
                    </td>

                    <!-- CENTER: Divider -->
                    <td width="10%" align="center" valign="top">
                        <div style="
                            width:1px;
                            height:80px;
                            background-color:#333;
                            margin:auto;
                        "></div>
                    </td>

                    <!-- RIGHT: Navigation Links -->
                    <td width="45%" valign="top" style="padding-left:15px;">
                        <a href="{FRONTEND_URL}" style="display:block; color:#fff; text-decoration:none; margin-bottom:8px;">Home</a>
                        <a href="{FRONTEND_URL}/aboutus" style="display:block; color:#fff; text-decoration:none; margin-bottom:8px;">About Us</a>
                        <a href="{FRONTEND_URL}/contactus" style="display:block; color:#fff; text-decoration:none; margin-bottom:8px;">Contact</a>
                        <a href="{FRONTEND_URL}/pricing" style="display:block; color:#fff; text-decoration:none; margin-bottom:8px;">Pricing</a>
                        <a href="{FRONTEND_URL}/security" style="display:block; color:#fff; text-decoration:none;">Security</a>
                    </td>
                </tr>

                <!-- Bottom Divider -->
                <tr>
                    <td colspan="3" style="padding-top:20px;">
                        <div style="border-top:1px solid #333;"></div>
                    </td>
                </tr>

                <!-- COPYRIGHT -->
                <tr>
                    <td colspan="3" style="padding-top:15px; text-align:center;">
                        <p style="font-size:11px; color:#94a3b8; margin:0;">
                            © {current_year} {platform_name}. All rights reserved.<br>
                            This is an automated message — please do not reply.
                        </p>
                    </td>
                </tr>
            </table>


        </div>
    </body>
    </html>
    """
    
    subject = f"{get_role_emoji(role)} Action Required: Please {role_description} - {document['filename']}"
    return send_email(recipient['email'], subject, html_content)

async def send_bulk_invites(
    document_id: str, 
    recipients: list, 
    common_message: str,
    personal_messages: dict,  # {"recipient_id": "personal message"}
    sender_email: str
):
    """Send invitation emails to multiple recipients with role-based content and messages"""
    document = db.documents.find_one({"_id": ObjectId(document_id)})
    
    # Update document with common message if not already set
    if common_message:
        db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"common_message": common_message}}
        )
    
    for recipient in recipients:
        try:
            # Generate OTP
            otp = generate_otp()
            otp_expires = datetime.utcnow() + timedelta(hours=24)
            
            # Get personal message for this recipient
            recipient_id_str = str(recipient["_id"])
            personal_message = personal_messages.get(recipient_id_str, "")
            
            # Get existing personal message from recipient if not in payload
            if not personal_message and "personal_message" in recipient:
                personal_message = recipient.get("personal_message", "")
            
            # Update recipient with OTP and messages
            update_data = {
                "otp": otp,
                "otp_expires": otp_expires,
                "otp_verified": False,
                "status": "invited",
                "personal_message": personal_message
            }
            
            db.recipients.update_one(
                {"_id": recipient["_id"]},
                {"$set": update_data}
            )
            
            # Send role-based email with both messages
            success = send_role_based_email(
                recipient=recipient,
                document=document,
                otp=otp,
                common_message=common_message,
                personal_message=personal_message
            )
            
            if success:
                db.recipients.update_one(
                    {"_id": recipient["_id"]},
                    {"$set": {
                        "status": "sent",
                        "sent_at": datetime.utcnow(),
                        "invited_at": datetime.utcnow()
                    }}
                )
                print(f"✅ {recipient.get('role', 'signer').title()} invitation sent to {recipient['email']}")
                
                # Log successful send
                db.document_activity.insert_one({
                    "document_id": ObjectId(document_id),
                    "action": "invite_sent",
                    "recipient_email": recipient["email"],
                    "recipient_name": recipient["name"],
                    "recipient_role": recipient.get("role", "signer"),
                    "timestamp": datetime.utcnow(),
                    "sender": sender_email,
                    "has_personal_message": bool(personal_message),
                    "has_common_message": bool(common_message)
                })
            else:
                print(f"❌ Failed to send invitation to {recipient['email']}")
                db.recipients.update_one(
                    {"_id": recipient["_id"]},
                    {"$set": {"status": "invite_failed"}}
                )
                
        except Exception as e:
            print(f"⚠️ Error sending to {recipient['email']}: {str(e)}")
            # Log error
            db.error_logs.insert_one({
                "document_id": ObjectId(document_id),
                "recipient_email": recipient.get("email"),
                "error": str(e),
                "timestamp": datetime.utcnow(),
                "action": "send_invite"
            })

async def send_reminder_email(recipient: dict, document: dict, sender_email: str):
    """Send reminder email to recipient with role-based content"""
    # Generate new OTP for reminder
    new_otp = generate_otp()
    new_expiry = datetime.utcnow() + timedelta(hours=24)
    
    # Update recipient with new OTP
    db.recipients.update_one(
        {"_id": recipient["_id"]},
        {"$set": {
            "otp": new_otp,
            "otp_expires": new_expiry,
            "otp_verified": False
        }}
    )
    
    action_url = f"{FRONTEND_URL}/verify/{recipient['_id']}"
    role = recipient.get('role', 'signer')
    action_button = get_action_button_text(role)
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ 
                font-family: 'Arial', sans-serif; 
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{ 
                background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
                color: white;
                padding: 25px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{ 
                padding: 25px;
                background: #fff3e0;
                border-radius: 0 0 10px 10px;
            }}
            .otp {{ 
                font-size: 28px;
                font-weight: bold;
                color: #ff9800;
                text-align: center;
                margin: 20px 0;
                letter-spacing: 4px;
            }}
            .button {{ 
                display: inline-block;
                padding: 12px 25px;
                background: #ff9800;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
            }}
            .note {{
                background: white;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
                border-left: 4px solid #ff9800;
            }}
            .role-badge {{
                display: inline-block;
                background: rgba(255,255,255,0.2);
                padding: 3px 10px;
                border-radius: 15px;
                font-size: 12px;
                margin-left: 10px;
                text-transform: capitalize;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔔 Reminder: Document Action Required</h1>
            <div class="role-badge">Role: {role.replace('_', ' ').title()}</div>
        </div>
        
        <div class="content">
            <h2>Hello {recipient['name']},</h2>
            <p>This is a friendly reminder to complete your required action for the document:</p>
            
            <div class="note">
                <strong>Document:</strong> {document['filename']}<br>
                <strong>Your Role:</strong> {role.replace('_', ' ').title()}<br>
                <strong>Action Required:</strong> {get_role_description(role)}
            </div>
            
            <div class="otp">
                Your New OTP: {new_otp}
            </div>
            
            <p style="text-align: center;">
                <a href="{action_url}" class="button">{action_button}</a>
            </p>
            
            <div class="note">
                <strong>Note:</strong> Your previous OTP has been replaced with this new one for security reasons.
            </div>
        </div>
    </body>
    </html>
    """
    
    subject = f"Reminder: {document['filename']}"
    success = send_email(recipient['email'], subject, html_content)
    
    if success:
        print(f"🔔 Reminder sent to {recipient['email']} | New OTP: {new_otp}")
    else:
        print(f"❌ Failed to send reminder to {recipient['email']}")
        
        
def send_signed_document_email(
    to_email: str,
    recipient_name: str,
    document_name: str,
    pdf_bytes: bytes
) -> bool:
    try:
        msg = MIMEMultipart()
        msg["From"] = EMAIL_FROM
        msg["To"] = to_email
        msg["Subject"] = f"Signed Document: {document_name}"

        html_body = f"""
        <p>Hello {recipient_name},</p>
        <p>Your signed document <strong>{document_name}</strong> is attached.</p>
        <p>Thank you for using our platform.</p>
        """

        msg.attach(MIMEText(html_body, "html"))

        attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
        attachment.add_header(
            "Content-Disposition",
            "attachment",
            filename=document_name
        )
        msg.attach(attachment)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)

        return True

    except Exception as e:
        print("Email send failed:", e)
        return False
    
def send_document_email(
    to_email: str,
    to_name: str,
    sender_email: str,
    sender_name: str,
    subject: str,
    body: str,
    document_name: str,
    pdf_bytes: bytes,
    envelope_id: str = None
) -> bool:
    """
    Send document via email with attachment.
    """
    try:
        # Create message
        msg = MIMEMultipart()
        msg["From"] = f"{sender_name} <{sender_email}>"
        msg["To"] = f"{to_name} <{to_email}>" if to_name else to_email
        msg["Subject"] = subject
        
        # Add body
        if envelope_id:
            body += f"\n\nEnvelope ID: {envelope_id}"
        
        msg.attach(MIMEText(body, "plain"))
        
        # Add PDF attachment
        attachment = MIMEBase("application", "pdf")
        attachment.set_payload(pdf_bytes)
        encoders.encode_base64(attachment)
        attachment.add_header(
            "Content-Disposition",
            f"attachment; filename={document_name}"
        )
        msg.attach(attachment)
        
        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
        
    except Exception as e:
        print(f"Error sending email to {to_email}: {str(e)}")
        return False
    
    
async def send_completed_document_to_recipients(document_id: str):
    """
    Send completed/signed document to all recipients when document is finalized.
    This is automatically triggered when document status changes to "completed".
    """
    try:
        # Get document
        document = db.documents.find_one({"_id": ObjectId(document_id)})
        if not document:
            print(f"❌ Document {document_id} not found")
            return False
        
        # Verify document is completed
        if document.get("status") != "completed":
            print(f"❌ Document {document_id} is not completed (status: {document.get('status')})")
            return False
        
        # Get completed PDF path
        pdf_path = document.get("signed_pdf_path") or document.get("pdf_file_path")
        if not pdf_path:
            print(f"❌ No PDF found for document {document_id}")
            return False
        
        # Get PDF content from Azure
        try:
            from storage import storage
            pdf_bytes = storage.download(pdf_path)
        except Exception as e:
            print(f"❌ Error reading PDF: {str(e)}")
            return False
        
        # Get all recipients
        recipients = list(db.recipients.find({"document_id": ObjectId(document_id)}))
        if not recipients:
            print(f"❌ No recipients found for document {document_id}")
            return False
        
        # Get document owner/sender info
        owner = db.users.find_one({"_id": document["owner_id"]})
        sender_email = document.get("owner_email", "")
        sender_name = owner.get("full_name", "") or owner.get("name", "") if owner else ""
        sender_organization = owner.get("organization_name", "") if owner else ""
        
        # Get branding info
        branding = db.branding.find_one({}) or {}
        platform_name = branding.get("platform_name", "SafeSign")
        logo_url = f"{BACKEND_URL}/branding/logo/file" if branding.get("logo_file_path") else None
        
        # Track results
        success_count = 0
        failed_recipients = []
        
        for recipient in recipients:
            try:
                # Prepare recipient-specific data
                recipient_name = recipient.get("name", recipient.get("email", ""))
                recipient_email = recipient.get("email", "")
                recipient_role = recipient.get("role", "signer")
                
                # Send email with completed document
                success = send_document_completion_email(
                    recipient_email=recipient_email,
                    recipient_name=recipient_name,
                    document=document,
                    pdf_bytes=pdf_bytes,
                    sender_name=sender_name,
                    sender_email=sender_email,
                    sender_organization=sender_organization,
                    recipient_role=recipient_role,
                    logo_url=logo_url,
                    platform_name=platform_name
                )
                
                if success:
                    success_count += 1
                    print(f"✅ Sent completed document to {recipient_email}")
                    
                    # Log the email send
                    db.document_activity.insert_one({
                        "document_id": ObjectId(document_id),
                        "action": "completed_document_sent",
                        "recipient_email": recipient_email,
                        "recipient_name": recipient_name,
                        "recipient_role": recipient_role,
                        "timestamp": datetime.utcnow(),
                        "sender": sender_email,
                        "document_status": "completed",
                        "envelope_id": document.get("envelope_id")
                    })
                else:
                    failed_recipients.append({
                        "email": recipient_email,
                        "name": recipient_name,
                        "error": "Email send failed"
                    })
                    print(f"❌ Failed to send to {recipient_email}")
                    
            except Exception as e:
                failed_recipients.append({
                    "email": recipient.get("email", "unknown"),
                    "name": recipient.get("name", "unknown"),
                    "error": str(e)
                })
                print(f"❌ Error sending to {recipient.get('email')}: {str(e)}")
        
        # Update document with email status
        update_data = {
            "completed_email_sent": True,
            "completed_email_sent_at": datetime.utcnow(),
            "completed_email_success_count": success_count,
            "completed_email_failed_count": len(failed_recipients)
        }
        
        # Only update if we actually sent emails (success or failure)
        if success_count > 0 or len(failed_recipients) > 0:
            db.documents.update_one(
                {"_id": ObjectId(document_id)},
                {"$set": update_data}
            )
            
            # Store failed recipients for retry purposes
            if failed_recipients:
                db.failed_email_attempts.insert_one({
                    "document_id": ObjectId(document_id),
                    "timestamp": datetime.utcnow(),
                    "failed_recipients": failed_recipients,
                    "total_attempts": len(recipients),
                    "successful_attempts": success_count
                })
        
        # Log overall result
        print(f"📧 Completed document emails sent: {success_count} success, {len(failed_recipients)} failed")
        
        return success_count > 0
        
    except Exception as e:
        print(f"❌ Error in send_completed_document_to_recipients: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
def send_document_completion_email(
    recipient_email: str,
    recipient_name: str,
    document: dict,
    pdf_bytes: bytes,
    sender_name: str,
    sender_email: str,
    sender_organization: str,
    recipient_role: str,
    logo_url: str = None,
    platform_name: str = "SafeSign"
) -> bool:
    """
    Send completed/signed document to recipient with professional email template.
    """
    try:
        # Get branding info
        branding = db.branding.find_one({}) or {}
        platform_name = branding.get("platform_name", "SafeSign")
        logo_url = f"{BACKEND_URL}/branding/logo/file" if branding.get("logo_file_path") else None
        current_year = datetime.now().strftime('%Y')
        FRONTEND_URL = os.getenv("FRONTEND_URL", "https://yourdomain.com")
        
        # Document details
        document_name = document.get("filename", "Document")
        envelope_id = document.get("envelope_id", "")
        completed_at = document.get("completed_at", datetime.utcnow())
        if isinstance(completed_at, datetime):
            completed_date = completed_at.strftime("%Y-%m-%d")
        else:
            completed_date = str(completed_at)[:10]
        
        # Create email content
        subject = f"✅ Document Signed: {document_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Document Completed: {document_name}</title>
            <style>
                body {{
                    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #374151;
                    margin: 0;
                    padding: 0;
                    background-color: #f9fafb;
                }}
                .email-wrapper {{
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                }}
                .brand-header {{
                    text-align: center;
                    padding: 30px 20px 20px 20px;
                    background: #ffffff;
                }}
                .brand-logo {{
                    height: 70px;
                }}
                .platform-name {{
                    font-size: 18px;
                    font-weight: 600;
                    color: #0d9488;
                    margin: 0 0 6px 0;
                }}
                .view-browser {{
                    font-size: 13px;
                    color: #6b7280;
                    margin: 0 0 18px 0;
                }}
                .header-banner {{
                    text-align: center;
                    background: #059669;
                }}
                .document-header {{
                    background: #059669;
                    color: white;
                    padding: 24px 30px;
                    text-align: center;
                }}
                .document-title {{
                    font-size: 20px;
                    font-weight: 500;
                    margin: 0 0 12px 0;
                }}
                .success-badge {{
                    display: inline-block;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                }}
                .content-section {{
                    padding: 30px;
                }}
                .greeting {{
                    color: #111827;
                    margin-bottom: 20px;
                    font-size: 16px;
                }}
                .info-grid {{
                    background: #f8fafc;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }}
                .info-table {{
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                }}
                .info-table td {{
                    padding: 10px 0;
                    border-bottom: 1px solid #e5e7eb;
                }}
                .info-label {{
                    color: #6b7280;
                    width: 160px;
                    vertical-align: top;
                }}
                .info-value {{
                    color: #374151;
                    font-weight: 500;
                }}
                .completion-section {{
                    background: #ecfdf5;
                    border: 2px solid #a7f3d0;
                    border-radius: 12px;
                    padding: 24px;
                    margin: 24px 0;
                    text-align: center;
                }}
                .completion-icon {{
                    font-size: 48px;
                    margin-bottom: 16px;
                }}
                .download-button {{
                    display: inline-block;
                    background: #059669;
                    color: white;
                    text-decoration: none;
                    padding: 14px 32px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 16px;
                    margin: 20px 0;
                    border: none;
                    cursor: pointer;
                }}
                .download-button:hover {{
                    background: #047857;
                }}
                .signature-section {{
                    margin: 30px 0;
                    padding: 20px;
                    background: #f0fdfa;
                    border-radius: 8px;
                    border-left: 4px solid #0d9488;
                }}
                .attachment-info {{
                    background: #e0f2fe;
                    border-radius: 8px;
                    padding: 16px;
                    margin: 20px 0;
                    font-size: 14px;
                    color: #0369a1;
                }}
                .footer {{
                    background-color: #000;
                    color: #fff;
                    padding: 30px 20px;
                }}
                .footer-content {{
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }}
                .footer-left {{
                    flex: 1;
                    padding-right: 15px;
                }}
                .footer-logo {{
                    height: 40px;
                    margin-bottom: 10px;
                }}
                .footer-tagline {{
                    font-size: 13px;
                    color: #bbb;
                    margin: 0;
                }}
                .footer-divider {{
                    width: 1px;
                    background-color: #333;
                    margin: 0 20px;
                }}
                .footer-right {{
                    flex: 1;
                    padding-left: 15px;
                }}
                .footer-links a {{
                    display: block;
                    color: #fff;
                    text-decoration: none;
                    margin-bottom: 8px;
                    font-size: 14px;
                }}
                .footer-links a:hover {{
                    text-decoration: underline;
                }}
                .copyright {{
                    text-align: center;
                    font-size: 11px;
                    color: #94a3b8;
                    padding-top: 20px;
                    border-top: 1px solid #333;
                    margin-top: 20px;
                }}
                @media (max-width: 480px) {{
                    .content-section {{
                        padding: 20px;
                    }}
                    .footer-content {{
                        flex-direction: column;
                    }}
                    .footer-divider {{
                        width: 100%;
                        height: 1px;
                        margin: 20px 0;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <!-- Brand Header -->
                <div class="brand-header">
                    {f'<img src="{logo_url}" alt="{platform_name}" class="brand-logo">' if logo_url else ''}
                    <div class="platform-name">{platform_name}</div>
                    <div class="view-browser">view this email in your browser</div>
                </div>
                
                <!-- Banner Image -->
                <div class="header-banner">
                    <img 
                        src="{BACKEND_URL}/static/email/completed-banner.png" 
                        alt="Document Completed" 
                        style="width: 100%;"
                    />
                </div>
                
                <!-- Document Header -->
                <div class="document-header">
                    <h1 class="document-title">✅ Document Successfully Signed</h1>
                    <div class="success-badge">COMPLETED</div>
                </div>
                
                <!-- Main Content -->
                <div class="content-section">
                    <h2 class="greeting">Hello {recipient_name},</h2>
                    <p style="margin-bottom: 25px; color: #4b5563;">
                        The document you were involved with has been successfully signed and completed. 
                        Your signed copy is attached to this email.
                    </p>
                    
                    <!-- Document Information -->
                    <div class="info-grid">
                        <table class="info-table">
                            <tr>
                                <td class="info-label"><strong>Document</strong></td>
                                <td class="info-value">{document_name}</td>
                            </tr>
                            {f'<tr><td class="info-label"><strong>Envelope ID</strong></td><td class="info-value">{envelope_id}</td></tr>' if envelope_id else ''}
                            <tr>
                                <td class="info-label"><strong>Sender</strong></td>
                                <td class="info-value">
                                    <a href="mailto:{sender_email}" style="color: #2563eb; text-decoration: none;">
                                        {sender_email}
                                    </a>
                                </td>
                            </tr>
                            <tr>
                                <td class="info-label"><strong>Organization</strong></td>
                                <td class="info-value">{sender_organization or "-"}</td>
                            </tr>
                            <tr>
                                <td class="info-label"><strong>Your Role</strong></td>
                                <td class="info-value">{recipient_role.replace('_', ' ').title()}</td>
                            </tr>
                            <tr>
                                <td class="info-label"><strong>Completed On</strong></td>
                                <td class="info-value">{completed_date}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- Completion Section -->
                    <div class="completion-section">
                        <div class="completion-icon">✅</div>
                        <h3 style="margin: 0 0 16px 0; color: #059669;">Document Successfully Signed</h3>
                        <p style="color: #047857; margin-bottom: 20px;">
                            All required signatures have been collected. This document is now legally binding.
                        </p>
                    </div>
                    
                    <!-- Download Button -->
                   
                    
                    <!-- Attachment Info -->
                    <div class="attachment-info">
                        <strong>📎 Attachment:</strong> {document_name} (PDF)<br>
                        <small>This PDF contains all signatures, timestamps, and is ready for your records.</small>
                    </div>
                    
                    <!-- Signature Section -->
                   
                    
                    <!-- Support Section -->
                    
                
                <!-- Footer -->
                <div class="footer">
                    <div class="footer-content">
                        <div class="footer-left">
                            {f'<img src="{logo_url}" alt="{platform_name}" class="footer-logo">' if logo_url else ''}
                            <p class="footer-tagline">Secure electronic signatures powered by AI</p>
                        </div>
                        
                        <div class="footer-divider"></div>
                        
                        <div class="footer-right">
                            <div class="footer-links">
                                <a href="{FRONTEND_URL}">Home</a>
                                <a href="{FRONTEND_URL}/aboutus">About Us</a>
                                <a href="{FRONTEND_URL}/contactus">Contact</a>
                                <a href="{FRONTEND_URL}/pricing">Pricing</a>
                                <a href="{FRONTEND_URL}/security">Security</a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="copyright">
                        © {current_year} {platform_name}. All rights reserved.<br>
                        This is an automated message — please do not reply to this email.
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Create email message
        msg = MIMEMultipart()
        msg["From"] = EMAIL_FROM
        msg["To"] = recipient_email
        msg["Subject"] = subject
        
        # Attach HTML body
        msg.attach(MIMEText(html_content, "html"))
        
        # Attach PDF document
        pdf_attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
        pdf_attachment.add_header(
            "Content-Disposition",
            "attachment",
            filename=f"signed_{document_name}"
        )
        msg.attach(pdf_attachment)
        
        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ Sent completed document to {recipient_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send completed document to {recipient_email}: {str(e)}")
        return False
    
async def send_completed_document_package(document_id: str):
    """
    Send completed document package (ZIP with signed doc, summary, certificate, original) 
    to all recipients when document is finalized.
    """
    try:
        # Get document
        document = db.documents.find_one({"_id": ObjectId(document_id)})
        if not document:
            print(f"❌ Document {document_id} not found")
            return False
        
        # Verify document is completed
        if document.get("status") != "completed":
            print(f"❌ Document {document_id} is not completed (status: {document.get('status')})")
            return False
        
        # Get document owner/sender info
        owner = db.users.find_one({"_id": document["owner_id"]})
        sender_email = document.get("owner_email", "")
        sender_name = owner.get("full_name", "") or owner.get("name", "") if owner else ""
        sender_organization = owner.get("organization_name", "") if owner else ""
        
        # Get branding info
        branding = db.branding.find_one({}) or {}
        platform_name = branding.get("platform_name", "SafeSign")
        logo_url = f"{BACKEND_URL}/branding/logo/file" if branding.get("logo_file_path") else None
        
        # Get all recipients
        recipients = list(db.recipients.find({"document_id": ObjectId(document_id)}))
        if not recipients:
            print(f"❌ No recipients found for document {document_id}")
            return False
        
        # Track results
        success_count = 0
        failed_recipients = []
        
        for recipient in recipients:
            try:
                # Generate document package for this recipient
                package_data = await generate_document_package(
                    document=document,
                    recipient=recipient,
                    sender_name=sender_name,
                    sender_email=sender_email,
                    sender_organization=sender_organization,
                    platform_name=platform_name,
                    logo_url=logo_url
                )
                
                if package_data and package_data.get("zip_bytes"):
                    # Send email with ZIP attachment
                    success = send_package_email(
                        recipient_email=recipient.get("email", ""),
                        recipient_name=recipient.get("name", ""),
                        document=document,
                        zip_bytes=package_data["zip_bytes"],
                        zip_filename=package_data["zip_filename"],
                        sender_name=sender_name,
                        sender_email=sender_email,
                        sender_organization=sender_organization,
                        platform_name=platform_name,
                        logo_url=logo_url
                    )
                    
                    if success:
                        success_count += 1
                        print(f"✅ Sent document package to {recipient.get('email')}")
                        
                        # Log the email send
                        db.document_activity.insert_one({
                            "document_id": ObjectId(document_id),
                            "action": "completed_package_sent",
                            "recipient_email": recipient.get("email"),
                            "recipient_name": recipient.get("name"),
                            "recipient_role": recipient.get("role"),
                            "timestamp": datetime.utcnow(),
                            "sender": sender_email,
                            "document_status": "completed",
                            "envelope_id": document.get("envelope_id"),
                            "package_type": "zip_with_all_documents"
                        })
                    else:
                        failed_recipients.append({
                            "email": recipient.get("email"),
                            "name": recipient.get("name"),
                            "error": "Email send failed"
                        })
                        print(f"❌ Failed to send to {recipient.get('email')}")
                else:
                    failed_recipients.append({
                        "email": recipient.get("email"),
                        "name": recipient.get("name"),
                        "error": "Package generation failed"
                    })
                    print(f"❌ Package generation failed for {recipient.get('email')}")
                    
            except Exception as e:
                failed_recipients.append({
                    "email": recipient.get("email", "unknown"),
                    "name": recipient.get("name", "unknown"),
                    "error": str(e)
                })
                print(f"❌ Error sending to {recipient.get('email')}: {str(e)}")
        
        # Update document with email status
        update_data = {
            "completed_email_sent": True,
            "completed_email_sent_at": datetime.utcnow(),
            "completed_email_success_count": success_count,
            "completed_email_failed_count": len(failed_recipients)
        }
        
        # Only update if we actually sent emails (success or failure)
        if success_count > 0 or len(failed_recipients) > 0:
            db.documents.update_one(
                {"_id": ObjectId(document_id)},
                {"$set": update_data}
            )
            
            # Store failed recipients for retry purposes
            if failed_recipients:
                db.failed_email_attempts.insert_one({
                    "document_id": ObjectId(document_id),
                    "timestamp": datetime.utcnow(),
                    "failed_recipients": failed_recipients,
                    "total_attempts": len(recipients),
                    "successful_attempts": success_count
                })
        
        # Log overall result
        print(f"📧 Completed document packages sent: {success_count} success, {len(failed_recipients)} failed")
        
        return success_count > 0
        
    except Exception as e:
        print(f"❌ Error in send_completed_document_package: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def generate_document_package(
    document: dict,
    recipient: dict,
    sender_name: str,
    sender_email: str,
    sender_organization: str,
    platform_name: str,
    logo_url: str = None
) -> dict:
    """
    Generate a ZIP package containing:
    1. Signed document
    2. Document summary
    3. Certificate of completion
    4. Original document
    """
    try:
        document_id = document["_id"]
        recipient_id = recipient["_id"]
        envelope_id = document.get("envelope_id", "unknown")
        
        # Safe filename base
        safe_doc_name = re.sub(r'[^\w\s-]', '', document.get('filename', 'document'))
        base_name = safe_doc_name.rsplit('.', 1)[0][:40]
        recipient_name = re.sub(r'[^\w\s-]', '', recipient.get('name', 'recipient'))[:20]
        
        zip_filename = f"{platform_name}_Package_{envelope_id}_{recipient_name}.zip"
        
        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            
            # 1. Get and add SIGNED DOCUMENT
            signed_pdf_path = document.get("signed_pdf_path") or document.get("pdf_file_path")
            if signed_pdf_path:
                try:
                    from storage import storage
                    signed_pdf_bytes = storage.download(signed_pdf_path)
                    signed_filename = f"signed_{base_name}.pdf"
                    zip_file.writestr(signed_filename, signed_pdf_bytes)
                    print(f"✅ Added signed document: {signed_filename}")
                except Exception as e:
                    print(f"❌ Error adding signed document: {e}")
            
            # 2. Get and add ORIGINAL DOCUMENT
            original_pdf_path = document.get("pdf_file_path")
            if original_pdf_path and original_pdf_path != signed_pdf_path:
                try:
                    from storage import storage
                    original_pdf_bytes = storage.download(original_pdf_path)
                    original_filename = f"original_{base_name}.pdf"
                    zip_file.writestr(original_filename, original_pdf_bytes)
                    print(f"✅ Added original document: {original_filename}")
                except Exception as e:
                    print(f"❌ Error adding original document: {e}")
            
            # 3. Generate and add DOCUMENT SUMMARY
            try:
                summary_data = await prepare_summary_data(document, recipient)
                summary_pdf_bytes = SafeSignSummaryEngine.create_document_summary_pdf(summary_data)
                summary_filename = f"summary_{base_name}.pdf"
                zip_file.writestr(summary_filename, summary_pdf_bytes)
                print(f"✅ Added document summary: {summary_filename}")
            except Exception as e:
                print(f"❌ Error generating summary: {e}")
            
            # 4. Generate and add CERTIFICATE OF COMPLETION
            try:
                certificate_data = await prepare_certificate_data(document, recipient)
                certificate_pdf_bytes = SafeSignCertificateEngine.create_certificate_pdf(certificate_data)
                certificate_filename = f"certificate_{base_name}.pdf"
                zip_file.writestr(certificate_filename, certificate_pdf_bytes)
                print(f"✅ Added certificate: {certificate_filename}")
            except Exception as e:
                print(f"❌ Error generating certificate: {e}")
            
            # 5. Add README file with information
            readme_content = f"""DOCUMENT PACKAGE - {platform_name}

Document: {document.get('filename', 'Unknown')}
Envelope ID: {envelope_id}
Recipient: {recipient.get('name', 'Unknown')} ({recipient.get('email', 'Unknown')})
Role: {recipient.get('role', 'signer').replace('_', ' ').title()}
Completion Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}

This package contains:
1. Signed Document - The final signed version with all signatures
2. Original Document - The original unsigned document
3. Document Summary - Detailed summary of all fields and signatures
4. Certificate of Completion - Official certificate with audit trail

Generated by {platform_name} on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
For questions, contact: {sender_email}
"""
            zip_file.writestr("README.txt", readme_content)
        
        zip_buffer.seek(0)
        
        return {
            "zip_bytes": zip_buffer.getvalue(),
            "zip_filename": zip_filename
        }
        
    except Exception as e:
        print(f"❌ Error generating document package: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


async def prepare_summary_data(document: dict, recipient: dict) -> dict:
    """Prepare data for document summary PDF"""
    try:
        document_id = document["_id"]
        recipient_id = recipient["_id"]
        
        # Get all recipients
        all_recipients = list(db.recipients.find({
            "document_id": document_id
        }).sort("signing_order", 1))
        
        # Get all fields
        all_fields = list(db.signature_fields.find({
            "document_id": document_id
        }))
        
        # Get fields assigned to this recipient
        recipient_fields = [f for f in all_fields if str(f.get("recipient_id")) == str(recipient_id)]
        
        # Get document timeline
        timeline = list(db.document_timeline.find({
            "document_id": document_id
        }).sort("timestamp", -1).limit(20))
        
        # Get document owner info
        owner = db.users.find_one({"_id": document.get("owner_id")})
        owner_name = owner.get("full_name") or owner.get("name") or document.get("owner_email", "") if owner else document.get("owner_email", "")
        
        # Format dates
        created_date = document.get("uploaded_at")
        created_date_str = created_date.strftime("%B %d, %Y") if created_date else "Unknown"
        
        completed_date = document.get("completed_at") or document.get("finalized_at")
        completed_date_str = completed_date.strftime("%B %d, %Y at %I:%M %p") if completed_date else "Not completed"
        
        # Prepare assigned fields
        assigned_fields = []
        signature_value = None
        initials_value = None
        has_initials_field = False
        
        for field in recipient_fields:
            field_type = field.get("type", "unknown")
            completed = field.get("completed_at") is not None
            
            if field_type in ['signature', 'witness_signature'] and completed:
                signature_value = field.get("value")
            elif field_type == 'initials':
                has_initials_field = True
                if completed:
                    initials_value = field.get("value")
            
            value = field.get("value", "")
            if isinstance(value, dict):
                if "image" in value:
                    value = "[Signature captured]"
                elif "value" in value:
                    value = value["value"]
            
            completed_at = None
            if completed and field.get("completed_at"):
                completed_at = field["completed_at"].strftime("%Y-%m-%d %H:%M")
            
            assigned_fields.append({
                "type": field_type,
                "page": field.get("page", 0),
                "completed": completed,
                "value": value,
                "raw_value": field.get("value"),
                "completed_at": completed_at,
                "required": field.get("required", True),
                "label": field.get("label", "")
            })
        
        # Prepare participants data
        participants = []
        for r in all_recipients:
            completion_time = None
            if r.get("signed_at"):
                completion_time = r["signed_at"].strftime("%Y-%m-%d")
            elif r.get("approved_at"):
                completion_time = r["approved_at"].strftime("%Y-%m-%d")
            
            r_fields = [f for f in all_fields if str(f.get("recipient_id")) == str(r["_id"])]
            r_completed = len([f for f in r_fields if f.get("completed_at")])
            
            participants.append({
                "name": r.get("name", "Unknown"),
                "email": r.get("email", ""),
                "role": r.get("role", "signer"),
                "status": r.get("status", "pending"),
                "completed_at": completion_time,
                "signing_order": r.get("signing_order", 1)
            })
        
        # Prepare activity timeline
        recent_activity = []
        for event in timeline[:15]:
            actor = event.get("actor", {})
            participant_name = actor.get("name") or actor.get("email") or "System"
            
            event_date = event.get("timestamp")
            if event_date:
                event_date = event_date.strftime("%Y-%m-%d %H:%M")
            
            recent_activity.append({
                "date": event_date,
                "event": event.get("title", event.get("action", "Activity")),
                "participant": participant_name,
                "details": event.get("description", "")
            })
        
        # Current recipient completion
        current_recipient_completed = None
        if recipient.get("signed_at"):
            current_recipient_completed = recipient["signed_at"].isoformat()
        elif recipient.get("approved_at"):
            current_recipient_completed = recipient["approved_at"].isoformat()
        
        # Calculate statistics
        total_fields = len(all_fields)
        completed_fields = len([f for f in all_fields if f.get("completed_at")])
        
        summary_data = {
            "envelope_id": document.get("envelope_id", "N/A"),
            "document_name": document.get("filename", "Untitled Document"),
            "document_status": document.get("status", "unknown"),
            "created_date": created_date_str,
            "completed_date": completed_date_str,
            "total_pages": document.get("page_count", 0),
            "owner_name": owner_name,
            "owner_email": document.get("owner_email", "Unknown"),
            
            "current_recipient": {
                "name": recipient.get("name", "Unknown"),
                "email": recipient.get("email", ""),
                "role": recipient.get("role", "signer"),
                "status": recipient.get("status", "pending"),
                "completed_at": current_recipient_completed,
                "ip_address": recipient.get("signed_ip") or recipient.get("completed_ip", "Unknown"),
                "otp_verified": recipient.get("otp_verified", False),
                "terms_accepted": recipient.get("terms_accepted", False),
                "signature_value": signature_value,
                "initials_value": initials_value,
                "has_initials_field": has_initials_field
            },
            
            "assigned_fields": assigned_fields,
            "all_recipients": participants,
            
            "statistics": {
                "total_recipients": len(all_recipients),
                "completed_recipients": len([r for r in all_recipients if r.get("status") == "completed"]),
                "total_fields": total_fields,
                "completed_fields": completed_fields,
                "completion_percentage": round((completed_fields / total_fields * 100), 1) if total_fields > 0 else 0,
                "assigned_to_you": len(recipient_fields),
                "completed_by_you": len([f for f in recipient_fields if f.get("completed_at")])
            },
            
            "recent_activity": recent_activity,
            
            "summary_id": f"SUM-{uuid.uuid4().hex[:8].upper()}-{datetime.utcnow().strftime('%Y%m%d')}",
            "generated_at": datetime.utcnow().isoformat(),
            "generated_by": recipient.get("email", "unknown"),
            "platform": "SafeSign Professional"
        }
        
        return summary_data
        
    except Exception as e:
        print(f"❌ Error preparing summary data: {str(e)}")
        # Return minimal summary data as fallback
        return {
            "envelope_id": document.get("envelope_id", "N/A"),
            "document_name": document.get("filename", "Unknown"),
            "document_status": document.get("status", "unknown"),
            "created_date": "Unknown",
            "completed_date": "Unknown",
            "total_pages": document.get("page_count", 0),
            "owner_name": "Unknown",
            "owner_email": document.get("owner_email", "Unknown"),
            "current_recipient": {
                "name": recipient.get("name", "Unknown"),
                "email": recipient.get("email", ""),
                "role": recipient.get("role", "signer"),
                "status": recipient.get("status", "pending"),
                "signature_value": None,
                "initials_value": None,
                "has_initials_field": False
            },
            "assigned_fields": [],
            "all_recipients": [],
            "statistics": {},
            "recent_activity": [],
            "summary_id": f"SUM-{uuid.uuid4().hex[:8].upper()}",
            "generated_at": datetime.utcnow().isoformat(),
            "generated_by": recipient.get("email", "unknown"),
            "platform": "SafeSign"
        }


async def prepare_certificate_data(document: dict, recipient: dict) -> dict:
    """Prepare data for certificate of completion PDF"""
    try:
        document_id = document["_id"]
        
        # Get all recipients
        all_recipients = list(db.recipients.find({
            "document_id": document_id
        }).sort("signing_order", 1))
        
        # Get all fields
        all_fields = list(db.signature_fields.find({
            "document_id": document_id
        }))
        
        # Get completed fields
        completed_fields = [f for f in all_fields if f.get("completed_at")]
        
        # Get document owner
        owner = db.users.find_one({"_id": document.get("owner_id")})
        owner_name = owner.get("full_name") or owner.get("name") or document.get("owner_email", "") if owner else document.get("owner_email", "")
        
        # Get sender IP
        sender_ip = "Unknown"
        sent_log = db.document_timeline.find_one({
            "document_id": document_id,
            "action": "upload_document"
        })
        if sent_log and sent_log.get("metadata"):
            sender_ip = sent_log["metadata"].get("ip") or sent_log.get("metadata", {}).get("ip_address", "Unknown")
        
        # Calculate statistics
        total_signatures = len([f for f in all_fields if f.get("type") in ["signature", "witness_signature"]])
        completed_signatures = len([f for f in completed_fields if f.get("type") in ["signature", "witness_signature"]])
        
        # Format dates
        created_date = document.get("uploaded_at")
        created_date_str = created_date.strftime("%B %d, %Y at %I:%M:%S %p") if created_date else "Unknown"
        
        completed_date = document.get("completed_at") or document.get("finalized_at")
        completed_date_str = completed_date.strftime("%B %d, %Y at %I:%M:%S %p") if completed_date else "Unknown"
        
        # Prepare recipients data
        recipients_data = []
        for r in all_recipients:
            completion_timestamp = None
            completion_ip = "Unknown"
            
            role = r.get("role", "signer")
            if role == "signer" or role == "in_person_signer":
                completion_timestamp = r.get("signed_at")
                completion_ip = r.get("signed_ip", r.get("completed_ip", "Unknown"))
            elif role == "approver":
                completion_timestamp = r.get("approved_at")
                completion_ip = r.get("approved_ip", r.get("completed_ip", "Unknown"))
            
            recipients_data.append({
                "name": r.get("name", "Unknown"),
                "email": r.get("email", "No email"),
                "role": role,
                "status": r.get("status", "pending"),
                "completed_at": completion_timestamp.strftime("%Y-%m-%d %H:%M:%S") if completion_timestamp else None,
                "ip_address": completion_ip,
                "signing_order": r.get("signing_order", 0),
                "otp_verified": r.get("otp_verified", False)
            })
        
        # Generate certificate ID
        certificate_id = f"CERT-{document.get('envelope_id', uuid.uuid4().hex[:8])}-{datetime.utcnow().strftime('%Y%m%d')}"
        
        certificate_data = {
            "envelope_id": document.get("envelope_id", "N/A"),
            "document_name": document.get("filename", "Unknown Document"),
            "document_id": str(document["_id"]),
            "page_count": document.get("page_count", 0),
            
            "created_date": created_date_str,
            "sent_date": created_date_str,
            "completed_date": completed_date_str,
            
            "owner_name": owner_name,
            "owner_email": document.get("owner_email", "Unknown"),
            "owner_ip": sender_ip,
            
            "statistics": {
                "total_recipients": len(all_recipients),
                "completed_recipients": len([r for r in all_recipients if r.get("status") == "completed"]),
                "total_fields": len(all_fields),
                "completed_fields": len(completed_fields),
                "completion_percentage": round((len(completed_fields) / len(all_fields) * 100), 1) if all_fields else 0,
                "total_signatures": total_signatures,
                "signatures_completed": completed_signatures,
            },
            
            "recipients": recipients_data,
            "field_history": [],
            
            "certificate_id": certificate_id,
            "generated_at": datetime.utcnow().isoformat(),
            "generated_by": recipient.get("email", "unknown"),
            "generated_by_name": recipient.get("name", "Unknown Recipient"),
            "platform": "SafeSign Professional"
        }
        
        return certificate_data
        
    except Exception as e:
        print(f"❌ Error preparing certificate data: {str(e)}")
        return {
            "envelope_id": document.get("envelope_id", "N/A"),
            "document_name": document.get("filename", "Unknown"),
            "page_count": document.get("page_count", 0),
            "created_date": "Unknown",
            "completed_date": "Unknown",
            "owner_name": "Unknown",
            "owner_email": document.get("owner_email", "Unknown"),
            "statistics": {},
            "recipients": [],
            "certificate_id": f"CERT-{uuid.uuid4().hex[:8]}",
            "generated_at": datetime.utcnow().isoformat(),
            "generated_by": recipient.get("email", "unknown"),
            "platform": "SafeSign"
        }


def send_package_email(
    recipient_email: str,
    recipient_name: str,
    document: dict,
    zip_bytes: bytes,
    zip_filename: str,
    sender_name: str,
    sender_email: str,
    sender_organization: str,
    platform_name: str,
    logo_url: str = None
) -> bool:
    """
    Send email with ZIP attachment containing all signed documents
    """
    try:
        current_year = datetime.now().strftime('%Y')
        document_name = document.get("filename", "Document")
        envelope_id = document.get("envelope_id", "")
        
        completed_at = document.get("completed_at", datetime.utcnow())
        if isinstance(completed_at, datetime):
            completed_date = completed_at.strftime("%B %d, %Y")
        else:
            completed_date = str(completed_at)[:10]
        
        subject = f"✅ Document Package: {document_name} - All Signed Documents"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Document Package: {document_name}</title>
            <style>
                body {{
                    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #374151;
                    margin: 0;
                    padding: 0;
                    background-color: #f9fafb;
                }}
                .email-wrapper {{
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                }}
                .brand-header {{
                    text-align: center;
                    padding: 30px 20px 20px 20px;
                    background: #ffffff;
                }}
                .brand-logo {{
                    height: 70px;
                }}
                .platform-name {{
                    font-size: 18px;
                    font-weight: 600;
                    color: #0d9488;
                    margin: 0 0 6px 0;
                }}
                .document-header {{
                    background: #0d9488;
                    color: white;
                    padding: 24px 30px;
                    text-align: center;
                }}
                .document-title {{
                    font-size: 20px;
                    font-weight: 500;
                    margin: 0 0 12px 0;
                }}
                .content-section {{
                    padding: 30px;
                }}
                .info-grid {{
                    background: #f8fafc;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }}
                .info-table {{
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                }}
                .info-table td {{
                    padding: 10px 0;
                    border-bottom: 1px solid #e5e7eb;
                }}
                .info-label {{
                    color: #6b7280;
                    width: 160px;
                    vertical-align: top;
                }}
                .info-value {{
                    color: #374151;
                    font-weight: 500;
                }}
                .package-section {{
                    background: #ecfdf5;
                    border: 2px solid #a7f3d0;
                    border-radius: 12px;
                    padding: 24px;
                    margin: 24px 0;
                    text-align: center;
                }}
                .package-icon {{
                    font-size: 48px;
                    margin-bottom: 16px;
                }}
                .package-contents {{
                    background: #f0fdfa;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                    text-align: left;
                }}
                .package-contents ul {{
                    list-style-type: none;
                    padding-left: 0;
                }}
                .package-contents li {{
                    padding: 8px 0;
                    border-bottom: 1px solid #e5e7eb;
                }}
                .package-contents li:last-child {{
                    border-bottom: none;
                }}
                .file-icon {{
                    font-size: 18px;
                    margin-right: 10px;
                }}
                .footer {{
                    background-color: #000;
                    color: #fff;
                    padding: 30px 20px;
                }}
                .footer-content {{
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }}
                .footer-left {{
                    flex: 1;
                    padding-right: 15px;
                }}
                .footer-logo {{
                    height: 40px;
                    margin-bottom: 10px;
                }}
                .footer-tagline {{
                    font-size: 13px;
                    color: #bbb;
                    margin: 0;
                }}
                .footer-divider {{
                    width: 1px;
                    background-color: #333;
                    margin: 0 20px;
                }}
                .footer-right {{
                    flex: 1;
                    padding-left: 15px;
                }}
                .footer-links a {{
                    display: block;
                    color: #fff;
                    text-decoration: none;
                    margin-bottom: 8px;
                    font-size: 14px;
                }}
                .copyright {{
                    text-align: center;
                    font-size: 11px;
                    color: #94a3b8;
                    padding-top: 20px;
                    border-top: 1px solid #333;
                    margin-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <div class="brand-header">
                    {f'<img src="{logo_url}" alt="{platform_name}" class="brand-logo">' if logo_url else ''}
                    <div class="platform-name">{platform_name}</div>
                </div>
                
                <div class="document-header">
                    <h1 class="document-title">✅ Document Package Ready</h1>
                </div>
                
                <div class="content-section">
                    <h2>Hello {recipient_name},</h2>
                    <p>The document you were involved with has been successfully signed and completed.</p>
                    
                    <div class="info-grid">
                        <table class="info-table">
                            <tr>
                                <td class="info-label"><strong>Document</strong></td>
                                <td class="info-value">{document_name}</td>
                            </tr>
                            {f'<tr><td class="info-label"><strong>Envelope ID</strong></td><td class="info-value">{envelope_id}</td></tr>' if envelope_id else ''}
                            <tr>
                                <td class="info-label"><strong>Completed On</strong></td>
                                <td class="info-value">{completed_date}</td>
                            </tr>
                            <tr>
                                <td class="info-label"><strong>Sender</strong></td>
                                <td class="info-value">{sender_email}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div class="package-section">
                        <div class="package-icon">📦</div>
                        <h3 style="margin: 0 0 10px 0; color: #059669;">Complete Document Package</h3>
                        <p style="margin-bottom: 20px;">Your ZIP file contains all signed documents and certificates</p>
                        
                        <div class="package-contents">
                            <h4 style="margin-top: 0; color: #0d9488;">Package Contents:</h4>
                            <ul>
                                <li><span class="file-icon">📄</span> Signed Document - Final signed version</li>
                                <li><span class="file-icon">📄</span> Original Document - Unsigned original</li>
                                <li><span class="file-icon">📊</span> Document Summary - Detailed field summary</li>
                                <li><span class="file-icon">🏆</span> Certificate of Completion - Official certificate</li>
                                <li><span class="file-icon">📝</span> README.txt - Package information</li>
                            </ul>
                        </div>
                        
                        <p style="margin: 20px 0;">
                            <strong>📎 The ZIP file is attached to this email.</strong>
                        </p>
                    </div>
                    
                    <div style="margin: 20px 0; padding: 15px; background: #e0f2fe; border-radius: 8px;">
                        <p style="margin: 0; color: #0369a1;">
                            <strong>Note:</strong> All documents in this package are legally binding and ready for your records.
                            The ZIP file contains everything you need for documentation and audit purposes.
                        </p>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="footer-content">
                        <div class="footer-left">
                            {f'<img src="{logo_url}" alt="{platform_name}" class="footer-logo">' if logo_url else ''}
                            <p class="footer-tagline">Secure electronic signatures powered by AI</p>
                        </div>
                        
                        <div class="footer-divider"></div>
                        
                        <div class="footer-right">
                            <div class="footer-links">
                                <a href="{FRONTEND_URL}">Home</a>
                                <a href="{FRONTEND_URL}/aboutus">About Us</a>
                                <a href="{FRONTEND_URL}/contactus">Contact</a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="copyright">
                        © {current_year} {platform_name}. All rights reserved.<br>
                        This is an automated message — please do not reply.
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Create email message
        msg = MIMEMultipart()
        msg["From"] = EMAIL_FROM
        msg["To"] = recipient_email
        msg["Subject"] = subject
        
        # Attach HTML body
        msg.attach(MIMEText(html_content, "html"))
        
        # Attach ZIP file
        zip_attachment = MIMEApplication(zip_bytes, _subtype="zip")
        zip_attachment.add_header(
            "Content-Disposition",
            "attachment",
            filename=zip_filename
        )
        msg.attach(zip_attachment)
        
        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ Sent document package to {recipient_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send package to {recipient_email}: {str(e)}")
        return False