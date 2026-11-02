import { useCallback, useEffect, useRef, useState } from "react";

import {
  ApiError,
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
  type CreateProductInput,
  type Product,
  type ProductFilters,
  type UpdateProductInput,
} from "@/services/productsApi";

function toError(e: unknown): Error {
  return e instanceof Error ? e : new Error("Something went wrong");
}

function isAbort(e: unknown): boolean {
  return e instanceof Error && e.name === "AbortError";
}

/* ------------------------------------------------------------------ */
/* List + mutations                                                    */
/* ------------------------------------------------------------------ */

export function useProducts(filters: ProductFilters = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);

  const controllerRef = useRef<AbortController | null>(null);

  // Stable dependency so an inline `{ search: "x" }` object doesn't refetch every render
  const filterKey = JSON.stringify(filters);

  const refetch = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(JSON.parse(filterKey), controller.signal);
      setProducts(data);
    } catch (e) {
      if (!isAbort(e)) setError(toError(e));
    } finally {
      if (controllerRef.current === controller) setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => {
    refetch();
    return () => controllerRef.current?.abort();
  }, [refetch]);

  // Mutations throw so forms can read ApiError.errors (422) or .status (409).
  const create = useCallback(
    async (input: CreateProductInput) => {
      setSaving(true);
      try {
        const res = await createProduct(input);
        await refetch(); // the new product may not match the active filters
        return res.data;
      } finally {
        setSaving(false);
      }
    },
    [refetch],
  );

  const update = useCallback(async (id: number, input: UpdateProductInput) => {
    setSaving(true);
    try {
      const res = await updateProduct(id, input);
      setProducts((prev) =>
        prev.map((p) => (p.product_id === id ? res.data : p)),
      );
      return res.data;
    } finally {
      setSaving(false);
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    setSaving(true);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.product_id !== id));
    } finally {
      setSaving(false);
    }
  }, []);

  return { products, loading, error, saving, refetch, create, update, remove };
}

/* ------------------------------------------------------------------ */
/* Single product (edit form)                                          */
/* ------------------------------------------------------------------ */

export function useProduct(id: number | null | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(id != null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (id == null) {
      setProduct(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getProduct(id, controller.signal)
      .then(setProduct)
      .catch((e) => {
        if (!isAbort(e)) setError(toError(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  return { product, loading, error };
}

export { ApiError };

