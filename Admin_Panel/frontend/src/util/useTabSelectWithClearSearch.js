import { useState } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Tab state for pages with MultiButton tabs that share URL search via useTableParams.
 * Clears the `search` query param when the user switches tabs.
 */
export const useTabSelectWithClearSearch = (initialTab) => {
  const [multiButtonSelect, setMultiButtonSelect] = useState(initialTab);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleMultiButtonSelect = (tab) => {
    if (tab != null && tab !== multiButtonSelect) {
      const nextParams = new URLSearchParams(searchParams);
      if (nextParams.has("search")) {
        nextParams.delete("search");
        setSearchParams(nextParams, { replace: true });
      }
    }
    setMultiButtonSelect(tab);
  };

  return { multiButtonSelect, setMultiButtonSelect, handleMultiButtonSelect };
};
