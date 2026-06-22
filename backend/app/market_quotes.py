from fastapi import APIRouter, Query

from app.crypto_market_data import get_live_crypto_quotes, parse_crypto_symbols
from app.market_data import get_live_stock_quotes, parse_stock_symbols

router = APIRouter(prefix="/api", tags=["market-data"])


@router.get("/stocks")
async def list_stocks(
    symbols: str | None = Query(
        default=None,
        description="Comma-separated stock symbols, for example AAPL,MSFT,NVDA.",
    ),
):
    requested_symbols = parse_stock_symbols(symbols)
    return {"stocks": await get_live_stock_quotes(requested_symbols)}


@router.get("/crypto")
async def list_crypto(
    symbols: str | None = Query(
        default=None,
        description="Comma-separated crypto symbols, for example BTC,ETH,SOL.",
    ),
):
    requested_symbols = parse_crypto_symbols(symbols)
    return {"crypto": await get_live_crypto_quotes(requested_symbols)}
