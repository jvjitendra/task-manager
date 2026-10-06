import os
import sys
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret"

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app import app, db  # noqa: E402


def setup_function():
    with app.app_context():
        db.drop_all()
        db.create_all()


def test_health():
    assert True
    client = app.test_client()
    response = client.get("/")

    assert response.status_code == 200
    body = response.get_json()
    assert body["status"] == "ok"
    assert body["database"] == "ok"


def test_register_and_login_with_email():
    client = app.test_client()

    register = client.post(
        "/api/register",
        json={
            "full_name": "Jitendra Kumar Verma",
            "email": "jitendra@example.com",
            "password": "test123",
        },
    )
    assert register.status_code == 201

    login = client.post(
        "/api/login",
        json={
            "email": "jitendra@example.com",
            "password": "test123",
        },
    )
    assert login.status_code == 200

    body = login.get_json()
    assert "token" in body
    assert body["user"]["full_name"] == "Jitendra Kumar Verma"


def test_duplicate_email_is_blocked():
    client = app.test_client()
    payload = {
        "full_name": "Jitendra Kumar Verma",
        "email": "jitendra@example.com",
        "password": "test123",
    }

    assert client.post("/api/register", json=payload).status_code == 201
    assert client.post("/api/register", json=payload).status_code == 409


def test_protected_task_crud():
    client = app.test_client()

    client.post(
        "/api/register",
        json={
            "full_name": "Jitendra Kumar Verma",
            "email": "jitendra@example.com",
            "password": "test123",
        },
    )

    login = client.post(
        "/api/login",
        json={
            "email": "jitendra@example.com",
            "password": "test123",
        },
    )
    token = login.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    create = client.post(
        "/api/tasks",
        json={
            "title": "Build portfolio",
            "description": "Finish TaskFlow",
            "priority": "high",
        },
        headers=headers,
    )
    assert create.status_code == 201

    task_id = create.get_json()["id"]

    get_all = client.get("/api/tasks", headers=headers)
    assert get_all.status_code == 200
    assert len(get_all.get_json()) == 1

    update = client.put(
        f"/api/tasks/{task_id}",
        json={"status": "done"},
        headers=headers,
    )
    assert update.status_code == 200
    assert update.get_json()["status"] == "done"

    delete = client.delete(
        f"/api/tasks/{task_id}",
        headers=headers,
    )
    assert delete.status_code == 200


def test_user_cannot_read_another_users_task():
    client = app.test_client()

    client.post(
        "/api/register",
        json={
            "full_name": "User One",
            "email": "one@example.com",
            "password": "test123",
        },
    )
    login_one = client.post(
        "/api/login",
        json={"email": "one@example.com", "password": "test123"},
    )
    token_one = login_one.get_json()["token"]

    task = client.post(
        "/api/tasks",
        json={"title": "Private task"},
        headers={"Authorization": f"Bearer {token_one}"},
    ).get_json()

    client.post(
        "/api/register",
        json={
            "full_name": "User Two",
            "email": "two@example.com",
            "password": "test123",
        },
    )
    login_two = client.post(
        "/api/login",
        json={"email": "two@example.com", "password": "test123"},
    )
    token_two = login_two.get_json()["token"]

    response = client.get(
        f"/api/tasks/{task['id']}",
        headers={"Authorization": f"Bearer {token_two}"},
    )

    assert response.status_code == 404
