# Copilot instructions for Pastel Dreams

This project is a small LLM-driven code sandbox: a FastAPI backend that proxies an LLM and a Vite + React frontend using Sandpack.

- **Purpose:** Help AI agents generate, merge and stream code into the frontend Sandpack environment by calling the backend `/generate` endpoint.

**Architecture (big picture)**
- **Backend:** FastAPI service that forwards chat-style messages to OpenRouter and expects a JSON response `{ files: {path: content}, message: string }`. See [backend/main.py](backend/main.py).
- **Frontend:** Vite + React app that manages a Sandpack workspace. The LLM context and calls live in [frontend/src/services/api.ts](frontend/src/services/api.ts) and sandbox orchestration in [frontend/src/contexts/SandboxContext.tsx](frontend/src/contexts/SandboxContext.tsx).
- **Template & merge logic:** Generated files are normalized and merged with a base template using [frontend/src/services/sandpack.ts](frontend/src/services/sandpack.ts).

**How LLM integration works (important details)**
- The backend posts to OpenRouter with a system prompt instructing the model to reply in JSON. The backend will strip markdown fences and parse JSON. See [backend/main.py](backend/main.py).
- The frontend builds a `system` context that includes an exact expected Sandpack layout and the current project files. See `SYSTEM_CONTEXT` in [frontend/src/services/api.ts](frontend/src/services/api.ts).
- The expected return format is a JSON object: `{"files": {"/App.tsx": "..."}, "message": "human summary"}`. The backend validates this shape and returns it to the frontend.

**Developer workflows & commands**
- Start frontend development: `npm run dev` (from `frontend/`). See [frontend/package.json](frontend/package.json).
- Build frontend: `npm run build`.
- Lint frontend: `npm run lint`.
- Start backend locally: `uvicorn main:app --reload --port 8000` (run inside `backend/`). Ensure `OPENROUTER_API_KEY` is set in your environment or `.env`.
- Docker / compose: see [DOCKER_SETUP.md](DOCKER_SETUP.md) and [docker-compose.yml](docker-compose.yml) if you want containerized dev.

**Project-specific conventions**
- Sandpack file paths must match the expected pattern (example in `SYSTEM_CONTEXT`): `/App.tsx`, `/index.tsx`, `/components/*.tsx`. The generator should produce `.tsx` files unless there is a clear reason to use `.jsx`/`.js`.
- When returning files, prefer root-relative paths (Sandpack normalization removes `src/`), e.g. return `src/App.tsx` or `/App.tsx`; the frontend normalizes paths in `mergeWithTemplate`.
- Generated output may be wrapped in triple-backtick blocks — the backend strips them, but returning pure JSON is preferred.
- TypeScript is strict in the app config; avoid `any` and fix unused vars/params (see [frontend/tsconfig.app.json](frontend/tsconfig.app.json) and [frontend/eslint.config.js](frontend/eslint.config.js)).
- Vite aliases use `@` → `src` (see [frontend/vite.config.ts](frontend/vite.config.ts)).

**Failure modes & tips (observed from code)**
- Backend will 500 if `OPENROUTER_API_KEY` is missing or the model returns invalid JSON. Handle and surface parse errors clearly; see error handling in [backend/main.py](backend/main.py).
- Frontend will time out after 60s when calling `/generate`. Be defensive about long-running model calls and provide progress UI via `useFileStreaming`. See [frontend/src/hooks/useFileStreaming.ts](frontend/src/hooks/useFileStreaming.ts).

**Examples**
- Minimal valid response (preferred):

```
{"files": {"/App.tsx": "export default function App(){ return <div>Hello</div> }"}, "message": "Added a minimal App"}
```

**Where to look first**
- Incoming proxy + validation: [backend/main.py](backend/main.py)
- LLM prompting + network call: [frontend/src/services/api.ts](frontend/src/services/api.ts)
- Merge / Sandpack format: [frontend/src/services/sandpack.ts](frontend/src/services/sandpack.ts)
- Orchestration + streaming: [frontend/src/contexts/SandboxContext.tsx](frontend/src/contexts/SandboxContext.tsx) and [frontend/src/hooks/useFileStreaming.ts](frontend/src/hooks/useFileStreaming.ts)

If any section is unclear or you want more examples (edge cases, tests, or sample prompts), tell me which part to expand and I'll iterate.
