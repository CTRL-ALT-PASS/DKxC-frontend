import type {
  InventoryItemCreate,
  InventoryItemPatch,
} from "@/components/inventory/inventory/InventoryItemActions";
import type {
  InventoryItem,
  StockUnit,
} from "@/components/inventory/inventory/InventoryRow";

import { useAuth } from "@/context/AuthContext";
import { getAuthToken } from "@/services/authStorage";
import {
  createInventoryItem,
  getInventoryItems,
  recordStockMovement,
  updateInventoryItem,
  type InventoryItem as ApiInventoryItem,
  type RecordMovementInput,
} from "@/services/inventoryApi";
import { useCallback, useEffect, useState } from "react";

/* ------------------------------ API -> UI mapping ------------------------------ */

// UI item plus the raw ISO timestamp, so "Last Stock Update" can be sorted
// (the display label is formatted text and isn't sortable).
export type InventoryListItem = InventoryItem & {
  lastStockUpdateAt: string | null;
};

function toUiItem(item: ApiInventoryItem): InventoryListItem {
  const units: StockUnit[] = item.units.map((unit) => ({
    // The server has no unit ids, so the (unique) name doubles as the id.
    id: unit.unit_name,
    name: unit.unit_name,
    note: `1 ${unit.unit_name} = ${unit.factor_to_base.toLocaleString("en-US")} ${item.base_unit}`,
    factor: unit.factor_to_base,
  }));

  return {
    id: String(item.inventory_item_id),
    itemName: item.item_name,
    category: item.item_category,
    stocks: item.quantity_on_hand,
    unit: item.base_unit,
    baseCost: item.cost_per_base_unit,
    reorderLevel: item.reorder_level,
    lastStockUpdate: item.last_restocked_label,
    lastStockUpdateAt: item.last_restocked,
    status: item.inventory_status,
    units,
  };
}

/* ----------------------------------- Hook ----------------------------------- */

export function useInventory() {
  const { signOut } = useAuth();

  const [items, setItems] = useState<InventoryListItem[]>([]);
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

  // Both mutation endpoints return the updated item, so patch that one row
  // instead of refetching the whole list.
  const replaceItem = useCallback((apiItem: ApiInventoryItem) => {
    const updated = toUiItem(apiItem);
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }, []);

  const recordMovement = useCallback(
    async (item: InventoryItem, input: RecordMovementInput) => {
      const token = await getAuthToken();

      if (!token) {
        await signOut();
        throw new Error("SESSION_INVALID");
      }

      try {
        const result = await recordStockMovement(token, Number(item.id), input);
        replaceItem(result.inventory_item);
      } catch (e) {
        if (e instanceof Error && e.message === "SESSION_INVALID") {
          await signOut();
        }
        throw e; // let the sheet show the error
      }
    },
    [signOut, replaceItem],
  );

  const updateItem = useCallback(
    async (id: string, patch: InventoryItemPatch) => {
      const token = await getAuthToken();

      if (!token) {
        await signOut();
        throw new Error("SESSION_INVALID");
      }

      try {
        const updated = await updateInventoryItem(token, Number(id), {
          item_name: patch.itemName,
          item_category: patch.category,
          reorder_level: patch.reorderLevel,
          cost_per_base_unit: patch.baseCost,
          // The server replaces the WHOLE list, so always send every unit.
          units: patch.units.map((u) => ({
            unit_name: u.name,
            factor_to_base: u.factor,
          })),
        });
        replaceItem(updated);
      } catch (e) {
        if (e instanceof Error && e.message === "SESSION_INVALID") {
          await signOut();
        }
        throw e; // let the modal show the error
      }
    },
    [signOut, replaceItem],
  );

  const createItem = useCallback(
    async (payload: InventoryItemCreate) => {
      const token = await getAuthToken();

      if (!token) {
        await signOut();
        throw new Error("SESSION_INVALID");
      }

      try {
        // New items start at 0 stock / "Out of Stock"; stock is added later
        // through a Restock movement.
        const created = await createInventoryItem(token, {
          item_name: payload.itemName,
          item_category: payload.category,
          base_unit: payload.unit,
          reorder_level: payload.reorderLevel,
          cost_per_base_unit: payload.baseCost,
          units: payload.units.map((u) => ({
            unit_name: u.name,
            factor_to_base: u.factor,
          })),
        });

        // Insert the new row, keeping the list alphabetical by name.
        const uiItem = toUiItem(created);
        setItems((prev) =>
          [...prev, uiItem].sort((a, b) =>
            a.itemName.localeCompare(b.itemName),
          ),
        );
      } catch (e) {
        if (e instanceof Error && e.message === "SESSION_INVALID") {
          await signOut();
        }
        throw e; // let the modal show the error (422 field errors, etc.)
      }
    },
    [signOut],
  );

  return {
    items,
    isLoading,
    isRefreshing,
    error,
    refresh,
    retry,
    recordMovement,
    updateItem,
    createItem,
  };
}
