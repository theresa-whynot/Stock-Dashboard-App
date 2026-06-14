import { BrokeragePanel } from "./components/BrokeragePanel";
import { Hero } from "./components/Hero";
import { PortfolioPanel } from "./components/PortfolioPanel";
import { WatchlistPanel } from "./components/WatchlistPanel";
import { useCoinbaseAccounts } from "./hooks/useCoinbaseAccounts";
import { usePortfolioCategories } from "./hooks/usePortfolioCategories";
import { useSchwabAccounts } from "./hooks/useSchwabAccounts";
import { useWatchlist } from "./hooks/useWatchlist";

export default function App() {
  const watchlist = useWatchlist();
  const schwab = useSchwabAccounts();
  const coinbase = useCoinbaseAccounts();
  const portfolio = usePortfolioCategories(
    schwab.schwabAccounts,
    coinbase.coinbasePositions,
  );

  async function loadAllAccounts() {
    await Promise.allSettled([
      schwab.schwabStatus?.connected
        ? schwab.loadSchwabAccounts()
        : Promise.resolve(),
      coinbase.coinbaseStatus?.configured
        ? coinbase.loadCoinbaseAccounts()
        : Promise.resolve(),
    ]);
  }

  return (
    <main className="app-shell">
      <Hero status={watchlist.status} />
      <BrokeragePanel
        coinbase={coinbase}
        onLoadAllAccounts={loadAllAccounts}
        schwab={schwab}
      />
      <PortfolioPanel
        allocations={portfolio.categoryAllocations}
        onUpdatePositionCategory={portfolio.updatePositionCategory}
        positions={portfolio.portfolioPositions}
        totalPortfolioValue={portfolio.totalPortfolioValue}
      />
      <WatchlistPanel
        companyName={watchlist.companyName}
        loading={watchlist.loading}
        onAddStock={watchlist.addStock}
        onCompanyNameChange={watchlist.setCompanyName}
        onRefreshQuotes={watchlist.refreshStocks}
        onRemoveStock={watchlist.removeStock}
        onSymbolChange={watchlist.setSymbol}
        stocks={watchlist.stocks}
        symbol={watchlist.symbol}
      />
    </main>
  );
}
