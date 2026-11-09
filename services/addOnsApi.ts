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

export interface AddOnInput {
  add_on_name: string;
  price: string;
  category_ids: number[];
  ingredients: { inventory_item_id: number; quantity: string }[];
}

export function createAddOn(
  input: AddOnInput,
): Promise<{ message: string; data: AddOn }> {
  return request("/add-ons", { method: "POST", body: input });
}

/** Lists you send (category_ids, ingredients) REPLACE the whole list. */
export function updateAddOn(
  id: number,
  input: Partial<AddOnInput>,
): Promise<{ message: string; data: AddOn }> {
  return request(`/add-ons/${id}`, { method: "PATCH", body: input });
}

/** 409 if the add-on has been sold. Remove it from all categories instead. */
export function deleteAddOn(id: number): Promise<{ message: string }> {
  return request(`/add-ons/${id}`, { method: "DELETE" });
}
