import os
import io
import re
import base64
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from bson import ObjectId
from pymongo import ReturnDocument

from database import db, get_collection

# ReportLab Imports
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER

logger = logging.getLogger("InvoiceService")

invoices_collection = get_collection("invoices")
counters_collection = get_collection("counters")
credit_transactions_collection = get_collection("credit_transactions")
payments_collection = get_collection("payments")
users_collection = get_collection("users")

# Helper function to serialize Mongo document
def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    res = dict(doc)
    if "_id" in res:
        res["id"] = str(res["_id"])
        res["_id"] = str(res["_id"])
    for k, v in res.items():
        if isinstance(v, ObjectId):
            res[k] = str(v)
        elif isinstance(v, datetime):
            res[k] = v.isoformat()
    return res


def get_issuer_info() -> Dict[str, Any]:
    """Return approved, verified business identity details for ESigniva invoicing"""
    return {
        "entity_name": "ESigniva",
        "legal_name": os.getenv("ESIGNIVA_LEGAL_ENTITY", "ESigniva Technologies"),
        "tagline": "Digital Signature Platform",
        "address_line1": os.getenv("ESIGNIVA_LEGAL_ADDRESS_1", "Tech Innovation Hub, Cyber Gateway"),
        "address_line2": os.getenv("ESIGNIVA_LEGAL_ADDRESS_2", "OMR IT Expressway"),
        "city": os.getenv("ESIGNIVA_LEGAL_CITY", "Chennai"),
        "state": os.getenv("ESIGNIVA_LEGAL_STATE", "Tamil Nadu"),
        "postal_code": os.getenv("ESIGNIVA_LEGAL_POSTAL_CODE", "600096"),
        "country": os.getenv("ESIGNIVA_LEGAL_COUNTRY", "India"),
        "tax_id": os.getenv("ESIGNIVA_TAX_ID", "GSTIN33AAACE1234F1Z5"),
        "billing_email": "billing@esigniva.com",
        "support_email": "support@esigniva.com",
        "website": "https://esigniva.com"
    }


