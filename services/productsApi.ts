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
  /** Storage path inside the product-images bucket. null = no image yet. */
  image_path: string | null;
  /** Full public URL built by the API from image_path. Use this for <Image source={{ uri }} />. */
  image_url: string | null;
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

/**
 * Images are NOT part of create/update. Create the product first, then call
 * uploadProductImage(product_id, file). image_path sent to PATCH is ignored.
 */
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

/** A picked image in the shape React Native's FormData expects in place of a Blob. */
export interface ProductImageFile {
  uri: string;
  name: string;
  type: string;
}

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

/* ------------------------------------------------------------------ */
/* Product image                                                       */
/* ------------------------------------------------------------------ */

/**
 * Turns an expo-image-picker asset into the { uri, name, type } object that
 * FormData needs. Takes a structural type so this file doesn't import expo.
 */
export function toProductImageFile(asset: {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}): ProductImageFile {
  const type = asset.mimeType ?? "image/jpeg";
  const ext = (type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
  return { uri: asset.uri, type, name: asset.fileName ?? `product.${ext}` };
}

/**
 * Uploads or replaces the product's image (jpg/png/webp, max 5 MB).
 * 422 -> ApiError.errors.image holds the reason; 502 -> storage was unreachable.
 */
export async function uploadProductImage(
  id: number,
  file: ProductImageFile,
): Promise<MutationResponse> {
  const form = new FormData();

  if (file.uri.startsWith("blob:") || file.uri.startsWith("data:")) {
    // Web: the browser's FormData only accepts real Blobs/Files. A plain
    // { uri, name, type } object gets stringified to "[object Object]".
    const blob = await (await fetch(file.uri)).blob();
    form.append("image", blob, file.name);
  } else {
    // Native (file:// or content://): React Native accepts { uri, name, type } in place of a Blob.
    form.append("image", file as unknown as Blob);
  }

  return request<MutationResponse>(`/products/${id}/image`, {
    method: "POST",
    body: form,
  });
}

export function deleteProductImage(id: number): Promise<MutationResponse> {
  return request<MutationResponse>(`/products/${id}/image`, {
    method: "DELETE",
  });
}