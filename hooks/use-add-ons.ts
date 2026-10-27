import { useEffect, useState } from "react";

import { getAddOns, type AddOn } from "@/services/addOnsApi";

export function useAddOns() {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getAddOns({}, controller.signal)
      .then(setAddOns)
      .catch((e) => {
        if (!(e instanceof Error && e.name === "AbortError")) {
          setError(
            e instanceof Error ? e : new Error("Failed to load add-ons"),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return { addOns, loading, error };
}
