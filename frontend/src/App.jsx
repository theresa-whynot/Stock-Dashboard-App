import { Hero } from "./components/Hero";
import { PortfolioPanel } from "./components/PortfolioPanel";
import { SchwabPanel } from "./components/SchwabPanel";
import { WatchlistPanel } from "./components/WatchlistPanel";
import { usePortfolioCategories } from "./hooks/usePortfolioCategories";
import { useSchwabAccounts } from "./hooks/useSchwabAccounts";
import { useWatchlist } from "./hooks/useWatchlist";

export default function App() {
  const watchlist = useWatchlist();
  const schwab = useSchwabAccounts();
  const portfolio = usePortfolioCategories(schwab.schwabAccounts);

  return (
    <main className="app-shell">
      <Hero status={watchlist.status} />
      <SchwabPanel
        accounts={schwab.schwabAccounts}
        loading={schwab.schwabLoading}
        message={schwab.schwabMessage}
        onConnect={schwab.connectSchwab}
        onLoadAccounts={schwab.loadSchwabAccounts}
        status={schwab.schwabStatus}
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
