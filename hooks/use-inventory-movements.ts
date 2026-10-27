import { useAuth } from "@/context/AuthContext";
import { getAuthToken } from "@/services/authStorage";
import {
    getInventoryMovements,
    type MovementLogEntry,
    type MovementLogType,
} from "@/services/inventoryApi";
import type { InventoryCategory } from "@/types/inventoryCategories";
import { useCallback, useEffect, useRef, useState } from "react";

const PER_PAGE = 25;
const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MAX_LENGTH = 100; // matches the backend's max:100 rule

export function useInventoryMovements() {
  const { signOut } = useAuth();

  const [filter, setFilterState] = useState<MovementLogType | null>(null);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  // `search` follows the input on every keystroke; `debouncedSearch` is what
  // actually gets sent to the API.
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // One cursor per visited page: [null, cursorForPage2, ...]
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [rows, setRows] = useState<MovementLogEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const cursor = cursorStack[cursorStack.length - 1];
  const page = cursorStack.length;

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();

      if (!token) {
        await signOut();
        return;
      }

      const result = await getInventoryMovements(token, {
        type: filter ? [filter] : undefined,
        category: categories.length ? categories : undefined,
        search: debouncedSearch || undefined,
        cursor: cursor ?? undefined,
        per_page: PER_PAGE,
      });

      if (id !== requestId.current) return; // a newer request replaced this one
      setRows(result.data);
      setNextCursor(result.nextCursor);
    } catch (e) {
      if (id !== requestId.current) return;

      if (e instanceof Error && e.message === "SESSION_INVALID") {
        await signOut();
        return;
      }

      console.error("Failed to load stock movements:", e);
      setError(
        "Unable to load stock movements. Check your connection and try again.",
      );
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [filter, categories, debouncedSearch, cursor, signOut]);

  useEffect(() => {
    void load();
  }, [load]);

  // Debounce the search text; a changed query always goes back to page 1.
  useEffect(() => {
    const next = search.trim().slice(0, SEARCH_MAX_LENGTH);
    if (next === debouncedSearch) return;

    const timer = setTimeout(() => {
      setDebouncedSearch(next);
      setCursorStack([null]);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  const setFilter = useCallback((value: MovementLogType | null) => {
    setFilterState(value);
    setCursorStack([null]);
  }, []);

  const toggleCategory = useCallback((c: InventoryCategory) => {
    setCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
    setCursorStack([null]);
  }, []);

  // Clears the search box AND the categories. Skips the debounce so the
  // list refreshes immediately instead of 300ms later.
  const clearFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setCategories([]);
    setCursorStack([null]);
  }, []);

  const goNext = useCallback(() => {
    if (nextCursor) setCursorStack((s) => [...s, nextCursor]);
  }, [nextCursor]);

  const goPrev = useCallback(() => {
    setCursorStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);

  return {
    rows,
    filter,
    setFilter,
    search,
    setSearch,
    categories,
    toggleCategory,
    clearFilters,
    hasActiveFilters: search.trim() !== "" || categories.length > 0,
    page,
    hasNext: nextCursor !== null,
    isLoading,
    error,
    goNext,
    goPrev,
    reload: load,
  };
}
