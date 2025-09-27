import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from config.database import db


class TimestampMixin:
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = db.Column(db.DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Task(db.Model, TimestampMixin):
    __tablename__ = 'tasks'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    # Kanban status columns: todo | in_progress | done
    status = db.Column(db.String(32), index=True, default='todo')
    stage = db.Column(db.String(32), index=True)  # planning|logistics|execution|post
    assignee = db.Column(db.String(100), index=True)
    due_date = db.Column(db.DateTime(timezone=True), index=True)
    # Position within a status column (0-based order)
    position = db.Column(db.Integer, index=True, default=0)


class Vendor(db.Model, TimestampMixin):
    __tablename__ = 'vendors'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(200), nullable=False, index=True)
    category = db.Column(db.String(100), index=True)
    contact_name = db.Column(db.String(100))
    email = db.Column(db.String(200))
    phone = db.Column(db.String(50))
    notes = db.Column(db.Text)


class ResourceFile(db.Model, TimestampMixin):
    __tablename__ = 'resource_files'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = db.Column(db.String(255), nullable=False)
    original_name = db.Column(db.String(255))
    content_type = db.Column(db.String(100))
    size = db.Column(db.Integer)
    category = db.Column(db.String(100))  # template|asset


class Volunteer(db.Model, TimestampMixin):
    __tablename__ = 'volunteers'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200))
    phone = db.Column(db.String(50))
    role = db.Column(db.String(100), index=True)


class Speaker(db.Model, TimestampMixin):
    __tablename__ = 'speakers'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200))
    bio = db.Column(db.Text)
    expertise = db.Column(db.String(200), index=True)


class Session(db.Model, TimestampMixin):
    __tablename__ = 'sessions'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = db.Column(db.String(200), nullable=False)
    track = db.Column(db.String(100), index=True)
    type = db.Column(db.String(100), index=True)
    timeslot = db.Column(db.String(100), index=True)  # e.g., '10:00-11:00'
    speaker_id = db.Column(UUID(as_uuid=True), db.ForeignKey('speakers.id'))


class SessionFeedback(db.Model, TimestampMixin):
    __tablename__ = 'session_feedback'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = db.Column(UUID(as_uuid=True), db.ForeignKey('sessions.id'), index=True)
    rating = db.Column(db.Integer)
    comment = db.Column(db.Text)


class EventFeedback(db.Model, TimestampMixin):
    __tablename__ = 'event_feedback'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rating = db.Column(db.Integer)
    comment = db.Column(db.Text)


class CertificateTemplate(db.Model, TimestampMixin):
    __tablename__ = 'certificate_templates'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(200), nullable=False)
    file_id = db.Column(UUID(as_uuid=True), db.ForeignKey('resource_files.id'))


class Photo(db.Model, TimestampMixin):
    __tablename__ = 'photos'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    album = db.Column(db.String(200), index=True)
    filename = db.Column(db.String(255), nullable=False)
    original_name = db.Column(db.String(255))
    visibility = db.Column(db.String(50), default='private', index=True)
