# TaskFlow — Production-Style Full-Stack Task Manager

TaskFlow is a full-stack task workspace built to demonstrate practical backend engineering: REST APIs, JWT authentication, relational data modelling, validation, testing, Docker and frontend integration.

## Architecture

```text
Browser
   |
   v
Netlify / Static Frontend
   |
   | HTTPS + JSON + JWT
   v
Flask REST API
   |
   +-- Authentication / Authorization
   +-- Validation / Error handling
   +-- Task CRUD
   |
   v
SQLAlchemy ORM
   |
   v
Neon PostgreSQL (production) / SQLite (local)
```

## Features

- Register and login with email
- Full name stored on the user profile
- Password hashing with Werkzeug
- JWT authentication
- Protected task routes
- Per-user task ownership
- Create / read / update / delete
- Pending / in progress / completed status
- Low / medium / high priority
- Search and status filtering
- Dashboard statistics
- Responsive premium frontend
- API health check
- PostgreSQL-ready configuration
- Dockerized backend
- Pytest API tests
- GitHub Actions CI
- Environment-based secrets/configuration

## API

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/` | No | Health check |
| POST | `/api/register` | No | Create account |
| POST | `/api/login` | No | Login + JWT |
| GET | `/api/me` | Yes | Current user |
| POST | `/api/tasks` | Yes | Create task |
| GET | `/api/tasks` | Yes | List current user's tasks |
| GET | `/api/tasks/<id>` | Yes | Read one current user's task |
| PUT | `/api/tasks/<id>` | Yes | Update current user's task |
| DELETE | `/api/tasks/<id>` | Yes | Delete current user's task |

Protected requests use:

```text
Authorization: Bearer <JWT>
```

## Local setup

### 1. Backend

Open a terminal in the project root:

```powershell
cd backend
python -m pip install -r requirements.txt
python app.py
```

Backend:

```text
http://127.0.0.1:5000
```

Test health in the browser:

```text
http://127.0.0.1:5000/
```

Expected:

```json
{
  "status": "ok",
  "service": "TaskFlow API",
  "database": "ok",
  "version": "1.2.0"
}
```

### 2. Frontend

Open the `frontend` folder with VS Code Live Server.

`frontend/config.js` already points to:

```js
API_BASE_URL: "http://127.0.0.1:5000"
```

The Flask terminal must stay running while the frontend is open.

## Tests

From the project root:

```powershell
python -m pytest -q
```

The tests cover health, registration/login, duplicate email handling, protected task CRUD and task ownership.

## Deployment

Recommended portfolio setup:

```text
Frontend → Netlify
Backend  → Render
Database → Neon PostgreSQL
```

Do not call the project a Live Demo until Register, Login, task CRUD and database persistence have been tested from a fresh browser.

Before deploying the frontend, change `frontend/config.js` to the public backend URL:

```js
window.APP_CONFIG = {
  API_BASE_URL: "https://your-taskflow-api.onrender.com"
};
```

On Render set:

```text
SECRET_KEY=<generated or long random secret>
DATABASE_URL=<Neon PostgreSQL connection string>
FRONTEND_URL=<Netlify frontend URL>
```

The included `render.yaml` and Dockerfile provide a production-style start configuration using Gunicorn.

## Database concepts

- Primary keys
- Foreign keys
- One-to-many relationship (`users -> tasks`)
- Unique email/username constraint
- Indexes on username, email, status and user ownership
- Cascading delete
- ORM queries
- Persistent timestamps

## Interview talking points

Be ready to explain:

1. How the browser talks to the Flask REST API.
2. How JWT authentication works.
3. Why passwords are hashed.
4. How user ownership prevents cross-user task access.
5. Why PostgreSQL is used in production.
6. What a primary key, foreign key and index do.
7. SQLAlchemy ORM vs raw SQL.
8. Why environment variables are used for secrets.
9. Why Docker/Gunicorn help deployment.
10. How CORS affects browser-to-API requests.
