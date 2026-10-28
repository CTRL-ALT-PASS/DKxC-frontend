import { useAuth } from "@/context/AuthContext";
import { getAuthToken } from "@/services/authStorage";
import {
    getOrderReceipt,
    getOrders,
    type OrderReceipt,
    type OrderStatus,
    type SalesOrderEntry,
} from "@/services/salesApi";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PER_PAGE = 25;

/**
 * GET /orders returns every order (no pagination, no search param), so this
 * hook fetches once per status/type change and does search + paging locally.
 * Fine at cafe volume; move to cursor pagination server-side if the order
 * count grows into the thousands.
 */
export function useSalesOrders() {
  const { signOut } = useAuth();

  const [status, setStatusState] = useState<OrderStatus | null>(null);
  const [search, setSearchState] = useState("");
  const [page, setPage] = useState(1);

  const [all, setAll] = useState<SalesOrderEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

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

      const result = await getOrders(token, {
        status: status ?? undefined,
      });

      if (id !== requestId.current) return;
      setAll(result);
    } catch (e) {
      if (id !== requestId.current) return;

      if (e instanceof Error && e.message === "SESSION_INVALID") {
        await signOut();
        return;
      }

      console.error("Failed to load orders:", e);
      setError(
        "Unable to load transactions. Check your connection and try again.",
      );
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [status, signOut]);

  useEffect(() => {
    void load();
  }, [load]);

  // Local search: order number (with or without "#") or cashier name.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^#/, "");
    if (!q) return all;
    return all.filter(
      (o) =>
        String(o.order_id).includes(q) ||
        (o.employee_name ?? "").toLowerCase().includes(q),
    );
  }, [all, search]);

  const rows = useMemo(
    () => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filtered, page],
  );

  const setStatus = useCallback((v: OrderStatus | null) => {
    setStatusState(v);
    setPage(1);
  }, []);

  const setSearch = useCallback((v: string) => {
    setSearchState(v);
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchState("");
    setStatusState(null);
    setPage(1);
  }, []);

  const hasNext = page * PER_PAGE < filtered.length;

  return {
    rows,
    total: filtered.length,
    perPage: PER_PAGE,
    status,
    setStatus,
    search,
    setSearch,
    clearFilters,
    hasActiveFilters: search.trim() !== "" || status !== null,
    page,
    hasNext,
    goNext: () => hasNext && setPage((p) => p + 1),
    goPrev: () => setPage((p) => Math.max(1, p - 1)),
    isLoading,
    error,
    reload: load,
  };
}

/** Loads the receipt (line items, add-ons, discounts, payment) when a row is expanded. */
export function useOrderReceipt(orderId: number, enabled: boolean) {
  const { signOut } = useAuth();
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      if (!token) {
        await signOut();
        return;
      }
      setReceipt(await getOrderReceipt(token, orderId));
    } catch (e) {
      if (e instanceof Error && e.message === "SESSION_INVALID") {
        await signOut();
        return;
      }
      console.error("Failed to load order details:", e);
      setError("Unable to load order details.");
    } finally {
      setIsLoading(false);
    }
  }, [orderId, signOut]);

  useEffect(() => {
    if (enabled && !receipt && !isLoading && !error) void load();
  }, [enabled, receipt, isLoading, error, load]);

  return { receipt, isLoading, error, reload: load };
}
