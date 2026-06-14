import { useEffect, useState } from "react";

import { getCoinbaseAccounts, getCoinbaseStatus } from "../api/coinbaseApi";
import { getCryptoQuotes } from "../api/marketQuotesApi";

function numberOrZero(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getAccountCurrency(account) {
  return (
    account.currency ??
    account.currency_code ??
    account.available_balance?.currency ??
    account.balance?.currency ??
    ""
  ).toUpperCase();
}

function getAccountQuantity(account) {
  return numberOrZero(
    account.available_balance?.value ??
      account.available_balance?.amount ??
      account.balance?.value ??
      account.balance?.amount,
  );
}

function getAccountName(account, currency) {
  return account.name ?? account.display_name ?? `${currency} Coinbase account`;
}

function toCoinbasePosition(account, quote) {
  const symbol = getAccountCurrency(account);
  const quantity = getAccountQuantity(account);
  const price = numberOrZero(quote?.price);

  return {
    accountNumber: account.uuid ?? account.id ?? `coinbase-${symbol}`,
    source: "Coinbase",
    symbol,
    name: quote?.name ?? getAccountName(account, symbol),
    quantity,
    marketValue: quantity * price,
    category: symbol === "BTC" || symbol === "ETH" ? "growth" : "speculative",
    lockedCategory: true,
  };
}

export function useCoinbaseAccounts() {
  const [coinbaseStatus, setCoinbaseStatus] = useState(null);
  const [coinbaseMessage, setCoinbaseMessage] = useState(
    "Checking Coinbase setup...",
  );
  const [coinbaseAccounts, setCoinbaseAccounts] = useState([]);
  const [coinbasePositions, setCoinbasePositions] = useState([]);
  const [coinbaseLoading, setCoinbaseLoading] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      try {
        const data = await getCoinbaseStatus();

        setCoinbaseStatus(data);
        setCoinbaseMessage(
          data.configured
            ? "Coinbase is configured. Load accounts when you are ready."
            : "Add Coinbase API credentials to backend/.env to enable crypto accounts.",
        );
      } catch {
        setCoinbaseMessage(
          "Start the Python backend to use Coinbase account details.",
        );
      }
    }

    loadStatus();
  }, []);

  async function loadCoinbaseAccounts() {
    setCoinbaseLoading(true);
    setCoinbaseMessage("Loading Coinbase account details...");

    try {
      const loadedAccounts = await getCoinbaseAccounts();
      const fundedAccounts = loadedAccounts.filter(
        (account) => getAccountCurrency(account) && getAccountQuantity(account) > 0,
      );
      const symbols = fundedAccounts.map(getAccountCurrency);
      const quotes = await getCryptoQuotes(symbols);
      const quoteBySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));

      setCoinbaseAccounts(loadedAccounts);
      setCoinbasePositions(
        fundedAccounts.map((account) =>
          toCoinbasePosition(account, quoteBySymbol.get(getAccountCurrency(account))),
        ),
      );
      setCoinbaseMessage("Showing read-only Coinbase account details.");
    } catch (error) {
      setCoinbaseMessage(error.message);
    } finally {
      setCoinbaseLoading(false);
    }
  }

  return {
    coinbaseStatus,
    coinbaseMessage,
    coinbaseAccounts,
    coinbasePositions,
    coinbaseLoading,
    loadCoinbaseAccounts,
  };
}
