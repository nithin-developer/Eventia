from flask import Blueprint, request, jsonify
from routes.auth import token_required
from models.core import Session
from config.database import db

agenda_bp = Blueprint('agenda', __name__, url_prefix='/api/agenda')

# Upload agenda via parsed payload (frontend can parse Excel and send JSON initially)
@agenda_bp.route('/upload', methods=['POST'])
@token_required
def upload_agenda():
    data = request.get_json(force=True)
    sessions = data.get('sessions', [])
    created = []
    for s in sessions:
        sess = Session(title=s.get('title',''), track=s.get('track'), type=s.get('type'), timeslot=s.get('timeslot'), speaker_id=s.get('speaker_id'))
        db.session.add(sess)
        created.append(sess)
    db.session.commit()
    return jsonify({'items':[serialize_session(x) for x in created]}), 201

@agenda_bp.route('/sessions', methods=['GET'])
@token_required
def get_sessions():
    q = Session.query.order_by(Session.created_at.desc())
    return jsonify({'items':[serialize_session(x) for x in q.all()]})

@agenda_bp.route('/sessions', methods=['POST'])
@token_required
def create_session():
    data = request.get_json(force=True)
    s = Session(
        title=data.get('title','').strip(),
        track=data.get('track'),
        type=data.get('type'),
        timeslot=data.get('timeslot'),
        speaker_id=data.get('speaker_id')
    )
    db.session.add(s)
    db.session.commit()
    return jsonify({'session': serialize_session(s)}), 201

@agenda_bp.route('/sessions/<uuid:session_id>', methods=['PUT'])
@token_required
def update_session(session_id):
    s = Session.query.get(session_id)
    if not s:
        return jsonify({'error':'not_found'}),404
    data = request.get_json(force=True)
    for f in ['title','track','type','timeslot','speaker_id']:
        if f in data:
            setattr(s, f, data[f])
    db.session.commit()
    return jsonify({'session': serialize_session(s)})

@agenda_bp.route('/sessions/<uuid:session_id>', methods=['DELETE'])
@token_required
def delete_session(session_id):
    s = Session.query.get(session_id)
    if not s:
        return jsonify({'error':'not_found'}),404
    db.session.delete(s)
    db.session.commit()
    return jsonify({'success': True})


def serialize_session(s: Session):
    return {
        'id': str(s.id),
        'title': s.title,
        'track': s.track,
        'type': s.type,
        'timeslot': s.timeslot,
        'speaker_id': str(s.speaker_id) if s.speaker_id else None,
    }
