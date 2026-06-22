from fastapi.testclient import TestClient

from app.crypto_market_data import parse_crypto_symbols
from app.main import app

client = TestClient(app)


def test_coinbase_status_reports_not_configured(monkeypatch):
    monkeypatch.delenv("COINBASE_API_KEY_NAME", raising=False)
    monkeypatch.delenv("COINBASE_API_KEY", raising=False)
    monkeypatch.delenv("COINBASE_API_PRIVATE_KEY", raising=False)
    monkeypatch.delenv("COINBASE_API_KEY_SECRET", raising=False)

    response = client.get("/api/coinbase/status")

    assert response.status_code == 200
    assert response.json() == {"configured": False}


def test_coinbase_accounts_returns_json_for_invalid_jwt_config(monkeypatch):
    monkeypatch.setenv("COINBASE_API_KEY_NAME", "test-key")
    monkeypatch.setenv("COINBASE_API_PRIVATE_KEY", "not-a-valid-private-key")
    monkeypatch.setenv("COINBASE_JWT_ALGORITHM", "EdDSA")

    response = client.get("/api/coinbase/accounts")

    assert response.status_code == 503
    assert "Unable to sign Coinbase API request" in response.json()["detail"]


def test_parse_crypto_symbols_normalizes_common_inputs():
    assert parse_crypto_symbols("btc, ETH-USD, sol/usd,btc") == [
        "BTC",
        "ETH",
        "SOL",
    ]


def test_list_crypto_uses_requested_symbols(monkeypatch):
    captured_symbols = []

    async def fake_get_live_crypto_quotes(symbols):
        captured_symbols.extend(symbols)
        return [
            {
                "symbol": "BTC",
                "name": "Bitcoin",
                "price": 65000.0,
                "change": None,
                "available": True,
                "assetType": "crypto",
                "productId": "BTC-USD",
            },
            {
                "symbol": "ETH",
                "name": "Ethereum",
                "price": 3500.0,
                "change": None,
                "available": True,
                "assetType": "crypto",
                "productId": "ETH-USD",
            },
        ]

    monkeypatch.setattr(
        "app.market_quotes.get_live_crypto_quotes",
        fake_get_live_crypto_quotes,
    )

    response = client.get("/api/crypto?symbols=btc,eth,btc")

    assert response.status_code == 200
    assert captured_symbols == ["BTC", "ETH"]
    assert response.json() == {
        "crypto": [
            {
                "symbol": "BTC",
                "name": "Bitcoin",
                "price": 65000.0,
                "change": None,
                "available": True,
                "assetType": "crypto",
                "productId": "BTC-USD",
            },
            {
                "symbol": "ETH",
                "name": "Ethereum",
                "price": 3500.0,
                "change": None,
                "available": True,
                "assetType": "crypto",
                "productId": "ETH-USD",
            },
        ]
    }


def test_list_crypto_rejects_invalid_symbols():
    response = client.get("/api/crypto?symbols=BTC,<script>")

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "<SCRIPT> is not a valid crypto symbol for this request."
    )
