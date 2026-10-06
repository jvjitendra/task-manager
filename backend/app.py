import os
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text
from werkzeug.security import check_password_hash, generate_password_hash


app = Flask(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///tasks.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql+psycopg2://",
        1
    )
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg2://",
        1
    )

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-change-me")
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

frontend_url = os.getenv("FRONTEND_URL", "*")
CORS(app, resources={r"/*": {"origins": frontend_url}})

db = SQLAlchemy(app)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(254), unique=True, nullable=False, index=True)
    email = db.Column(db.String(254), unique=True, nullable=True, index=True)
    full_name = db.Column(db.String(120), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    tasks = db.relationship(
        "Task",
        backref="owner",
        lazy=True,
        cascade="all, delete-orphan",
    )


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.String(1000), default="", nullable=False)
    status = db.Column(db.String(20), default="pending", nullable=False, index=True)
    priority = db.Column(db.String(20), default="medium", nullable=False)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description or "",
            "status": self.status,
            "priority": self.priority,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


def ensure_legacy_user_columns():
    """
    Keep an older local tasks.db usable after adding profile fields.
    This is intentionally limited to SQLite-compatible ALTER TABLE operations.
    """
    inspector = inspect(db.engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("users")}

    if "email" not in columns:
        with db.engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(254)"))

    if "full_name" not in columns:
        with db.engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(120)"))

    inspector = inspect(db.engine)
    columns = {column["name"] for column in inspector.get_columns("users")}

    # Existing early versions used username as the login identifier.
    if "email" in columns:
        with db.engine.begin() as connection:
            connection.execute(
                text(
                    "UPDATE users "
                    "SET email = username "
                    "WHERE email IS NULL OR email = ''"
                )
            )


with app.app_context():
    db.create_all()
    # Only run schema compatibility changes for SQLite-style local development.
    if DATABASE_URL.startswith("sqlite"):
        ensure_legacy_user_columns()


def utc_now():
    return datetime.now(timezone.utc)


def normalize_email(value):
    return str(value or "").strip().lower()


def friendly_name(user):
    if user.full_name and user.full_name.strip():
        return user.full_name.strip()
    return (user.email or user.username).split("@")[0]


