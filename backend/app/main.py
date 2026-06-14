from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.market_data import get_live_stock_quotes, parse_stock_symbols
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


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/stocks")
async def list_stocks(
    symbols: str | None = Query(
        default=None,
        description="Comma-separated stock symbols, for example AAPL,MSFT,NVDA.",
    ),
):
    requested_symbols = parse_stock_symbols(symbols)
    return {"stocks": await get_live_stock_quotes(requested_symbols)}
