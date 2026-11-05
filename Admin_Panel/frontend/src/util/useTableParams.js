import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * A custom hook to manage table parameters (pagination, search, filters) in the URL.
 */
export const useTableParams = (initialParams = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const getParam = (key, defaultValue) => {
    const value = searchParams.get(key);
    if (value === null) return defaultValue;
    
    // Auto-parse numbers if they look like numbers, EXCEPT for "search"
    if (key !== "search" && !isNaN(value) && value.trim() !== "") {
      return parseInt(value, 10);
    }
    
    return value;
  };

  const rawPage = parseInt(getParam("page", initialParams.page || 1), 10);
  const rawLimit = parseInt(getParam("limit", initialParams.limit || 10), 10);

  const params = {
    page: isNaN(rawPage) || rawPage <= 0 ? 1 : rawPage,
    limit: isNaN(rawLimit) || rawLimit <= 0 ? initialParams.limit || 10 : rawLimit,
    search: getParam("search", initialParams.search || ""),
    startDate: getParam("startDate", initialParams.startDate || "All"),
    endDate: getParam("endDate", initialParams.endDate || "All"),
    // Dynamic overlay for any other component-specific filters
    ...Object.keys(initialParams).reduce((acc, key) => {
      if (!["page", "limit", "search", "startDate", "endDate"].includes(key)) {
        acc[key] = getParam(key, initialParams[key]);
      }
      return acc;
    }, {}),
  };

  // Sync initial parameters to URL if they are missing
  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    let changed = false;

    Object.keys(initialParams).forEach((key) => {
      if (!searchParams.has(key)) {
        const value = initialParams[key];
        if (value !== undefined && value !== null && value !== "" && value !== "All") {
          nextParams.set(key, value);
          changed = true;
        }
      }
    });

    if (changed) {
      setSearchParams(nextParams, { replace: true });
    }
  }, []); // Only run once on mount

  const updateParams = (newParams) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.keys(newParams).forEach((key) => {
      const value = newParams[key];
      if (value !== undefined && value !== null && value !== "" && value !== "All") {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });
    setSearchParams(nextParams);
  };

  const handleFilterChange = (newParams) => {
    // When a filter changes, we almost always want to reset back to page 1
    updateParams({ ...newParams, page: 1 });
  };

  return {
    params,
    updateParams,
    handleFilterChange,
    getParam,
  };
};
