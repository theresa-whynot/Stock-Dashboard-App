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
│   ├── app/
│   │   └── main.py
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