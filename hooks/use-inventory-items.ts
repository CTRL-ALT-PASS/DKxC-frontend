import { useEffect, useState } from "react";

import {
    getInventoryItems,
    type InventoryItem,
} from "../services/inventoryItemsApi";

export function useInventoryItems() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getInventoryItems({}, controller.signal)
      .then(setItems)
      .catch((e) => {
        if (!(e instanceof Error && e.name === "AbortError")) {
          setError(
            e instanceof Error ? e : new Error("Failed to load ingredients"),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return { items, loading, error };
}
