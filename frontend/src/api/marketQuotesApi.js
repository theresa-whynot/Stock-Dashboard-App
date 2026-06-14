const cryptoSymbols = new Set([
  "ADA",
  "AVAX",
  "BCH",
  "BTC",
  "DOGE",
  "DOT",
  "ETH",
  "LINK",
  "LTC",
  "MATIC",
  "SOL",
  "USDC",
  "XRP",
]);

function normalizeSymbol(symbol) {
  return symbol.trim().toUpperCase().replace("/USD", "").replace("-USD", "");
}

export function isCryptoSymbol(symbol) {
  return cryptoSymbols.has(normalizeSymbol(symbol));
}

function unavailableQuote(symbol, assetType, message) {
  return {
    symbol,
    name: message,
    price: null,
    change: null,
    available: false,
    assetType,
  };
}

async function fetchQuotes(path, key, symbols) {
  if (symbols.length === 0) {
    return [];
  }

  const params = new URLSearchParams({ symbols: symbols.join(",") });
  const response = await fetch(`${path}?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail ?? "Unable to load market data.");
  }

  return Array.isArray(data[key]) ? data[key] : [];
}

export async function getMarketQuotes(symbols = []) {
  const requestedSymbols = [
    ...new Set(symbols.map(normalizeSymbol).filter(Boolean)),
  ];
  const requestedCrypto = requestedSymbols.filter(isCryptoSymbol);
  const requestedStocks = requestedSymbols.filter((symbol) => !isCryptoSymbol(symbol));
  const [stockResult, cryptoResult] = await Promise.allSettled([
    fetchQuotes("/api/stocks", "stocks", requestedStocks),
    fetchQuotes("/api/crypto", "crypto", requestedCrypto),
  ]);
  const quotes = [];
  const errors = [];

  if (stockResult.status === "fulfilled") {
    quotes.push(
      ...stockResult.value.map((quote) => ({ ...quote, assetType: "stock" })),
    );
  } else {
    errors.push(stockResult.reason.message);
    quotes.push(
      ...requestedStocks.map((symbol) =>
        unavailableQuote(symbol, "stock", `${symbol} stock quote unavailable`),
      ),
    );
  }

  if (cryptoResult.status === "fulfilled") {
    quotes.push(
      ...cryptoResult.value.map((quote) => ({ ...quote, assetType: "crypto" })),
    );
  } else {
    errors.push(cryptoResult.reason.message);
    quotes.push(
      ...requestedCrypto.map((symbol) =>
        unavailableQuote(symbol, "crypto", `${symbol} crypto quote unavailable`),
      ),
    );
  }

  const quoteBySymbol = new Map(
    quotes.map((quote) => [normalizeSymbol(quote.symbol), quote]),
  );

  return {
    quotes: requestedSymbols.map(
      (symbol) =>
        quoteBySymbol.get(symbol) ??
        unavailableQuote(symbol, "stock", `${symbol} quote unavailable`),
    ),
    errors,
  };
}

export async function getCryptoQuotes(symbols = []) {
  const requestedSymbols = [
    ...new Set(symbols.map(normalizeSymbol).filter(Boolean)),
  ];
  return fetchQuotes("/api/crypto", "crypto", requestedSymbols);
}
