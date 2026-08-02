import { useState } from "react";

//* Server-side sort state for a paginated table. `sortParams` spreads
//* directly into both the list query params and the CSV export params, so
//* a download always matches what's on screen.
export const useTableSort = (defaultKey, defaultOrder = "asc", { setPage } = {}) => {
  const [sortBy, setSortBy] = useState(defaultKey);
  const [sortOrder, setSortOrder] = useState(defaultOrder);

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage?.(1);
  };

  return {
    sortBy,
    sortOrder,
    handleSort,
    sortParams: { sort_by: sortBy, sort_order: sortOrder },
  };
};
