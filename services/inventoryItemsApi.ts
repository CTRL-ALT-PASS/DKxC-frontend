import { request } from "@/services/apiClient";

export type BaseUnit = "g" | "kg" | "mL" | "L" | "pcs";
export type InventoryStatus = "Available" | "Low Stock" | "Out of Stock";

export interface InventoryItem {
  inventory_item_id: number;
  item_name: string;
  base_unit: BaseUnit;
  quantity_on_hand: string;
  reorder_level: string;
  cost_per_base_unit: string;
  inventory_status: InventoryStatus;
  item_category: string;
  last_restocked: string | null;
  units: { unit_name: string; factor_to_base: string }[];
}

export interface InventoryItemFilters {
  search?: string;
  inventory_status?: InventoryStatus;
  item_category?: string;
}

export function getInventoryItems(
  filters: InventoryItemFilters = {},
  signal?: AbortSignal,
): Promise<InventoryItem[]> {
  return request<InventoryItem[]>("/inventory-items", {
    query: { ...filters },
    signal,
  });
}
