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
from typing import Optional, List, Union

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.utils import ImageReader

from database import db
from config import SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, EMAIL_FROM, FRONTEND_URL, BACKEND_URL
from storage import storage  # Import Azure storage provider

from fastapi import APIRouter, BackgroundTasks, Depends, Request
router = APIRouter()

# Note: GridFS is removed - we now use Azure Blob Storage

# ======================
# PROFESSIONAL DOCUSIGN-STYLE SUMMARY ENGINE
# ======================

class SafeSignSummaryEngine:
    """Professional document summary generator - DocuSign inspired green, black & white design"""
    
    # Brand color palette - Professional DocuSign Style
    BRAND_PRIMARY = "#00A3A3"      # Primary Teal
    BRAND_SECONDARY = "#1A1A1A"    # Text Black
    BRAND_ACCENT = "#008a8a"       # Deep Teal
    BRAND_LIGHT = "#F0F9F9"        # Soft Teal Bg
    
    # Status colors
    SUCCESS = "#2E7D32"            # Success Green
    SUCCESS_LIGHT = "#E8F5E9"      # Light Green Bg
    WARNING = "#ED6C02"            # Warning Orange
    WARNING_LIGHT = "#FFF4E5"      # Light Orange Bg
    INFO = "#0288D1"               # Info Blue
    INFO_LIGHT = "#E1F5FE"         # Light Blue Bg
    VOID = "#4A4A4A"               # Text Gray
    VOID_LIGHT = "#FAFAFA"         # Light Gray Bg
    
    # Neutral colors - professional black & white scale
    GRAY_50 = "#FAFAFA"      # Light Gray Bg
    GRAY_100 = "#F5F5F5"
    GRAY_200 = "#EEEEEE"
    GRAY_300 = "#E0E0E0"
    GRAY_400 = "#BDBDBD"
    GRAY_600 = "#4A4A4A"      # Text Gray
    GRAY_700 = "#616161"
    GRAY_800 = "#424242"
    GRAY_900 = "#212121"
    BLACK = "#1A1A1A"        # Text Black
    WHITE = "#FFFFFF"

    @staticmethod
    def _get_branding_data():
        """Retrieve logo and platform name from DB/Azure"""
        branding = db.branding.find_one({})
        logo_img = None
        platform_name = "SafeSign"
        tagline = "Secure Digital Signatures"
        
        if branding:
            platform_name = branding.get("platform_name", platform_name)
            tagline = branding.get("tagline", tagline)
            logo_path = branding.get("logo_file_path")
            if logo_path:
                try:
                    logo_bytes = storage.download(logo_path)
                    logo_img = ImageReader(io.BytesIO(logo_bytes))
                except Exception as e:
                    print(f"Error loading logo for PDF: {e}")
        
        return logo_img, platform_name, tagline
    
    @staticmethod
    def create_header(canvas, doc, title="DOCUMENT SUMMARY", envelope_id=None, logo_img=None, platform_name="SafeSign", tagline="Secure Digital Signatures"):
        """Professional Header - Absolute positioning to avoid content overlap"""
        canvas.saveState()
        
        PAGE_WIDTH, PAGE_HEIGHT = A4
        HEADER_BASE = PAGE_HEIGHT - 95
        
        # Header background rect - Top of page
        canvas.setFillColor(colors.HexColor(SafeSignSummaryEngine.WHITE))
        canvas.rect(0, HEADER_BASE, PAGE_WIDTH, 95, fill=1, stroke=0)

        # Teal top accent bar
        canvas.setFillColor(colors.HexColor(SafeSignSummaryEngine.BRAND_PRIMARY))
        canvas.rect(0, PAGE_HEIGHT - 4, PAGE_WIDTH, 4, fill=1, stroke=0)

        # Subtle teal divider - Bottom of header area
        canvas.setStrokeColor(colors.HexColor(SafeSignSummaryEngine.BRAND_PRIMARY))
        canvas.setLineWidth(1.25)
        canvas.line(40, HEADER_BASE, PAGE_WIDTH - 40, HEADER_BASE)

        # Dynamic Logo Positioning
        text_x_offset = 40
        if logo_img:
            try:
                logo_size = 35
                canvas.drawImage(logo_img, 40, HEADER_BASE + 35, width=logo_size, height=logo_size, preserveAspectRatio=True, mask='auto')
                text_x_offset = 82
            except Exception as e:
                text_x_offset = 40

        # Branding
        canvas.setFont("Helvetica-Bold", 18)
        canvas.setFillColor(colors.HexColor(SafeSignSummaryEngine.BLACK))
        canvas.drawString(text_x_offset, HEADER_BASE + 55, platform_name)

        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(colors.HexColor(SafeSignSummaryEngine.GRAY_600))
        canvas.drawString(text_x_offset, HEADER_BASE + 42, tagline)

        # Document Title (Right)
        canvas.setFont("Helvetica-Bold", 14)
        canvas.setFillColor(colors.HexColor(SafeSignSummaryEngine.BLACK))
        canvas.drawRightString(PAGE_WIDTH - 40, HEADER_BASE + 55, title)

        # Envelope ID
        if envelope_id:
            canvas.setFont("Helvetica", 7.5)
            canvas.setFillColor(colors.HexColor(SafeSignSummaryEngine.GRAY_600))
            canvas.drawRightString(PAGE_WIDTH - 40, HEADER_BASE + 42, f"Envelope: {envelope_id}")

        canvas.restoreState()

    
    @staticmethod
    def create_footer(canvas, doc, certificate_id=None):
        """Create professional footer - clean black & white"""
        canvas.saveState()
        
        # Light gray line
        canvas.setStrokeColor(colors.HexColor(SafeSignSummaryEngine.GRAY_300))
        canvas.setLineWidth(0.5)
        canvas.line(40, 35, doc.width + 40, 35)
        
        # Footer text - Professional Format
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %I:%M:%S %p UTC")
        footer_id = f"SUM-{certificate_id[:12].upper()}" if certificate_id else "N/A"
        footer_text = f"© SafeSign | Secure Digital Signatures | Generated: {timestamp} | Summary ID: {footer_id}"
        
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(colors.HexColor(SafeSignSummaryEngine.GRAY_600))
        canvas.drawString(40, 20, footer_text)
        
        # SafeSign Branding
        canvas.setFont("Helvetica-Bold", 7)
        canvas.setFillColor(colors.HexColor(SafeSignSummaryEngine.BRAND_PRIMARY))
        canvas.drawRightString(doc.width + 40, 20, "SafeSign Verified")
        
        # Page number
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
            rightMargin=54,   # 0.75"
            leftMargin=54,    # 0.75"
            topMargin=120,    # Prevent header overlap
            bottomMargin=54,  # 0.75"
            title=f"SafeSign Summary - {summary_data.get('envelope_id', 'Document')}",
            author="SafeSign",
            subject="Document Summary"
        )
        
        styles = getSampleStyleSheet()
        story = []
        
        # Fetch platform branding
        logo_img, platform_name, tagline = SafeSignSummaryEngine._get_branding_data()
        
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
        
        # Section headers - Compressed
        styles.add(ParagraphStyle(
            name='DocuSignSection',
            parent=styles['Heading2'],
            fontSize=13,
            textColor=colors.HexColor(SafeSignSummaryEngine.BLACK),
            alignment=TA_LEFT,
            spaceBefore=10,
            spaceAfter=4,
            fontName='Helvetica-Bold',
            leading=18,
            keepWithNext=True
        ))
        
        # Sub-section headers - Compressed
        styles.add(ParagraphStyle(
            name='DocuSignSubSection',
            parent=styles['Heading3'],
            fontSize=11,
            textColor=colors.HexColor(SafeSignSummaryEngine.GRAY_700),
            alignment=TA_LEFT,
            spaceBefore=8,  # Reduced
            spaceAfter=4,   # Reduced
            fontName='Helvetica-Bold',
            leading=15,
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
            spaceAfter=3   # Reduced
        ))
        
        # Label text - Light gray
        styles.add(ParagraphStyle(
            name='DocuSignLabel',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor(SafeSignSummaryEngine.GRAY_600),
            alignment=TA_LEFT,
            fontName='Helvetica',
            leading=11,     # Reduced
            spaceAfter=1    # Reduced
        ))
        
        # Value text - Black
        styles.add(ParagraphStyle(
            name='DocuSignValue',
            parent=styles['Normal'],
            fontSize=9.5,   # Reduced
            textColor=colors.HexColor(SafeSignSummaryEngine.BLACK),
            alignment=TA_LEFT,
            fontName='Helvetica',
            leading=13,     # Reduced
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
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('RIGHTPADDING', (0, 0), (-1, -1), 15),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor(SafeSignSummaryEngine.GRAY_200)),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(envelope_bar)
        story.append(Spacer(1, 10))
        
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
        story.append(Spacer(1, 10))
        
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
        story.append(Spacer(1, 8))
        
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
            timeline_data = [
                ["Date", "Event", "Participant", "Details"]
            ]
            
            for event in timeline:
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
        
        # Professional Certificate Banner
        story.append(Spacer(1, 10))
        story.append(Paragraph("CERTIFICATE OF AUTHENTICITY", 
            ParagraphStyle('AuthTitle', fontSize=22, textColor=colors.HexColor(SafeSignSummaryEngine.BLACK), fontName='Helvetica-Bold', alignment=TA_LEFT, spaceAfter=18)))
        
        # Summary snapshot row
        summary_id = summary_data.get('summary_id', f"SUM-{uuid.uuid4().hex[:8].upper()}-{datetime.utcnow().strftime('%Y%m%d')}")
        gen_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
        snapshot_data = [
            [
                Paragraph(f"<font color='{SafeSignSummaryEngine.GRAY_600}'>Summary ID:</font> <b>{summary_id}</b>", styles['DocuSignBody']),
                Paragraph(f"<font color='{SafeSignSummaryEngine.GRAY_600}'>Generated:</font> <b>{gen_time}</b>", styles['DocuSignBody']),
                Paragraph(f"<font color='{SafeSignSummaryEngine.GRAY_600}'>Verified by:</font> <b>SafeSign Platform</b>", styles['DocuSignBody'])
            ]
        ]
        snapshot_table = Table(snapshot_data, colWidths=[180, 180, 140], hAlign='LEFT')
        snapshot_table.setStyle(TableStyle([
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('LINEBELOW', (0, 0), (-1, -1), 1, colors.HexColor(SafeSignSummaryEngine.BRAND_PRIMARY)),
        ]))
        story.append(snapshot_table)
        story.append(Spacer(1, 20))
        
        # Verification Badges - High Professional Look
        badge_style = ParagraphStyle('BadgeStyle', fontSize=10, textColor=colors.HexColor(SafeSignSummaryEngine.SUCCESS), fontName='Helvetica-Bold', leading=14)
        
        badges = [
            [Paragraph(f"<font color='{SafeSignSummaryEngine.SUCCESS}'>✔</font> Document Integrity Verified", badge_style)],
            [Paragraph(f"<font color='{SafeSignSummaryEngine.SUCCESS}'>✔</font> Electronic Consent Recorded", badge_style)],
            [Paragraph(f"<font color='{SafeSignSummaryEngine.SUCCESS}'>✔</font> Audit Trail Available", badge_style)]
        ]
        badge_table = Table(badges, colWidths=[400], hAlign='LEFT')
        badge_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(SafeSignSummaryEngine.SUCCESS_LIGHT)),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor(SafeSignSummaryEngine.SUCCESS)),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 5),
            ('TOPPADDING', (0, 2), (-1, 2), 5),
        ]))
        story.append(badge_table)
        story.append(Spacer(1, 25))

        auth_style = ParagraphStyle(
            'AuthBody',
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor("#4A4A4A"),
            fontName='Helvetica',
            spaceAfter=12
        )

        label_style = ParagraphStyle(
            'AuthLabel',
            fontSize=11,
            textColor=colors.HexColor("#1A1A1A"),
            fontName='Helvetica-Bold',
            spaceAfter=4
        )

        sections = [
            ("Platform Governance & Trust", "SafeSign is a secure digital signature platform designed to provide legally binding electronic transactions. Our infrastructure utilizes industry-standard encryption, multi-factor authentication, and tamper-evident technology to ensure document integrity throughout the lifecycle of every envelope. We adhere to stringent technical standards to maintain the highest level of trust and security for all participating parties."),
            ("Electronic Record and Signature Disclosure", "By participating in this electronic transaction, all parties acknowledge and agree to conduct transactions electronically in accordance with the SafeSign Electronic Consent Policy and applicable international laws, including the US ESIGN Act, UETA, and EU eIDAS regulations. Electronic signatures captured on this platform are legally binding and carry the same weight as traditional handwritten signatures."),
            ("Document Integrity & Immutability", "This certificate attests that the document associated with this SafeSign envelope remains in the precise state in which it existed at the time of completion. SafeSign records cryptographic evidence and system metadata designed to detect and prevent unauthorized post-signing modifications. Any alteration to the document after finalization will invalidate the recorded verification chain."),
            ("Signature Validity & Forensic Audit", "Electronic signatures captured within SafeSign are technically bound to the document content. Each signing event is recorded with high-fidelity contextual data, including precise UTC timestamps, IP addresses, and secure access tokens, forming a permanent, tamper-evident audit history for legal and compliance review."),
            ("Audit Trail & Traceability", "SafeSign maintains a comprehensive audit trail that logs every critical recipient action, including document access, field interactions, authentication challenges, and final approvals. This traceability is designed to support independent transaction review and evidentiary validation in the event of a dispute."),
            ("Account & Transaction Context", "This transaction was initiated and managed by the authorized account holder ('Sender') identified in the document metadata. SafeSign validates recipient access through secure delivery channels and secondary identity verification mechanisms where configured. All transaction logs are maintained within SafeSign's secure vault for the duration of the retention period."),
            ("Platform Security Assurance", "SafeSign applies advanced technical and organizational safeguards to protect signature data and transaction records. System controls—including data-at-rest encryption and secure transit protocols—are designed to support reliability, service continuity, and long-term evidentiary preservation."),
            ("Help, Support & Contact Information", "For technical assistance or inquiries regarding the signatures contained within this document, please contact the original sender or visit our Global Help Center at <u>support.safesign.com</u>. SafeSign provides the technical infrastructure for this transaction but is not a party to the underlying legal agreements or commercial terms between the signers."),
            ("Certificate Limitations & Legal Disclaimer", "This certificate is a system-generated summary derived from SafeSign's encrypted transaction records. It does not constitute legal advice, nor does it independently validate the ultimate legal enforceability of specific clauses under localized jurisdictions. Enforceability is subject to applicable law and the specific consent of the involved parties.")
        ]

        for i, (title, content) in enumerate(sections):
            story.append(Paragraph(title, label_style))
            story.append(Paragraph(content, auth_style))
            story.append(Spacer(1, 5))
            
            # Spacer instead of page break for continuity
            if i == 4:
                story.append(Spacer(1, 10))

        story.append(Spacer(1, 15))
        
        # ========== SENDER & ACCOUNT CONTEXT BOX ==========
        owner_name = summary_data.get('owner_name', 'Authorized Account Holder')
        owner_email = summary_data.get('owner_email', 'N/A')
        
        sender_info_data = [
            ["Transaction Origin Context", ""],
            ["Account Holder", owner_name],
            ["Email Address", owner_email],
            ["Platform Node", "SafeSign Global Architecture"],
            ["Verification Standard", "ISO/IEC 27001 Compliant Infrastructure"]
        ]
        
        sender_table = Table(sender_info_data, colWidths=[150, 350], hAlign='LEFT')
        sender_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(SafeSignSummaryEngine.GRAY_50)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor(SafeSignSummaryEngine.GRAY_900)),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor(SafeSignSummaryEngine.BRAND_PRIMARY)),
            
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TEXTCOLOR', (0, 1), (0, -1), colors.HexColor(SafeSignSummaryEngine.GRAY_700)),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(sender_table)
        story.append(Spacer(1, 15))

        # Final Branding Footer
        footer_style = ParagraphStyle('FinalFooter', fontSize=8, textColor=colors.HexColor(SafeSignSummaryEngine.GRAY_600), alignment=TA_CENTER)
        
        # Horizontal Rule
        hr_table = Table([['']], colWidths=[doc.width], hAlign='CENTER')
        hr_table.setStyle(TableStyle([
            ('LINEABOVE', (0, 0), (-1, 0), 0.5, colors.HexColor(SafeSignSummaryEngine.GRAY_300)),
        ]))
        story.append(hr_table)
        story.append(Spacer(1, 10))
        
        story.append(Paragraph(f"© SafeSign | Secure Digital Signatures", footer_style))
        story.append(Paragraph(f"Generated: {gen_time} AM UTC | Summary ID: {summary_id}", footer_style))

        # ========== BUILD PDF ==========
        def on_page(canvas, doc):
            SafeSignSummaryEngine.create_header(
                canvas, 
                doc, 
                title="DOCUMENT SUMMARY",
                envelope_id=summary_data.get('envelope_id'),
                logo_img=logo_img,
                platform_name=platform_name,
                tagline=tagline
            )
            SafeSignSummaryEngine.create_footer(
                canvas, 
                doc,
                certificate_id=summary_id
            )

        try:
            doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
        except Exception as e:
            print(f"Error building PDF: {e}")
            return SafeSignSummaryEngine._create_fallback_pdf(summary_data)
        
        buffer.seek(0)
        return buffer.getvalue()
    
    @staticmethod
    def _create_fallback_pdf(summary_data):
        """
        High-Fidelity Enterprise Fallback PDF - Professional Edition.
        Used when the complex Platypus layout engine fails or for quick rendering.
        Provides a dense, professional summary of the document lifecycle.
        """
        buffer = io.BytesIO()
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from datetime import datetime
        
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        
        # --- BRAND COLORS ---
        TEAL = colors.HexColor("#0D9488")
        DARK = colors.HexColor("#1F2937")
        GRAY_TEXT = colors.HexColor("#4B5563")
        GRAY_BG = colors.HexColor("#F9FAFB")
        GRAY_BORDER = colors.HexColor("#E5E7EB")
        WHITE = colors.white
        
        # 1. PREMIUM HEADER
        c.setFillColor(TEAL)
        c.rect(0, height - 80, width, 80, fill=1, stroke=0)
        
        # Platform Info
        c.setFont("Helvetica-Bold", 24)
        c.setFillColor(WHITE)
        c.drawString(50, height - 45, "SafeSign")
        
        c.setFont("Helvetica", 9)
        c.setFillColor(WHITE)
        c.drawString(50, height - 60, "Official Document Completion Summary")
        
        # Right Header - Status Badge
        status = summary_data.get('document_status', 'Pending').upper()
        c.setFont("Helvetica-Bold", 12)
        c.drawRightString(width - 50, height - 45, "STATUS: " + status)
        
        gen_time = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
        c.setFont("Helvetica", 8)
        c.drawRightString(width - 50, height - 60, f"Generated: {gen_time}")
        
        # 2. ENVELOPE SUMMARY CARD
        card_y = height - 200
        c.setFillColor(GRAY_BG)
        c.setStrokeColor(GRAY_BORDER)
        c.roundRect(50, card_y, width - 100, 100, 4, fill=1, stroke=1)
        
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(DARK)
        c.drawString(65, card_y + 80, "ENVELOPE INFORMATION")
        
        # Envelope Data Points
        details = [
            ("Document Name", summary_data.get('document_name', 'N/A')),
            ("Envelope ID", summary_data.get('envelope_id', 'N/A')),
            ("Sender", f"{summary_data.get('owner_name', 'N/A')} ({summary_data.get('owner_email', 'N/A')})"),
            ("Completed At", summary_data.get('completed_date', 'In Progress'))
        ]
        
        y_off = card_y + 60
        for label, val in details:
            c.setFont("Helvetica-Bold", 9)
            c.setFillColor(GRAY_TEXT)
            c.drawString(65, y_off, label + ":")
            
            c.setFont("Helvetica", 9)
            c.setFillColor(DARK)
            c.drawString(160, y_off, str(val)[:75])
            y_off -= 16
            
        # 3. PARTICIPANTS LIST
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(DARK)
        c.drawString(50, card_y - 30, "Document Participants")
        
        # Table Header
        table_y = card_y - 50
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(GRAY_TEXT)
        c.drawString(50, table_y, "NAME / EMAIL")
        c.drawString(280, table_y, "ROLE")
        c.drawString(380, table_y, "STATUS")
        c.drawString(480, table_y, "ACTION DATE")
        
        c.setStrokeColor(TEAL)
        c.setLineWidth(1)
        c.line(50, table_y - 5, width - 50, table_y - 5)
        
        # Draw Participants (limit to 6 for space)
        participants = summary_data.get('all_recipients', [])
        curr_y = table_y - 20
        for p in participants[:6]:
            c.setFont("Helvetica", 8.5)
            c.setFillColor(DARK)
            name_text = f"{p.get('name', 'N/A')}"
            email_text = f"{p.get('email', 'N/A')}"
            
            c.drawString(50, curr_y, name_text[:40])
            c.setFont("Helvetica-Oblique", 7.5)
            c.setFillColor(GRAY_TEXT)
            c.drawString(50, curr_y - 10, email_text[:45])
            
            c.setFont("Helvetica", 8.5)
            c.setFillColor(DARK)
            c.drawString(280, curr_y, p.get('role', 'signer').title())
            
            # Status badge color coding
            p_status = p.get('status', 'pending').lower()
            if p_status == 'completed': c.setFillColor(colors.HexColor("#059669"))
            elif p_status == 'declined': c.setFillColor(colors.red)
            else: c.setFillColor(GRAY_TEXT)
            
            c.drawString(380, curr_y, p_status.upper())
            
            c.setFillColor(DARK)
            c.drawString(480, curr_y, str(p.get('completed_at') or 'Pending'))
            
            curr_y -= 25
            
        # 4. AUDIT TRAIL / RECENT ACTIVITY
        trail_y = curr_y - 20
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(DARK)
        c.drawString(50, trail_y, "Audit Record & Activity History")
        
        table_y = trail_y - 20
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(GRAY_TEXT)
        c.drawString(50, table_y, "TIMESTAMP")
        c.drawString(180, table_y, "PARTICIPANT / ACTOR")
        c.drawString(350, table_y, "ACTION TAKEN")
        
        c.setStrokeColor(GRAY_BORDER)
        c.setLineWidth(0.5)
        c.line(50, table_y - 5, width - 50, table_y - 5)
        
        activity = summary_data.get('recent_activity', [])
        curr_y = table_y - 20
        for item in activity[:8]: # Last 8 events
            c.setFont("Helvetica", 8)
            c.setFillColor(DARK)
            c.drawString(50, curr_y, str(item.get('date', 'N/A')))
            c.drawString(180, curr_y, str(item.get('participant', 'System'))[:35])
            c.drawString(350, curr_y, str(item.get('event', 'Activity'))[:50])
            curr_y -= 14
            
        # 5. SECURITY & EVIDENCE
        c.setFillColor(GRAY_BG)
        c.rect(0, 0, width, 80, fill=1, stroke=0)
        
        c.setFont("Helvetica-Oblique", 7)
        c.setFillColor(GRAY_TEXT)
        legal_text = "EVIDENCE: This document contains a cryptographically verified summary of the signing process. For every signature captured, the IP address, timestamp, and authentication method were recorded. SafeSign maintains the original encrypted transaction audit logs for evidentiary purposes in compliance with global electronic signature regulations."
        
        # Wrap legal text
        text_object = c.beginText(50, 60)
        text_object.setFont("Helvetica-Oblique", 7)
        text_object.setTextRenderMode(0)
        
        # Simple wrapping
        words = legal_text.split()
        line = ""
        for word in words:
            if c.stringWidth(line + " " + word) < width - 100:
                line += " " + word
            else:
                text_object.textLine(line.strip())
                line = word
        text_object.textLine(line.strip())
        c.drawText(text_object)
        
        # Branding & Bottom Line
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(TEAL)
        c.drawString(50, 20, "SAFESIGN VERIFIED")
        
        c.setFont("Helvetica", 7)
        c.setFillColor(GRAY_TEXT)
        c.drawRightString(width - 50, 20, f"Summary ID: {summary_data.get('summary_id', 'N/A')} | Page 1 of 1")
        
        c.save()
        buffer.seek(0)
        return buffer.getvalue()



