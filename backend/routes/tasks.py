from flask import Blueprint, request, jsonify
from sqlalchemy import and_
from config.database import db
from routes.auth import token_required
from models.core import Task
import uuid


tasks_bp = Blueprint('tasks', __name__, url_prefix='/api/tasks')

ALLOWED_STATUSES = {"todo", "in_progress", "done"}


def next_position(status: str) -> int:
    try:
        max_pos = db.session.query(db.func.max(Task.position)).filter(Task.status == status).scalar()
        return int(max_pos or 0) + 1 if max_pos is not None else 0
    except Exception:
        return 0


@tasks_bp.route('', methods=['POST'])
@token_required
def create_task():
    data = request.get_json(force=True)
    status = (data.get('status') or 'todo').strip()
    if status not in ALLOWED_STATUSES:
        status = 'todo'
    pos = data.get('position')
    try:
        position = int(pos) if pos is not None else next_position(status)
    except Exception:
        position = next_position(status)
    t = Task(
        title=data.get('title','').strip(),
        description=data.get('description'),
        status=status,
        stage=data.get('stage'),
        assignee=data.get('assignee'),
        position=position,
    )
    db.session.add(t)
    db.session.commit()
    return jsonify({'task': serialize_task(t)}), 201


@tasks_bp.route('', methods=['GET'])
@token_required
def list_tasks():
    status = request.args.get('status')
    stage = request.args.get('stage')
    person = request.args.get('person')
    q = Task.query
    if status:
        q = q.filter(Task.status==status)
    if stage:
        q = q.filter(Task.stage==stage)
    if person:
        q = q.filter(Task.assignee==person)
    items = [serialize_task(x) for x in q.order_by(Task.status.asc(), Task.position.asc(), Task.created_at.asc()).all()]
    return jsonify({'items': items})


@tasks_bp.route('/board', methods=['GET'])
@token_required
def get_board():
    """Return tasks grouped by columns for Kanban."""
    tasks = Task.query.order_by(Task.status.asc(), Task.position.asc(), Task.created_at.asc()).all()
    board = {k: [] for k in ALLOWED_STATUSES}
    for t in tasks:
        col = t.status if t.status in ALLOWED_STATUSES else 'todo'
        board[col].append(serialize_task(t))
    return jsonify({'columns': board})


@tasks_bp.route('/<uuid:task_id>', methods=['PUT'])
@token_required
def update_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error':'not_found'}), 404
    data = request.get_json(force=True)
    status = data.get('status')
    if status is not None:
        if status not in ALLOWED_STATUSES:
            return jsonify({'error': 'invalid_status'}), 400
        # If status changed and no explicit position provided, move to end of new column
        if status != task.status and 'position' not in data:
            task.status = status
            task.position = next_position(status)
    for f in ['title','description','stage','assignee']:
        if f in data:
            setattr(task, f, data[f])
    if 'position' in data:
        try:
            task.position = int(data['position'])
        except Exception:
            pass
    db.session.commit()
    return jsonify({'task': serialize_task(task)})


@tasks_bp.route('/<uuid:task_id>', methods=['DELETE'])
@token_required
def delete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error':'not_found'}), 404
    db.session.delete(task)
    db.session.commit()
    return jsonify({'success': True})


@tasks_bp.route('/reorder', methods=['POST'])
@token_required
def reorder_tasks():
    """
    Batch update tasks order and status after drag-and-drop.
    Expected payload:
    {
      "columns": {
        "todo": ["taskId1","taskId2", ...],
        "in_progress": [ ... ],
        "done": [ ... ]
      }
    }
    """
    body = request.get_json(force=True) or {}
    columns = (body.get('columns') or {})
    allowed_cols = ['todo', 'in_progress', 'done']
    updates = []
    for col in allowed_cols:
        ids = columns.get(col) or []
        for idx, tid in enumerate(ids):
            updates.append((tid, col, idx))

    if not updates:
        return jsonify({'updated': 0})

    # Load all tasks in one query
    # Convert ids to UUID objects for DB comparison
    id_uuids = []
    for tid, _, _ in updates:
        try:
            id_uuids.append(uuid.UUID(str(tid)))
        except Exception:
            continue
    if not id_uuids:
        return jsonify({'updated': 0})
    tasks = Task.query.filter(Task.id.in_(id_uuids)).all()
    by_id = {str(t.id): t for t in tasks}

    changed = 0
    for tid, col, pos in updates:
        t = by_id.get(str(tid))
        if not t:
            continue
        if t.status != col or t.position != pos:
            t.status = col
            t.position = pos
            changed += 1
    if changed:
        db.session.commit()
    return jsonify({'updated': changed})


def serialize_task(t: Task):
    return {
        'id': str(t.id),
        'title': t.title,
        'description': t.description,
        'status': t.status,
        'stage': t.stage,
        'assignee': t.assignee,
        'position': t.position,
        'created_at': t.created_at.isoformat() if t.created_at else None,
        'updated_at': t.updated_at.isoformat() if t.updated_at else None,
    }
