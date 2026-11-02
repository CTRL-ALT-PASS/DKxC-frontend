import type { DateRange } from "@/components/inventory/dashboard/chartData";
import { ApiError } from "@/services/apiClient";
import { getDashboard, type DashboardData } from "@/services/dashboardApi";
import { useCallback, useEffect, useState } from "react";

// Local-time YYYY-MM-DD. Don't use toISOString() here: it converts to UTC,
// which shifts the date by a day for anyone ahead of UTC (e.g. the Philippines).
function toYmd(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function useDashboard(range: DateRange, topLimit = 3) {
  const from = toYmd(range.start);
  const to = toYmd(range.end);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    // `data` is kept while reloading so the cards don't blank out
    // every time the range changes.
    getDashboard({ from, to, limit: topLimit }, controller.signal)
      .then(setData)
      .catch((e) => {
        if (controller.signal.aborted) return;
        setError(
          e instanceof ApiError ? e.message : "Could not load the dashboard.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [from, to, topLimit, reloadKey]);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  return { data, loading, error, refetch };
}
