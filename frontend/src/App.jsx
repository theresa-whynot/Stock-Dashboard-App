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

function formatCurrency(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numberValue);
}

function getAccountSummary(account) {
  const securitiesAccount = account.securitiesAccount ?? account;
  const balances =
    securitiesAccount.currentBalances ?? securitiesAccount.initialBalances ?? {};
  const positions = Array.isArray(securitiesAccount.positions)
    ? securitiesAccount.positions
    : [];

  return {
    accountNumber:
      securitiesAccount.accountNumber ?? securitiesAccount.accountHash ?? "Unknown",
    accountType:
      securitiesAccount.type ?? securitiesAccount.accountType ?? "Brokerage",
    liquidationValue:
      balances.liquidationValue ??
      balances.totalAccountValue ??
      balances.cashBalance,
    positions,
  };
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
  const [schwabStatus, setSchwabStatus] = useState(null);
  const [schwabMessage, setSchwabMessage] = useState("Checking Schwab setup...");
  const [schwabAccounts, setSchwabAccounts] = useState([]);
  const [schwabLoading, setSchwabLoading] = useState(false);

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

  useEffect(() => {
    async function loadStatus() {
      try {
        const response = await fetch("/api/schwab/status");
        const data = await response.json();

        setSchwabStatus(data);

        if (!data.configured) {
          setSchwabMessage(
            "Add Schwab API credentials to backend/.env to enable account details.",
          );
          return;
        }

        setSchwabMessage(
          data.connected
            ? "Schwab is connected. Load account details when you are ready."
            : "Schwab is configured. Connect your account to load details.",
        );
      } catch {
        setSchwabMessage("Start the Python backend to use Schwab account details.");
      }
    }

    loadStatus();
  }, []);

  async function connectSchwab() {
    setSchwabLoading(true);

    try {
      const response = await fetch("/api/schwab/login-url");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Unable to start Schwab login.");
      }

      window.location.href = data.authorization_url;
    } catch (error) {
      setSchwabMessage(error.message);
      setSchwabLoading(false);
    }
  }

  async function loadSchwabAccounts() {
    setSchwabLoading(true);
    setSchwabMessage("Loading Schwab account details...");

    try {
      const response = await fetch("/api/schwab/accounts?positions=true");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Unable to load Schwab account details.");
      }

      setSchwabAccounts(Array.isArray(data.accounts) ? data.accounts : []);
      setSchwabMessage("Showing read-only Schwab account details.");
      setSchwabStatus((currentStatus) =>
        currentStatus
          ? { ...currentStatus, connected: true }
          : { configured: true, connected: true },
      );
    } catch (error) {
      setSchwabMessage(error.message);
    } finally {
      setSchwabLoading(false);
    }
  }

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

      <section className="panel account-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Schwab integration</p>
            <h2>Read-only account details</h2>
          </div>
          <div className="integration-actions">
            <button
              disabled={!schwabStatus?.configured || schwabLoading}
              onClick={connectSchwab}
              type="button"
            >
              Connect Schwab
            </button>
            <button
              className="ghost-button"
              disabled={!schwabStatus?.connected || schwabLoading}
              onClick={loadSchwabAccounts}
              type="button"
            >
              Load accounts
            </button>
          </div>
        </div>

        <p className="helper-text">{schwabMessage}</p>

        {schwabAccounts.length > 0 && (
          <div className="account-list">
            {schwabAccounts.map((account, index) => {
              const summary = getAccountSummary(account);

              return (
                <article className="account-card" key={summary.accountNumber}>
                  <div>
                    <span>Account {index + 1}</span>
                    <strong>{summary.accountType}</strong>
                  </div>
                  <div>
                    <span>Account identifier</span>
                    <strong>{summary.accountNumber}</strong>
                  </div>
                  <div>
                    <span>Estimated value</span>
                    <strong>{formatCurrency(summary.liquidationValue)}</strong>
                  </div>
                  <div>
                    <span>Positions</span>
                    <strong>{summary.positions.length}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        )}
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
