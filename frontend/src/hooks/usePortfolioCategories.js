import { useEffect, useMemo, useState } from "react";

import {
  getCategoryAllocations,
  getPortfolioPositions,
  getTotalPortfolioValue,
} from "../utils/portfolio";
import {
  readSavedCategories,
  storageKeys,
  writeStorageValue,
} from "../utils/storage";

export function usePortfolioCategories(accounts) {
  const [categoryBySymbol, setCategoryBySymbol] = useState(() =>
    readSavedCategories(),
  );

  const portfolioPositions = useMemo(
    () => getPortfolioPositions(accounts, categoryBySymbol),
    [accounts, categoryBySymbol],
  );
  const totalPortfolioValue = useMemo(
    () => getTotalPortfolioValue(accounts, portfolioPositions),
    [accounts, portfolioPositions],
  );
  const categoryAllocations = useMemo(
    () => getCategoryAllocations(portfolioPositions, totalPortfolioValue),
    [portfolioPositions, totalPortfolioValue],
  );

  useEffect(() => {
    writeStorageValue(storageKeys.positionCategories, categoryBySymbol);
  }, [categoryBySymbol]);

  function updatePositionCategory(symbolToUpdate, category) {
    setCategoryBySymbol((currentCategories) => ({
      ...currentCategories,
      [symbolToUpdate]: category,
    }));
  }

  return {
    categoryAllocations,
    portfolioPositions,
    totalPortfolioValue,
    updatePositionCategory,
  };
}
