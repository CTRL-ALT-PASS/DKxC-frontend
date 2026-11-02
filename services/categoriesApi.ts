import { request } from "@/services/apiClient";

export interface Category {
  category_id: number;
  category_name: string;
  description: string | null;
}

export function getCategories(signal?: AbortSignal): Promise<Category[]> {
  return request<Category[]>("/categories", { signal });
}

export interface CategoryInput {
  category_name: string;
  /** Send null on update to clear the description */
  description?: string | null;
}

export function createCategory(
  input: CategoryInput,
): Promise<{ message: string; data: Category }> {
  return request("/categories", { method: "POST", body: input });
}

export function updateCategory(
  id: number,
  input: Partial<CategoryInput>,
): Promise<{ message: string; data: Category }> {
  return request(`/categories/${id}`, { method: "PATCH", body: input });
}

/** 409 if the category still has products. */
export function deleteCategory(id: number): Promise<{ message: string }> {
  return request(`/categories/${id}`, { method: "DELETE" });
}
