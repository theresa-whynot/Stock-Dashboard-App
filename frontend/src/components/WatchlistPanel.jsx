export function WatchlistPanel({
  companyName,
  loading,
  onAddStock,
  onCompanyNameChange,
  onRefreshQuotes,
  onRemoveStock,
  onSymbolChange,
  stocks,
  symbol,
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Watchlist</p>
          <h2>Featured stocks and crypto</h2>
        </div>
        <button
          className="ghost-button"
          disabled={loading || stocks.length === 0}
          onClick={onRefreshQuotes}
          type="button"
        >
          {loading ? "Refreshing..." : "Refresh market data"}
        </button>
      </div>

      <form className="watchlist-form" onSubmit={onAddStock}>
        <label>
          Symbol
          <input
            maxLength="8"
            onChange={(event) => onSymbolChange(event.target.value)}
            placeholder="AAPL or BTC"
            value={symbol}
          />
        </label>
        <label>
          Name
          <input
            onChange={(event) => onCompanyNameChange(event.target.value)}
            placeholder="Apple Inc. or Bitcoin"
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
              <strong>{formatStockPrice(stock.price)}</strong>
              <span className={getChangeClassName(stock.change)}>
                {formatStockChange(stock.change)}
              </span>
            </div>
            <button
              className="ghost-button"
              onClick={() => onRemoveStock(stock.symbol)}
              type="button"
            >
              Remove
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatStockPrice(price) {
  const numberPrice = Number(price);

  if (!Number.isFinite(numberPrice) || numberPrice <= 0) {
    return "Unavailable";
  }

  return `$${numberPrice.toFixed(2)}`;
}

function formatStockChange(change) {
  const numberChange = Number(change);

  if (!Number.isFinite(numberChange)) {
    return "No quote";
  }

  return `${numberChange >= 0 ? "+" : ""}${numberChange.toFixed(2)}%`;
}

function getChangeClassName(change) {
  const numberChange = Number(change);

  if (!Number.isFinite(numberChange)) {
    return "";
  }

  return numberChange >= 0 ? "positive" : "negative";
}
