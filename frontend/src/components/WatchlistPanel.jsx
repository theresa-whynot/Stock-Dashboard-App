export function WatchlistPanel({
  companyName,
  onAddStock,
  onCompanyNameChange,
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
          <h2>Featured stocks</h2>
        </div>
      </div>

      <form className="watchlist-form" onSubmit={onAddStock}>
        <label>
          Symbol
          <input
            maxLength="8"
            onChange={(event) => onSymbolChange(event.target.value)}
            placeholder="AAPL"
            value={symbol}
          />
        </label>
        <label>
          Company name
          <input
            onChange={(event) => onCompanyNameChange(event.target.value)}
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
