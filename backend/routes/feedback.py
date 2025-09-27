from flask import Blueprint, request, jsonify
from routes.auth import token_required
from models.core import SessionFeedback, EventFeedback
from config.database import db

feedback_bp = Blueprint('feedback', __name__, url_prefix='/api/feedback')

@feedback_bp.route('/session', methods=['POST'])
@token_required
def post_session_feedback():
    data = request.get_json(force=True)
    fb = SessionFeedback(session_id=data.get('session_id'), rating=data.get('rating'), comment=data.get('comment'))
    db.session.add(fb)
    db.session.commit()
    return jsonify({'success': True}), 201

@feedback_bp.route('/event', methods=['POST'])
@token_required
def post_event_feedback():
    data = request.get_json(force=True)
    fb = EventFeedback(rating=data.get('rating'), comment=data.get('comment'))
    db.session.add(fb)
    db.session.commit()
    return jsonify({'success': True}), 201

@feedback_bp.route('/analytics', methods=['GET'])
@token_required
def get_analytics():
    # Basic aggregates (can be optimized with actual SQL aggregation)
    session_count = SessionFeedback.query.count()
    event_count = EventFeedback.query.count()
    avg_session = db.session.query(db.func.avg(SessionFeedback.rating)).scalar() or 0
    avg_event = db.session.query(db.func.avg(EventFeedback.rating)).scalar() or 0
    return jsonify({
        'session_feedback_count': session_count,
        'event_feedback_count': event_count,
        'avg_session_rating': float(avg_session),
        'avg_event_rating': float(avg_event)
    })
