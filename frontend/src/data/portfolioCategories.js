export const portfolioCategories = {
  lowRiskIndex: {
    label: "Low risk index",
    description: "Broad index ETFs, mutual funds, and diversified funds.",
  },
  growth: {
    label: "Growth",
    description: "Companies where the main goal is share price growth.",
  },
  dividend: {
    label: "Dividend",
    description: "Income-oriented stocks and dividend-focused funds.",
  },
  speculative: {
    label: "Speculative",
    description: "Higher-risk individual positions or unproven ideas.",
  },
};

export const indexSymbols = new Set([
  "DIA",
  "ITOT",
  "IVV",
  "IWM",
  "QQQ",
  "QQQM",
  "SCHA",
  "SCHB",
  "SCHX",
  "SPY",
  "SWPPX",
  "VEA",
  "VOO",
  "VTI",
  "VT",
  "VTSAX",
  "VWO",
]);

export const dividendSymbols = new Set([
  "ABBV",
  "DGRO",
  "HDV",
  "JNJ",
  "KO",
  "MO",
  "NOBL",
  "O",
  "PEP",
  "PG",
  "SCHD",
  "T",
  "VIG",
  "VYM",
  "XOM",
]);

export const growthSymbols = new Set([
  "AAPL",
  "AMZN",
  "AMD",
  "CRM",
  "GOOG",
  "GOOGL",
  "META",
  "MSFT",
  "NFLX",
  "NVDA",
  "SHOP",
  "TSLA",
]);
