from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schwab import router as schwab_router

app = FastAPI(
    title="Stock Dashboard API",
    description="Starter API for a React stock dashboard.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schwab_router)

SAMPLE_STOCKS = [
    {"symbol": "AAPL", "name": "Apple Inc.", "price": 189.98, "change": 1.24},
    {"symbol": "MSFT", "name": "Microsoft Corp.", "price": 421.53, "change": -0.36},
    {"symbol": "NVDA", "name": "NVIDIA Corp.", "price": 926.69, "change": 2.18},
    {"symbol": "TSLA", "name": "Tesla Inc.", "price": 177.55, "change": -1.08},
]


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/stocks")
def list_stocks():
    return {"stocks": SAMPLE_STOCKS}
