import os
import re
from typing import Any

import httpx
from fastapi import HTTPException

from app.schwab import get_schwab_access_token

DEFAULT_STOCK_SYMBOLS = ("AAPL", "MSFT", "NVDA", "TSLA")
MAX_SYMBOLS_PER_REQUEST = 25
QUOTE_URL = os.getenv(
    "SCHWAB_MARKET_DATA_QUOTES_URL",
    "https://api.schwabapi.com/marketdata/v1/quotes",
)
SYMBOL_PATTERN = re.compile(r"^[A-Z0-9.$/-]{1,15}$")


def parse_stock_symbols(raw_symbols: str | None) -> list[str]:
    raw_values = (
        raw_symbols.split(",")
        if raw_symbols
        else os.getenv("DEFAULT_STOCK_SYMBOLS", ",".join(DEFAULT_STOCK_SYMBOLS)).split(
            ","
        )
    )
    symbols: list[str] = []

    for raw_value in raw_values:
        symbol = raw_value.strip().upper()

        if not symbol:
            continue

        if not SYMBOL_PATTERN.match(symbol):
            raise HTTPException(
                status_code=400,
                detail=f"{symbol} is not a valid stock symbol for this request.",
            )

        if symbol not in symbols:
            symbols.append(symbol)

    if not symbols:
        raise HTTPException(status_code=400, detail="Provide at least one stock symbol.")

    if len(symbols) > MAX_SYMBOLS_PER_REQUEST:
        raise HTTPException(
            status_code=400,
            detail=f"Request up to {MAX_SYMBOLS_PER_REQUEST} symbols at a time.",
        )

    return symbols


def _nested_value(data: dict[str, Any], paths: tuple[tuple[str, ...], ...]) -> Any:
    for path in paths:
        value: Any = data

        for key in path:
            if not isinstance(value, dict) or key not in value:
                value = None
                break

            value = value[key]

        if value is not None:
            return value

    return None


def _number_or_none(value: Any) -> float | None:
    try:
        number_value = float(value)
    except (TypeError, ValueError):
        return None

    return number_value


def _normalize_quote(symbol: str, quote: dict[str, Any] | None) -> dict[str, Any]:
    if not quote:
        return {
            "symbol": symbol,
            "name": f"{symbol} quote unavailable",
            "price": None,
            "change": None,
            "available": False,
        }

    normalized_symbol = str(quote.get("symbol") or symbol).upper()
    name = _nested_value(
        quote,
        (
            ("reference", "description"),
            ("fundamental", "description"),
            ("description",),
        ),
    )
    price = _number_or_none(
        _nested_value(
            quote,
            (
                ("quote", "lastPrice"),
                ("regular", "regularMarketLastPrice"),
                ("lastPrice",),
                ("regularMarketLastPrice",),
                ("quote", "mark"),
                ("quote", "closePrice"),
                ("quote", "askPrice"),
                ("quote", "bidPrice"),
            ),
        )
    )
    change_percent = _number_or_none(
        _nested_value(
            quote,
            (
                ("quote", "netPercentChange"),
                ("regular", "regularMarketPercentChange"),
                ("netPercentChange",),
                ("regularMarketPercentChange",),
                ("quote", "markPercentChange"),
            ),
        )
    )

    return {
        "symbol": normalized_symbol,
        "name": str(name or normalized_symbol),
        "price": price,
        "change": change_percent,
        "available": price is not None,
    }


async def get_live_stock_quotes(symbols: list[str]) -> list[dict[str, Any]]:
    access_token = await get_schwab_access_token()

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(
            QUOTE_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            params={
                "symbols": ",".join(symbols),
                "fields": "quote,reference,regular",
            },
        )

    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    quotes_by_symbol = response.json()

    if not isinstance(quotes_by_symbol, dict):
        raise HTTPException(
            status_code=502,
            detail="Schwab returned an unexpected market data response.",
        )

    return [
        _normalize_quote(
            symbol,
            quotes_by_symbol.get(symbol) or quotes_by_symbol.get(symbol.upper()),
        )
        for symbol in symbols
    ]
