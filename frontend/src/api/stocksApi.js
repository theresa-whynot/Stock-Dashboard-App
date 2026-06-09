export async function getStocks(symbols = []) {
  const params = new URLSearchParams();
  const requestedSymbols = symbols
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);

  if (requestedSymbols.length > 0) {
    params.set("symbols", requestedSymbols.join(","));
  }

  const response = await fetch(
    params.toString() ? `/api/stocks?${params.toString()}` : "/api/stocks",
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail ?? "Backend returned an error");
  }

  return data.stocks;
}
