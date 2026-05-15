import { useEffect, useState } from "react";

const storageKey = "stock-dashboard-watchlist";

const fallbackStocks = [
  { symbol: "AAPL", name: "Apple Inc.", price: 189.98, change: 1.24 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 421.53, change: -0.36 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 926.69, change: 2.18 },
];

function readSavedStocks() {
  const savedStocks = window.localStorage.getItem(storageKey);

  if (!savedStocks) {
    return null;
  }

  try {
    const parsedStocks = JSON.parse(savedStocks);
    return Array.isArray(parsedStocks) ? parsedStocks : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [initialSavedStocks] = useState(() => readSavedStocks());
  const [stocks, setStocks] = useState(() => initialSavedStocks ?? fallbackStocks);
  const [status, setStatus] = useState(
    initialSavedStocks
      ? "Showing your locally saved watchlist"
      : "Loading sample market data...",
  );
  const [symbol, setSymbol] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    if (initialSavedStocks) {
      return;
    }

    async function loadStocks() {
      try {
        const response = await fetch("/api/stocks");

        if (!response.ok) {
          throw new Error("Backend returned an error");
        }

        const data = await response.json();
        setStocks(data.stocks);
        setStatus("Live from the Python API");
      } catch {
        setStatus("Showing local sample data until the backend is running");
      }
    }

    loadStocks();
  }, [initialSavedStocks]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(stocks));
  }, [stocks]);

  function addStock(event) {
    event.preventDefault();

    const trimmedSymbol = symbol.trim().toUpperCase();
    const trimmedCompanyName = companyName.trim();

    if (!trimmedSymbol) {
      return;
    }

    const stockExists = stocks.some((stock) => stock.symbol === trimmedSymbol);

    if (stockExists) {
      setStatus(`${trimmedSymbol} is already in your watchlist`);
      return;
    }

    setStocks((currentStocks) => [
      ...currentStocks,
      {
        symbol: trimmedSymbol,
        name: trimmedCompanyName || `${trimmedSymbol} watchlist stock`,
        price: 0,
        change: 0,
      },
    ]);
    setStatus("Showing your locally saved watchlist");
    setSymbol("");
    setCompanyName("");
  }

  function removeStock(symbolToRemove) {
    setStocks((currentStocks) =>
      currentStocks.filter((stock) => stock.symbol !== symbolToRemove),
    );
    setStatus("Showing your locally saved watchlist");
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Stock Dashboard Starter</p>
          <h1>Track your market watchlist</h1>
          <p className="hero-copy">
            A lightweight React and Python boilerplate for building dashboards,
            alerts, charts, and portfolio tools.
          </p>
        </div>
        <div className="status-card">
          <span>API Status</span>
          <strong>{status}</strong>
        </div>
      </section>

      <section className="summary-grid" aria-label="Market summary">
        <article>
          <span>Watchlist</span>
          <strong>{stocks.length}</strong>
        </article>
        <article>
          <span>Gainers</span>
          <strong>{stocks.filter((stock) => stock.change >= 0).length}</strong>
        </article>
        <article>
          <span>Losers</span>
          <strong>{stocks.filter((stock) => stock.change < 0).length}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Watchlist</p>
            <h2>Featured stocks</h2>
          </div>
        </div>

        <form className="watchlist-form" onSubmit={addStock}>
          <label>
            Symbol
            <input
              maxLength="8"
              onChange={(event) => setSymbol(event.target.value)}
              placeholder="AAPL"
              value={symbol}
            />
          </label>
          <label>
            Company name
            <input
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Apple Inc."
              value={companyName}
            />
          </label>
          <button type="submit">Add symbol</button>
        </form>

        <div className="stock-list">
          {stocks.map((stock) => (
            <article className="stock-row" key={stock.symbol}>
              <div>
                <strong>{stock.symbol}</strong>
                <span>{stock.name}</span>
              </div>
              <div className="price-block">
                <strong>
                  {stock.price > 0 ? `$${stock.price.toFixed(2)}` : "Watching"}
                </strong>
                <span className={stock.change >= 0 ? "positive" : "negative"}>
                  {stock.change >= 0 ? "+" : ""}
                  {stock.change.toFixed(2)}%
                </span>
              </div>
              <button
                className="ghost-button"
                onClick={() => removeStock(stock.symbol)}
                type="button"
              >
                Remove
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
