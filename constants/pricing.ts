import { getUnitPrice, type Product } from "./mockData";

// Promo discounts (in percent) a cashier can apply in the options modal. Each one
// applies to ONE drink in the order line, never to the whole quantity. Kept as
// plain data so the list can come from a backend later.
export const PROMO_DISCOUNTS = [40, 100] as const;

const toPesos = (n: number) => Math.round(n * 100) / 100;

// How many pesos come off ONE drink at this unit price.
export function getDiscountAmount(unitPrice: number, percent?: number): number {
  if (!percent) return 0;
  return toPesos((unitPrice * percent) / 100);
}

// Full price of an order line: every unit at its unit price, minus the promo
// once (it only covers a single drink).
export function getLineTotal(
  product: Product,
  options: Record<string, string> | undefined,
  quantity: number,
  discountPercent?: number,
): number {
  const unit = getUnitPrice(product, options);
  return toPesos(unit * quantity - getDiscountAmount(unit, discountPercent));
}

// "Medium, 50%, 1 Shot" -- skips "None" choices so the summary stays readable.
export function formatOptions(options?: Record<string, string>): string {
  if (!options) return "";
  return Object.values(options)
    .filter((value) => value !== "None")
    .join(", ");
}

// "40% promo (−₱54.00)"
export function formatPromo(
  product: Product,
  options: Record<string, string> | undefined,
  percent: number,
): string {
  const amount = getDiscountAmount(getUnitPrice(product, options), percent);
  return `${percent}% promo (−₱${amount.toFixed(2)})`;
}
