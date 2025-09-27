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
    # Demo: generate a simple PDF per name; in production, merge with template file and placeholders
    data = request.get_json(force=True)
    recipients = data.get('recipients', [])
    generated = []
    for r in recipients:
        name = r.get('name','Recipient')
        mem = io.BytesIO()
        c = canvas.Canvas(mem)
        c.setFont("Helvetica", 18)
        c.drawString(100, 750, f"Certificate of Participation")
        c.setFont("Helvetica", 14)
        c.drawString(100, 700, f"Awarded to: {name}")
        c.showPage()
        c.save()
        mem.seek(0)
        generated.append({'name': name, 'bytes': len(mem.getvalue())})
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

    if not smtp_host or not smtp_from:
        return jsonify({ 'error': 'smtp_not_configured', 'message': 'Set SMTP_HOST and SMTP_FROM in environment' }), 400

    sent = 0
    errors = []
    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
            if smtp_starttls:
                try:
                    server.starttls()
                except Exception:
                    # continue without TLS
                    pass
            if smtp_user and smtp_pass:
                server.login(smtp_user, smtp_pass)
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
