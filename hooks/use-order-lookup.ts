import type { OrderOptions } from "@/constants/pricing";
import { useProducts } from "@/hooks/use-products";
import type { OrderItem } from "@/services/ordersApi";
import { useMemo } from "react";

export const peso = (v: string | number) => `₱${Number(v).toFixed(2)}`;

export function useOrderLookup() {
  const { products, loading, error } = useProducts();
  const byId = useMemo(
    () => new Map(products.map((p) => [p.product_id, p])),
    [products],
  );

  const getProduct = (id: number) => byId.get(id);

  const describeItem = (item: OrderItem) => {
    const product = byId.get(item.product_id);
    const size = product?.sizes.find((s) => s.size_id === item.size_id);
    const addOnName = (id: number) =>
      [...(product?.add_ons ?? []), ...(product?.disabled_add_ons ?? [])].find(
        (a) => a.add_on_id === id,
      )?.add_on_name ?? `Add-on #${id}`;

    const options: OrderOptions = {
      sizeId: item.size_id ?? undefined,
      addOnIds: item.add_ons.map((a) => a.add_on_id),
    };

    return {
      product,
      options,
      name: product?.product_name ?? `Product #${item.product_id}`,
      optionsText: [
        size?.size_label,
        ...item.add_ons.map((a) => addOnName(a.add_on_id)),
      ]
        .filter(Boolean)
        .join(", "),
      discountLabels: item.discounts.map(
        (d) =>
          `${d.discount_code} ${parseFloat(d.rate_applied)}% (−${peso(d.amount)})`,
      ),
      lineTotal: parseFloat(item.subtotal) - parseFloat(item.discount_amount),
    };
  };

  return { loading, error, getProduct, describeItem };
}
