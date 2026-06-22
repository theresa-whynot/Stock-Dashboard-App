from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.coinbase import router as coinbase_router
from app.market_quotes import router as market_quotes_router
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
app.include_router(coinbase_router)
app.include_router(market_quotes_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
