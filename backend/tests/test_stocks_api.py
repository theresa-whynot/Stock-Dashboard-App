from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_stocks_uses_requested_symbols(monkeypatch):
    captured_symbols = []

    async def fake_get_live_stock_quotes(symbols):
        captured_symbols.extend(symbols)
        return [
            {
                "symbol": "AAPL",
                "name": "Apple Inc.",
                "price": 200.12,
                "change": 1.5,
                "available": True,
            },
            {
                "symbol": "MSFT",
                "name": "Microsoft Corp.",
                "price": 425.5,
                "change": -0.2,
                "available": True,
            },
        ]

    monkeypatch.setattr(
        "app.market_quotes.get_live_stock_quotes",
        fake_get_live_stock_quotes,
    )

    response = client.get("/api/stocks?symbols=aapl,msft,aapl")

    assert response.status_code == 200
    assert captured_symbols == ["AAPL", "MSFT"]
    assert response.json() == {
        "stocks": [
            {
                "symbol": "AAPL",
                "name": "Apple Inc.",
                "price": 200.12,
                "change": 1.5,
                "available": True,
            },
            {
                "symbol": "MSFT",
                "name": "Microsoft Corp.",
                "price": 425.5,
                "change": -0.2,
                "available": True,
            },
        ]
    }


def test_list_stocks_rejects_invalid_symbols():
    response = client.get("/api/stocks?symbols=AAPL,<script>")

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "<SCRIPT> is not a valid stock symbol for this request."
    )
