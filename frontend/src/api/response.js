export async function parseJsonResponse(response, fallbackMessage) {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (isJson && data?.detail) {
      throw new Error(data.detail);
    }

    throw new Error(typeof data === "string" && data ? data : fallbackMessage);
  }

  if (!isJson) {
    throw new Error(fallbackMessage);
  }

  return data;
}
