from flask import Blueprint, request, jsonify
from config.database import db
from routes.auth import token_required
from models.core import Vendor

vendors_bp = Blueprint('vendors', __name__, url_prefix='/api/vendors')

@vendors_bp.route('', methods=['POST'])
@token_required
def create_vendor():
    data = request.get_json(force=True)
    v = Vendor(
        name=data.get('name','').strip(),
        category=data.get('category'),
        contact_name=data.get('contact_name'),
        email=data.get('email'),
        phone=data.get('phone'),
        notes=data.get('notes'),
    )
    db.session.add(v)
    db.session.commit()
    return jsonify({'vendor': serialize_vendor(v)}), 201

@vendors_bp.route('', methods=['GET'])
@token_required
def list_vendors():
    q = Vendor.query.order_by(Vendor.created_at.desc())
    return jsonify({'items':[serialize_vendor(x) for x in q.all()]})

@vendors_bp.route('/<uuid:vendor_id>', methods=['PUT'])
@token_required
def update_vendor(vendor_id):
    v = Vendor.query.get(vendor_id)
    if not v:
        return jsonify({'error':'not_found'}), 404
    data=request.get_json(force=True)
    for f in ['name','category','contact_name','email','phone','notes']:
        if f in data:
            setattr(v, f, data[f])
    db.session.commit()
    return jsonify({'vendor': serialize_vendor(v)})

@vendors_bp.route('/<uuid:vendor_id>', methods=['DELETE'])
@token_required
def delete_vendor(vendor_id):
    v=Vendor.query.get(vendor_id)
    if not v:
        return jsonify({'error':'not_found'}),404
    db.session.delete(v)
    db.session.commit()
    return jsonify({'success': True})


def serialize_vendor(v: Vendor):
    return {
        'id': str(v.id),
        'name': v.name,
        'category': v.category,
        'contact_name': v.contact_name,
        'email': v.email,
        'phone': v.phone,
        'notes': v.notes,
        'created_at': v.created_at.isoformat() if v.created_at else None,
    }
