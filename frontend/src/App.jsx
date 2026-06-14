import { Hero } from "./components/Hero";
import { PortfolioPanel } from "./components/PortfolioPanel";
import { SchwabPanel } from "./components/SchwabPanel";
import { WatchlistPanel } from "./components/WatchlistPanel";
import { usePortfolioCategories } from "./hooks/usePortfolioCategories";
import { useSchwabAccounts } from "./hooks/useSchwabAccounts";
import { useWatchlist } from "./hooks/useWatchlist";

function readSavedStocks() {
  const savedStocks = window.localStorage.getItem(storageKey);

  if (!savedStocks) {
    return null;
  }

  try {
    const parsedStocks = JSON.parse(savedStocks);
    return Array.isArray(parsedStocks) ? parsedStocks : null;
  } catch {
    return null;
  }
}

function readSavedCategories() {
  const savedCategories = window.localStorage.getItem(categoryStorageKey);

  if (!savedCategories) {
    return {};
  }

  try {
    const parsedCategories = JSON.parse(savedCategories);
    return parsedCategories && typeof parsedCategories === "object"
      ? parsedCategories
      : {};
  } catch {
    return {};
  }
}

function formatCurrency(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numberValue);
}

function formatPercent(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "0.0%";
  }

  return `${numberValue.toFixed(1)}%`;
}

function getAccountSummary(account) {
  const securitiesAccount = account.securitiesAccount ?? account;
  const balances =
    securitiesAccount.currentBalances ?? securitiesAccount.initialBalances ?? {};
  const positions = Array.isArray(securitiesAccount.positions)
    ? securitiesAccount.positions
    : [];

  return {
    accountNumber:
      securitiesAccount.accountNumber ?? securitiesAccount.accountHash ?? "Unknown",
    accountType:
      securitiesAccount.type ?? securitiesAccount.accountType ?? "Brokerage",
    liquidationValue:
      balances.liquidationValue ??
      balances.totalAccountValue ??
      balances.cashBalance,
    positions,
  };
}

function getPositionSymbol(position) {
  return position.instrument?.symbol ?? position.symbol ?? "UNKNOWN";
}

function getPositionName(position) {
  return (
    position.instrument?.description ??
    position.instrument?.cusip ??
    position.description ??
    "No description"
  );
}

function getPositionQuantity(position) {
  return (
    position.longQuantity ??
    position.shortQuantity ??
    position.quantity ??
    position.instrument?.quantity ??
    0
  );
}

function getPositionMarketValue(position) {
  const directValue =
    position.marketValue ??
    position.longMarketValue ??
    position.shortMarketValue ??
    position.currentValue;

  if (Number.isFinite(Number(directValue))) {
    return Math.abs(Number(directValue));
  }

  const quantity = Number(getPositionQuantity(position));
  const averagePrice = Number(position.averagePrice ?? position.price ?? 0);

  return Math.abs(quantity * averagePrice);
}

function getDefaultCategory(position) {
  const symbol = getPositionSymbol(position).toUpperCase();
  const assetType = String(position.instrument?.assetType ?? "").toUpperCase();

  if (
    indexSymbols.has(symbol) ||
    assetType.includes("ETF") ||
    assetType.includes("MUTUAL")
  ) {
    return "lowRiskIndex";
  }

  if (dividendSymbols.has(symbol)) {
    return "dividend";
  }

  if (growthSymbols.has(symbol)) {
    return "growth";
  }

  return "speculative";
}

function getPortfolioPositions(accounts, categoryBySymbol) {
  return accounts.flatMap((account, accountIndex) => {
    const summary = getAccountSummary(account);

    return summary.positions.map((position) => {
      const symbol = getPositionSymbol(position).toUpperCase();

      return {
        accountNumber: summary.accountNumber,
        accountIndex,
        symbol,
        name: getPositionName(position),
        quantity: getPositionQuantity(position),
        marketValue: getPositionMarketValue(position),
        category: categoryBySymbol[symbol] ?? getDefaultCategory(position),
      };
    });
  });
}

function getTotalPortfolioValue(accounts, positions) {
  const accountTotal = accounts.reduce((total, account) => {
    const summary = getAccountSummary(account);
    const liquidationValue = Number(summary.liquidationValue);

    return Number.isFinite(liquidationValue) && liquidationValue > 0
      ? total + liquidationValue
      : total;
  }, 0);

  if (accountTotal > 0) {
    return accountTotal;
  }

  return positions.reduce((total, position) => total + position.marketValue, 0);
}

function getCategoryAllocations(positions, totalPortfolioValue) {
  return Object.entries(portfolioCategories).map(([categoryKey, category]) => {
    const categoryPositions = positions.filter(
      (position) => position.category === categoryKey,
    );
    const value = categoryPositions.reduce(
      (total, position) => total + position.marketValue,
      0,
    );

    return {
      key: categoryKey,
      ...category,
      count: categoryPositions.length,
      value,
      percent: totalPortfolioValue > 0 ? (value / totalPortfolioValue) * 100 : 0,
    };
  });
}

export default function App() {
  const watchlist = useWatchlist();
  const schwab = useSchwabAccounts();
  const portfolio = usePortfolioCategories(schwab.schwabAccounts);

  async function connectSchwab() {
    setSchwabLoading(true);

    try {
      const response = await fetch("/api/schwab/login-url");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Unable to start Schwab login.");
      }

      window.location.href = data.authorization_url;
    } catch (error) {
      setSchwabMessage(error.message);
      setSchwabLoading(false);
    }
  }

  async function loadSchwabAccounts() {
    setSchwabLoading(true);
    setSchwabMessage("Loading Schwab account details...");

    try {
      const response = await fetch("/api/schwab/accounts?positions=true");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Unable to load Schwab account details.");
      }

      setSchwabAccounts(Array.isArray(data.accounts) ? data.accounts : []);
      setSchwabMessage("Showing read-only Schwab account details.");
      setSchwabStatus((currentStatus) =>
        currentStatus
          ? { ...currentStatus, connected: true }
          : { configured: true, connected: true },
      );
    } catch (error) {
      setSchwabMessage(error.message);
    } finally {
      setSchwabLoading(false);
    }
  }

  function addStock(event) {
    event.preventDefault();

    const trimmedSymbol = symbol.trim().toUpperCase();
    const trimmedCompanyName = companyName.trim();

    if (!trimmedSymbol) {
      return;
    }

    const stockExists = stocks.some((stock) => stock.symbol === trimmedSymbol);

    if (stockExists) {
      setStatus(`${trimmedSymbol} is already in your watchlist`);
      return;
    }

    setStocks((currentStocks) => [
      ...currentStocks,
      {
        symbol: trimmedSymbol,
        name: trimmedCompanyName || `${trimmedSymbol} watchlist stock`,
        price: 0,
        change: 0,
      },
    ]);
    setStatus("Showing your locally saved watchlist");
    setSymbol("");
    setCompanyName("");
  }

  function removeStock(symbolToRemove) {
    setStocks((currentStocks) =>
      currentStocks.filter((stock) => stock.symbol !== symbolToRemove),
    );
    setStatus("Showing your locally saved watchlist");
  }

  function updatePositionCategory(symbolToUpdate, category) {
    setCategoryBySymbol((currentCategories) => ({
      ...currentCategories,
      [symbolToUpdate]: category,
    }));
  }

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
