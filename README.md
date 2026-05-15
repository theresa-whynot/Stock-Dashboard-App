# Stock Dashboard App

A simple full-stack starter for a stock market dashboard.

- **Frontend:** React + Vite
- **Backend:** Python + FastAPI
- **API:** sample stock watchlist data under `/api/stocks`

## Project structure

```text
.
├── backend/
│   ├── app/
│   │   └── main.py
│   └── requirements.txt
└── frontend/
    ├── src/
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

## Next ideas

- Replace sample stock data with a real market data provider.
- Add charts for historical prices.
- Add user-defined watchlists.
- Add backend tests for API routes.