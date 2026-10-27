import { request } from "@/services/apiClient";

export interface AddOn {
  add_on_id: number;
  add_on_name: string;
  price: string;
  category_ids: number[];
  categories: { category_id: number; category_name: string }[];
  ingredients: { inventory_item_id: number; quantity: string }[];
}

export interface AddOnFilters {
  search?: string;
  category_id?: number;
}

export function getAddOns(
  filters: AddOnFilters = {},
  signal?: AbortSignal,
): Promise<AddOn[]> {
  return request<AddOn[]>("/add-ons", { query: { ...filters }, signal });
}
