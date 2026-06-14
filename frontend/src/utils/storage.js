export const storageKeys = {
  watchlist: "stock-dashboard-watchlist",
  positionCategories: "stock-dashboard-position-categories",
};

function readStorageJson(key) {
  const savedValue = window.localStorage.getItem(key);

  if (!savedValue) {
    return null;
  }

  try {
    return JSON.parse(savedValue);
  } catch {
    return null;
  }
}

export function readSavedStocks() {
  const parsedStocks = readStorageJson(storageKeys.watchlist);
  return Array.isArray(parsedStocks) ? parsedStocks : null;
}

export function readSavedCategories() {
  const parsedCategories = readStorageJson(storageKeys.positionCategories);
  return parsedCategories && typeof parsedCategories === "object"
    ? parsedCategories
    : {};
}

export function writeStorageValue(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}
