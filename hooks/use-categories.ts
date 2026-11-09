import { useCallback, useEffect, useState } from "react";

import { getCategories, type Category } from "@/services/categoriesApi";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await getCategories(signal));
    } catch (e) {
      if (!(e instanceof Error && e.name === "AbortError")) {
        setError(
          e instanceof Error ? e : new Error("Failed to load categories"),
        );
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refetch(controller.signal);
    return () => controller.abort();
  }, [refetch]);

  return { categories, loading, error, refetch };
}
