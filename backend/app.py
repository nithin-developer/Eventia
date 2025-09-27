import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from config.database import init_app, db
from werkzeug.security import generate_password_hash
from datetime import datetime as dt
from routes.auth import auth_bp
from routes.tasks import tasks_bp
from routes.vendors import vendors_bp
from routes.resources import resources_bp
from routes.volunteers import volunteers_bp
from routes.speakers import speakers_bp
from routes.agenda import agenda_bp
from routes.feedback import feedback_bp
from routes.certificates import certificates_bp
from routes.gallery import gallery_bp

# Models
from models.admins import Admin
from models.core import Volunteer, Vendor, Speaker, Session, ResourceFile, SessionFeedback, EventFeedback
# Eventia data models will be imported as needed in blueprints

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-change')

# Allow multiple frontend origins for dev (5173/5174; localhost and 127.0.0.1)
origins_env = os.getenv('FRONTEND_ORIGINS') or os.getenv('FRONTEND_ORIGIN')
if origins_env:
    frontend_origins = [o.strip() for o in origins_env.split(',') if o.strip()]
else:
    frontend_origins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
    ]

CORS(
    app,
    resources={r"/api/*": {
        "origins": frontend_origins,
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }},
    supports_credentials=True,
)
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', str(25 * 1024 * 1024)))  # 25MB default
init_app(app)  # Initialize the database

# Optionally auto-create tables in development for quick start
if os.getenv('AUTO_CREATE_DB', 'true').lower() == 'true':
    try:
        with app.app_context():
            db.create_all()
    except Exception:
        # If using migrations or DB not reachable, ignore here
        pass


def ensure_schema_evolution():
    """Minimal dev-time schema evolution for Task.position column.
    This avoids a manual migration step while prototyping Kanban.
    In production, prefer Alembic migrations instead.
    """
    try:
        from sqlalchemy import inspect, text
        insp = inspect(db.engine)
        if not insp.has_table('tasks'):
            return
        cols = [c['name'] for c in insp.get_columns('tasks')]
        if 'position' not in cols:
            with db.engine.begin() as conn:
                conn.execute(text('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0'))
                # optional: backfill explicit 0
                conn.execute(text('UPDATE tasks SET position = 0 WHERE position IS NULL'))
                # optional: create index (non-concurrent for dev)
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_tasks_position ON tasks (position)'))
            print('[schema] Added tasks.position column')
    except Exception as e:
        # Log and continue; DB may not be ready yet
        print(f"[schema] ensure_schema_evolution skipped: {e}")


@app.before_request
def _ensure_schema_on_first_request():
    try:
        ensure_schema_evolution()
    except Exception as e:
        print(f"[schema] before_first_request error: {e}")


# Add/ensure default admin
def add_default_admin():
    with app.app_context():
        email = os.getenv('DEFAULT_ADMIN_EMAIL', "admin@event-track.com")
        password = os.getenv('DEFAULT_ADMIN_PASSWORD', "admin123")

        # check if already exists
        admin = Admin.query.filter_by(email=email).first()
        if admin:
            if os.getenv('DEFAULT_ADMIN_OVERWRITE', 'false').lower() == 'true':
                admin.hashed_password = generate_password_hash(password)
                admin.role = admin.role or 'super_admin'
                db.session.commit()
                print(f"Default admin existed; password reset per DEFAULT_ADMIN_OVERWRITE.")
            else:
                print(f"Admin with email {email} already exists.")
            return

        new_admin = Admin(
            full_name="Default Super Admin",
            email=email,
            hashed_password=generate_password_hash(password),
            role="super_admin",
        )
        db.session.add(new_admin)
        db.session.commit()
        print(f"Default admin created with email: {email} and password: {password}")


def ensure_default_admin_if_configured():
    """Create a default admin if SEED_DEFAULT_ADMIN is true (default true for dev)."""
    seed = os.getenv('SEED_DEFAULT_ADMIN', 'true').lower() == 'true'
    if not seed:
        return
    try:
        add_default_admin()
    except Exception as e:
        # Avoid crashing app if DB not ready; just log
        print(f"[ensure_default_admin] skipped or failed: {e}")


# Health check endpoint (dev)
@app.route('/api/health', methods=['GET'])
def get_health():
    return jsonify({"status": "healthy", "timestamp": dt.now()}), 200


# Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(tasks_bp)
app.register_blueprint(vendors_bp)
app.register_blueprint(resources_bp)
app.register_blueprint(volunteers_bp)
app.register_blueprint(speakers_bp)
app.register_blueprint(agenda_bp)
app.register_blueprint(feedback_bp)
app.register_blueprint(certificates_bp)
app.register_blueprint(gallery_bp)


if __name__ == '__main__':
    # Always ensure default admin in dev unless disabled by env
    ensure_default_admin_if_configured()
    # Ensure schema adjustments inside app context
    try:
        with app.app_context():
            ensure_schema_evolution()
    except Exception as e:
        print(f"[schema] startup ensure_schema_evolution error: {e}")
    app.run(debug=True, host='0.0.0.0', port=8000)
