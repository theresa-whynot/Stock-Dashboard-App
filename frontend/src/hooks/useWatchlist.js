import { useCallback, useEffect, useMemo, useState } from "react";

import { getStocks } from "../api/stocksApi";
import { fallbackStocks } from "../data/fallbackStocks";
import {
  readSavedStocks,
  storageKeys,
  writeStorageValue,
} from "../utils/storage";

export function useWatchlist() {
  const [initialSavedStocks] = useState(() => readSavedStocks());
  const [stocks, setStocks] = useState(() => initialSavedStocks ?? fallbackStocks);
  const [status, setStatus] = useState(
    initialSavedStocks
      ? "Showing your locally saved watchlist"
      : "Loading live market data...",
  );
  const [symbol, setSymbol] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const stockSymbols = useMemo(
    () => stocks.map((stock) => stock.symbol).filter(Boolean).join(","),
    [stocks],
  );
  const mergeLoadedStocks = useCallback((loadedStocks) => {
    setStocks((currentStocks) =>
      loadedStocks.map((stock) => {
        const savedStock = currentStocks.find(
          (currentStock) => currentStock.symbol === stock.symbol,
        );

        return {
          ...savedStock,
          ...stock,
          name: stock.name || savedStock?.name || stock.symbol,
        };
      }),
    );
  }, []);

  const refreshStocks = useCallback(async () => {
    const requestedSymbols = stockSymbols.split(",").filter(Boolean);

    if (requestedSymbols.length === 0) {
      setStatus("Add a symbol to refresh live quotes.");
      return;
    }

    setLoading(true);
    setStatus("Refreshing live market data...");

    try {
      const loadedStocks = await getStocks(requestedSymbols);
      mergeLoadedStocks(loadedStocks);
      setStatus("Live market data from Schwab");
    } catch (error) {
      setStatus(`${error.message} Showing local data.`);
    } finally {
      setLoading(false);
    }
  }, [mergeLoadedStocks, stockSymbols]);

  useEffect(() => {
    const requestedSymbols = stockSymbols.split(",").filter(Boolean);

    if (requestedSymbols.length === 0) {
      return;
    }

    let ignoreResponse = false;

    async function loadStocks() {
      setLoading(true);
      setStatus("Loading live market data...");

      try {
        const loadedStocks = await getStocks(requestedSymbols);

        if (ignoreResponse) {
          return;
        }

        mergeLoadedStocks(loadedStocks);
        setStatus("Live market data from Schwab");
      } catch (error) {
        if (!ignoreResponse) {
          setStatus(`${error.message} Showing local data.`);
        }
      } finally {
        if (!ignoreResponse) {
          setLoading(false);
        }
      }
    }

    loadStocks();

    return () => {
      ignoreResponse = true;
    };
  }, [mergeLoadedStocks, stockSymbols]);

  useEffect(() => {
    writeStorageValue(storageKeys.watchlist, stocks);
  }, [stocks]);

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
        price: null,
        change: null,
        available: false,
      },
    ]);
    setStatus("Loading live market data...");
    setSymbol("");
    setCompanyName("");
  }

  function removeStock(symbolToRemove) {
    setStocks((currentStocks) =>
      currentStocks.filter((stock) => stock.symbol !== symbolToRemove),
    );
    setStatus("Showing your locally saved watchlist");
  }

  return {
    stocks,
    status,
    loading,
    symbol,
    setSymbol,
    companyName,
    setCompanyName,
    addStock,
    removeStock,
    refreshStocks,
  };
}
