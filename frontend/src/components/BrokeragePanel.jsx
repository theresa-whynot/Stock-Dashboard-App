import { formatCurrency } from "../utils/formatters";
import { getAccountSummary } from "../utils/portfolio";

function CoinbaseAccountCard({ account, position }) {
  const currency =
    account.currency ??
    account.currency_code ??
    account.available_balance?.currency ??
    position?.symbol ??
    "Crypto";
  const amount =
    account.available_balance?.value ??
    account.available_balance?.amount ??
    account.balance?.value ??
    account.balance?.amount ??
    0;

  return (
    <article className="account-card">
      <div>
        <span>Provider</span>
        <strong>Coinbase</strong>
      </div>
      <div>
        <span>Asset</span>
        <strong>{currency}</strong>
      </div>
      <div>
        <span>Quantity</span>
        <strong>{Number(amount).toLocaleString()}</strong>
      </div>
      <div>
        <span>Estimated value</span>
        <strong>{formatCurrency(position?.marketValue)}</strong>
      </div>
    </article>
  );
}

function SchwabAccountCard({ account, index }) {
  const summary = getAccountSummary(account);

  return (
    <article className="account-card">
      <div>
        <span>Schwab account {index + 1}</span>
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
}

export function BrokeragePanel({
  coinbase,
  onLoadAllAccounts,
  schwab,
}) {
  const loading = schwab.schwabLoading || coinbase.coinbaseLoading;
  const canLoadAll =
    Boolean(schwab.schwabStatus?.connected) ||
    Boolean(coinbase.coinbaseStatus?.configured);
  const coinbasePositionByAccount = new Map(
    coinbase.coinbasePositions.map((position) => [
      position.accountNumber,
      position,
    ]),
  );

  return (
    <section className="panel account-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Brokerage integrations</p>
          <h2>Read-only account details</h2>
        </div>
        <div className="integration-actions">
          <button
            disabled={!schwab.schwabStatus?.configured || loading}
            onClick={schwab.connectSchwab}
            type="button"
          >
            Connect Schwab
          </button>
          <button
            disabled={!coinbase.coinbaseStatus?.configured || loading}
            onClick={coinbase.loadCoinbaseAccounts}
            type="button"
          >
            Connect Coinbase
          </button>
          <button
            className="ghost-button"
            disabled={!canLoadAll || loading}
            onClick={onLoadAllAccounts}
            type="button"
          >
            {loading ? "Loading..." : "Load all accounts"}
          </button>
        </div>
      </div>

      <div className="broker-status-grid">
        <article className="broker-status-card">
          <span>Schwab</span>
          <p>{schwab.schwabMessage}</p>
        </article>
        <article className="broker-status-card">
          <span>Coinbase</span>
          <p>{coinbase.coinbaseMessage}</p>
        </article>
      </div>

      {(schwab.schwabAccounts.length > 0 ||
        coinbase.coinbaseAccounts.length > 0) && (
        <div className="account-list">
          {schwab.schwabAccounts.map((account, index) => (
            <SchwabAccountCard
              account={account}
              index={index}
              key={`schwab-${getAccountSummary(account).accountNumber}`}
            />
          ))}
          {coinbase.coinbaseAccounts.map((account) => {
            const currency =
              account.currency ??
              account.currency_code ??
              account.available_balance?.currency ??
              "";

            return (
              <CoinbaseAccountCard
                account={account}
                key={`coinbase-${account.uuid ?? account.id ?? currency}`}
                position={coinbasePositionByAccount.get(
                  account.uuid ?? account.id ?? `coinbase-${currency}`,
                )}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
