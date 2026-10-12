import type { Product } from "@/constants/mockData";
import { fetchCategories, fetchProducts } from "@/services/productsApi";
import { useEffect, useState } from "react";

// One source of truth for the product list. The POS menu and the admin
// Products page should both read from here, so when a real backend exists,
// an admin's change shows up on the cashier's menu.
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["All Menu"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProducts(), fetchCategories()])
      .then(([p, c]) => {
        if (cancelled) return;
        setProducts(p);
        setCategories(c);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load the menu.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, categories, loading, error };
}