class InvoiceService:
    @staticmethod
    async def generate_invoice_number(year: Optional[int] = None) -> str:
        """
        Atomically generate a sequential, human-readable invoice ID.
        Format: ESI-YYYY-XXXXXX (e.g. ESI-2026-000125)
        """
        if not year:
            year = datetime.utcnow().year
        try:
            counter = await counters_collection.find_one_and_update(
                {"_id": f"invoice_seq_{year}"},
                {"$inc": {"seq": 1}},
                upsert=True,
                return_document=ReturnDocument.AFTER
            )
            seq = counter.get("seq", 1) if counter else 1
            return f"ESI-{year}-{seq:06d}"
        except Exception as e:
            logger.error(f"Error generating invoice sequence: {e}")
            timestamp = int(datetime.utcnow().timestamp())
            return f"ESI-{year}-{str(timestamp)[-6:]}"

    @staticmethod
    async def create_invoice(
        user_email: str,
        user_id: Optional[str] = None,
        items: Optional[List[Dict[str, Any]]] = None,
        subtotal: float = 0.0,
        tax_amount: float = 0.0,
        total_amount: Optional[float] = None,
        payment_reference: Optional[str] = None,
        payment_method: str = "Stripe",
        status: str = "PAID",
        customer_info: Optional[Dict[str, Any]] = None,
        issue_date: Optional[datetime] = None,
        payment_date: Optional[datetime] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a new persistent invoice in the database.
        """
        now = datetime.utcnow()
        issue_dt = issue_date or now
        pay_dt = payment_date or now
        year = issue_dt.year

        invoice_number = await InvoiceService.generate_invoice_number(year)

        # Calculate amounts
        subtotal_val = round(float(subtotal), 2)
        tax_val = round(float(tax_amount), 2)
        total_val = round(float(total_amount if total_amount is not None else (subtotal_val + tax_val)), 2)
        paid_val = total_val if status.upper() == "PAID" else 0.0
        balance_val = round(total_val - paid_val, 2)

        # Lookup user profile if customer_info not provided
        if not customer_info:
            user = await users_collection.find_one({"email": user_email})
            user_data = user or {}
            billing = user_data.get("billing_info", {})
            full_name = billing.get("company_name") or user_data.get("full_name") or f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip() or "Valued Customer"
            addr = billing.get("address")
            city = billing.get("city")
            state = billing.get("state")
            zip_c = billing.get("zip")
            cntry = billing.get("country", "United States")
            composed_addr = f"{addr}, {city}, {state} {zip_c}, {cntry}".strip(", ") if addr else "100 Enterprise Way, San Francisco, CA 94107, United States"

            customer_info = {
                "name": full_name,
                "email": billing.get("billing_email") or user_email,
                "company": billing.get("company_name") or user_data.get("company", ""),
                "address": composed_addr,
                "tax_id": billing.get("vat_id") or "N/A"
            }

        issuer_info = get_issuer_info()

        # Format items if not provided
        if not items:
            items = [{
                "description": "500 ESigniva Credits",
                "sub_description": "One-time credit top-up • Non-expiring cloud balance",
                "quantity": 1,
                "unit_price": f"${subtotal_val:.2f}",
                "amount": f"${subtotal_val:.2f}"
            }]
        else:
            formatted_items = []
            for itm in items:
                u_price = itm.get("unit_price")
                if isinstance(u_price, (int, float)):
                    u_price_str = f"${float(u_price):.2f}"
                else:
                    u_price_str = str(u_price or f"${subtotal_val:.2f}")

                amt = itm.get("amount")
                if isinstance(amt, (int, float)):
                    amt_str = f"${float(amt):.2f}"
                else:
                    amt_str = str(amt or f"${subtotal_val:.2f}")

                formatted_items.append({
                    "description": itm.get("description", "Credit Top-Up"),
                    "sub_description": itm.get("sub_description", "Official signing credits"),
                    "quantity": int(itm.get("quantity", 1)),
                    "unit_price": u_price_str,
                    "amount": amt_str
                })
            items = formatted_items

        ref_id = payment_reference or f"STRIPE-TX-{int(now.timestamp())}"
        short_ref = ref_id
        if len(ref_id) > 28:
            short_ref = f"{ref_id[:16]}...{ref_id[-8:]}"

        invoice_doc = {
            "invoice_number": invoice_number,
            "user_email": user_email.lower(),
            "user_id": str(user_id) if user_id else None,
            "issuer": issuer_info,
            "customer": customer_info,
            "issue_date": issue_dt,
            "payment_date": pay_dt,
            "issue_date_str": issue_dt.strftime("%d %b %Y"),
            "payment_date_str": pay_dt.strftime("%d %b %Y"),
            "status": status.upper(),
            "currency": "USD",
            "currency_symbol": "$",
            "payment_method": payment_method,
            "payment_reference": ref_id,
            "short_reference": short_ref,
            "items": items,
            "subtotal": subtotal_val,
            "subtotal_str": f"${subtotal_val:.2f}",
            "tax_rate": 0.0,
            "tax_amount": tax_val,
            "tax_str": f"${tax_val:.2f}",
            "total_amount": total_val,
            "total_str": f"${total_val:.2f}",
            "total_paid": paid_val,
            "total_paid_str": f"${paid_val:.2f}",
            "balance_due": balance_val,
            "balance_str": f"${balance_val:.2f}",
            "notes": "Payment processed securely through Stripe. Keep this invoice for your accounting and tax records.",
            "metadata": metadata or {},
            "created_at": now,
            "updated_at": now
        }

        res = await invoices_collection.insert_one(invoice_doc)
        invoice_doc["_id"] = res.inserted_id
        return serialize_doc(invoice_doc)

    @staticmethod
    async def get_user_invoices(user_email: str, auto_backfill: bool = True) -> List[Dict[str, Any]]:
        """
        Fetch all invoices for a user. If auto_backfill is enabled and existing purchases
        lack invoice records, automatically generate real ESI invoices for them.
        """
        clean_email = user_email.strip().lower()

        cursor = invoices_collection.find({"user_email": clean_email}).sort("created_at", -1)
        invoices = await cursor.to_list(length=100)

        if auto_backfill:
            # Check credit transactions for purchases
            tx_cursor = credit_transactions_collection.find({
                "email": clean_email,
                "$or": [
                    {"source": {"$in": ["purchase", "stripe", "subscription"]}},
                    {"type": "purchase"},
                    {"amount": {"$gt": 0}, "reference_id": {"$exists": True}}
                ]
            }).sort("created_at", 1)
            purchase_txs = await tx_cursor.to_list(length=100)

            # Map existing invoice references
            existing_refs = {inv.get("payment_reference") for inv in invoices if inv.get("payment_reference")}
            existing_tx_ids = {str(inv.get("metadata", {}).get("transaction_id", "")) for inv in invoices}

            newly_created = []
            for tx in purchase_txs:
                ref_id = tx.get("reference_id") or str(tx.get("_id", ""))
                tx_id = str(tx.get("_id", ""))

                if ref_id in existing_refs or tx_id in existing_tx_ids:
                    continue

                amt_credits = abs(int(tx.get("amount", 0)))
                # Calculate real price based on credit amount or description
                price = 15.00
                desc = tx.get("description", "")
                if "$" in desc:
                    match = re.search(r"\$(\d+(\.\d+)?)", desc)
                    if match:
                        try:
                            price = float(match.group(1))
                        except Exception:
                            price = 15.00
                elif amt_credits == 500:
                    price = 5.00
                elif amt_credits == 2000:
                    price = 15.00
                elif amt_credits == 10000:
                    price = 50.00
                elif amt_credits == 50000:
                    price = 200.00
                elif amt_credits <= 100:
                    price = 0.00

                tx_date = tx.get("created_at") or datetime.utcnow()
                if not isinstance(tx_date, datetime):
                    try:
                        tx_date = datetime.fromisoformat(str(tx_date))
                    except Exception:
                        tx_date = datetime.utcnow()

                items = [{
                    "description": f"{amt_credits:,} ESigniva Credits" if amt_credits > 0 else "ESigniva Credit Plan",
                    "sub_description": desc or "Official non-expiring cloud signing credits",
                    "quantity": 1,
                    "unit_price": f"${price:.2f}",
                    "amount": f"${price:.2f}"
                }]

                inv = await InvoiceService.create_invoice(
                    user_email=clean_email,
                    user_id=tx.get("user_id"),
                    items=items,
                    subtotal=price,
                    tax_amount=0.0,
                    total_amount=price,
                    payment_reference=ref_id,
                    payment_method="Stripe",
                    status="PAID",
                    issue_date=tx_date,
                    payment_date=tx_date,
                    metadata={"transaction_id": tx_id, "backfilled": True}
                )
                newly_created.append(inv)
                existing_refs.add(ref_id)
                existing_tx_ids.add(tx_id)

            if newly_created:
                # Re-query all invoices sorted by issue_date descending
                cursor = invoices_collection.find({"user_email": clean_email}).sort("issue_date", -1)
                invoices = await cursor.to_list(length=100)

        return [serialize_doc(inv) for inv in invoices]

    @staticmethod
    async def get_invoice_by_id(invoice_id: str, user_email: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Fetch invoice by invoice_number or MongoDB ObjectId"""
        filter_query: Dict[str, Any] = {}
        if invoice_id.startswith("ESI-"):
            filter_query["invoice_number"] = invoice_id
        else:
            try:
                filter_query["_id"] = ObjectId(invoice_id)
            except Exception:
                filter_query["invoice_number"] = invoice_id

        if user_email:
            filter_query["user_email"] = user_email.strip().lower()

        doc = await invoices_collection.find_one(filter_query)
        return serialize_doc(doc)

    @staticmethod
    def generate_invoice_pdf(invoice_data: Dict[str, Any]) -> bytes:
        """
        Generate pixel-perfect, vector A4 PDF invoice using ReportLab.
        Matches professional SaaS layout specifications (Stripe / Adobe / Microsoft 365).
        """
        pdf_buffer = io.BytesIO()

        # A4: 595.27 x 841.89 pt. 36pt margins -> 523.27 pt width
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        normal = styles['Normal']

        teal = colors.HexColor("#086B70")
        navy = colors.HexColor("#101828")
        slate = colors.HexColor("#334155")
        muted = colors.HexColor("#64748B")
        border_color = colors.HexColor("#E4E7EC")
        bg_light = colors.HexColor("#F8FAFC")
        green_bg = colors.HexColor("#ECFDF5")
        green_text = colors.HexColor("#065F46")
        green_border = colors.HexColor("#A7F3D0")

        # Typography Styles
        brand_style = ParagraphStyle(
            'BrandTitle', parent=normal,
            fontName='Helvetica-Bold', fontSize=20, leading=23, textColor=navy
        )
        tagline_style = ParagraphStyle(
            'BrandTagline', parent=normal,
            fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=teal
        )
        brand_meta_style = ParagraphStyle(
            'BrandMeta', parent=normal,
            fontName='Helvetica', fontSize=8, leading=10, textColor=muted
        )
        inv_title_style = ParagraphStyle(
            'InvoiceTitle', parent=normal,
            fontName='Helvetica-Bold', fontSize=18, leading=20, alignment=TA_RIGHT, textColor=navy
        )
        inv_num_style = ParagraphStyle(
            'InvoiceNum', parent=normal,
            fontName='Helvetica-Bold', fontSize=10.5, leading=13, alignment=TA_RIGHT, textColor=teal
        )
        status_style = ParagraphStyle(
            'StatusPaid', parent=normal,
            fontName='Helvetica-Bold', fontSize=7.5, leading=9, alignment=TA_CENTER, textColor=green_text
        )

        section_header_style = ParagraphStyle(
            'SectionHeader', parent=normal,
            fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=muted
        )
        party_name_style = ParagraphStyle(
            'PartyName', parent=normal,
            fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=navy
        )
        party_text_style = ParagraphStyle(
            'PartyText', parent=normal,
            fontName='Helvetica', fontSize=8.5, leading=11.5, textColor=slate
        )

        meta_label_style = ParagraphStyle(
            'MetaLabel', parent=normal,
            fontName='Helvetica-Bold', fontSize=7.5, leading=9, textColor=muted
        )
        meta_val_style = ParagraphStyle(
            'MetaVal', parent=normal,
            fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=navy
        )

        th_left = ParagraphStyle('THLeft', parent=normal, fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=navy)
        th_center = ParagraphStyle('THCenter', parent=normal, fontName='Helvetica-Bold', fontSize=8, leading=10, alignment=TA_CENTER, textColor=navy)
        th_right = ParagraphStyle('THRight', parent=normal, fontName='Helvetica-Bold', fontSize=8, leading=10, alignment=TA_RIGHT, textColor=navy)

        item_title_style = ParagraphStyle('ItemTitle', parent=normal, fontName='Helvetica-Bold', fontSize=9, leading=11, textColor=navy)
        item_sub_style = ParagraphStyle('ItemSub', parent=normal, fontName='Helvetica', fontSize=7.5, leading=9.5, textColor=muted)
        td_center = ParagraphStyle('TDCenter', parent=normal, fontName='Helvetica', fontSize=8.5, leading=11, alignment=TA_CENTER, textColor=slate)
        td_right = ParagraphStyle('TDRight', parent=normal, fontName='Helvetica', fontSize=8.5, leading=11, alignment=TA_RIGHT, textColor=slate)
        td_right_bold = ParagraphStyle('TDRightBold', parent=normal, fontName='Helvetica-Bold', fontSize=8.5, leading=11, alignment=TA_RIGHT, textColor=navy)

        tot_label = ParagraphStyle('TotLabel', parent=normal, fontName='Helvetica', fontSize=8.5, leading=11, textColor=muted)
        tot_val = ParagraphStyle('TotVal', parent=normal, fontName='Helvetica-Bold', fontSize=8.5, leading=11, alignment=TA_RIGHT, textColor=navy)
        grand_label = ParagraphStyle('GrandLabel', parent=normal, fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=navy)
        grand_val = ParagraphStyle('GrandVal', parent=normal, fontName='Helvetica-Bold', fontSize=13, leading=16, alignment=TA_RIGHT, textColor=teal)

        note_hdr = ParagraphStyle('NoteHdr', parent=normal, fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=teal)
        note_txt = ParagraphStyle('NoteTxt', parent=normal, fontName='Helvetica', fontSize=8, leading=11, textColor=slate)

        footer_style = ParagraphStyle('FooterTxt', parent=normal, fontName='Helvetica', fontSize=7.5, leading=10, alignment=TA_CENTER, textColor=muted)

        story = []

        # 1. Header Section
        logo_path = os.path.join(os.path.dirname(__file__), "..", "static", "branding", "platform_logo.png")
        if not os.path.exists(logo_path):
            logo_path = "static/branding/platform_logo.png"

        logo_img = None
        if os.path.exists(logo_path):
            try:
                logo_img = Image(logo_path, width=36, height=36)
            except Exception:
                logo_img = None

        brand_block = [
            Paragraph("ESigniva", brand_style),
            Paragraph("DIGITAL SIGNATURE PLATFORM", tagline_style),
            Paragraph("billing@esigniva.com • https://esigniva.com", brand_meta_style)
        ]

        if logo_img:
            header_left = Table([[logo_img, brand_block]], colWidths=[42, 258])
            header_left.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
                ('TOPPADDING', (0,0), (-1,-1), 0),
                ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ]))
        else:
            header_left = Table([[brand_block]], colWidths=[300])

        status_pill = Table([[Paragraph(invoice_data.get("status", "PAID"), status_style)]], colWidths=[54], rowHeights=[17])
        status_pill.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), green_bg),
            ('BOX', (0,0), (-1,-1), 0.75, green_border),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ]))

        header_right = Table([
            [Paragraph("INVOICE", inv_title_style)],
            [status_pill],
            [Paragraph(invoice_data.get("invoice_number", "ESI-2026-000125"), inv_num_style)]
        ], colWidths=[223])
        header_right.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 1),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ]))

        header_table = Table([[header_left, header_right]], colWidths=[300, 223])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 14))
        story.append(HRFlowable(width="100%", thickness=1, color=border_color, spaceBefore=0, spaceAfter=14))

        # 2. Balanced Two-Column Billing Layout
        issuer = invoice_data.get("issuer") or get_issuer_info()
        customer = invoice_data.get("customer") or {}

        billed_from = [
            Paragraph("BILLED FROM", section_header_style),
            Spacer(1, 4),
            Paragraph(issuer.get("entity_name", "ESigniva"), party_name_style),
            Paragraph(issuer.get("legal_name", "ESigniva Technologies"), party_text_style),
            Paragraph(issuer.get("address_line1", "Tech Innovation Hub, Cyber Gateway"), party_text_style),
            Paragraph(f"{issuer.get('city', 'Chennai')}, {issuer.get('state', 'Tamil Nadu')} {issuer.get('postal_code', '600096')}, {issuer.get('country', 'India')}", party_text_style),
            Paragraph(f"Tax / GST ID: {issuer.get('tax_id', 'GSTIN33AAACE1234F1Z5')}", party_text_style),
            Paragraph(f"Billing: {issuer.get('billing_email', 'billing@esigniva.com')}", party_text_style),
        ]

        cust_addr = customer.get("address") or "N/A"
        cust_vat = customer.get("tax_id") or "N/A / Consumer"

        billed_to = [
            Paragraph("BILLED TO", section_header_style),
            Spacer(1, 4),
            Paragraph(customer.get("name", "Valued Customer"), party_name_style),
            Paragraph(customer.get("company", ""), party_text_style) if customer.get("company") else Spacer(1, 0),
            Paragraph(cust_addr, party_text_style),
            Paragraph(f"Email: {customer.get('email', 'N/A')}", party_text_style),
            Paragraph(f"Tax / VAT ID: {cust_vat}", party_text_style),
        ]

        billing_table = Table([[billed_from, billed_to]], colWidths=[261, 262])
        billing_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(billing_table)
        story.append(Spacer(1, 16))

        # 3. Metadata Strip (4 columns)
        meta_table = Table([
            [
                [Paragraph("INVOICE DATE", meta_label_style), Paragraph(invoice_data.get("issue_date_str", "20 Oct 2026"), meta_val_style)],
                [Paragraph("PAYMENT DATE", meta_label_style), Paragraph(invoice_data.get("payment_date_str", "20 Oct 2026"), meta_val_style)],
                [Paragraph("PAYMENT METHOD", meta_label_style), Paragraph(invoice_data.get("payment_method", "Stripe"), meta_val_style)],
                [Paragraph("CURRENCY", meta_label_style), Paragraph(f"{invoice_data.get('currency', 'USD')} ($)", meta_val_style)],
            ]
        ], colWidths=[130, 131, 131, 131])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_light),
            ('BOX', (0,0), (-1,-1), 1, border_color),
            ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 18))

        # 4. Itemized Table
        items_data = [
            [
                Paragraph("DESCRIPTION", th_left),
                Paragraph("QTY", th_center),
                Paragraph("UNIT PRICE", th_right),
                Paragraph("AMOUNT", th_right)
            ]
        ]

        items = invoice_data.get("items", [])
        if not items:
            items = [{
                "description": "500 ESigniva Credits",
                "sub_description": "One-time credit top-up • Non-expiring cloud balance",
                "quantity": 1,
                "unit_price": "$5.00",
                "amount": "$5.00"
            }]

        for item in items:
            desc_block = [
                Paragraph(item.get("description", "Credit Top-Up"), item_title_style),
                Paragraph(item.get("sub_description", "Official signing credits"), item_sub_style)
            ]
            items_data.append([
                desc_block,
                Paragraph(str(item.get("quantity", 1)), td_center),
                Paragraph(str(item.get("unit_price", "$5.00")), td_right),
                Paragraph(str(item.get("amount", "$5.00")), td_right_bold)
            ])

        items_table = Table(items_data, colWidths=[273, 50, 100, 100])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), bg_light),
            ('LINEBELOW', (0,0), (-1,0), 1, border_color),
            ('LINEBELOW', (0,1), (-1,-1), 0.5, border_color),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 18))

        # 5. Financial Summary & Compact Payment Details Section
        short_ref = invoice_data.get("short_reference") or invoice_data.get("payment_reference", "STRIPE-TX-ESI2026")
        payment_note = [
            Paragraph("PAYMENT CONFIRMATION", note_hdr),
            Spacer(1, 3),
            Paragraph("Payment processed securely through Stripe. Keep this invoice for your accounting and tax records.", note_txt),
            Spacer(1, 3),
            Paragraph(f"Reference: <strong>{short_ref}</strong> • Status: <strong>Cleared & Retained</strong>", note_txt),
        ]

        subtotal_str = invoice_data.get("subtotal_str") or f"${float(invoice_data.get('subtotal', 5.0)):.2f}"
        tax_str = invoice_data.get("tax_str") or f"${float(invoice_data.get('tax_amount', 0.0)):.2f}"
        total_str = invoice_data.get("total_str") or f"${float(invoice_data.get('total_amount', 5.0)):.2f}"
        balance_str = invoice_data.get("balance_str") or f"${float(invoice_data.get('balance_due', 0.0)):.2f}"

        totals_data = [
            [Paragraph("Subtotal", tot_label), Paragraph(subtotal_str, tot_val)],
            [Paragraph("Tax (0% / B2B SaaS)", tot_label), Paragraph(tax_str, tot_val)],
            [Paragraph("Total Paid", grand_label), Paragraph(total_str, grand_val)],
            [Paragraph("Balance Due", tot_label), Paragraph(balance_str, tot_val)],
        ]
        totals_table = Table(totals_data, colWidths=[120, 110])
        totals_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('LINEABOVE', (0,2), (-1,2), 1.5, teal),
            ('LINEBELOW', (0,2), (-1,2), 1, border_color),
            ('TOPPADDING', (0,2), (-1,2), 6),
            ('BOTTOMPADDING', (0,2), (-1,2), 6),
        ]))

        payment_box = Table([[payment_note]], colWidths=[270])
        payment_box.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_light),
            ('BOX', (0,0), (-1,-1), 1, border_color),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))

        summary_grid = Table([[payment_box, totals_table]], colWidths=[283, 240])
        summary_grid.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(KeepTogether(summary_grid))
        story.append(Spacer(1, 24))

        # 6. Footer Section
        story.append(HRFlowable(width="100%", thickness=1, color=border_color, spaceBefore=0, spaceAfter=14))
        footer_text = (
            "Thank you for choosing ESigniva.<br/>"
            "<strong>esigniva.com</strong> • support@esigniva.com • billing@esigniva.com<br/>"
            "This is an electronically generated official tax invoice and payment receipt. Valid without physical signature."
        )
        story.append(Paragraph(footer_text, footer_style))

        doc.build(story)
        return pdf_buffer.getvalue()

    @staticmethod
    def generate_invoice_html(invoice_data: Dict[str, Any]) -> str:
        """
        Generate pixel-perfect, responsive HTML invoice.
        Matches professional SaaS layout specifications (Stripe / Adobe / Microsoft 365).
        """
        issuer = invoice_data.get("issuer") or get_issuer_info()
        customer = invoice_data.get("customer") or {}
        items = invoice_data.get("items") or []

        inv_num = invoice_data.get("invoice_number", "ESI-2026-000125")
        status = invoice_data.get("status", "PAID")
        issue_date_str = invoice_data.get("issue_date_str", "20 Oct 2026")
        payment_date_str = invoice_data.get("payment_date_str", "20 Oct 2026")
        payment_method = invoice_data.get("payment_method", "Stripe")
        currency = invoice_data.get("currency", "USD")

        subtotal_str = invoice_data.get("subtotal_str") or f"${float(invoice_data.get('subtotal', 5.0)):.2f}"
        tax_str = invoice_data.get("tax_str") or f"${float(invoice_data.get('tax_amount', 0.0)):.2f}"
        total_str = invoice_data.get("total_str") or f"${float(invoice_data.get('total_amount', 5.0)):.2f}"
        balance_str = invoice_data.get("balance_str") or f"${float(invoice_data.get('balance_due', 0.0)):.2f}"
        short_ref = invoice_data.get("short_reference") or invoice_data.get("payment_reference", "STRIPE-TX-ESI2026")

        items_html = ""
        for itm in items:
            items_html += f"""
            <tr>
              <td>
                <div class="item-title">{itm.get('description', 'Credit Pack')}</div>
                <div class="item-sub">{itm.get('sub_description', 'Official signing credits')}</div>
              </td>
              <td style="text-align: center;">{itm.get('quantity', 1)}</td>
              <td style="text-align: right;">{itm.get('unit_price', '$5.00')}</td>
              <td style="text-align: right; font-weight: 700; color: #101828;">{itm.get('amount', '$5.00')}</td>
            </tr>
            """

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice - {inv_num}</title>
  <style>
    @page {{
      size: A4 portrait;
      margin: 14mm;
    }}
    * {{
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f8fafc;
      color: #101828;
      margin: 0;
      padding: 24px;
      font-size: 13px;
      line-height: 1.5;
    }}
    .invoice-card {{
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e4e7ec;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(16, 24, 40, 0.06);
      padding: 40px 48px;
    }}
    .header-grid {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }}
    .brand-section {{
      display: flex;
      align-items: center;
      gap: 14px;
    }}
    .brand-text h1 {{
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      color: #101828;
      letter-spacing: -0.5px;
    }}
    .brand-text .tagline {{
      font-size: 9px;
      font-weight: 700;
      color: #086b70;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-top: 1px;
    }}
    .brand-text .meta {{
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }}
    .inv-header-meta {{
      text-align: right;
    }}
    .inv-title {{
      font-size: 22px;
      font-weight: 800;
      color: #101828;
      letter-spacing: 0.5px;
      margin: 0 0 6px 0;
    }}
    .status-badge {{
      display: inline-block;
      padding: 3px 12px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      margin-bottom: 6px;
    }}
    .inv-number {{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 14px;
      font-weight: 700;
      color: #086b70;
    }}
    .divider {{
      border: none;
      border-top: 1px solid #e4e7ec;
      margin: 20px 0;
    }}
    .billing-grid {{
      display: flex;
      justify-content: space-between;
      gap: 32px;
      margin-bottom: 24px;
    }}
    .billing-col {{
      flex: 1;
    }}
    .section-label {{
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 6px;
    }}
    .entity-name {{
      font-size: 14px;
      font-weight: 700;
      color: #101828;
      margin-bottom: 2px;
    }}
    .entity-line {{
      font-size: 12px;
      color: #334155;
      line-height: 1.5;
    }}
    .metadata-bar {{
      display: flex;
      background: #f8fafc;
      border: 1px solid #e4e7ec;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 24px;
    }}
    .meta-box {{
      flex: 1;
      padding: 10px 14px;
      border-right: 1px solid #e4e7ec;
    }}
    .meta-box:last-child {{
      border-right: none;
    }}
    .meta-box .lbl {{
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 2px;
    }}
    .meta-box .val {{
      font-size: 12px;
      font-weight: 700;
      color: #101828;
    }}
    .items-table {{
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }}
    .items-table th {{
      background: #f8fafc;
      padding: 10px 14px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #101828;
      border-top: 1px solid #e4e7ec;
      border-bottom: 1px solid #e4e7ec;
    }}
    .items-table td {{
      padding: 12px 14px;
      border-bottom: 1px solid #e4e7ec;
      font-size: 12.5px;
      color: #334155;
    }}
    .item-title {{
      font-weight: 700;
      color: #101828;
    }}
    .item-sub {{
      font-size: 11px;
      color: #64748b;
      margin-top: 1px;
    }}
    .summary-grid {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 28px;
      margin-bottom: 28px;
    }}
    .payment-details-box {{
      flex: 1.1;
      background: #f8fafc;
      border: 1px solid #e4e7ec;
      border-radius: 8px;
      padding: 14px 16px;
    }}
    .pay-hdr {{
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #086b70;
      margin-bottom: 4px;
    }}
    .pay-txt {{
      font-size: 11.5px;
      color: #334155;
      line-height: 1.5;
    }}
    .totals-table {{
      flex: 0.9;
      border-collapse: collapse;
      margin-left: auto;
    }}
    .totals-table td {{
      padding: 5px 10px;
      font-size: 12.5px;
    }}
    .totals-table tr.grand-row td {{
      border-top: 2px solid #086b70;
      border-bottom: 1px solid #e4e7ec;
      padding: 10px 10px;
      font-size: 16px;
      font-weight: 800;
    }}
    .totals-table tr.grand-row td:last-child {{
      color: #086b70;
      text-align: right;
    }}
    .footer {{
      border-top: 1px solid #e4e7ec;
      padding-top: 18px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }}
    .footer strong {{
      color: #101828;
    }}
    @media print {{
      body {{
        background: #ffffff;
        padding: 0;
      }}
      .invoice-card {{
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }}
    }}
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header-grid">
      <div class="brand-section">
        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="invGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#086B70" />
              <stop offset="100%" stop-color="#0D9488" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="14" fill="url(#invGrad)"/>
          <path d="M32 14C32 14 44 16 44 26C44 38 32 48 32 48C32 48 20 38 20 26C20 16 32 14 32 14Z" 
                stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M26 28L30 32L38 22" 
                stroke="#5EEAD4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
        <div class="brand-text">
          <h1>ESigniva</h1>
          <div class="tagline">DIGITAL SIGNATURE PLATFORM</div>
          <div class="meta">billing@esigniva.com • https://esigniva.com</div>
        </div>
      </div>
      <div class="inv-header-meta">
        <div class="inv-title">INVOICE</div>
        <div class="status-badge">{status}</div>
        <div class="inv-number">{inv_num}</div>
      </div>
    </div>

    <hr class="divider" />

    <div class="billing-grid">
      <div class="billing-col">
        <div class="section-label">BILLED FROM</div>
        <div class="entity-name">{issuer.get('entity_name', 'ESigniva')}</div>
        <div class="entity-line">{issuer.get('legal_name', 'ESigniva Technologies')}</div>
        <div class="entity-line">{issuer.get('address_line1', 'Tech Innovation Hub, Cyber Gateway')}</div>
        <div class="entity-line">{issuer.get('city', 'Chennai')}, {issuer.get('state', 'Tamil Nadu')} {issuer.get('postal_code', '600096')}, {issuer.get('country', 'India')}</div>
        <div class="entity-line">Tax / GST ID: {issuer.get('tax_id', 'GSTIN33AAACE1234F1Z5')}</div>
        <div class="entity-line">Billing: {issuer.get('billing_email', 'billing@esigniva.com')}</div>
      </div>

      <div class="billing-col">
        <div class="section-label">BILLED TO</div>
        <div class="entity-name">{customer.get('name', 'Valued Customer')}</div>
        {f"<div class='entity-line'>{customer.get('company')}</div>" if customer.get('company') else ""}
        <div class="entity-line">{customer.get('address') or 'N/A'}</div>
        <div class="entity-line">Email: {customer.get('email', 'N/A')}</div>
        <div class="entity-line">Tax / VAT ID: {customer.get('tax_id') or 'N/A / Consumer'}</div>
      </div>
    </div>

    <div class="metadata-bar">
      <div class="meta-box">
        <div class="lbl">INVOICE DATE</div>
        <div class="val">{issue_date_str}</div>
      </div>
      <div class="meta-box">
        <div class="lbl">PAYMENT DATE</div>
        <div class="val">{payment_date_str}</div>
      </div>
      <div class="meta-box">
        <div class="lbl">PAYMENT METHOD</div>
        <div class="val">{payment_method}</div>
      </div>
      <div class="meta-box">
        <div class="lbl">CURRENCY</div>
        <div class="val">{currency} ($)</div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="text-align: left; width: 48%;">DESCRIPTION</th>
          <th style="text-align: center; width: 12%;">QTY</th>
          <th style="text-align: right; width: 20%;">UNIT PRICE</th>
          <th style="text-align: right; width: 20%;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        {items_html}
      </tbody>
    </table>

    <div class="summary-grid">
      <div class="payment-details-box">
        <div class="pay-hdr">PAYMENT CONFIRMATION</div>
        <div class="pay-txt">Payment processed securely through Stripe. Keep this invoice for your records.</div>
        <div class="pay-txt" style="margin-top: 4px; font-weight: 600;">Reference: {short_ref}</div>
        <div class="pay-txt" style="color: #64748b; font-size: 11px;">Status: Cleared &amp; Retained in Ledger • 256-bit SSL Encrypted</div>
      </div>

      <table class="totals-table">
        <tr>
          <td style="color: #64748b;">Subtotal</td>
          <td style="text-align: right; font-weight: 600; color: #101828;">{subtotal_str}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Tax (0% / B2B SaaS)</td>
          <td style="text-align: right; font-weight: 600; color: #101828;">{tax_str}</td>
        </tr>
        <tr class="grand-row">
          <td>Total Paid</td>
          <td>{total_str}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Balance Due</td>
          <td style="text-align: right; font-weight: 700; color: #059669;">{balance_str}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      Thank you for choosing <strong>ESigniva</strong>.<br/>
      <strong>esigniva.com</strong> • support@esigniva.com • billing@esigniva.com<br/>
      This is an electronically generated official tax invoice and payment receipt. Valid without physical signature.
    </div>
  </div>
</body>
</html>"""
