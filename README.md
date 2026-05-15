# Stock Dashboard App

A simple full-stack starter for a stock market dashboard.

- **Frontend:** React + Vite
- **Backend:** Python + FastAPI
- **API:** sample stock watchlist data under `/api/stocks`
- **Local storage:** added symbols are saved in your browser

## Project structure

```text
.
├── backend/
│   ├── .env.example
│   ├── app/
│   │   ├── main.py
│   │   └── schwab.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── styles.css
    ├── index.html
    └── package.json
```

## Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`.

Useful endpoints:

- `GET /api/health`
- `GET /api/stocks`
- `GET /api/schwab/status`
- `GET /api/schwab/login-url`
- `GET /api/schwab/accounts`

## Schwab account details

The Schwab integration is local-first and read-only in this starter app. The
React frontend never receives your Schwab app secret. OAuth tokens are saved by
the Python backend in `.schwab_tokens.json`, which is ignored by git.

To enable it:

1. Create an individual app in the Charles Schwab Developer Portal.
2. Set the app callback/redirect URL to:

   ```text
   http://127.0.0.1:8000/api/schwab/callback
   ```

3. Copy the example environment file:

   ```bash
   cd backend
   cp .env.example .env
   ```

4. Fill in your Schwab app key and secret in `backend/.env`:

   ```bash
   SCHWAB_CLIENT_ID=your-schwab-app-key
   SCHWAB_CLIENT_SECRET=your-schwab-app-secret
   SCHWAB_REDIRECT_URI=http://127.0.0.1:8000/api/schwab/callback
   FRONTEND_URL=http://localhost:5173
   ```

5. Start the backend and frontend, then use the **Connect Schwab** button in the
   dashboard.

This starter only exposes read-only account detail routes. It does not include
any trading or order placement endpoints.

## Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The React app runs at `http://localhost:5173` and proxies `/api` requests to the FastAPI server.

Use the form on the dashboard to add the stock symbols you want to watch. The
watchlist is saved locally in your browser with `localStorage`, so it does not
need accounts, a database, or cloud hosting.

## Next ideas

- Replace sample stock data with a real market data provider.
- Add charts for historical prices.
- Sync the local watchlist with the backend if you want multi-device access.
- Add backend tests for API routes.