Abstract0
===========

LLM-driven code sandbox: FastAPI backend that proxies OpenRouter and a Vite + React frontend that streams files into Sandpack.
This app generates React/Vite websites using AI; current model: Devstral 2 2512.

Architecture
------------
- Backend: FastAPI proxy with JSON-only model responses.
- Frontend: Vite + React UI with Sandpack workspace orchestration.

Interface Example
-----------------
![Abstract0 interface example](frontend/public/ui-example.png)

API
---
Base URL: `http://localhost:8000`

Endpoints:
- `GET /health` -> `{ "status": "ok", "message": "Backend is running" }`
- `POST /generate`
	- Request: `{ "prompt": string, "context": [{ "role": "user"|"assistant", "content": string }] }`
	- Response: `{ "files": { "path": "content" }, "message": "summary" }`

Example:
```json
{
	"prompt": "Generate a simple App",
	"context": [{"role": "user", "content": "Use TypeScript"}]
}
```

Environment
-----------
Required:
- `OPENROUTER_API_KEY`

Optional:
- `VITE_API_BASE_URL` (frontend, default in compose is `http://localhost:8000`)

Development (Docker)
--------------------
```bash
OPENROUTER_API_KEY=... docker compose up --build
```

Ports:
- Backend: `8000`
- Frontend: `8080`

Development (Local)
-------------------
Backend (uv):
```bash
cd backend
uv sync
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Notes
-----
- The backend expects the model to return JSON only; markdown fences are stripped if present.
- The backend model is configured in [backend/main.py](backend/main.py).
