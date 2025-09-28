from flask import Blueprint, request, jsonify
from config.database import db
from routes.auth import token_required
from models.core import Speaker, Session

speakers_bp = Blueprint('speakers', __name__, url_prefix='/api/speakers')

@speakers_bp.route('', methods=['POST'])
@token_required
def create_speaker():
    data = request.get_json(force=True)
    s = Speaker(name=data.get('name','').strip(), email=data.get('email'), bio=data.get('bio'), expertise=data.get('expertise'))
    db.session.add(s)
    db.session.commit()
    return jsonify({'speaker': serialize_speaker(s)}), 201

@speakers_bp.route('', methods=['GET'])
@token_required
def list_speakers():
    q = Speaker.query.order_by(Speaker.created_at.desc())
    return jsonify({'items':[serialize_speaker(x) for x in q.all()]})

@speakers_bp.route('/<uuid:speaker_id>', methods=['PUT'])
@token_required
def update_speaker(speaker_id):
    s = Speaker.query.get(speaker_id)
    if not s:
        return jsonify({'error':'not_found'}),404
    data = request.get_json(force=True)
    for f in ['name','email','bio','expertise']:
        if f in data:
            setattr(s, f, data[f])
    db.session.commit()
    return jsonify({'speaker': serialize_speaker(s)})

@speakers_bp.route('/<uuid:speaker_id>', methods=['DELETE'])
@token_required
def delete_speaker(speaker_id):
    s = Speaker.query.get(speaker_id)
    if not s:
        return jsonify({'error':'not_found'}),404
    db.session.delete(s)
    db.session.commit()
    return jsonify({'success': True})

@speakers_bp.route('/<uuid:speaker_id>/sessions', methods=['POST'])
@token_required
def assign_session(speaker_id):
    sp = Speaker.query.get(speaker_id)
    if not sp:
        return jsonify({'error':'not_found'}),404
    data = request.get_json(force=True)
    sess = Session(title=data.get('title','').strip(), track=data.get('track'), type=data.get('type'), timeslot=data.get('timeslot'), speaker_id=sp.id)
    db.session.add(sess)
    db.session.commit()
    return jsonify({'session': serialize_session(sess)})


# Agenda is cross-cutting; minimal endpoints here for sessions list
@speakers_bp.route('/sessions', methods=['GET'])
@token_required
def list_sessions():
    q = Session.query.order_by(Session.created_at.desc())
    return jsonify({'items':[serialize_session(x) for x in q.all()]})


def serialize_speaker(s: Speaker):
    # Get session count for this speaker
    session_count = Session.query.filter_by(speaker_id=s.id).count()
    
    return {
        'id': str(s.id),
        'name': s.name,
        'email': s.email,
        'bio': s.bio,
        'expertise': s.expertise,
        'session_count': session_count,
    }


def serialize_session(s: Session):
    return {
        'id': str(s.id),
        'title': s.title,
        'track': s.track,
        'type': s.type,
        'timeslot': s.timeslot,
        'speaker_id': str(s.speaker_id) if s.speaker_id else None,
    }
