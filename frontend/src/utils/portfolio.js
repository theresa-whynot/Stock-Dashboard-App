import {
  dividendSymbols,
  growthSymbols,
  indexSymbols,
  portfolioCategories,
} from "../data/portfolioCategories";

export function getAccountSummary(account) {
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

export function getPositionSymbol(position) {
  return position.instrument?.symbol ?? position.symbol ?? "UNKNOWN";
}

export function getPositionName(position) {
  return (
    position.instrument?.description ??
    position.instrument?.cusip ??
    position.description ??
    "No description"
  );
}

export function getPositionQuantity(position) {
  return (
    position.longQuantity ??
    position.shortQuantity ??
    position.quantity ??
    position.instrument?.quantity ??
    0
  );
}

export function getPositionMarketValue(position) {
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

export function getDefaultCategory(position) {
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

function getCryptoCategory(symbol) {
  return symbol === "BTC" || symbol === "ETH" ? "growth" : "speculative";
}

function getSchwabPositions(accounts, categoryBySymbol) {
  return accounts.flatMap((account, accountIndex) => {
    const summary = getAccountSummary(account);

    return summary.positions.map((position) => {
      const symbol = getPositionSymbol(position).toUpperCase();

      return {
        accountNumber: summary.accountNumber,
        accountIndex,
        source: "Schwab",
        symbol,
        name: getPositionName(position),
        quantity: getPositionQuantity(position),
        marketValue: getPositionMarketValue(position),
        category: categoryBySymbol[symbol] ?? getDefaultCategory(position),
      };
    });
  });
}

function getCoinbasePositions(coinbasePositions) {
  return coinbasePositions.map((position) => ({
    ...position,
    source: "Coinbase",
    category: getCryptoCategory(position.symbol),
    lockedCategory: true,
  }));
}

export function getPortfolioPositions(
  accounts,
  categoryBySymbol,
  coinbasePositions = [],
) {
  return [
    ...getSchwabPositions(accounts, categoryBySymbol),
    ...getCoinbasePositions(coinbasePositions),
  ];
}

export function getTotalPortfolioValue(accounts, positions) {
  const accountTotal = accounts.reduce((total, account) => {
    const summary = getAccountSummary(account);
    const liquidationValue = Number(summary.liquidationValue);

    return Number.isFinite(liquidationValue) && liquidationValue > 0
      ? total + liquidationValue
      : total;
  }, 0);

  const coinbaseTotal = positions
    .filter((position) => position.source === "Coinbase")
    .reduce((total, position) => total + position.marketValue, 0);

  if (accountTotal > 0) {
    return accountTotal + coinbaseTotal;
  }

  return positions.reduce((total, position) => total + position.marketValue, 0);
}

export function getCategoryAllocations(positions, totalPortfolioValue) {
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
