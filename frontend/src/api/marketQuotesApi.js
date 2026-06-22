import { parseJsonResponse } from "./response";

function normalizeSymbol(symbol) {
  return symbol.trim().toUpperCase().replace("/USD", "").replace("-USD", "");
}

function normalizeEntries(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => {
      if (typeof entry === "string") {
        return { symbol: normalizeSymbol(entry), assetType: undefined };
      }

      return {
        symbol: normalizeSymbol(entry.symbol),
        assetType: entry.assetType,
      };
    })
    .filter((entry) => entry.symbol);
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
  const data = await parseJsonResponse(response, "Unable to load market data.");

  return Array.isArray(data[key]) ? data[key] : [];
}

function quoteBySymbol(quotes) {
  return new Map(quotes.map((quote) => [normalizeSymbol(quote.symbol), quote]));
}

function resolveQuote(entry, cryptoQuotes, stockQuotes) {
  const cryptoQuote = cryptoQuotes.get(entry.symbol);
  const stockQuote = stockQuotes.get(entry.symbol);

  if (entry.assetType === "crypto") {
    return (
      cryptoQuote ??
      unavailableQuote(entry.symbol, "crypto", `${entry.symbol} crypto quote unavailable`)
    );
  }

  if (entry.assetType === "stock") {
    return (
      stockQuote ??
      unavailableQuote(entry.symbol, "stock", `${entry.symbol} stock quote unavailable`)
    );
  }

  if (cryptoQuote?.available) {
    return { ...cryptoQuote, assetType: "crypto" };
  }

  if (stockQuote?.available) {
    return { ...stockQuote, assetType: "stock" };
  }

  if (cryptoQuote || stockQuote) {
    const fallbackQuote = cryptoQuote ?? stockQuote;
    return {
      ...fallbackQuote,
      assetType: cryptoQuote ? "crypto" : "stock",
    };
  }

  return unavailableQuote(
    entry.symbol,
    "stock",
    `${entry.symbol} quote unavailable`,
  );
}

export async function getMarketQuotes(entries = []) {
  const uniqueEntries = [];
  const seen = new Set();

  for (const entry of normalizeEntries(entries)) {
    if (!seen.has(entry.symbol)) {
      seen.add(entry.symbol);
      uniqueEntries.push(entry);
    }
  }

  const cryptoSymbols = uniqueEntries
    .filter((entry) => entry.assetType === "crypto" || entry.assetType === undefined)
    .map((entry) => entry.symbol);
  const stockSymbols = uniqueEntries
    .filter((entry) => entry.assetType === "stock" || entry.assetType === undefined)
    .map((entry) => entry.symbol);
  const [stockResult, cryptoResult] = await Promise.allSettled([
    fetchQuotes("/api/stocks", "stocks", stockSymbols),
    fetchQuotes("/api/crypto", "crypto", cryptoSymbols),
  ]);
  const errors = [];
  const stockQuotes = quoteBySymbol(
    stockResult.status === "fulfilled"
      ? stockResult.value.map((quote) => ({ ...quote, assetType: "stock" }))
      : [],
  );
  const cryptoQuotes = quoteBySymbol(
    cryptoResult.status === "fulfilled"
      ? cryptoResult.value.map((quote) => ({ ...quote, assetType: "crypto" }))
      : [],
  );

  if (stockResult.status === "rejected") {
    errors.push(stockResult.reason.message);
  }

  if (cryptoResult.status === "rejected") {
    errors.push(cryptoResult.reason.message);
  }

  return {
    quotes: uniqueEntries.map((entry) =>
      resolveQuote(entry, cryptoQuotes, stockQuotes),
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