# ======================
# REDESIGNED PROFESSIONAL CERTIFICATE ENGINE - MATCHING SUMMARY STYLE
# ======================

class SafeSignCertificateEngine:
    """Professional Certificate of Completion - Matching Summary Document Style"""
    
    # Brand color palette - Professional DocuSign Style
    BRAND_PRIMARY = "#00A3A3"      # Primary Teal
    BRAND_SECONDARY = "#1A1A1A"    # Text Black
    BRAND_ACCENT = "#008a8a"       # Deep Teal
    BRAND_LIGHT = "#F0F9F9"        # Soft Teal Bg
    
    # Status colors
    SUCCESS = "#2E7D32"            # Success Green
    SUCCESS_LIGHT = "#E8F5E9"      # Light Green Bg
    WARNING = "#ED6C02"            # Warning Orange
    WARNING_LIGHT = "#FFF4E5"      # Light Orange Bg
    INFO = "#0288D1"               # Info Blue
    INFO_LIGHT = "#E1F5FE"         # Light Blue Bg
    VOID = "#4A4A4A"               # Text Gray
    VOID_LIGHT = "#FAFAFA"         # Light Gray Bg
    
    # Neutral colors - professional black & white scale
    GRAY_50 = "#FAFAFA"      # Light Gray Bg
    GRAY_100 = "#F5F5F5"
    GRAY_200 = "#EEEEEE"
    GRAY_300 = "#E0E0E0"
    GRAY_400 = "#BDBDBD"
    GRAY_600 = "#4A4A4A"      # Text Gray
    GRAY_700 = "#616161"
    GRAY_800 = "#424242"
    GRAY_900 = "#212121"
    BLACK = "#1A1A1A"        # Text Black
    WHITE = "#FFFFFF"
    
    @staticmethod
    def create_header(canvas, doc, title="CERTIFICATE OF COMPLETION", envelope_id=None, logo_img=None, platform_name="SafeSign", tagline="Secure Digital Signatures"):
        """Professional Header matching Summary Style with Absolute Positioning"""
        canvas.saveState()
        
        PAGE_WIDTH, PAGE_HEIGHT = A4
        HEADER_BASE = PAGE_HEIGHT - 95
        
        # White header background
        canvas.setFillColor(colors.HexColor(SafeSignCertificateEngine.WHITE))
        canvas.rect(0, HEADER_BASE, PAGE_WIDTH, 95, fill=1, stroke=0)
        
        # Teal top accent bar
        canvas.setFillColor(colors.HexColor(SafeSignCertificateEngine.BRAND_PRIMARY))
        canvas.rect(0, PAGE_HEIGHT - 4, PAGE_WIDTH, 4, fill=1, stroke=0)
        
        # Subtle teal divider
        canvas.setStrokeColor(colors.HexColor(SafeSignCertificateEngine.BRAND_PRIMARY))
        canvas.setLineWidth(1.25)
        canvas.line(40, HEADER_BASE, PAGE_WIDTH - 40, HEADER_BASE)
        
        # Dynamic Logo Positioning
        text_x_offset = 40
        if logo_img:
            try:
                logo_size = 35
                canvas.drawImage(logo_img, 40, HEADER_BASE + 35, width=logo_size, height=logo_size, preserveAspectRatio=True, mask='auto')
                text_x_offset = 82
            except Exception as e:
                text_x_offset = 40
        
        # Branding
        canvas.setFont("Helvetica-Bold", 20)
        canvas.setFillColor(colors.HexColor(SafeSignCertificateEngine.BLACK))
        canvas.drawString(text_x_offset, HEADER_BASE + 55, platform_name)
        
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(colors.HexColor(SafeSignCertificateEngine.GRAY_600))
        canvas.drawString(text_x_offset, HEADER_BASE + 42, tagline)
        
        # Certificate Title (Right)
        canvas.setFont("Helvetica-Bold", 15)
        canvas.setFillColor(colors.HexColor(SafeSignCertificateEngine.BLACK))
        canvas.drawRightString(PAGE_WIDTH - 40, HEADER_BASE + 55, title)
        
        if envelope_id:
            canvas.setFont("Helvetica", 7.5)
            canvas.setFillColor(colors.HexColor(SafeSignCertificateEngine.GRAY_600))
            canvas.drawRightString(PAGE_WIDTH - 40, HEADER_BASE + 42, f"Envelope: {envelope_id}")
        
        canvas.restoreState()
    
    @staticmethod
    def create_footer(canvas, doc, certificate_id=None):
        """Create professional footer matching summary style"""
        canvas.saveState()
        
        # Light gray separator line
        canvas.setStrokeColor(colors.HexColor(SafeSignCertificateEngine.GRAY_300))
        canvas.setLineWidth(0.5)
        canvas.line(40, 35, doc.width + 40, 35)
        
        # Footer text - Professional Format
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %I:%M:%S %p UTC")
        footer_id = f"SUM-{certificate_id[:12].upper()}" if certificate_id else "N/A"
        footer_text = f"© SafeSign | Secure Digital Signatures | Generated: {timestamp} | Summary ID: {footer_id}"
        
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(colors.HexColor(SafeSignCertificateEngine.GRAY_600))
        canvas.drawString(40, 20, footer_text)
        
        # SafeSign Branding
        canvas.setFont("Helvetica-Bold", 7)
        canvas.setFillColor(colors.HexColor(SafeSignCertificateEngine.BRAND_PRIMARY))
        canvas.drawRightString(doc.width + 40, 20, "SafeSign Verified")
        
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
        
        # Fetch branding
        logo_img, platform_name, tagline = SafeSignSummaryEngine._get_branding_data()
        
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=54,   # 0.75"
            leftMargin=54,    # 0.75"
            topMargin=120,    # Prevent header overlap
            bottomMargin=54,  # 0.75"
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
        
        # Section headers - Compressed
        styles.add(ParagraphStyle(
            name='CertSection',
            parent=styles['Heading2'],
            fontSize=13,
            textColor=colors.HexColor(SafeSignCertificateEngine.BLACK),
            alignment=TA_LEFT,
            spaceBefore=10,
            spaceAfter=4,
            fontName='Helvetica-Bold',
            leading=16,
            keepWithNext=True
        ))
        
        # Sub-section headers - Compressed
        styles.add(ParagraphStyle(
            name='CertSubSection',
            parent=styles['Heading3'],
            fontSize=11,
            textColor=colors.HexColor(SafeSignCertificateEngine.GRAY_700),
            alignment=TA_LEFT,
            spaceBefore=8,
            spaceAfter=4,
            fontName='Helvetica-Bold',
            leading=15,
            keepWithNext=True
        ))
        
        # Body text - Compressed
        styles.add(ParagraphStyle(
            name='CertBody',
            parent=styles['Normal'],
            fontSize=8.5,
            textColor=colors.HexColor(SafeSignCertificateEngine.GRAY_800),
            alignment=TA_LEFT,
            fontName='Helvetica',
            leading=12,
            spaceAfter=3
        ))
        
        # Label text - Compressed
        styles.add(ParagraphStyle(
            name='CertLabel',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor(SafeSignCertificateEngine.GRAY_600),
            alignment=TA_LEFT,
            fontName='Helvetica',
            leading=11,
            spaceAfter=1
        ))
        
        # Value text - Compressed
        styles.add(ParagraphStyle(
            name='CertValue',
            parent=styles['Normal'],
            fontSize=9.5,
            textColor=colors.HexColor(SafeSignCertificateEngine.BLACK),
            alignment=TA_LEFT,
            fontName='Helvetica',
            leading=13,
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
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('RIGHTPADDING', (0, 0), (-1, -1), 15),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor(SafeSignCertificateEngine.GRAY_200)),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(envelope_card)
        story.append(Spacer(1, 10))
        
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
        story.append(Spacer(1, 10))
        
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
                
                signer_table = Table(signer_data, colWidths=[80, 110, 60, 60, 100, 70], hAlign='LEFT', repeatRows=1)
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
            
            disclosure_table = Table(disclosure_data, colWidths=[110, 150, 80, 140], hAlign='LEFT', repeatRows=1)
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
        
        story.append(Spacer(1, 15))
        
        # ========== DOCUMENT ACTIVITY (RECENT ACTIVITY) ==========
        story.append(Paragraph("Document Audit History", styles['CertSection']))
        
        timeline = certificate_data.get('recent_activity', [])
        if timeline:
            activity_data = [["Date/Time", "Event", "Participant", "Details"]]
            
            for event in timeline[:25]:  # Show top 25 events in certificate
                activity_data.append([
                    Paragraph(f"<font name='Helvetica' size='8'>{event.get('date', '')}</font>", styles['CertBody']),
                    Paragraph(f"<font name='Helvetica-Bold' size='8'>{event.get('event', '')}</font>", styles['CertBody']),
                    Paragraph(f"<font name='Helvetica' size='8'>{event.get('participant', '')}</font>", styles['CertBody']),
                    Paragraph(f"<font name='Helvetica' size='8'>{event.get('details', '')}</font>", styles['CertBody']),
                ])
            
            activity_table = Table(activity_data, colWidths=[80, 100, 100, 200], hAlign='LEFT', repeatRows=1)
            activity_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(SafeSignCertificateEngine.GRAY_50)),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor(SafeSignCertificateEngine.GRAY_700)),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(SafeSignCertificateEngine.GRAY_200)),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
            ]))
            
            story.append(activity_table)
            story.append(Spacer(1, 10))
        else:
            story.append(Paragraph(
                f"<font name='Helvetica' size='11' color='{SafeSignCertificateEngine.GRAY_600}'>No document activity recorded.</font>",
                styles['Normal']
            ))

        story.append(Spacer(1, 20))
        
        # ========== FIELD COMPLETION HISTORY (if available) ==========
        field_history = certificate_data.get('field_history', [])
        if field_history:
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
                
                history_table = Table(field_history_data, colWidths=[90, 110, 50, 130, 100], hAlign='LEFT', repeatRows=1)
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
            "CERTIFICATE OF AUTHENTICITY",
            ParagraphStyle(
                'AuthTitle',
                parent=styles['Heading2'],
                fontSize=18,
                textColor=colors.HexColor(SafeSignCertificateEngine.BLACK),
                fontName='Helvetica-Bold',
                spaceBefore=10,
                spaceAfter=20,
                alignment=TA_CENTER
            )
        ))
        
        auth_style = ParagraphStyle(
            'AuthBody',
            parent=styles['Normal'],
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor(SafeSignCertificateEngine.GRAY_800),
            fontName='Helvetica',
            spaceAfter=10,
            alignment=TA_CENTER
        )
        
        # Center terms
        story.append(Paragraph("<b>Electronic Record and Signature Disclosure</b>", 
            ParagraphStyle('AuthLabelCenter', parent=styles['Normal'], fontSize=11, textColor=colors.HexColor(SafeSignCertificateEngine.BLACK), fontName='Helvetica-Bold', spaceAfter=10, alignment=TA_CENTER)))
        
        story.append(Paragraph(
            "By participating in this electronic transaction, all parties consent to receive and "
            "sign documents electronically in accordance with the <b>SafeSign Electronic Consent Policy</b>. "
            "The signatures captured represent legally binding agreements equivalent to handwritten signatures "
            "under applicable electronic transaction laws (including the ESIGN Act and UETA).",
            auth_style
        ))
        
        story.append(Spacer(1, 15))
        
        # Two-column layout for details
        sub_auth_style = ParagraphStyle('SubAuth', parent=auth_style, fontSize=8, textColor=colors.HexColor(SafeSignCertificateEngine.GRAY_700), alignment=TA_LEFT)
        
        # Extended Legal Disclosure
        disclosure_style = ParagraphStyle('CertDisclosure', parent=auth_style, fontSize=8, textColor=colors.HexColor(SafeSignCertificateEngine.GRAY_700), alignment=TA_JUSTIFY, leading=11, spaceAfter=8)
        
        story.append(Paragraph("<b>System Governance & Legal Framework</b>", ParagraphStyle('SubAuthBold', parent=sub_auth_style, fontSize=9, spaceAfter=5)))
        story.append(Paragraph(
            "SafeSign operates as a trusted third-party service provider under global electronic transaction frameworks. "
            "Our platform infrastructure is engineered for high-availability and cryptographic security, ensuring that "
            "every signature event is uniquely linked to the signer and the document content at the moment of execution. "
            "By utilizing this service, all parties acknowledge that SafeSign maintains the master audit record of this transaction.",
            disclosure_style
        ))
        
        story.append(Paragraph("<b>Sender & Account Context</b>", ParagraphStyle('SubAuthBold', parent=sub_auth_style, fontSize=9, spaceAfter=5)))
        owner_name = certificate_data.get('owner_name', 'Authorized Account Holder')
        owner_email = certificate_data.get('owner_email', 'N/A')
        story.append(Paragraph(
            f"This envelope was prepared and transmitted by <b>{owner_name}</b> ({owner_email}). "
            "The sender is responsible for the accuracy of the recipient information provided and for "
            "ensuring that the underlying document content complies with all applicable business and legal requirements. "
            "SafeSign conducts automated delivery and identity challenges as directed by the sender's configuration.",
            disclosure_style
        ))
        
        story.append(Spacer(1, 10))
        
        story.append(Spacer(1, 10))
        
        # New page title for continuation
        story.append(Paragraph("<b>Audit Evidence & Authentication Records</b>", ParagraphStyle('SubAuthBold', parent=sub_auth_style, fontSize=11, spaceAfter=15, alignment=TA_CENTER)))
        
        # Two-column layout for evidence details - Enhanced
        evidence_data = [
            [Paragraph("<b>Document Integrity</b>", sub_auth_style), Paragraph("<b>Authentication Record</b>", sub_auth_style)],
            [Paragraph("SafeSign employs multi-layered security protocols to maintain document immutability throughout the lifecycle. Any attempt to modify the completion record or signature metadata will invalidate the verification chain.", sub_auth_style),
             Paragraph("Recipient identities are validated through secure access links and secondary authentication methods (where enabled). Every action is logged with system metadata for forensic audit trails.", sub_auth_style)]
        ]
        
        ev_table = Table(evidence_data, colWidths=[240, 240])
        ev_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(ev_table)
        
        story.append(Spacer(1, 15))
        
        story.append(Paragraph("<b>Global Support & Resource Center</b>", ParagraphStyle('SubAuthBold', parent=sub_auth_style, fontSize=9, spaceAfter=5)))
        story.append(Paragraph(
            "For assistance regarding your SafeSign account, technical troubleshooting, or to report unauthorized access, "
            "please visit our Help Center at <u>support.safesign.com</u> or contact our legal compliance team at <u>legal@safesign.com</u>. "
            "Our platform support team is available 24/7 to assist with platform-specific inquiries.",
            disclosure_style
        ))

        story.append(Spacer(1, 10))
        
        story.append(Paragraph(
            "<i>This document summary is generated by SafeSign. SafeSign is not a party to the documents "
            "or transactions conducted via its platform and makes no warranties regarding the legal "
            "enforceability or specific jurisdictional requirements of individual agreements. ALL DISCLAIMERS APPLY.</i>",
            ParagraphStyle('Disclaimer', parent=auth_style, fontSize=7.5, textColor=colors.HexColor(SafeSignCertificateEngine.GRAY_600), italic=True)
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
                envelope_id=certificate_data.get('envelope_id'),
                logo_img=logo_img,
                platform_name=platform_name,
                tagline=tagline
            )
            SafeSignCertificateEngine.create_footer(
                canvas,
                doc,
                certificate_id=certificate_data.get('certificate_id')
            )
        
        def later_pages(canvas, doc):
            SafeSignCertificateEngine.create_header(
                canvas,
                doc,
                title="CERTIFICATE OF COMPLETION",
                envelope_id=certificate_data.get('envelope_id'),
                logo_img=logo_img,
                platform_name=platform_name,
                tagline=tagline
            )
            SafeSignCertificateEngine.create_footer(
                canvas,
                doc,
                certificate_id=certificate_data.get('certificate_id')
            )
        
        try:
            doc.build(story, onFirstPage=first_page, onLaterPages=later_pages)
        except Exception as e:
            print(f"Error building certificate PDF: {e}")
            return SafeSignCertificateEngine._create_fallback_pdf(certificate_data)
        
        buffer.seek(0)
        return buffer.getvalue()
    
    @staticmethod
    def _create_fallback_pdf(certificate_data):
        """Elegant Fallback Certificate PDF - Professional UI"""
        buffer = io.BytesIO()
        from reportlab.pdfgen import canvas
        
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        
        # Professional background area
        c.setFillColor(colors.HexColor(SafeSignCertificateEngine.WHITE))
        c.rect(0, 0, width, height, fill=1, stroke=0)
        
        # Heading area
        c.setFillColor(colors.HexColor(SafeSignCertificateEngine.BRAND_PRIMARY))
        c.rect(0, height - 10, width, 10, fill=1, stroke=0)
        
        c.setFont("Helvetica-Bold", 24)
        c.setFillColor(colors.HexColor(SafeSignCertificateEngine.BLACK))
        c.drawString(60, height - 60, "SafeSign")
        
        c.setFont("Helvetica-Bold", 16)
        c.drawRightString(width - 60, height - 60, "Certificate of Completion")
        
        # Main info board
        box_y = height - 280
        c.setStrokeColor(colors.HexColor(SafeSignCertificateEngine.GRAY_200))
        c.setFillColor(colors.HexColor(SafeSignCertificateEngine.GRAY_50))
        c.roundRect(60, box_y, width - 120, 180, 6, fill=1, stroke=1)
        
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(colors.HexColor(SafeSignCertificateEngine.BLACK))
        c.drawString(80, box_y + 155, "Certificate Verification Summary")
        
        details_y = box_y + 125
        details = [
            ("Document Name:", certificate_data.get('document_name', 'N/A')),
            ("Envelope ID:", certificate_data.get('envelope_id', 'N/A')),
            ("Completion Date:", certificate_data.get('completed_date', 'N/A')),
            ("Owner:", certificate_data.get('owner_name', 'N/A')),
            ("Verification ID:", certificate_data.get('certificate_id', 'N/A')[:12].upper() if certificate_data.get('certificate_id') else 'N/A')
        ]
        
        for label, val in details:
            c.setFont("Helvetica-Bold", 9.5)
            c.drawString(80, details_y, label)
            c.setFont("Helvetica", 9.5)
            c.drawString(200, details_y, str(val))
            details_y -= 20
            
        # Success Badge if COMPLETED
        c.setFillColor(colors.HexColor(SafeSignCertificateEngine.SUCCESS))
        c.setFont("Helvetica-Bold", 12)
        c.drawCentredString(width/2, box_y + 20, "✔ VERIFIED COMPLETED DOCUMENT")
        
        # Footer
        c.setFont("Helvetica", 8)
        c.setFillColor(colors.HexColor(SafeSignCertificateEngine.GRAY_600))
        c.drawString(50, 50, "Verified by SafeSign Secure Digital Signature Platform")
        
        c.save()
        buffer.seek(0)
        return buffer.getvalue()

    # Alias for compatibility with documents.py
    _create_fallback_certificate = _create_fallback_pdf


def generate_otp(length: int = 6) -> str:
    """Generate numeric OTP"""
    return ''.join(random.choices(string.digits, k=length))

from typing import Optional, Dict
from email.mime.image import MIMEImage

def get_standard_email_footer():
    """Returns the unified professional footer HTML used across all platform emails"""
    current_year = datetime.now().year
    return f"""
                        <!-- Redesigned Footer Section Exactly as Image -->
                        <tr>
                            <td style="padding: 40px 20px 30px; text-align: center; border-top: 1px solid #f1f5f9; background-color: #ffffff;">
                                <!-- Policy Links -->
                                <div style="margin-bottom: 12px;">
                                    <a href="https://safesign.devopstrio.co.uk/privacy-policy" style="color: #1e293b; text-decoration: underline; font-size: 13px; margin: 0 8px; font-weight: 500;">Privacy Policy</a>
                                    <a href="https://safesign.devopstrio.co.uk/terms-of-service" style="color: #1e293b; text-decoration: underline; font-size: 13px; margin: 0 8px; font-weight: 500;">Terms of Service</a>
                                    <a href="https://safesign.devopstrio.co.uk/cookies" style="color: #1e293b; text-decoration: underline; font-size: 13px; margin: 0 8px; font-weight: 500;">Cookie Policy</a>
                                </div>
                                <div style="margin-bottom: 30px;">
                                    <a href="https://safesign.devopstrio.co.uk/complaints" style="color: #1e293b; text-decoration: underline; font-size: 13px; margin: 0 8px; font-weight: 500;">GDPR Compliance</a>
                                    <a href="https://safesign.devopstrio.co.uk/faq" style="color: #1e293b; text-decoration: underline; font-size: 13px; margin: 0 8px; font-weight: 500;">FAQ</a>
                                </div>

                                <!-- Social Icons in Rounded Boxes (Teal Branding) -->
                                <div style="margin-bottom: 35px;">
                                    <table border="0" cellspacing="0" cellpadding="0" align="center">
                                        <tr>
                                            <td style="padding: 0 6px;">
                                                <a href="https://www.linkedin.com/company/devopstrioglobal/posts/?feedView=all" style="text-decoration: none; display: block; width: 44px; height: 40px; border: 1.2px solid #00A3A3; border-radius: 12px; line-height: 40px; text-align: center;">
                                                    <img src="https://img.icons8.com/material-rounded/24/00A3A3/linkedin--v1.png" alt="in" style="width: 20px; height: 20px; vertical-align: middle;">
                                                </a>
                                            </td>
                                            <td style="padding: 0 6px;">
                                                <a href="https://www.facebook.com/profile.php?id=61579126233218" style="text-decoration: none; display: block; width: 44px; height: 40px; border: 1.2px solid #00A3A3; border-radius: 12px; line-height: 40px; text-align: center;">
                                                    <img src="https://img.icons8.com/material-rounded/24/00A3A3/facebook-new.png" alt="f" style="width: 20px; height: 20px; vertical-align: middle;">
                                                </a>
                                            </td>
                                            <td style="padding: 0 6px;">
                                                <a href="https://www.instagram.com/devopstrio_offcl/" style="text-decoration: none; display: block; width: 44px; height: 40px; border: 1.2px solid #00A3A3; border-radius: 12px; line-height: 40px; text-align: center;">
                                                    <img src="https://img.icons8.com/material-rounded/24/00A3A3/instagram-new.png" alt="ig" style="width: 20px; height: 20px; vertical-align: middle;">
                                                </a>
                                            </td>
                                            <td style="padding: 0 6px;">
                                                <a href="https://devopstrio.co.uk/" style="text-decoration: none; display: block; width: 44px; height: 40px; border: 1.2px solid #00A3A3; border-radius: 12px; line-height: 40px; text-align: center;">
                                                    <img src="https://img.icons8.com/material-rounded/24/00A3A3/domain.png" alt="web" style="width: 20px; height: 20px; vertical-align: middle;">
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </div>

                                <!-- Copyright and Address -->
                                <div style="color: #475569; font-size: 13px; line-height: 1.5; font-weight: 500;">
                                    <p style="margin: 0;">Copyright {current_year} Devopstrio Ltd. All rights reserved.</p>
                                    <p style="margin: 0;">We are located at 128, City Road, London, EC1V 2NX</p>
                                    <p style="margin: 0;">United Kingdom</p>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Bottom Teal Bar -->
                        <tr>
                            <td align="center" style="background-color: #00A3A3; padding: 15px 20px;">
                                <p style="margin: 0; color: #ffffff; font-size: 13px; font-weight: 600; letter-spacing: 0.2px;">
                                    © {current_year} Devopstrio. All rights reserved.
                                </p>
                            </td>
                        </tr>
    """


def send_email(to_email: str, subject: str, html_content: str, images: Optional[Dict[str, bytes]] = None) -> bool:
    """Send email using SMTP with support for embedded images (CIDs)"""
    try:
        # Create message - 'related' is required for embedding images (CID)
        msg = MIMEMultipart('related')
        msg['Subject'] = subject
        
        # DYNAMIC SENDER NAME
        try:
            branding = db.branding.find_one({}) or {}
            platform_name = branding.get("platform_name", "SafeSign Team")
            if "Team" not in platform_name:
                display_name = f"{platform_name} Team"
            else:
                display_name = platform_name
                
            msg['From'] = f"{display_name} <{EMAIL_FROM if '<' not in EMAIL_FROM else EMAIL_FROM.split('<')[-1].split('>')[0]}>"
        except:
            msg['From'] = EMAIL_FROM
            
        msg['To'] = to_email
        
        # Add body part
        msg_alternative = MIMEMultipart('alternative')
        msg.attach(msg_alternative)
        msg_alternative.attach(MIMEText(html_content, 'html'))
        
        # Attach images as related parts (for CID embedding)
        if images:
            for cid, img_data in images.items():
                if img_data:
                    subtype = 'png'
                    if cid.lower().endswith('.jpg') or cid.lower().endswith('.jpeg'):
                        subtype = 'jpeg'
                    
                    msg_image = MIMEImage(img_data, _subtype=subtype)
                    msg_image.add_header('Content-ID', f'<{cid}>')
                    msg_image.add_header('Content-Disposition', 'inline', filename=f"{cid}.{subtype}")
                    msg.attach(msg_image)
        
        # Connect to SMTP server and send
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"Email sent to {to_email}")
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
    
    standard_footer = get_standard_email_footer()
    
    # Generate individual digit boxes for OTP
    otp_digits_html = "".join([f'<span class="otp-digit">{d}</span>' for d in str(otp)])
    
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
            .brand-logo {{
                height: 45px;
                width: auto;
            }}
            .platform-name {{
                font-size: 24px;
                font-weight: 800;
                color: #00A3A3;
                letter-spacing: -0.5px;
            }}
            .document-header {{
                background: #ffffff;
                color: #00A3A3;
                padding: 24px 30px;
                text-align: center;
                border-bottom: 2px solid #f1f5f9;
            }}
            .document-title {{
                font-size: 20px;
                font-weight: 500;
                margin: 0 0 12px 0;
            }}
            .role-badge {{
                display: inline-block;
                background: #f1f5f9;
                color: #00A3A3;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 14px;
                text-transform: capitalize;
                font-weight: 600;
            }}
            .content-section {{
                padding: 40px 30px;
            }}
            .greeting {{
                color: #111827;
                margin-bottom: 20px;
                font-size: 16px;
                font-weight: 700;
            }}
            .info-grid {{
                background: #f8fafc;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                border: 1px solid #e2e8f0;
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
                width: 140px;
                vertical-align: top;
            }}
            .info-value {{
                color: #374151;
                font-weight: 600;
            }}
            .otp-container {{
                text-align: center;
                margin: 35px 0;
            }}
            .otp-box {{
                display: inline-block;
                background-color: #f8fafc;
                border-radius: 16px;
                padding: 35px 25px;
                border: 1px solid #e2e8f0;
                min-width: 320px;
                text-align: center;
            }}
            .otp-digit {{ 
                display: inline-block; 
                width: 42px; 
                height: 50px; 
                line-height: 50px; 
                background: #ffffff; 
                border: 1px solid #cbd5e1; 
                border-radius: 8px; 
                margin: 0 4px; 
                font-size: 24px; 
                font-weight: 700; 
                color: #1e293b; 
                text-align: center;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }}
            .action-button {{
                display: inline-block;
                background: #00A3A3;
                color: #ffffff !important;
                text-decoration: none;
                padding: 14px 34px;
                border-radius: 8px;
                font-weight: 700;
                font-size: 16px;
                margin: 10px 0;
            }}
            @media (max-width: 480px) {{
                .content-section {{
                    padding: 25px 20px;
                }}
                .otp-box {{
                    min-width: 100%;
                }}
                .otp-code {{
                    font-size: 32px;
                    letter-spacing: 6px;
                }}
            }}
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
            <tr>
                <td align="center">
                    <table width="100%" maxWidth="600" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse; width: 100%;">
                        <!-- Header: Logo -->
                        <tr>
                            <td style="padding: 15px 25px; border-bottom: 1px solid #f1f5f9; text-align: left;">
                                <table border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="vertical-align: middle;">
                                            {f'<img src="{logo_url}" alt="{platform_name}" class="brand-logo">' if logo_url else ''}
                                        </td>
                                        <td style="vertical-align: middle; padding-left: 10px;">
                                            <span class="platform-name">{platform_name}</span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Banner -->
                        <tr>
                            <td style="padding: 0;">
                                <img 
                                    src="{BACKEND_URL}/static/email/otp-banner.png" 
                                    alt="OTP Verification" 
                                    style="width: 100%; height: auto; display: block; border: 0;"
                                />
                            </td>
                        </tr>
                        
                        <!-- Document Context Header -->
                        <tr>
                            <td class="document-header">
                                <h1 class="document-title" style="margin: 0; color: #00A3A3;">Document Verification</h1>
                                <div class="role-badge">{role.replace('_', ' ').title()}</div>
                            </td>
                        </tr>
                        
                        <!-- Main Content -->
                        <tr>
                            <td class="content-section">
                                <h2 class="greeting">Hello {recipient['name']},</h2>
                                <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #475569;">
                                    A verification attempt was detected for <strong>{document['filename']}</strong>. 
                                    Use the one-time passcode below to verify your identity and access the document.
                                </p>
                                
                                <!-- Document Info -->
                                <div class="info-grid">
                                    <table class="info-table">
                                        <tr>
                                            <td class="info-label">Document</td>
                                            <td class="info-value">{document['filename']}</td>
                                        </tr>
                                        <tr>
                                            <td class="info-label">Sender</td>
                                            <td class="info-value">
                                                <a href="mailto:{sender_email}" style="color: #00A3A3; text-decoration: none;">
                                                    {sender_name} ({sender_email})
                                                </a>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="info-label">Expires</td>
                                            <td class="info-value">24 hours from now</td>
                                        </tr>
                                    </table>
                                </div>
                                
                                <!-- OTP Display -->
                                <div class="otp-container">
                                    <div class="otp-box">
                                        <p style="margin: 0 0 15px; font-size: 12px; font-weight: 700; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase;">
                                            Your One-Time Passcode
                                        </p>
                                        <div class="otp-code-container" style="margin: 20px 0;">
                                            {otp_digits_html}
                                        </div>
                                        <p style="margin: 0; font-size: 13px; color: #64748b;">
                                            Valid for 10 Minutes &bull; Single Use Only
                                        </p>
                                    </div>
                                </div>
                                
                                <!-- Action Button -->
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="{action_url}" class="action-button">
                                        {action_button} →
                                    </a>
                                </div>
                                
                                <!-- Security Notice -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 15px;">
                                    <tr>
                                        <td style="vertical-align: top; width: 20px; padding-top: 2px;">
                                            <span style="font-size: 18px;">⚠️</span>
                                        </td>
                                        <td style="padding-left: 12px; font-size: 13px; line-height: 1.5; color: #b91c1c;">
                                            <strong>Security Notice:</strong> Never share this OTP with anyone. Our staff will never ask for your code.
                                            If you didn't request this code, please 
                                            <a href="{complaints_url}" style="color: #dc2626; font-weight: 700;">report it immediately</a>.
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        {standard_footer}
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    subject = f"{'🔐' if not is_resend else '🔁'} OTP Verification - {document['filename']}"
    return send_email(recipient['email'], subject, html_content)

