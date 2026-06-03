export function SummaryCards({ stocks }) {
  const gainers = stocks.filter((stock) => stock.change >= 0).length;
  const losers = stocks.filter((stock) => stock.change < 0).length;

  return (
    <section className="summary-grid" aria-label="Market summary">
      <article>
        <span>Watchlist</span>
        <strong>{stocks.length}</strong>
      </article>
      <article>
        <span>Gainers</span>
        <strong>{gainers}</strong>
      </article>
      <article>
        <span>Losers</span>
        <strong>{losers}</strong>
      </article>
    </section>
  );
}
