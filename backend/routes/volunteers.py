from flask import Blueprint, request, jsonify
from config.database import db
from routes.auth import token_required
from models.core import Volunteer

volunteers_bp = Blueprint('volunteers', __name__, url_prefix='/api/volunteers')

@volunteers_bp.route('', methods=['POST'])
@token_required
def create_volunteer():
    data = request.get_json(force=True)
    v = Volunteer(name=data.get('name','').strip(), email=data.get('email'), phone=data.get('phone'), role=data.get('role'))
    db.session.add(v)
    db.session.commit()
    return jsonify({'volunteer': serialize_volunteer(v)}), 201

@volunteers_bp.route('', methods=['GET'])
@token_required
def list_volunteers():
    q = Volunteer.query.order_by(Volunteer.created_at.desc())
    return jsonify({'items':[serialize_volunteer(x) for x in q.all()]})

@volunteers_bp.route('/<uuid:volunteer_id>', methods=['PUT'])
@token_required
def update_volunteer(volunteer_id):
    v = Volunteer.query.get(volunteer_id)
    if not v:
        return jsonify({'error':'not_found'}),404
    data = request.get_json(force=True)
    for f in ['name','email','phone','role']:
        if f in data:
            setattr(v, f, data[f])
    db.session.commit()
    return jsonify({'volunteer': serialize_volunteer(v)})

@volunteers_bp.route('/<uuid:volunteer_id>', methods=['DELETE'])
@token_required
def delete_volunteer(volunteer_id):
    v = Volunteer.query.get(volunteer_id)
    if not v:
        return jsonify({'error':'not_found'}),404
    db.session.delete(v)
    db.session.commit()
    return jsonify({'success': True})


def serialize_volunteer(v: Volunteer):
    return {
        'id': str(v.id),
        'name': v.name,
        'email': v.email,
        'phone': v.phone,
        'role': v.role,
        'created_at': v.created_at.isoformat() if v.created_at else None,
    }
