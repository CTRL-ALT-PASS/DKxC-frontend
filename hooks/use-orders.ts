import { useCallback, useEffect, useRef, useState } from "react";

import {
    cancelOrder,
    completeOrder,
    getOrders,
    updateOrder,
    type CompleteResult,
    type Order,
    type OrderFilters,
    type OrderInput,
} from "@/services/ordersApi";

function toError(e: unknown): Error {
  return e instanceof Error ? e : new Error("Something went wrong");
}
function isAbort(e: unknown): boolean {
  return e instanceof Error && e.name === "AbortError";
}

export function useOrders(filters: OrderFilters = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const filterKey = JSON.stringify(filters);

  const refetch = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      setOrders(await getOrders(JSON.parse(filterKey), controller.signal));
    } catch (e) {
      if (!isAbort(e)) setError(toError(e));
    } finally {
      if (controllerRef.current === controller) setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => {
    refetch();
    return () => controllerRef.current?.abort();
  }, [refetch]);

  // Mutations throw so screens can show the server message (422 stock shortages, 409 conflicts).
  const update = useCallback(async (id: number, input: OrderInput) => {
    setSaving(true);
    try {
      const res = await updateOrder(id, input);
      setOrders((prev) => prev.map((o) => (o.order_id === id ? res.data : o)));
      return res.data;
    } finally {
      setSaving(false);
    }
  }, []);

  const complete = useCallback(
    async (id: number): Promise<CompleteResult> => {
      setSaving(true);
      try {
        const res = await completeOrder(id);
        await refetch(); // the order left the Pending list
        return res.data;
      } finally {
        setSaving(false);
      }
    },
    [refetch],
  );

  const cancel = useCallback(
    async (id: number, approvalToken?: string) => {
      setSaving(true);
      try {
        await cancelOrder(id, approvalToken);
        await refetch();
      } finally {
        setSaving(false);
      }
    },
    [refetch],
  );

  return { orders, loading, error, saving, refetch, update, complete, cancel };
}
