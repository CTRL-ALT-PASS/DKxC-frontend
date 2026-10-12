import { INVENTORY, type InventoryItem } from "../constants/mockData";
import { mockDelay } from "./client";

export async function fetchInventory(): Promise<InventoryItem[]> {
  return mockDelay(INVENTORY);
  // Later:
  // const res = await fetch(`${API_BASE_URL}/inventory`);
  // if (!res.ok) throw new Error("Failed to load inventory");
  // return res.json();
}
