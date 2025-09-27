import os
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from routes.auth import token_required

UPLOAD_DIR = os.getenv('GALLERY_DIR', os.path.join(os.getcwd(), 'gallery'))
os.makedirs(UPLOAD_DIR, exist_ok=True)

gallery_bp = Blueprint('gallery', __name__, url_prefix='/api/gallery')

@gallery_bp.route('/photos', methods=['POST'])
@token_required
def upload_photo():
    album = request.form.get('album') or 'default'
    if 'file' not in request.files:
        return jsonify({'error': 'file_missing'}), 400
    f = request.files['file']
    if not f.filename:
        return jsonify({'error': 'filename_missing'}), 400
    original = secure_filename(f.filename)
    fid = str(uuid.uuid4())
    server_name = f"{album}_{fid}_{original}"
    dest = os.path.join(UPLOAD_DIR, server_name)
    f.save(dest)
    return jsonify({'photo': {'album': album, 'filename': server_name}}), 201

@gallery_bp.route('/photos', methods=['GET'])
@token_required
def list_photos():
    files = []
    for fn in os.listdir(UPLOAD_DIR):
        files.append({'filename': fn, 'album': fn.split('_',1)[0] if '_' in fn else 'default'})
    return jsonify({'items': files})
