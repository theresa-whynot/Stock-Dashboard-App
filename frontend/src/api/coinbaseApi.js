import { parseJsonResponse } from "./response";

export async function getCoinbaseStatus() {
  const response = await fetch("/api/coinbase/status");
  return parseJsonResponse(response, "Unable to check Coinbase setup.");
}

export async function getCoinbaseAccounts() {
  const response = await fetch("/api/coinbase/accounts");
  const data = await parseJsonResponse(
    response,
    "Unable to load Coinbase account details.",
  );

  return Array.isArray(data.accounts) ? data.accounts : [];
}
