import type { ApiOrderType } from "@/services/ordersApi";
import type {
  Product,
  ProductAddOn,
  ProductSize,
} from "@/services/productsApi";

// What the cashier picked in the options modal. Ids, not labels, so the same
// object can be sent to the backend when orders are submitted.
export interface OrderOptions {
  sizeId?: number;
  addOnIds: number[];
}

export const PROMO_DISCOUNTS = [40, 100] as const;

const toPesos = (n: number) => Math.round(n * 100) / 100;

export function getSelectedSize(
  product: Product,
  options?: OrderOptions,
): ProductSize | undefined {
  if (options?.sizeId == null) return undefined;
  return product.sizes.find((s) => s.size_id === options.sizeId);
}

export function getSelectedAddOns(
  product: Product,
  options?: OrderOptions,
): ProductAddOn[] {
  const ids = new Set(options?.addOnIds ?? []);
  return product.add_ons.filter((a) => ids.has(a.add_on_id));
}

// size.price is already selling_price + additional_price (computed by the API),
// so don't add additional_price again. Add-ons are added on top.
export function getUnitPrice(product: Product, options?: OrderOptions): number {
  const size = getSelectedSize(product, options);
  const base = parseFloat(size ? size.price : product.selling_price);
  const addOns = getSelectedAddOns(product, options).reduce(
    (sum, a) => sum + parseFloat(a.price),
    0,
  );
  return toPesos(base + addOns);
}

export function getDiscountAmount(unitPrice: number, percent?: number): number {
  if (!percent) return 0;
  return toPesos((unitPrice * percent) / 100);
}

export function getLineTotal(
  product: Product,
  options: OrderOptions | undefined,
  quantity: number,
  discountPercent?: number,
): number {
  const unit = getUnitPrice(product, options);
  return toPesos(unit * quantity - getDiscountAmount(unit, discountPercent));
}

// "Iced 16oz, Espresso Shot, Pearl". Needs the product now to resolve names.
export function formatOptions(
  product: Product,
  options?: OrderOptions,
): string {
  if (!options) return "";
  const parts = [
    getSelectedSize(product, options)?.size_label,
    ...getSelectedAddOns(product, options).map((a) => a.add_on_name),
  ];
  return parts.filter(Boolean).join(", ");
}

export function formatPromo(
  product: Product,
  options: OrderOptions | undefined,
  percent: number,
): string {
  const amount = getDiscountAmount(getUnitPrice(product, options), percent);
  return `${percent}% promo (−₱${amount.toFixed(2)})`;
}

export const SENIOR_PWD_DISCOUNT_PERCENT = 20;

export function getOrderTotals(subtotal: number, seniorPwd: boolean) {
  const roundedSubtotal = toPesos(subtotal);
  const seniorPwdDiscount = seniorPwd
    ? toPesos((roundedSubtotal * SENIOR_PWD_DISCOUNT_PERCENT) / 100)
    : 0;
  return {
    subtotal: roundedSubtotal,
    seniorPwdDiscount,
    total: toPesos(roundedSubtotal - seniorPwdDiscount),
  };
}

export const ORDER_TYPE_TO_API: Record<"Dine In" | "Take out", ApiOrderType> = {
  "Dine In": "Dine-In",
  "Take out": "Takeout",
};

// Matches the seeded `discount` codes. Later, build these from GET /api/discounts.
export const PROMO_CODE_BY_PERCENT: Record<number, string> = {
  40: "PROMO_5TH",
  100: "PROMO_10TH",
};

// The toggle doesn't distinguish Senior from PWD (both are 20%). Add a selector later.
export const SENIOR_PWD_CODE = "SENIOR";
