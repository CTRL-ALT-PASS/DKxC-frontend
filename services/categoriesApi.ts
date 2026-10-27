import { request } from "@/services/apiClient";

export interface Category {
  category_id: number;
  category_name: string;
  description: string | null;
}

export function getCategories(signal?: AbortSignal): Promise<Category[]> {
  return request<Category[]>("/categories", { signal });
}
