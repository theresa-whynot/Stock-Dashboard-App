async function parseJsonResponse(response, fallbackMessage) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail ?? fallbackMessage);
  }

  return data;
}

export async function getSchwabStatus() {
  const response = await fetch("/api/schwab/status");
  return parseJsonResponse(response, "Unable to check Schwab setup.");
}

export async function getSchwabLoginUrl() {
  const response = await fetch("/api/schwab/login-url");
  const data = await parseJsonResponse(response, "Unable to start Schwab login.");
  return data.authorization_url;
}

export async function getSchwabAccounts() {
  const response = await fetch("/api/schwab/accounts?positions=true");
  const data = await parseJsonResponse(
    response,
    "Unable to load Schwab account details.",
  );

  return Array.isArray(data.accounts) ? data.accounts : [];
}
