import type {
  InventoryItem,
  StockUnit,
} from "@/components/inventory/inventory/InventoryRow";
import { useAuth } from "@/context/AuthContext";
import { getAuthToken } from "@/services/authStorage";
import {
  getInventoryItems,
  type InventoryItem as ApiInventoryItem,
} from "@/services/inventoryApi";
import { useCallback, useEffect, useState } from "react";

/* ------------------------------ API -> UI mapping ------------------------------ */

function formatLastRestocked(value: string | null): string {
  if (!value) return "No stock yet";

  // Laravel may send "2026-10-15 15:42:00" or an ISO string.
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;

  const day = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${day} · ${time}`;
}

function toUiItem(item: ApiInventoryItem): InventoryItem {
  const units: StockUnit[] = item.units.map((unit) => ({
    id: unit.unit_name,
    name: unit.unit_name,
    note: `1 = ${unit.factor_to_base.toLocaleString("en-US")} ${item.base_unit}`,
    factor: unit.factor_to_base,
  }));

  return {
    id: String(item.inventory_item_id),
    itemName: item.item_name,
    stocks: item.quantity_on_hand,
    unit: item.base_unit,
    baseCost: item.cost_per_base_unit,
    lastStockUpdate: item.last_restocked_label,
    status: item.inventory_status,
    units,
  };
}

/* ----------------------------------- Hook ----------------------------------- */

export function useInventory() {
  const { signOut } = useAuth();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "initial") setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      try {
        const token = await getAuthToken();

        if (!token) {
          await signOut();
          return;
        }

        const data = await getInventoryItems(token);
        setItems(data.map(toUiItem));
      } catch (e) {
        if (e instanceof Error && e.message === "SESSION_INVALID") {
          await signOut();
          return;
        }

        console.error("Failed to load inventory:", e);
        setError(
          "Unable to load inventory. Check your connection and try again.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [signOut],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  const refresh = useCallback(() => load("refresh"), [load]);
  const retry = useCallback(() => load("initial"), [load]);

  return { items, isLoading, isRefreshing, error, refresh, retry };
}