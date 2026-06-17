import asyncio

import httpx

from app.crypto_market_data import get_live_crypto_quotes


class FakeResponse:
    def __init__(self, status_code: int, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


class FakeAsyncClient:
    def __init__(self, responses: dict[str, FakeResponse]):
        self.responses = responses

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return None

    async def get(self, url: str):
        for product_id, response in self.responses.items():
            if product_id in url:
                return response

        return FakeResponse(404, {})


def test_get_live_crypto_quotes_uses_product_metadata(monkeypatch):
    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda **kwargs: FakeAsyncClient(
            {
                "DOGE-USD": FakeResponse(
                    200,
                    {
                        "base_name": "Dogecoin",
                        "display_name": "DOGE-USD",
                        "price": "0.08709",
                        "price_percentage_change_24h": "-1.135",
                    },
                )
            }
        ),
    )

    quotes = asyncio.run(get_live_crypto_quotes(["DOGE"]))

    assert quotes == [
        {
            "symbol": "DOGE",
            "name": "Dogecoin",
            "price": 0.08709,
            "change": -1.135,
            "available": True,
            "assetType": "crypto",
            "productId": "DOGE-USD",
        }
    ]


def test_get_live_crypto_quotes_marks_unknown_products_unavailable(monkeypatch):
    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda **kwargs: FakeAsyncClient(
            {
                "FAKECOIN-USD": FakeResponse(404, {}),
            }
        ),
    )

    quotes = asyncio.run(get_live_crypto_quotes(["FAKECOIN"]))

    assert quotes == [
        {
            "symbol": "FAKECOIN",
            "name": "FAKECOIN quote unavailable",
            "price": None,
            "change": None,
            "available": False,
            "assetType": "crypto",
            "productId": "FAKECOIN-USD",
        }
    ]
