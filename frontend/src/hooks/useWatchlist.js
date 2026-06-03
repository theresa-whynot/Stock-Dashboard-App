import { useEffect, useState } from "react";

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
      : "Loading sample market data...",
  );
  const [symbol, setSymbol] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    if (initialSavedStocks) {
      return;
    }

    async function loadStocks() {
      try {
        const loadedStocks = await getStocks();
        setStocks(loadedStocks);
        setStatus("Live from the Python API");
      } catch {
        setStatus("Showing local sample data until the backend is running");
      }
    }

    loadStocks();
  }, [initialSavedStocks]);

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

  return {
    stocks,
    status,
    symbol,
    setSymbol,
    companyName,
    setCompanyName,
    addStock,
    removeStock,
  };
}
