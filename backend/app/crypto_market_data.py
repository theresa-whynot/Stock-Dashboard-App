import os
import re
from typing import Any

import httpx
from fastapi import HTTPException

DEFAULT_CRYPTO_SYMBOLS = ("BTC", "ETH", "SOL")
MAX_CRYPTO_SYMBOLS_PER_REQUEST = 25
CRYPTO_PRODUCT_URL_TEMPLATE = os.getenv(
    "COINBASE_CRYPTO_PRODUCT_URL_TEMPLATE",
    "https://api.coinbase.com/api/v3/brokerage/market/products/{product_id}",
)
CRYPTO_SYMBOL_PATTERN = re.compile(r"^[A-Z0-9-]{2,20}$")


def parse_crypto_symbols(raw_symbols: str | None) -> list[str]:
    raw_values = (
        raw_symbols.split(",")
        if raw_symbols
        else os.getenv("DEFAULT_CRYPTO_SYMBOLS", ",".join(DEFAULT_CRYPTO_SYMBOLS)).split(
            ","
        )
    )
    symbols: list[str] = []

    for raw_value in raw_values:
        symbol = _normalize_crypto_symbol(raw_value)

        if not symbol:
            continue

        if symbol not in symbols:
            symbols.append(symbol)

    if not symbols:
        raise HTTPException(status_code=400, detail="Provide at least one crypto symbol.")

    if len(symbols) > MAX_CRYPTO_SYMBOLS_PER_REQUEST:
        raise HTTPException(
            status_code=400,
            detail=f"Request up to {MAX_CRYPTO_SYMBOLS_PER_REQUEST} crypto symbols at a time.",
        )

    return symbols


def _normalize_crypto_symbol(raw_symbol: str) -> str:
    symbol = raw_symbol.strip().upper()

    if not symbol:
        return ""

    if "/" in symbol:
        symbol = symbol.replace("/", "-")

    if symbol.endswith("-USD"):
        symbol = symbol.removesuffix("-USD")

    if not CRYPTO_SYMBOL_PATTERN.match(symbol):
        raise HTTPException(
            status_code=400,
            detail=f"{symbol} is not a valid crypto symbol for this request.",
        )

    return symbol


def _product_id(symbol: str) -> str:
    return f"{symbol}-USD"


def _number_or_none(value: Any) -> float | None:
    try:
        number_value = float(value)
    except (TypeError, ValueError):
        return None

    return number_value


def _normalize_crypto_quote(symbol: str, data: dict[str, Any] | None) -> dict[str, Any]:
    if not data:
        return {
            "symbol": symbol,
            "name": f"{symbol} quote unavailable",
            "price": None,
            "change": None,
            "available": False,
            "assetType": "crypto",
            "productId": _product_id(symbol),
        }

    price = _number_or_none(data.get("price"))
    change = _number_or_none(data.get("price_percentage_change_24h"))
    name = data.get("base_name") or data.get("display_name") or symbol

    return {
        "symbol": symbol,
        "name": str(name),
        "price": price,
        "change": change,
        "available": price is not None,
        "assetType": "crypto",
        "productId": _product_id(symbol),
    }


async def get_live_crypto_quotes(symbols: list[str]) -> list[dict[str, Any]]:
    quotes: list[dict[str, Any]] = []

    async with httpx.AsyncClient(timeout=20) as client:
        for symbol in symbols:
            response = await client.get(
                CRYPTO_PRODUCT_URL_TEMPLATE.format(product_id=_product_id(symbol)),
            )

            if response.status_code >= 400:
                quotes.append(_normalize_crypto_quote(symbol, None))
                continue

            data = response.json()

            if not isinstance(data, dict):
                quotes.append(_normalize_crypto_quote(symbol, None))
                continue

            quotes.append(_normalize_crypto_quote(symbol, data))

    return quotes
