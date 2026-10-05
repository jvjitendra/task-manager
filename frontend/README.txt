TaskFlow v3 — Precision Productivity

Frontend: plain HTML/CSS/JS.
Backend contract: Flask REST API with JWT authentication.

Files
- index.html — complete responsive UI
- style.css — TaskFlow visual system and responsive rules
- app.js — auth, CRUD, filters, navigation, command center, developer profile
- config.js — API URL + shared developer/project ecosystem

Local
1. Start the Flask backend on http://127.0.0.1:5000.
2. Keep API_BASE_URL in config.js pointed at that URL.
3. Serve this folder with any static server.

Production
Replace API_BASE_URL in config.js with the deployed TaskFlow API URL. No API key belongs in the frontend.

Project ecosystem
The Developer Profile is shared in structure across projects. Add future live URLs in PROJECTS only; blank live URLs render as Coming Soon.

Cross-check targets
- register/login/logout/session restore
- create/edit/delete/complete/reopen tasks
- search/status/quick/today/priority filters
- command center + Ctrl/Cmd+K + ESC
- developer profile + project ecosystem
- desktop/tablet/mobile navigation
- modal close by button/outside click/ESC
- keyboard focus and reduced-motion support