def build_completion_summary_html(recipients: list) -> str:
    """Build a professional HTML table showing recipient completion status and timeline."""
    rows = ""
    for r in recipients:
        name = r.get("name", "Recipient")
        email = r.get("email", "")
        status = r.get("status", "pending").replace('_', ' ').title()
        
        # Determine completion time
        comp_time = None
        if r.get("status") == "completed":
            comp_time = r.get("completed_at") or r.get("signed_at") or r.get("approved_at") or r.get("viewer_at")
        elif r.get("status") == "declined":
            comp_time = r.get("declined_at")
            
        time_str = comp_time.strftime("%b %d, %Y %I:%M %p") if comp_time and isinstance(comp_time, datetime) else "—"
        status_color = "#059669" if r.get("status") == "completed" else ("#dc2626" if r.get("status") == "declined" else "#64748b")
        
        rows += f"""
        <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px 8px;">
                <div style="font-weight: 600; color: #1e293b;">{name}</div>
                <div style="font-size: 12px; color: #64748b;">{email}</div>
            </td>
            <td style="padding: 12px 8px; color: {status_color}; font-weight: 500;">{status}</td>
            <td style="padding: 12px 8px; color: #64748b; font-size: 12px;">{time_str}</td>
        </tr>
        """
        
    return f"""
    <div style="margin-top: 30px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff;">
        <div style="background: #f8fafc; padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 14px;">
            Document Signing Completion Summary
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
                <tr style="background: #ffffff; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">
                    <th style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0;">Participant</th>
                    <th style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0;">Status</th>
                    <th style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0;">Completion Date</th>
                </tr>
            </thead>
            <tbody>
                {rows}
            </tbody>
        </table>
    </div>
    """

