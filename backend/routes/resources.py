import os
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from routes.auth import token_required
from models.core import ResourceFile
from config.database import db

UPLOAD_DIR = os.getenv('UPLOAD_DIR', os.path.join(os.getcwd(), 'uploads'))
os.makedirs(UPLOAD_DIR, exist_ok=True)

resources_bp = Blueprint('resources', __name__, url_prefix='/api/resources')

@resources_bp.route('', methods=['POST'])
@token_required
def upload_resource():
    if 'file' not in request.files:
        return jsonify({'error': 'file_missing'}), 400
    f = request.files['file']
    if not f.filename:
        return jsonify({'error': 'filename_missing'}), 400
    original = secure_filename(f.filename)
    fid = str(uuid.uuid4())
    server_name = f"{fid}_{original}"
    dest = os.path.join(UPLOAD_DIR, server_name)
    f.save(dest)
    rf = ResourceFile(filename=server_name, original_name=original, content_type=f.mimetype, size=os.path.getsize(dest), category=request.form.get('category'))
    db.session.add(rf)
    db.session.commit()
    return jsonify({'resource': serialize_resource(rf)}), 201

@resources_bp.route('', methods=['GET'])
@token_required
def list_resources():
    category = request.args.get('category')
    q = ResourceFile.query
    if category:
        q = q.filter(ResourceFile.category == category)
    q = q.order_by(ResourceFile.created_at.desc())
    return jsonify({'items':[serialize_resource(x) for x in q.all()]})


@resources_bp.route('/html', methods=['POST'])
@token_required
def upload_html_template():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    html = data.get('html')
    category = (data.get('category') or 'template').strip() or 'template'
    if not name:
        return jsonify({'error': 'name_required'}), 400
    if not html:
        return jsonify({'error': 'html_required'}), 400
    # ensure extension
    base_name = secure_filename(name)
    if not base_name.lower().endswith('.html'):
        base_name = f"{base_name}.html"
    fid = str(uuid.uuid4())
    server_name = f"{fid}_{base_name}"
    dest = os.path.join(UPLOAD_DIR, server_name)
    try:
        with open(dest, 'w', encoding='utf-8') as f:
            f.write(html)
    except Exception:
        return jsonify({'error': 'write_failed'}), 500
    rf = ResourceFile(
        filename=server_name,
        original_name=base_name,
        content_type='text/html',
        size=os.path.getsize(dest),
        category=category or 'template'
    )
    db.session.add(rf)
    db.session.commit()
    return jsonify({'resource': serialize_resource(rf)}), 201


def serialize_resource(r: ResourceFile):
    return {
        'id': str(r.id),
        'filename': r.filename,
        'original_name': r.original_name,
        'content_type': r.content_type,
        'size': r.size,
        'category': r.category,
        'created_at': r.created_at.isoformat() if r.created_at else None,
    }
