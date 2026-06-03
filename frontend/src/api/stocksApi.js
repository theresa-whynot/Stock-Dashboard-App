export async function getStocks() {
  const response = await fetch("/api/stocks");

  if (!response.ok) {
    throw new Error("Backend returned an error");
  }

  const data = await response.json();
  return data.stocks;
}
