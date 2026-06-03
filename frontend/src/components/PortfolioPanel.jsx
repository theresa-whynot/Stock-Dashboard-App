import { portfolioCategories } from "../data/portfolioCategories";
import { formatCurrency, formatPercent } from "../utils/formatters";

export function PortfolioPanel({
  allocations,
  onUpdatePositionCategory,
  positions,
  totalPortfolioValue,
}) {
  return (
    <section className="panel portfolio-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Portfolio categories</p>
          <h2>Current positions by risk style</h2>
        </div>
        <div className="portfolio-total">
          <span>Total portfolio value</span>
          <strong>{formatCurrency(totalPortfolioValue)}</strong>
        </div>
      </div>

      <p className="helper-text">
        Positions load from Schwab after you connect your account. Starter
        categories are guessed from symbol and asset type, and any changes you
        make here are saved locally in this browser.
      </p>

      <div className="allocation-grid">
        {allocations.map((allocation) => (
          <article className="allocation-card" key={allocation.key}>
            <div>
              <span>{allocation.label}</span>
              <strong>{formatPercent(allocation.percent)}</strong>
            </div>
            <div className="allocation-bar" aria-hidden="true">
              <span style={{ width: `${Math.min(allocation.percent, 100)}%` }} />
            </div>
            <p>{allocation.description}</p>
            <small>
              {formatCurrency(allocation.value)} across {allocation.count}{" "}
              {allocation.count === 1 ? "position" : "positions"}
            </small>
          </article>
        ))}
      </div>

      <div className="positions-header">
        <h3>Current positions</h3>
        <span>{positions.length} loaded from Schwab</span>
      </div>

      {positions.length > 0 ? (
        <div className="positions-table">
          <div className="positions-row positions-heading">
            <span>Symbol</span>
            <span>Name</span>
            <span>Quantity</span>
            <span>Market value</span>
            <span>Category</span>
          </div>
          {positions.map((position) => (
            <div
              className="positions-row"
              key={`${position.accountNumber}-${position.symbol}`}
            >
              <strong>{position.symbol}</strong>
              <span>{position.name}</span>
              <span>{Number(position.quantity).toLocaleString()}</span>
              <span>{formatCurrency(position.marketValue)}</span>
              <label className="category-select">
                <span>Category</span>
                <select
                  onChange={(event) =>
                    onUpdatePositionCategory(position.symbol, event.target.value)
                  }
                  value={position.category}
                >
                  {Object.entries(portfolioCategories).map(
                    ([categoryKey, category]) => (
                      <option key={categoryKey} value={categoryKey}>
                        {category.label}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          Connect Schwab and load accounts to see your current positions here.
        </div>
      )}
    </section>
  );
}
