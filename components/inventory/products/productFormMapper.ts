import type {
    CreateProductInput,
    Product,
    RecipeIngredient,
} from "@/services/productsApi";

import {
    uid,
    type IngredientLine,
    type ProductFormValues,
} from "./ProductFormScreen";

/** "150.000" -> "150", "115.00" -> "115" (nicer in inputs; the API accepts either) */
const trimDecimal = (v: string) => String(Number(v));

const toLines = (items: RecipeIngredient[]): IngredientLine[] =>
  items.map((i) => ({
    id: uid(),
    ingredientId: String(i.inventory_item_id),
    qty: trimDecimal(i.quantity),
  }));

export function toFormValues(product: Product): ProductFormValues {
  return {
    imageUri: null, // swap for product.image_url once the backend returns it
    name: product.product_name,
    description: product.description ?? "",
    categoryId: String(product.category_id),
    price: trimDecimal(product.selling_price),
    status: product.product_status,
    ingredients: toLines(product.ingredients),
    sizesEnabled: product.sizes.length > 0,
    sizes: product.sizes.map((s) => ({
      id: uid(),
      sizeId: s.size_id,
      name: s.size_label,
      extraCost: trimDecimal(s.additional_price),
      ingredients: toLines(s.ingredients),
    })),
    disabledAddOnIds: product.disabled_add_ons.map((a) => a.add_on_id),
  };
}

const toRecipe = (lines: IngredientLine[]): RecipeIngredient[] =>
  lines.map((l) => ({
    inventory_item_id: Number(l.ingredientId),
    quantity: l.qty.trim(),
  }));

/**
 * Used for both POST and PATCH. On PATCH every list we send replaces the stored one:
 * sizes keep their size_id (kept) and new sizes don't (created); sizes left out are deleted.
 */
export function toPayload(values: ProductFormValues): CreateProductInput {
  return {
    category_id: Number(values.categoryId),
    product_name: values.name.trim(),
    description: values.description.trim() || undefined,
    selling_price: values.price.trim(),
    product_status: values.status,
    ingredients: toRecipe(values.ingredients),
    disabled_add_on_ids: values.disabledAddOnIds,
    sizes: values.sizesEnabled
      ? values.sizes.map((s) => ({
          size_id: s.sizeId,
          size_label: s.name.trim(),
          additional_price: s.extraCost.trim() || "0",
          ingredients: toRecipe(s.ingredients),
        }))
      : [],
  };
}
