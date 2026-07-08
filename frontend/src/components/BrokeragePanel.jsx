export function BrokeragePanel({
  coinbase,
  onLoadAllAccounts,
  schwab,
}) {
  const loading = schwab.schwabLoading || coinbase.coinbaseLoading;
  const canLoadAll =
    Boolean(schwab.schwabStatus?.connected) ||
    Boolean(coinbase.coinbaseStatus?.configured);
  const hasLoadedAccounts =
    schwab.schwabAccounts.length > 0 || coinbase.coinbasePositions.length > 0;

  return (
    <section className="panel account-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Brokerage integrations</p>
          <h2>Connect and load accounts</h2>
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
            {loading
              ? "Loading..."
              : hasLoadedAccounts
                ? "Re-load all accounts"
                : "Load all accounts"}
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
    </section>
  );
}
