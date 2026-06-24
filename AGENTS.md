# AGENTS.md

## Cursor Cloud specific instructions

This repo is a local-first Stock & Crypto Portfolio Dashboard with two dev services. See `README.md` for full setup/run/test commands. Notes below cover only non-obvious, durable caveats for running in the cloud environment.

### Services

| Service | Dir | Start command | Port |
| --- | --- | --- | --- |
| FastAPI backend | `backend/` | `source .venv/bin/activate && uvicorn app.main:app --reload` | `127.0.0.1:8000` |
| Vite React frontend | `frontend/` | `npm run dev` | `localhost:5173` |

Start the backend first; the Vite dev server proxies `/api` → `http://127.0.0.1:8000` (`frontend/vite.config.js`). CORS in `backend/app/main.py` is hardcoded to `localhost:5173` / `127.0.0.1:5173`, so run the frontend on port 5173.

### Environment / dependencies

- The update script creates `backend/.venv`, installs `backend/requirements.txt` into it, and runs `npm install` in `frontend/`. Always run backend commands inside the venv (`source backend/.venv/bin/activate`).
- `python3 -m venv` requires the system package `python3.12-venv` (already installed in the VM snapshot, not part of the update script).

### Running / testing caveats

- No `.env` and no database are required to boot. The app loads fully without credentials.
- Live crypto quotes work with no credentials (Coinbase public API). The hello-world check is adding a crypto symbol (e.g. `BTC`) to the watchlist and confirming a live price loads via `GET /api/crypto`.
- Live stock quotes and Schwab/Coinbase account data are OPTIONAL and need real third-party credentials in `backend/.env` plus the Schwab OAuth callback flow; these generally cannot be exercised in this environment, so stock symbols show "quote unavailable" without Schwab.
- Tests/checks: backend `cd backend && pytest`; frontend `cd frontend && npm run lint` (one pre-existing `react-hooks/exhaustive-deps` warning is expected) and `npm run build`.