def token_required(fn):
    @wraps(fn)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization", "").strip()
        if not auth:
            return jsonify({"message": "Authentication token is required."}), 401

        try:
            parts = auth.split()
            token = (
                parts[1]
                if len(parts) == 2 and parts[0].lower() == "bearer"
                else auth
            )
            payload = jwt.decode(
                token,
                app.config["SECRET_KEY"],
                algorithms=["HS256"],
            )
            user = db.session.get(User, payload["user_id"])
            if not user:
                return jsonify({"message": "Invalid authentication token."}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Session expired. Please login again."}), 401
        except (jwt.InvalidTokenError, KeyError, ValueError, TypeError):
            return jsonify({"message": "Invalid authentication token."}), 401

        return fn(user, *args, **kwargs)

    return decorated


def validate_task_payload(data, partial=False):
    if not isinstance(data, dict):
        return "Request body must be valid JSON."

    if not partial and not str(data.get("title", "")).strip():
        return "Title is required."

    if "title" in data and not (1 <= len(str(data["title"]).strip()) <= 200):
        return "Title must be between 1 and 200 characters."

    if "description" in data and len(str(data["description"])) > 1000:
        return "Description cannot exceed 1000 characters."

    if "status" in data and data["status"] not in {"pending", "in_progress", "done"}:
        return "Status must be pending, in_progress, or done."

    if "priority" in data and data["priority"] not in {"low", "medium", "high"}:
        return "Priority must be low, medium, or high."

    return None


def user_payload(user):
    return {
        "id": user.id,
        "email": user.email or user.username,
        "full_name": friendly_name(user),
    }


@app.get("/")
def health():
    try:
        db.session.execute(text("SELECT 1"))
        return jsonify(
            {
                "status": "ok",
                "service": "TaskFlow API",
                "database": "ok",
                "version": "1.2.0",
            }
        )
    except Exception:
        return (
            jsonify(
                {
                    "status": "error",
                    "service": "TaskFlow API",
                    "database": "error",
                    "version": "1.2.0",
                }
            ),
            503,
        )


@app.post("/api/register")
def register():
    data = request.get_json(silent=True) or {}

    full_name = str(data.get("full_name", "")).strip()
    email = normalize_email(data.get("email"))
    password = str(data.get("password", ""))

    if not full_name or not email or not password:
        return jsonify({"message": "Name, email and password are required."}), 400

    if not (2 <= len(full_name) <= 120):
        return jsonify({"message": "Name must be between 2 and 120 characters."}), 400

    if "@" not in email or "." not in email.rsplit("@", 1)[-1]:
        return jsonify({"message": "Please enter a valid email address."}), 400

    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters."}), 400

    existing = User.query.filter(
        (User.email == email) | (User.username == email)
    ).first()
    if existing:
        return jsonify({"message": "An account with this email already exists."}), 409

    user = User(
        username=email,
        email=email,
        full_name=full_name,
        password_hash=generate_password_hash(password),
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Account created successfully."}), 201


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}

    email = normalize_email(data.get("email"))
    password = str(data.get("password", ""))

    user = User.query.filter(
        (User.email == email) | (User.username == email)
    ).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid email or password."}), 401

    token = jwt.encode(
        {
            "user_id": user.id,
            "exp": utc_now() + timedelta(hours=24),
        },
        app.config["SECRET_KEY"],
        algorithm="HS256",
    )

    return jsonify({"token": token, "user": user_payload(user)}), 200


@app.get("/api/me")
@token_required
def me(current_user):
    return jsonify(user_payload(current_user))


@app.post("/api/tasks")
@token_required
def create_task(current_user):
    data = request.get_json(silent=True) or {}
    error = validate_task_payload(data)

    if error:
        return jsonify({"message": error}), 400

    task = Task(
        title=str(data["title"]).strip(),
        description=str(data.get("description", "")).strip(),
        status=data.get("status", "pending"),
        priority=data.get("priority", "medium"),
        user_id=current_user.id,
    )

    db.session.add(task)
    db.session.commit()

    return jsonify(task.to_dict()), 201


@app.get("/api/tasks")
@token_required
def get_tasks(current_user):
    tasks = (
        Task.query.filter_by(user_id=current_user.id)
        .order_by(Task.created_at.desc())
        .all()
    )
    return jsonify([task.to_dict() for task in tasks])


@app.get("/api/tasks/<int:task_id>")
@token_required
def get_task(current_user, task_id):
    task = Task.query.filter_by(
        id=task_id,
        user_id=current_user.id,
    ).first()

    if not task:
        return jsonify({"message": "Task not found."}), 404

    return jsonify(task.to_dict())


@app.put("/api/tasks/<int:task_id>")
@token_required
def update_task(current_user, task_id):
    task = Task.query.filter_by(
        id=task_id,
        user_id=current_user.id,
    ).first()

    if not task:
        return jsonify({"message": "Task not found."}), 404

    data = request.get_json(silent=True) or {}
    error = validate_task_payload(data, partial=True)

    if error:
        return jsonify({"message": error}), 400

    if "title" in data:
        task.title = str(data["title"]).strip()
    if "description" in data:
        task.description = str(data["description"]).strip()
    if "status" in data:
        task.status = data["status"]
    if "priority" in data:
        task.priority = data["priority"]

    task.updated_at = utc_now()
    db.session.commit()

    return jsonify(task.to_dict())


@app.delete("/api/tasks/<int:task_id>")
@token_required
def delete_task(current_user, task_id):
    task = Task.query.filter_by(
        id=task_id,
        user_id=current_user.id,
    ).first()

    if not task:
        return jsonify({"message": "Task not found."}), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "Task deleted successfully."})


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        debug=False,
    )
