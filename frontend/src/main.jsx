import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const fallbackStocks = [
  { symbol: "AAPL", name: "Apple Inc.", price: 189.98, change: 1.24 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 421.53, change: -0.36 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 926.69, change: 2.18 },
];

function App() {
  const [stocks, setStocks] = useState(fallbackStocks);
  const [status, setStatus] = useState("Loading sample market data...");

  useEffect(() => {
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
  }, []);

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
          <button type="button">Add symbol</button>
        </div>

        <div className="stock-list">
          {stocks.map((stock) => (
            <article className="stock-row" key={stock.symbol}>
              <div>
                <strong>{stock.symbol}</strong>
                <span>{stock.name}</span>
              </div>
              <div className="price-block">
                <strong>${stock.price.toFixed(2)}</strong>
                <span className={stock.change >= 0 ? "positive" : "negative"}>
                  {stock.change >= 0 ? "+" : ""}
                  {stock.change.toFixed(2)}%
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
