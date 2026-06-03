export function Hero({ status }) {
  return (
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
  );
}
