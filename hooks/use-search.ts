import { useMemo, useState } from "react";

/**
 * Reusable "search by name" logic.
 *
 * @param items    The list to search (pre-filter it by category/status first if needed).
 * @param getText  Returns the text to match for an item, e.g. (p) => p.name
 *
 * Returns the query, its setter, and the filtered results.
 */
export function useSearch<T>(items: T[], getText: (item: T) => string) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => getText(item).toLowerCase().includes(q));
    // getText is intentionally omitted so inline arrow functions don't bust the memo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query]);

  return { query, setQuery, results };
}
