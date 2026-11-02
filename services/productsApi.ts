import { ApiError, request } from "@/services/apiClient";

export { ApiError }; // keeps `import { ApiError } from "@/services/productsApi"` working

/* ------------------------------------------------------------------ */
/* Types (decimals come back from the API as strings)                  */
/* ------------------------------------------------------------------ */

export type ProductStatus = "Active" | "Inactive" | "Discontinued";

export interface RecipeIngredient {
  inventory_item_id: number;
  quantity: string;
}

export interface ProductIngredient extends RecipeIngredient {
  product_id: number;
}

export interface ProductSize {
  size_id: number;
  product_id: number;
  size_label: string;
  additional_price: string;
  /** selling_price + additional_price, already computed by the API */
  price: string;
  ingredients: RecipeIngredient[];
}

export interface ProductAddOn {
  add_on_id: number;
  add_on_name: string;
  price: string;
  enabled: boolean;
}

export interface Product {
  product_id: number;
  category_id: number;
  product_name: string;
  description: string | null;
  selling_price: string;
  product_status: ProductStatus;
  is_available: boolean;
  ingredients: ProductIngredient[];
  sizes: ProductSize[];
  /** Add-ons the product offers (use in the POS) */
  add_ons: ProductAddOn[];
  /** Add-ons its category offers but this product switched off (use in the edit form) */
  disabled_add_ons: ProductAddOn[];
}

export interface ProductFilters {
  search?: string;
  category_id?: number;
  product_status?: ProductStatus;
}

export interface SizeInput {
  /** Required on PATCH for every size you want to keep. Omit to create a new size. */
  size_id?: number;
  size_label: string;
  additional_price: string;
  ingredients?: RecipeIngredient[];
}

export interface CreateProductInput {
  category_id: number;
  product_name: string;
  description?: string;
  selling_price: string;
  product_status: ProductStatus;
  ingredients: RecipeIngredient[];
  disabled_add_on_ids?: number[];
  sizes?: SizeInput[];
}

/** Every field is optional. A list that is sent REPLACES the whole list. */
export type UpdateProductInput = Partial<CreateProductInput>;

interface MutationResponse {
  message: string;
  data: Product;
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

export function getProducts(
  filters: ProductFilters = {},
  signal?: AbortSignal,
): Promise<Product[]> {
  return request<Product[]>("/products", { query: { ...filters }, signal });
}

export function getProduct(id: number, signal?: AbortSignal): Promise<Product> {
  return request<Product>(`/products/${id}`, { signal });
}

export function createProduct(
  input: CreateProductInput,
): Promise<MutationResponse> {
  return request<MutationResponse>("/products", {
    method: "POST",
    body: input,
  });
}

export function updateProduct(
  id: number,
  input: UpdateProductInput,
): Promise<MutationResponse> {
  return request<MutationResponse>(`/products/${id}`, {
    method: "PATCH",
    body: input,
  });
}

/** 409 if the product has sales history: set it to Discontinued instead. */
export function deleteProduct(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/products/${id}`, { method: "DELETE" });
}
