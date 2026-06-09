import { formatCurrency } from "../utils/formatters";
import { getAccountSummary } from "../utils/portfolio";

export function SchwabPanel({
  accounts,
  loading,
  message,
  onConnect,
  onLoadAccounts,
  status,
}) {
  return (
    <section className="panel account-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Schwab integration</p>
          <h2>Read-only account details</h2>
        </div>
        <div className="integration-actions">
          <button
            disabled={!status?.configured || loading}
            onClick={onConnect}
            type="button"
          >
            Connect Schwab
          </button>
          <button
            className="ghost-button"
            disabled={!status?.connected || loading}
            onClick={onLoadAccounts}
            type="button"
          >
            {accounts.length > 0 ? "Refresh accounts" : "Load accounts"}
          </button>
        </div>
      </div>

      <p className="helper-text">{message}</p>

      {accounts.length > 0 && (
        <div className="account-list">
          {accounts.map((account, index) => {
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
  );
}
