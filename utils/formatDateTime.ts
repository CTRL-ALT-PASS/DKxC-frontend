export function parseApiDate(value: string): Date {
  // "2026-09-01 08:00:00+08" -> "2026-09-01T08:00:00+08:00"
  const iso = value
    .replace(" ", "T")
    .replace(/(\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)([+-]\d{2})$/, "$1$2:00");
  return new Date(iso);
}

/**
 * "2026-09-01 08:00:00+08" -> "Sep 1, 2026 · 8:00 AM"
 * Returns `emptyLabel` for null/empty values and the raw string if it can't be parsed.
 */
export function formatDateTime(
  value: string | null | undefined,
  emptyLabel = "—",
): string {
  if (!value) return emptyLabel;

  const date = parseApiDate(value);
  if (Number.isNaN(date.getTime())) return value;

  const day = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${day} · ${time}`;
}