def send_recipient_activity_notification_to_owner(
    recipient: dict,
    document: dict,
    status: str = "completed"
) -> bool:
    """
    Send real-time progress update email to document owner when a recipient acts.
    Supports statuses: 'completed', 'declined', 'skipped'.
    """
    try:
        # Get branding info
        branding = db.branding.find_one({}) or {}
        platform_name = branding.get("platform_name", "SafeSign")
        logo_url = f"{BACKEND_URL}/branding/logo/file" if branding.get("logo_file_path") else None
        current_year = datetime.now().strftime('%Y')
        
        # Get owner/sender info
        owner = db.users.find_one({"_id": document["owner_id"]})
        owner_email = document.get("owner_email") or (owner.get("email") if owner else "")
        if not owner_email:
            print("❌ Cannot notify owner: Owner email missing")
            return False

        recipient_name = recipient.get("name", "Recipient")
        recipient_email = recipient.get("email", "")
        document_name = document.get("filename", "Document")
        timestamp = datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC")
        
        # Status-specific formatting
        status_colors = {
            "completed": "#059669", # Green
            "declined": "#dc2626",  # Red
            "skipped": "#d97706"    # Orange
        }
        status_text = {
            "completed": "Successfully Completed Signing",
            "declined": "Declined to Sign",
            "skipped": "Skipped Signing Step"
        }
        status_emojis = {
            "completed": "✅",
            "declined": "❌",
            "skipped": "⏩"
        }
        
        color = status_colors.get(status, "#374151")
        text = status_text.get(status, status.title())
        emoji = status_emojis.get(status, "🔔")
        
        subject = f"{emoji} {recipient_name} {status.title()} Signing – {document_name}"
        
        # 4. Handle Banner (CID: banner)
        images = {}
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        banner_path = os.path.join(base_dir, "static", "email", "Progress-update.png")
        if os.path.exists(banner_path):
            try:
                with open(banner_path, "rb") as f:
                    images["banner"] = f.read()
            except Exception as e:
                print(f"Error reading activity banner: {e}")

        standard_footer = get_standard_email_footer()
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb; }}
                .brand-logo {{ height: 32px; width: auto; display: block; }}
                .brand-name {{ font-size: 24px; font-weight: 800; color: #00A3A3; letter-spacing: -0.5px; }}
                .header {{ background: #ffffff; color: #00A3A3; padding: 25px 30px; text-align: center; border-bottom: 2px solid #f1f5f9; }}
                .banner-img {{ width: 100%; height: auto; display: block; margin: 0; }}
                .content {{ padding: 30px; background: #ffffff; }}
                .status-badge {{ display: inline-block; padding: 6px 16px; border-radius: 20px; color: white; font-weight: 500; font-size: 14px; background-color: {color}; margin-bottom: 20px; }}
                .details-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }}
                .details-table td {{ padding: 12px 0; border-bottom: 1px solid #e5e7eb; }}
                .label {{ color: #6b7280; width: 140px; }}
                .value {{ font-weight: 600; color: #111827; }}
                .button {{ display: inline-block; background: #00A3A3; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 20px; }}
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
                <tr>
                    <td align="center">
                        <table width="100%" maxWidth="600" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse; width: 100%;">
                            <!-- Header: Logo -->
                            <tr>
                                <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; text-align: left;">
                                    <table border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td style="vertical-align: middle;">
                                                {f'<img src="{logo_url}" alt="{platform_name}" class="brand-logo">' if logo_url else ''}
                                            </td>
                                            <td style="vertical-align: middle; padding-left: 10px;">
                                                <span class="brand-name">{platform_name}</span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Full-Width Banner -->
                            <tr>
                                <td style="padding: 0;">
                                    <img src="cid:banner" alt="Progress Update" class="banner-img">
                                </td>
                            </tr>
                            
                            <tr>
                                <td class="header">
                                    <h1 style="margin:0; font-size: 20px; color: #00A3A3;">Signing Progress Update</h1>
                                </td>
                            </tr>
                            
                            <tr>
                                <td class="content">
                                    <div class="status-badge">{text}</div>
                                    <p style="margin-top: 0;">Hello,</p>
                                    <p>This is an automated update regarding your document <strong>{document_name}</strong>. A recipient has just updated their status.</p>
                                    
                                    <table class="details-table">
                                        <tr>
                                            <td class="label">Recipient</td>
                                            <td class="value">{recipient_name} ({recipient_email})</td>
                                        </tr>
                                        <tr>
                                            <td class="label">Status</td>
                                            <td class="value" style="color: {color};">{text}</td>
                                        </tr>
                                        <tr>
                                            <td class="label">Timestamp</td>
                                            <td class="value">{timestamp}</td>
                                        </tr>
                                        <tr>
                                            <td class="label">Document</td>
                                            <td class="value">{document_name}</td>
                                        </tr>
                                    </table>
                                    
                                    <div style="text-align: center; margin-bottom: 20px;">
                                        <a href="{FRONTEND_URL}/user/document-summary/{document['_id']}" class="button">View Document Status</a>
                                    </div>
                                </td>
                            </tr>
                            
                            {standard_footer}
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        # Check idempotency to avoid double notifications for the same status
        existing = db.document_activity.find_one({
            "document_id": document["_id"],
            "action": f"owner_notified_{status}",
            "recipient_email": recipient_email
        })
        
        if existing:
            print(f"ℹ️ Owner already notified for {status} status of {recipient_email}")
            return True
        
        # Determine receiver URL (use FRONTEND_URL from config or env)
        receiver_url = FRONTEND_URL
        if not receiver_url.startswith('http'):
            receiver_url = f"https://{receiver_url}"

        # Send email
        success = send_email(owner_email, subject, html_content, images=images)
        
        if success:
            # Log the notification in activity
            db.document_activity.insert_one({
                "document_id": document["_id"],
                "action": f"owner_notified_{status}",
                "recipient_email": recipient_email,
                "recipient_name": recipient_name,
                "owner_email": owner_email,
                "timestamp": datetime.utcnow(),
                "status_notified": status
            })
            print(f"Owner notified: {recipient_name} {status}")
            
        return success
        
    except Exception as e:
        print(f"❌ Error notifying owner of recipient activity: {str(e)}")
        return False

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
    
    # Generate individual digit boxes for OTP
    otp_digits_html = "".join([f'<span class="otp-digit">{d}</span>' for d in str(otp)])
    
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
    
    standard_footer = get_standard_email_footer()
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Action Required: {document['filename']}</title>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb; }}
            .brand-logo {{ height: 32px; width: auto; display: block; }}
            .brand-name {{ font-size: 24px; font-weight: 800; color: #00A3A3; letter-spacing: -0.5px; }}
            .document-header {{ background: #ffffff; color: #00A3A3; padding: 24px 30px; text-align: center; border-bottom: 2px solid #f1f5f9; }}
            .role-badge {{ display: inline-block; background: #f1f5f9; color: #00A3A3; padding: 6px 16px; border-radius: 20px; font-size: 14px; margin-top: 8px; font-weight: 600; }}
            .content {{ padding: 30px; background: #ffffff; }}
            .info-grid {{ background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; }}
            .info-table {{ width: 100%; border-collapse: collapse; font-size: 14px; }}
            .info-table td {{ padding: 8px 0; border-bottom: 1px solid #e5e7eb; }}
            .info-label {{ color: #6b7280; width: 160px; vertical-align: top; font-weight: 600; }}
            .info-value {{ color: #374151; }}
            .message-box {{ background: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
            .otp-box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; text-align: center; margin: 25px 0; }}
            .otp-digit {{ 
                display: inline-block; 
                width: 42px; 
                height: 50px; 
                line-height: 50px; 
                background: #ffffff; 
                border: 1px solid #cbd5e1; 
                border-radius: 8px; 
                margin: 0 4px; 
                font-size: 24px; 
                font-weight: 700; 
                color: #1e293b; 
                text-align: center;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }}
            .action-button {{ display: inline-block; background: #00A3A3; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 20px 0; }}
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
            <tr>
                <td align="center">
                    <table width="100%" maxWidth="600" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse; width: 100%;">
                        <!-- Header: Logo -->
                        <tr>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; text-align: left;">
                                <table border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="vertical-align: middle;">
                                            {f'<img src="{logo_url}" alt="{platform_name}" class="brand-logo">' if logo_url else ''}
                                        </td>
                                        <td style="vertical-align: middle; padding-left: 10px;">
                                            <span class="brand-name">{platform_name}</span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Banner Image -->
                        <tr>
                            <td style="padding: 0;">
                                <img src="{BACKEND_URL}/static/email/banner.png" alt="SafeSign Banner" style="width: 100%; height: auto; display: block; border: 0;" />
                            </td>
                        </tr>
                        
                        <!-- Document Header -->
                        <tr>
                            <td class="document-header">
                                <h1 style="margin: 0; color: #111827; font-size: 20px;">Action Required: Please Sign Document</h1>
                                <div class="role-badge">{role.replace('_', ' ').title()}</div>
                            </td>
                        </tr>
                        
                        <!-- Main Content -->
                        <tr>
                            <td class="content">
                                <h2 style="margin-top: 0; color: #111827;">Hello {recipient['name']},</h2>
                                <p><strong>{sender_organization or sender_name}</strong> has requested you to review and sign <strong>{document['filename']}</strong>.</p>
                                
                                <div class="info-grid">
                                    <table class="info-table">
                                        <tr>
                                            <td class="info-label">Sender</td>
                                            <td class="info-value">
                                                <a href="mailto:{sender_email}" style="color: #00A3A3; text-decoration: none;">{sender_name} ({sender_email})</a>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="info-label">Document</td>
                                            <td class="info-value">{document['filename']}</td>
                                        </tr>
                                        <tr>
                                            <td class="info-label">Expires</td>
                                            <td class="info-value">{document.get('expires_at', '24 hours from now')}</td>
                                        </tr>
                                        <tr>
                                            <td class="info-label">Your Role</td>
                                            <td class="info-value">{role.replace('_', ' ').title()}</td>
                                        </tr>
                                    </table>
                                </div>
                                
                                {messages_html if messages_html else ''}
                                
                                <div class="message-box">
                                    <h3 style="margin-top: 0; font-size: 14px; color: #111827;">Task Description</h3>
                                    <p style="margin-bottom: 0; font-size: 14px; color: #4b5563;">{role_instructions.get(role, 'Please review the document and take appropriate action.')}</p>
                                </div>
                                
                                <div class="otp-box">
                                    <p style="margin: 0 0 20px; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your One-Time Passcode</p>
                                    <div class="otp-code-container">
                                        {otp_digits_html}
                                    </div>
                                    <p style="margin: 20px 0 0 0; font-size: 11px; color: #94a3b8;">🔒 For your security, this code is valid for single use only</p>
                                </div>
                                
                                <div style="text-align: center;">
                                    <a href="{action_url}" class="action-button">{action_button} →</a>
                                </div>
                            </td>
                        </tr>
            


            
            
            {standard_footer}
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
    
    subject = f"Action Required: Please {role_description} - {document['filename']}"
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
                print(f"{recipient.get('role', 'signer').title()} invitation sent to {recipient['email']}")
                
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
    
    # Generate individual digit boxes for OTP
    otp_digits_html = "".join([f'<span class="otp-digit">{d}</span>' for d in str(new_otp)])
    
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
    
    # Get branding info
    branding = db.branding.find_one({}) or {}
    platform_name = branding.get("platform_name", "SafeSign")
    logo_url = f"{BACKEND_URL}/branding/logo/file" if branding.get("logo_file_path") else None
    
    standard_footer = get_standard_email_footer()
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb; }}
            .brand-logo {{ height: 32px; width: auto; display: block; }}
            .brand-name {{ font-size: 24px; font-weight: 800; color: #00A3A3; letter-spacing: -0.5px; }}
            .header {{ background: #ffffff; color: #00A3A3; padding: 25px 30px; text-align: center; border-bottom: 2px solid #f1f5f9; }}
            .content {{ padding: 30px; background: #ffffff; }}
            .otp-box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 40px 30px; text-align: center; margin: 30px 0; }}
            .otp-digit {{ 
                display: inline-block; 
                width: 46px; 
                height: 54px; 
                line-height: 54px; 
                background: #ffffff; 
                border: 1px solid #e2e8f0; 
                border-radius: 12px; 
                margin: 0 4px; 
                font-size: 26px; 
                font-weight: 800; 
                color: #1e293b; 
                text-align: center;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
            }}
            .button {{ display: inline-block; background: #00A3A3; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 20px; }}
            .note {{ background: #f8fafc; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; font-size: 14px; }}
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
            <tr>
                <td align="center">
                    <table width="100%" maxWidth="600" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse; width: 100%;">
                        <!-- Header: Logo -->
                        <tr>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; text-align: left;">
                                <table border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="vertical-align: middle;">
                                            {f'<img src="{logo_url}" alt="{platform_name}" class="brand-logo">' if logo_url else ''}
                                        </td>
                                        <td style="vertical-align: middle; padding-left: 10px;">
                                            <span class="brand-name">{platform_name}</span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Banner Image -->
                        <tr>
                            <td style="padding: 0;">
                                <img src="{BACKEND_URL}/static/email/reminder-banner.png" alt="Reminder Banner" style="width: 100%; height: auto; display: block; border: 0;" />
                            </td>
                        </tr>
                        
                        <tr>
                            <td class="header">
                                <h1 style="margin:0; font-size: 20px; color: #00A3A3;">Reminder: Action Required</h1>
                            </td>
                        </tr>
                        
                        <tr>
                            <td class="content">
                                <h2>Hello {recipient['name']},</h2>
                                <p>This is a friendly reminder to complete your required action for <strong>{document['filename']}</strong>.</p>
                                
                                <div class="note">
                                    <strong>Document:</strong> {document['filename']}<br>
                                    <strong>Your Role:</strong> {role.replace('_', ' ').title()}<br>
                                    <strong>Task:</strong> {get_role_description(role)}
                                </div>
                                
                                <div class="otp-box">
                                    <p style="margin: 0 0 20px; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Your One-Time Passcode</p>
                                    <div style="margin: 25px 0;">
                                        {otp_digits_html}
                                    </div>
                                    <p style="margin: 20px 0 0 0; font-size: 12px; color: #94a3b8; font-weight: 500;">🔒 For your security, this code is valid for single use only</p>
                                    <p style="margin: 10px 0 0 0; font-size: 10px; color: #cbd5e1; font-style: italic;">Note: This replaces any previous code sent to you.</p>
                                </div>
                                
                                <div style="text-align: center;">
                                    <a href="{action_url}" class="button">{action_button} →</a>
                                </div>
                            </td>
                        </tr>
                        
                        {standard_footer}
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    subject = f"Reminder: {document['filename']}"
    success = send_email(recipient['email'], subject, html_content)
    
    if success:
        print(f"Reminder sent to {recipient['email']} | New OTP: {new_otp}")
    else:
        print(f"❌ Failed to send reminder to {recipient['email']}")
        
        
def send_signed_document_email(
    to_email: str,
    recipient_name: str,
    document_name: str,
    pdf_bytes: bytes
) -> bool:
    standard_footer = get_standard_email_footer()
    try:
        msg = MIMEMultipart()
        msg["From"] = EMAIL_FROM
        msg["To"] = to_email
        msg["Subject"] = f"Signed Document: {document_name}"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb; }}
                .brand-name {{ font-size: 24px; font-weight: 800; color: #00A3A3; letter-spacing: -0.5px; }}
                .document-header {{ background: #ffffff; color: #00A3A3; padding: 40px 30px; text-align: center; border-bottom: 2px solid #f1f5f9; }}
                .content {{ padding: 30px; background: #ffffff; }}
                .info-box {{ background: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0; border: 1.5px solid #e2e8f0; border-style: dashed; text-align: center; }}
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
                <tr>
                    <td align="center">
                        <table width="100%" maxWidth="600" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse; width: 100%;">
                            <!-- Banner Image -->
                            <tr>
                                <td style="padding: 0;">
                                    <img src="{BACKEND_URL}/static/email/completed-document.png" alt="Document Signed" style="width: 100%; height: auto; display: block; border: 0;" />
                                </td>
                            </tr>
                            
                            <!-- Document Header -->
                            <tr>
                                <td class="document-header">
                                    <h1 style="margin: 0; color: #00A3A3; font-size: 24px;">Your Document is Signed!</h1>
                                    <p style="margin: 10px 0 0 0; color: #64748b;">Securely delivered to your inbox</p>
                                </td>
                            </tr>
                            
                            <!-- Main Content -->
                            <tr>
                                <td class="content">
                                    <h2 style="margin-top: 0; color: #111827;">Hello {recipient_name},</h2>
                                    <p>Your signed document <strong>{document_name}</strong> is processed and attached to this email for your records.</p>
                                    
                                    <div class="info-box">
                                        <div style="font-size: 40px; margin-bottom: 15px;">📥</div>
                                        <h3 style="margin: 0; color: #0d9488;">Signed PDF Attached</h3>
                                        <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Please see the attachment at the bottom of this email.</p>
                                    </div>

                                    <p style="margin-bottom: 0;">Thank you for using our platform for your secure digital signatures.</p>
                                </td>
                            </tr>

                            {standard_footer}
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_content, "html"))

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
    envelope_id: Optional[str] = None
) -> bool:
    """
    Send document via email with attachment.
    """
    try:
        standard_footer = get_standard_email_footer()
        
        # Build HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb; }}
                .brand-name {{ font-size: 24px; font-weight: 800; color: #00A3A3; letter-spacing: -0.5px; }}
                .document-header {{ background: #ffffff; color: #111827; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; background: #ffffff; }}
                .message-box {{ background: #f8fafc; border-left: 4px solid #00A3A3; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
                <tr>
                    <td align="center">
                        <table width="100%" maxWidth="600" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse; width: 100%;">
                            <!-- Header -->
                            <tr>
                                <td style="padding: 20px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                                    <span class="brand-name">SafeSign</span>
                                </td>
                            </tr>
                            
                            <!-- Document Header -->
                            <tr>
                                <td class="document-header">
                                    <h1 style="margin: 0; color: #111827; font-size: 20px;">Document Shared With You</h1>
                                </td>
                            </tr>
                            
                            <!-- Main Content -->
                            <tr>
                                <td class="content">
                                    <h2 style="margin-top: 0; color: #111827;">Hello {to_name or 'there'},</h2>
                                    <p><strong>{sender_name}</strong> ({sender_email}) has shared a document with you.</p>
                                    
                                    <div class="message-box">
                                        <p style="margin: 0; font-size: 15px;">{body}</p>
                                    </div>
                                    
                                    <p>Document Name: <strong>{document_name}</strong></p>
                                    {f'<p style="color: #6b7280; font-size: 13px;">Envelope ID: {envelope_id}</p>' if envelope_id else ''}
                                    
                                    <p style="margin-bottom: 0;">Please find the attached document for your review.</p>
                                </td>
                            </tr>

                            {standard_footer}
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html_content, "html"))
        
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
        
        # USE UNIFIED RENDERING TO ENSURE PDF FORMAT WITH SIGNATURES
        # This solves the issue where original formats like DOCX were being sent in emails.
        try:
            from .documents import load_document_pdf, apply_completed_fields_to_pdf
            
            # Load base PDF (correctly handles multi-file and conversions)
            pdf_bytes = load_document_pdf(document, str(document["_id"]))
            if not pdf_bytes:
                raise Exception("Could not load base PDF")
                
            # Apply all completed fields dynamically
            print(f"Generating optimized signed PDF for completion emails (Document ID: {document_id})")
            pdf_bytes = apply_completed_fields_to_pdf(pdf_bytes, str(document["_id"]), document)
            
            # ADDING ENVELOPE HEADER & WATERMARK (MATCHES DOWNLOAD)
            # This ensures emailed documents look professional and consistent
            from .pdf_engine import PDFEngine
            
            envelope_id = document.get("envelope_id")
            if envelope_id:
                try:
                    pdf_bytes = PDFEngine.apply_minimal_envelope_header(
                        pdf_bytes,
                        envelope_id=envelope_id,
                        color="#000000"
                    )
                except Exception as e:
                    print(f"Warning: Header failed for automated email: {e}")
                    
            try:
                pdf_bytes = PDFEngine.apply_watermark(
                    pdf_bytes,
                    "SIGNED DOCUMENT",
                    color="#4CAF50",
                    opacity=0.1,
                    font_size=48,
                    angle=45
                )
            except Exception as e:
                print(f"Warning: Watermark failed for automated email: {e}")
            
        except Exception as e:
            print(f"❌ Error in dynamic rendering for email: {str(e)}")
            # Fallback to storage version if dynamic fails
            pdf_path = document.get("signed_pdf_path") or document.get("pdf_file_path")
            if not pdf_path:
                print(f"❌ No PDF found for document {document_id}")
                return False
            try:
                from storage import storage
                pdf_bytes = storage.download(pdf_path)
            except Exception as se:
                print(f"❌ Storage fallback failed: {str(se)}")
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
            # Skip recipients who declined - they should not receive the final document
            if recipient.get("status") == "declined":
                continue
                
            try:
                # Prepare recipient-specific data
                recipient_name = recipient.get("name", recipient.get("email", ""))
                recipient_email = recipient.get("email", "")
                recipient_role = recipient.get("role", "signer")
                
                # Send email with completed document
                success = await send_document_completion_email(
                    recipient_email=recipient_email,
                    recipient_name=recipient_name,
                    document=document,
                    pdf_bytes=pdf_bytes,
                    sender_name=sender_name,
                    sender_email=sender_email,
                    sender_organization=sender_organization,
                    recipient_role=recipient_role,
                    recipient=recipient,
                    logo_url=logo_url,
                    platform_name=platform_name
                )
                
                if success:
                    success_count += 1
                    print(f"Sent completed document to {recipient_email}")
                    
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
    
async def send_document_completion_email(
    recipient_email: str,
    recipient_name: str,
    document: dict,
    pdf_bytes: bytes,
    sender_name: str,
    sender_email: str,
    sender_organization: str,
    recipient_role: str,
    recipient: dict = None,
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
        subject = f"Document Signed: {document_name}"

        # 4. Handle Banner (CID: banner)
        images = {}
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        banner_path = os.path.join(base_dir, "static", "email", "completed-document.png")
        if os.path.exists(banner_path):
            try:
                with open(banner_path, "rb") as f:
                    images["banner"] = f.read()
            except Exception as e:
                print(f"Error reading completion banner: {e}")
        
        standard_footer = get_standard_email_footer()
        
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
                .brand-logo {{
                    height: 32px;
                    width: auto;
                    display: block;
                }}
                .brand-name {{
                    font-size: 24px;
                    font-weight: 800;
                    color: #00A3A3;
                    letter-spacing: -0.5px;
                }}
                .header-banner {{
                    text-align: center;
                    background: #ffffff;
                }}
                .document-header {{
                    background: #ffffff;
                    color: #111827;
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
                    background: #00A3A3;
                    color: #ffffff;
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 600;
                }}
                .content-section {{
                    padding: 30px;
                    background: #ffffff;
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
                    border: 1px solid #e2e8f0;
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
                    font-weight: 600;
                }}
                .completion-section {{
                    background: #ecfdf5;
                    border: 2px solid #a7f3d0;
                    border-radius: 12px;
                    padding: 24px;
                    margin: 24px 0;
                    text-align: center;
                }}
                .download-button {{
                    display: inline-block;
                    background: #00A3A3;
                    color: #ffffff !important;
                    text-decoration: none;
                    padding: 14px 32px;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 16px;
                    margin: 20px 0;
                }}
                @media (max-width: 480px) {{
                    .content-section {{
                        padding: 20px;
                    }}
                }}
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
                <tr>
                    <td align="center">
                        <table width="100%" maxWidth="600" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse; width: 100%;">
                            <!-- Header: Logo -->
                            <tr>
                                <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; text-align: left;">
                                    <table border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td style="vertical-align: middle;">
                                                {f'<img src="{logo_url}" alt="{platform_name}" class="brand-logo">' if logo_url else ''}
                                            </td>
                                            <td style="vertical-align: middle; padding-left: 10px;">
                                                <span class="brand-name">{platform_name}</span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Banner Image -->
                            <tr>
                                <td style="padding: 0; background: #ffffff;">
                                    <img 
                                        src="cid:banner" 
                                        alt="Document Completed" 
                                        style="width: 100%; height: auto; display: block;"
                                    />
                                </td>
                            </tr>
                            
                            <!-- Document Header -->
                            <tr>
                                <td class="document-header">
                                    <h1 class="document-title" style="margin: 0; color: #111827;">Document Executed Successfully</h1>
                                    <div class="success-badge">All Signatures Captured</div>
                                </td>
                            </tr>
                            
                            <!-- Main Content -->
                            <tr>
                                <td class="content-section">
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
                    
                    
                    
                    <!-- Download Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{BACKEND_URL}/signing/recipient/{str(recipient['_id']) if recipient else 'unknown'}/download/signed" class="download-button" style="color: white; background-color: #00a3a3; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                            Download Signed Document
                        </a>
                    </div>
                    
                    <div style="text-align: center; margin-top: -10px; margin-bottom: 30px;">
                        <p style="font-size: 14px; color: #6b7280;">
                            A full document package (ZIP) is also attached to this email for your records.
                        </p>
                    </div>
                    <!-- Attachment Info -->
                    <div class="attachment-info">
                        <strong>📎 Attachment:</strong> {document_name} (PDF)<br>
                        <small>This PDF contains all signatures, timestamps, and is ready for your records.</small>
                    </div>
                    
                    <!-- Signature Section -->
                   
                    
                    <!-- Support Section -->
                    
                
                            {standard_footer}
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        # Create email message - 'related' is required for embedding images (CID)
        msg = MIMEMultipart('related')
        msg["From"] = EMAIL_FROM
        msg["To"] = recipient_email
        msg["Subject"] = subject
        
        # Attach HTML body
        msg_alternative = MIMEMultipart('alternative')
        msg.attach(msg_alternative)
        msg_alternative.attach(MIMEText(html_content, "html"))
        
        # Attach Banner Image as CID
        if images.get("banner"):
            msg_image = MIMEImage(images["banner"], _subtype="png")
            msg_image.add_header('Content-ID', '<banner>')
            msg_image.add_header('Content-Disposition', 'inline', filename="banner.png")
            msg.attach(msg_image)

        # Attach PDF document
        pdf_attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
        pdf_attachment.add_header(
            "Content-Disposition",
            "attachment",
            filename=f"completed_{document_name}"
        )
        msg.attach(pdf_attachment)
        
        # ATTACH FULL ZIP PACKAGE
        try:
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
                zip_attachment = MIMEApplication(package_data["zip_bytes"], _subtype="zip")
                zip_attachment.add_header(
                    "Content-Disposition",
                    "attachment",
                    filename=package_data["zip_filename"]
                )
                msg.attach(zip_attachment)
                print(f" Attached full ZIP package to completion email for {recipient_email}")
        except Exception as ze:
            print(f"⚠️ Warning: Could not generate/attach ZIP package to completion email: {str(ze)}")
        
        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"Sent completed document to {recipient_email}")
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
        
        # Build completion summary HTML (Timeline)
        summary_html = build_completion_summary_html(recipients)
        
        # Pre-generate common package data (Signed doc, Summary, Certificate)
        # This optimization ensures we don't re-render for every recipient
        from .documents import load_document_pdf, apply_completed_fields_to_pdf
        
        # Determine who should receive the package (ONLY Owner now for ZIP Packages, recipients get it in completion email)
        package_recipients = []
            
        # Add Owner (Sender) to the list
        if owner:
            package_recipients.append({
                "email": sender_email or owner.get("email"),
                "name": sender_name or owner.get("full_name") or "Sender",
                "is_owner": True,
                "recipient_obj": recipients[0] if recipients else None # Use first recipient for context if needed
            })
            
        success_count = 0
        failed_recipients = []

        for target in package_recipients:
            try:
                recipient_email = target["email"]
                recipient_name = target["name"]
                is_owner = target["is_owner"]
                
                # Generate document package for this target
                package_data = await generate_document_package(
                    document=document,
                    recipient=target["recipient_obj"],
                    sender_name=sender_name,
                    sender_email=sender_email,
                    sender_organization=sender_organization,
                    platform_name=platform_name,
                    logo_url=logo_url
                )
                
                if package_data and package_data.get("zip_bytes"):
                    # Custom subject/greeting if it's the owner
                    subject = None
                    if is_owner:
                        subject = f"All Recipients Signed: {document.get('filename')} - Final Package Ready"
                    
                    # Send email with ZIP attachment and Summary
                    success = send_package_email(
                        recipient_email=recipient_email,
                        recipient_name=recipient_name,
                        document=document,
                        zip_bytes=package_data["zip_bytes"],
                        zip_filename=package_data["zip_filename"],
                        sender_name=sender_name,
                        sender_email=sender_email,
                        sender_organization=sender_organization,
                        platform_name=platform_name,
                        logo_url=logo_url,
                        subject_override=subject,
                        summary_html=summary_html # Pass the summary
                    )
                    
                    if success:
                        success_count += 1
                        print(f"Sent document package to {recipient_email}")
                        
                        # Log the email send
                        current_recipient = target["recipient_obj"]
                        db.document_activity.insert_one({
                            "document_id": ObjectId(document_id),
                            "action": "completed_package_sent",
                            "recipient_email": recipient_email,
                            "recipient_name": recipient_name,
                            "recipient_role": current_recipient.get("role") if current_recipient else "owner",
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
            
            # 1. Get and add SIGNED DOCUMENT (Dynamically rendered to ensure PDF format)
            try:
                from .documents import load_document_pdf, apply_completed_fields_to_pdf
                
                # Use unified rendering logic to get the perfect signed PDF
                signed_pdf_bytes = load_document_pdf(document, str(document["_id"]))
                if signed_pdf_bytes:
                    signed_pdf_bytes = apply_completed_fields_to_pdf(signed_pdf_bytes, str(document["_id"]), document)
                    
                    # Ensure filename has .pdf extension
                    bare_filename = base_name
                    if bare_filename.lower().endswith(".pdf"):
                        bare_filename = bare_filename[:-4]
                    elif bare_filename.lower().endswith(".docx"):
                        bare_filename = bare_filename[:-5]
                        
                    signed_filename = f"completed_{bare_filename}.pdf"
                    zip_file.writestr(signed_filename, signed_pdf_bytes)
                    print(f"Added signed document (PDF): {signed_filename}")
                else:
                    print(f"❌ Could not load base PDF for package")
            except Exception as e:
                print(f"❌ Error adding signed document to package: {e}")
                # Fallback to stored version if dynamic fails
                signed_pdf_path = document.get("signed_pdf_path") or document.get("pdf_file_path")
                if signed_pdf_path:
                    try:
                        from storage import storage
                        signed_pdf_bytes = storage.download(signed_pdf_path)
                        zip_file.writestr(f"signed_{base_name}.pdf", signed_pdf_bytes)
                    except: pass
            
            # 2. Get and add ORIGINAL DOCUMENT (Ensuring PDF if possible)
            original_path = document.get("pdf_file_path")
            if original_path:
                try:
                    from .documents import load_document_pdf
                    original_pdf_bytes = load_document_pdf(document, str(document["_id"]))
                    
                    if original_pdf_bytes:
                        bare_filename = base_name
                        if bare_filename.lower().endswith(".pdf"):
                            bare_filename = bare_filename[:-4]
                        elif bare_filename.lower().endswith(".docx"):
                            bare_filename = bare_filename[:-5]
                            
                        original_filename = f"original_{bare_filename}.pdf"
                        zip_file.writestr(original_filename, original_pdf_bytes)
                        print(f"Added original document (PDF): {original_filename}")
                except Exception as e:
                    print(f"❌ Error adding original document to package: {e}")
            
            # 3. Generate and add DOCUMENT SUMMARY
            try:
                summary_data = await prepare_summary_data(document, recipient)
                summary_pdf_bytes = SafeSignSummaryEngine.create_document_summary_pdf(summary_data)
                summary_filename = f"summary_{base_name}.pdf"
                zip_file.writestr(summary_filename, summary_pdf_bytes)
                print(f"Added document summary: {summary_filename}")
            except Exception as e:
                print(f"❌ Error generating summary: {e}")
            
            # 4. Generate and add CERTIFICATE OF COMPLETION
            try:
                certificate_data = await prepare_certificate_data(document, recipient)
                certificate_pdf_bytes = SafeSignCertificateEngine.create_certificate_pdf(certificate_data)
                certificate_filename = f"certificate_{base_name}.pdf"
                zip_file.writestr(certificate_filename, certificate_pdf_bytes)
                print(f"Added certificate: {certificate_filename}")
            except Exception as e:
                print(f"❌ Error generating certificate: {e}")
            
            # 5. Add any ATTACHMENTS uploaded by recipients
            try:
                attachment_fields = list(db.signature_fields.find({
                    "document_id": ObjectId(document_id),
                    "type": "attachment",
                    "completed_at": {"$ne": None}
                }))
                
                if attachment_fields:
                    print(f" Found {len(attachment_fields)} attachments to include")
                    for attr in attachment_fields:
                        val = attr.get("value")
                        if isinstance(val, dict) and val.get("data"):
                            try:
                                # Decode base64 data
                                data_str = val["data"]
                                if "base64," in data_str:
                                    data_str = data_str.split("base64,")[1]
                                
                                import base64
                                file_bytes = base64.b64decode(data_str)
                                
                                # Use recipient name if possible
                                rec_id = attr.get("recipient_id")
                                rec = db.recipients.find_one({"_id": ObjectId(rec_id)})
                                rec_name = re.sub(r'[^\w\s-]', '', rec.get('name', 'recipient'))[:20] if rec else "unknown"
                                
                                # Construct filename
                                orig_filename = val.get("filename", f"attachment_{attr['_id']}.bin")
                                zip_attr_name = f"attachments/{rec_name}_{orig_filename}"
                                
                                zip_file.writestr(zip_attr_name, file_bytes)
                                print(f"Added attachment: {zip_attr_name}")
                            except Exception as e:
                                print(f"❌ Error adding attachment {attr.get('_id')}: {e}")
            except Exception as e:
                print(f"❌ Error processing attachments: {e}")

            # 6. Add README file with information
            readme_content = f"""DOCUMENT PACKAGE - {platform_name}

Document: {document.get('filename', 'Unknown')}
Envelope ID: {envelope_id}
Recipient: {recipient.get('name', 'Unknown')} ({recipient.get('email', 'Unknown')})
Role: {recipient.get('role', 'signer').replace('_', ' ').title()}
Completion Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}

This package contains:
1. Completed Document - The final signed version with all signatures
2. Original Document - The original unsigned document
3. Document Summary - Detailed summary of all fields and signatures
4. Certificate of Completion - Official certificate with audit trail
5. Attachments folder - Files uploaded by recipients (if any)

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
                "signing_order": r.get("signing_order", 1),
                "otp_verified": r.get("otp_verified", False),
                "terms_accepted": r.get("terms_accepted", False)
            })
        
        # Prepare activity timeline
        recent_activity = []
        for event in timeline[:15]:
            actor = event.get("actor", {})
            participant_name = actor.get("name") or actor.get("email") or "System"
            
            event_date = event.get("timestamp")
            if event_date:
                event_date = event_date.strftime("%Y-%m-%d %H:%M:%S")
            
            # Improve details if description is empty
            details = event.get("description", "")
            if not details:
                meta = event.get("metadata", {})
                action = event.get("type", event.get("action", ""))
                if action == "recipient_viewed":
                    details = f"Viewed by {participant_name}"
                elif action == "document_downloaded":
                    details = f"Downloaded {meta.get('filename', 'document')}"
                elif action == "otp_verified":
                    details = "Security verification completed"
                else:
                    details = event.get("title", action.replace("_", " ").title())

            recent_activity.append({
                "date": event_date,
                "event": event.get("title", event.get("action", "Activity")),
                "participant": participant_name,
                "details": details
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
        # Return minimal summary data as fallback.
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
        
        # Get document timeline for audit trail
        timeline = list(db.document_timeline.find({
            "document_id": document_id
        }).sort("timestamp", -1).limit(30))
        
        # Prepare activity timeline (enriched)
        recent_activity = []
        for event in timeline:
            actor = event.get("actor", {})
            participant_name = actor.get("name") or actor.get("email") or "System"
            
            event_date = event.get("timestamp")
            if event_date:
                event_date = event_date.strftime("%Y-%m-%d %H:%M:%S")
            
            # Improve details if description is empty
            details = event.get("description", "")
            if not details:
                meta = event.get("metadata", {})
                action = event.get("type", event.get("action", ""))
                if action == "recipient_viewed":
                    details = f"Viewed by {participant_name}"
                elif action == "document_downloaded":
                    details = f"Downloaded {meta.get('filename', 'document')}"
                elif action == "otp_verified":
                    details = "Security verification completed"
                else:
                    details = event.get("title", action.replace("_", " ").title())

            recent_activity.append({
                "date": event_date,
                "event": event.get("title", event.get("action", "Activity")),
                "participant": participant_name,
                "details": details
            })
        
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
            elif role == "form_filler":
                completion_timestamp = r.get("form_completed_at")
                completion_ip = r.get("completed_ip", "Unknown")
            elif role == "witness":
                completion_timestamp = r.get("witnessed_at")
                completion_ip = r.get("witnessed_ip", r.get("completed_ip", "Unknown"))
            elif role == "viewer":
                completion_timestamp = r.get("viewer_at")
                completion_ip = r.get("viewed_ip", r.get("completed_ip", "Unknown"))

            # Get terms acceptance info
            terms_accepted_date = None
            if r.get("terms_accepted_at"):
                terms_accepted_date = r["terms_accepted_at"].strftime("%Y-%m-%d %H:%M:%S")
            elif r.get("terms_accepted_date"): # Fallback for string format
                terms_accepted_date = r["terms_accepted_date"]

            recipients_data.append({
                "name": r.get("name", "Unknown"),
                "email": r.get("email", "No email"),
                "role": role,
                "status": r.get("status", "pending"),
                "completed_at": completion_timestamp.strftime("%Y-%m-%d %H:%M:%S") if completion_timestamp else None,
                "ip_address": completion_ip,
                "signing_order": r.get("signing_order", 0),
                "otp_verified": r.get("otp_verified", False),
                "terms_accepted": r.get("terms_accepted", False),
                "terms_accepted_date": terms_accepted_date
            })

        # Prepare field completion history
        field_history = []
        for field in completed_fields[:30]:  # Limit to 30 most recent for certificate
            field_recipient = next((r for r in all_recipients if str(r["_id"]) == str(field.get("recipient_id"))), None)
            if field_recipient:
                completion_time = field.get("completed_at")
                field_history.append({
                    "type": field.get("type", "unknown"),
                    "signer_name": field_recipient.get("name", "Unknown"),
                    "completed_at": completion_time.strftime("%Y-%m-%d %H:%M:%S") if completion_time else None,
                    "ip_address": field.get("completed_ip") or field_recipient.get("completed_ip") or "Unknown",
                    "page": field.get("page", 0) + 1
                })
        
        # Sort history by date
        field_history.sort(key=lambda x: x.get("completed_at", ""), reverse=True)
        
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
            "field_history": field_history,
            "recent_activity": recent_activity,
            
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
            "recent_activity": [],
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
    logo_url: str = None,
    subject_override: str = None,
    summary_html: str = None
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
        
        subject = subject_override or f"Document Package: {document_name} - All Signed Documents"
        
        standard_footer = get_standard_email_footer()
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Document Package: {document_name}</title>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb; }}
                .brand-logo {{ height: 32px; width: auto; display: block; }}
                .brand-name {{ font-size: 24px; font-weight: 800; color: #00A3A3; letter-spacing: -0.5px; }}
                .document-header {{ background: #ffffff; color: #00A3A3; padding: 30px; text-align: center; border-bottom: 2px solid #f1f5f9; }}
                .content {{ padding: 30px; background: #ffffff; }}
                .info-grid {{ background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; }}
                .info-table {{ width: 100%; border-collapse: collapse; font-size: 14px; }}
                .info-table td {{ padding: 10px 0; border-bottom: 1px solid #e5e7eb; }}
                .info-label {{ color: #6b7280; width: 150px; vertical-align: top; font-weight: 600; }}
                .info-value {{ color: #374151; }}
                .package-box {{ background: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 12px; padding: 25px; margin: 25px 0; }}
                .package-item {{ display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #d1fae5; }}
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
                <tr>
                    <td align="center">
                        <table width="100%" maxWidth="600" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse; width: 100%;">
                            <!-- Header -->
                            <tr>
                                <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; text-align: left;">
                                    <table border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td style="vertical-align: middle;">
                                                {f'<img src="{logo_url}" alt="{platform_name}" class="brand-logo">' if logo_url else ''}
                                            </td>
                                            <td style="vertical-align: middle; padding-left: 10px;">
                                                <span class="brand-name">{platform_name}</span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Banner Image -->
                            <tr>
                                <td style="padding: 0;">
                                    <img src="{BACKEND_URL}/static/email/completed-document.png" alt="Completed Document Banner" style="width: 100%; height: auto; display: block; border: 0;" />
                                </td>
                            </tr>
                            
                            <!-- Document Header -->
                            <tr>
                                <td class="document-header">
                                    <h1 style="margin: 0; color: #111827; font-size: 22px;">Document Package Ready</h1>
                                    <p style="margin: 8px 0 0 0; opacity: 0.9;">All parties have signed successfully</p>
                                </td>
                            </tr>
                            
                            <!-- Main Content -->
                            <tr>
                                <td class="content">
                                    <h2 style="margin-top: 0; color: #111827;">Hello {recipient_name},</h2>
                                    <p>The document processing is complete. Your fully signed package is attached.</p>
                                    
                                    <div class="info-grid">
                                        <table class="info-table">
                                            <tr>
                                                <td class="info-label">Document</td>
                                                <td class="info-value">{document_name}</td>
                                            </tr>
                                            {f'<tr><td class="info-label">Envelope ID</td><td class="info-value">{envelope_id}</td></tr>' if envelope_id else ''}
                                            <tr>
                                                <td class="info-label">Completed On</td>
                                                <td class="info-value">{completed_date}</td>
                                            </tr>
                                        </table>
                                    </div>

                                    {summary_html if summary_html else ""}
                                    
                                    <div class="package-box">
                                        <h3 style="margin: 0 0 15px 0; color: #064e3b; text-align: center;"> Package Contents:</h3>
                                        <div style="font-size: 14px; color: #065f46;">
                                            • Signed Document (Final Version)<br>
                                            • Original Document<br>
                                            • Document Summary & Audit Trail<br>
                                            • Official Certificate of Completion
                                        </div>
                                    </div>
                                    
                                    <p style="font-size: 14px; text-align: center; color: #6b7280;">📌 The ZIP file is attached to this email.</p>
                                </td>
                            </tr>

                            {standard_footer}
                        </table>
                    </td>
                </tr>
            </table>
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
        
        print(f"Sent document package to {recipient_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send package to {recipient_email}: {str(e)}")
        return False

# ============================================
# EXTERNAL TRIGGER ROUTE
# ============================================

@router.post("/trigger-completed-emails/{document_id}")
async def trigger_completed_emails(
    document_id: str,
    background_tasks: BackgroundTasks
):
    """
    Manually trigger completion emails (ZIP packages) for a document.
    Sends to all recipients and the document owner.
    """
    try:
        doc = db.documents.find_one({"_id": ObjectId(document_id)})
        if not doc:
            return {"success": False, "message": "Document not found"}
            
        if doc.get("status") != "completed":
            return {"success": False, "message": "Document is not yet completed/signed"}
            
        # Trigger in background - ZIP package to owner, Final Copy to recipients
        background_tasks.add_task(send_completed_document_package, document_id=document_id)
        background_tasks.add_task(send_completed_document_to_recipients, document_id=document_id)
        
        return {
            "success": True, 
            "message": f"Completion emails (Final Copy for recipients, Package ZIP for owner) scheduled for document {document_id}"
        }
    except Exception as e:
        return {"success": False, "message": str(e)}

async def send_expiration_email_to_owner(document: dict):
    """Send alert to document owner when document expires"""
    owner_email = document.get("owner_email")
    if not owner_email:
        return False
        
    doc_name = document.get("filename", "Document")
    envelope_id = document.get("envelope_id", "N/A")
    
    current_year = datetime.utcnow().year
    standard_footer = get_standard_email_footer()
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb; }}
            .brand-name {{ font-size: 24px; font-weight: 800; color: #dc2626; letter-spacing: -0.5px; }}
            .alert-header {{ background: #dc2626; color: white; padding: 30px; text-align: center; }}
            .content {{ padding: 30px; background: #ffffff; }}
            .info-card {{ background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
            <tr>
                <td align="center">
                    <table width="100%" maxWidth="600" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse; width: 100%;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 20px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                                <span class="brand-name">SafeSign</span>
                            </td>
                        </tr>
                        
                        <!-- Alert Header -->
                        <tr>
                            <td class="alert-header">
                                <h1 style="margin: 0; color: #ffffff; font-size: 20px;">⚠️ Document Expired</h1>
                            </td>
                        </tr>
                        
                        <!-- Main Content -->
                        <tr>
                            <td class="content">
                                <h2 style="margin-top: 0; color: #111827;">Document Expiry Alert</h2>
                                <p>Your document "<strong>{doc_name}</strong>" has expired before all recipients could sign.</p>
                                
                                <div class="info-card">
                                    <p style="margin: 0; font-size: 14px;"><strong>Envelope ID:</strong> {envelope_id}</p>
                                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #991b1b;">This document is now inactive and cannot be signed.</p>
                                </div>
                                
                                <p>If you still require these signatures, you will need to re-send the document or create a new request.</p>
                            </td>
                        </tr>

                        {standard_footer}
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    msg = MIMEMultipart()
    msg['From'] = EMAIL_FROM
    msg['To'] = owner_email
    msg['Subject'] = f"Document Expired: {doc_name}"
    msg.attach(MIMEText(html_content, 'html'))
    
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            if SMTP_USERNAME and SMTP_PASSWORD:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending expiration email to owner: {e}")
        return False

async def send_expiration_email_to_recipient(recipient: dict, document: dict):
    """Send alert to recipient when a document they were supposed to sign expires"""
    recipient_email = recipient.get("email")
    if not recipient_email:
        return False
        
    doc_name = document.get("filename", "Document")
    owner_name = document.get("owner_name") or document.get("owner_email", "The sender")
    
    current_year = datetime.utcnow().year
    standard_footer = get_standard_email_footer()
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb; }}
            .brand-name {{ font-size: 24px; font-weight: 800; color: #dc2626; letter-spacing: -0.5px; }}
            .alert-header {{ background: #dc2626; color: white; padding: 30px; text-align: center; }}
            .content {{ padding: 30px; background: #ffffff; }}
            .info-card {{ background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
            <tr>
                <td align="center">
                    <table width="100%" maxWidth="600" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse; width: 100%;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 20px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                                <span class="brand-name">SafeSign</span>
                            </td>
                        </tr>
                        
                        <!-- Alert Header -->
                        <tr>
                            <td class="alert-header">
                                <h1 style="margin: 0; color: #ffffff; font-size: 20px;">🕒 Request Expired</h1>
                            </td>
                        </tr>
                        
                        <!-- Main Content -->
                        <tr>
                            <td class="content">
                                <h2 style="margin-top: 0; color: #111827;">Hello {recipient.get('name', 'there')},</h2>
                                <p>The signature request for "<strong>{doc_name}</strong>" from {owner_name} has expired.</p>
                                
                                <div class="info-card">
                                    <p style="margin: 0; font-size: 14px; color: #991b1b;">You can no longer sign or view this document.</p>
                                </div>
                                
                                <p>If you have questions regarding this request, please contact the sender directly.</p>
                            </td>
                        </tr>

                        {standard_footer}
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    msg = MIMEMultipart()
    msg['From'] = EMAIL_FROM
    msg['To'] = recipient_email
    msg['Subject'] = f"Signature Request Expired: {doc_name}"
    msg.attach(MIMEText(html_content, 'html'))
    
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            if SMTP_USERNAME and SMTP_PASSWORD:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending expiration email to recipient: {e}")
        return False
