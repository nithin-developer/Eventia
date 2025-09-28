import io
import os
import base64
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from flask import Blueprint, request, jsonify, send_file
from reportlab.pdfgen import canvas
from routes.auth import token_required

certificates_bp = Blueprint('certificates', __name__, url_prefix='/api/certificates')

@certificates_bp.route('/generate', methods=['POST'])
@token_required
def generate_bulk():
    # Generate proper PDF certificates with template styling
    data = request.get_json(force=True)
    recipients = data.get('recipients', [])
    event_name = data.get('event_name', 'Event')
    event_date = data.get('event_date', 'Date')
    
    generated = []
    for r in recipients:
        name = r.get('name','Recipient')
        mem = io.BytesIO()
        c = canvas.Canvas(mem)
        
        # Set page size to A4 landscape
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.colors import Color
        c.setPageSize(landscape(A4))
        width, height = landscape(A4)
        
        # Background
        c.setFillColorRGB(1, 1, 1)  # White background
        c.rect(0, 0, width, height, fill=1)
        
        # Draw main border (green)
        c.setStrokeColor(Color(0, 0.788, 0.318))  # #00c951
        c.setLineWidth(10)
        c.rect(25, 25, width-50, height-50)
        
        # Center calculations
        center_x = width / 2
        
        # Title - "Certificate of Participation"
        c.setFont("Helvetica-Bold", 36)
        c.setFillColorRGB(0, 0, 0)
        c.drawCentredString(center_x, height - 100, "Certificate of Participation")
        
        # Subtitle
        c.setFont("Helvetica", 18)
        c.drawCentredString(center_x, height - 150, "This certificate is proudly presented to")
        
        # Recipient name (with underline)
        c.setFont("Times-Italic", 28)
        c.setFillColor(Color(0, 0.5, 0))  # Dark green
        name_width = c.stringWidth(name, "Times-Italic", 28)
        c.drawCentredString(center_x, height - 200, name)
        
        # Draw underline for name
        c.setStrokeColor(Color(0, 0.788, 0.318))
        c.setLineWidth(2)
        underline_start = center_x - (name_width / 2) - 20
        underline_end = center_x + (name_width / 2) + 20
        c.line(underline_start, height - 215, underline_end, height - 215)
        
        # "for actively participating in"
        c.setFont("Helvetica", 18)
        c.setFillColorRGB(0, 0, 0)
        c.drawCentredString(center_x, height - 260, "for actively participating in")
        
        # Event name (with underline)
        c.setFont("Helvetica-Bold", 22)
        c.setFillColor(Color(0, 0.5, 0))
        event_width = c.stringWidth(event_name, "Helvetica-Bold", 22)
        c.drawCentredString(center_x, height - 310, event_name)
        
        # Draw underline for event
        c.setStrokeColor(Color(0, 0.788, 0.318))
        c.setLineWidth(2)
        event_underline_start = center_x - (event_width / 2) - 20
        event_underline_end = center_x + (event_width / 2) + 20
        c.line(event_underline_start, height - 325, event_underline_end, height - 325)
        
        # "held on"
        c.setFont("Helvetica", 18)
        c.setFillColorRGB(0, 0, 0)
        c.drawCentredString(center_x, height - 370, "held on")
        
        # Event date (with underline)
        c.setFont("Helvetica-Bold", 20)
        c.setFillColor(Color(0, 0.5, 0))
        date_width = c.stringWidth(event_date, "Helvetica-Bold", 20)
        c.drawCentredString(center_x, height - 420, event_date)
        
        # Draw underline for date
        c.setStrokeColor(Color(0, 0.788, 0.318))
        c.setLineWidth(2)
        date_underline_start = center_x - (date_width / 2) - 15
        date_underline_end = center_x + (date_width / 2) + 15
        c.line(date_underline_start, height - 435, date_underline_end, height - 435)
        
        # Footer area
        footer_y = 80
        
        # Left signature area
        c.setFont("Helvetica", 14)
        c.setFillColorRGB(0, 0, 0)
        c.drawCentredString(200, footer_y, "Organizer Signature")
        c.setLineWidth(1)
        c.setStrokeColorRGB(0, 0, 0)
        c.line(120, footer_y + 20, 280, footer_y + 20)
        
        # Right seal area
        c.drawCentredString(width - 200, footer_y, "Official Seal")
        c.line(width - 280, footer_y + 20, width - 120, footer_y + 20)
        
        c.showPage()
        c.save()
        mem.seek(0)
        pdf_content = mem.getvalue()
        pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
        
        generated.append({
            'name': name, 
            'bytes': len(pdf_content),
            'pdf_base64': pdf_base64
        })
    
    return jsonify({'generated': generated})


