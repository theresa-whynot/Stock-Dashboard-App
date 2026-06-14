export function Hero({ status }) {
  return (
    <section className="hero">
      <div>
        <p className="eyebrow">Stock Dashboard Starter</p>
        <h1>Track your portfolio risk</h1>
        <p className="hero-copy">
          A lightweight React and Python boilerplate to track risk on your
          positions from multiple brokerages.
        </p>
      </div>
      <div className="status-card">
        <span>API Status</span>
        <strong>{status}</strong>
      </div>
    </section>
  );
}
