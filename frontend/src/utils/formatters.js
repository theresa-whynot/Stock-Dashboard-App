export function formatCurrency(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numberValue);
}

export function formatPercent(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "0.0%";
  }

  return `${numberValue.toFixed(1)}%`;
}