@certificates_bp.route('/bulk-email', methods=['POST'])
@token_required
def bulk_email():
    """
    Payload shape:
    {
      "subject": "string",
      "body": "string (plain or HTML)",
      "is_html": true,
      "messages": [
        { "to": "user@example.com", "name": "Recipient Name", "attachment": { "filename": "certificate.pdf", "content_base64": "..." } }
      ]
    }
    """
    data = request.get_json(force=True)
    subject = data.get('subject') or 'Your Certificate'
    body = data.get('body') or ''
    is_html = bool(data.get('is_html', True))
    messages = data.get('messages', [])

    smtp_host = os.getenv('SMTP_HOST')
    smtp_port = int(os.getenv('SMTP_PORT') or 587)
    smtp_user = os.getenv('SMTP_USER')
    smtp_pass = os.getenv('SMTP_PASS')
    smtp_from = os.getenv('SMTP_FROM') or smtp_user
    smtp_starttls = (os.getenv('SMTP_STARTTLS') or 'true').lower() in ('1','true','yes')
    smtp_ssl = (os.getenv('SMTP_SSL') or 'false').lower() in ('1','true','yes')

    if not smtp_host or not smtp_from:
        return jsonify({ 'error': 'smtp_not_configured', 'message': 'Set SMTP_HOST and SMTP_FROM in environment' }), 400

    sent = 0
    errors = []
    try:
        # Try SSL first if configured, otherwise start with plain SMTP
        if smtp_ssl:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=30)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=30)
        with server:
            try:
                server.ehlo()
            except Exception:
                pass
            if not smtp_ssl and smtp_starttls:
                try:
                    server.starttls()
                    try:
                        server.ehlo()
                    except Exception:
                        pass
                except Exception as e:
                    # proceed without TLS but note the issue
                    errors.append({ 'to': None, 'error': f'starttls_failed: {e}' })
            if smtp_user and smtp_pass:
                try:
                    server.login(smtp_user, smtp_pass)
                except Exception as e:
                    return jsonify({ 'error': 'smtp_auth_failed', 'message': str(e) }), 401
            for msg in messages:
                to = msg.get('to')
                name = msg.get('name')
                attachment = msg.get('attachment') or {}
                if not to:
                    errors.append({ 'to': None, 'error': 'missing_to' })
                    continue
                mime = MIMEMultipart()
                mime['From'] = smtp_from
                mime['To'] = to
                mime['Subject'] = subject
                if is_html:
                    mime.attach(MIMEText(body.replace('{name}', name or ''), 'html'))
                else:
                    mime.attach(MIMEText(body.replace('{name}', name or ''), 'plain'))
                content_b64 = attachment.get('content_base64')
                filename = attachment.get('filename') or 'certificate.pdf'
                if content_b64:
                    try:
                        raw = base64.b64decode(content_b64)
                        part = MIMEApplication(raw, _subtype='pdf')
                        part.add_header('Content-Disposition', 'attachment', filename=filename)
                        mime.attach(part)
                    except Exception as e:
                        errors.append({ 'to': to, 'error': f'attachment_error: {e}' })
                        # still try sending without attachment
                try:
                    server.sendmail(smtp_from, [to], mime.as_string())
                    sent += 1
                except Exception as e:
                    errors.append({ 'to': to, 'error': str(e) })
    except Exception as e:
        return jsonify({ 'error': 'smtp_connection_failed', 'message': str(e) }), 500

    return jsonify({ 'sent': sent, 'errors': errors })
