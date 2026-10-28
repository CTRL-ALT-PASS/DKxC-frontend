// Date-range helpers + bucketing for the dashboard charts.
// The daily numbers come from GET /api/dashboard (`series`); this file only
// turns them into chart-friendly points for whatever range is selected.

import type { DailySeriesPoint } from "@/services/dashboardApi";

export type Metric = "sales" | "profit";
export type Timeframe = "7d" | "30d" | "90d";

export interface DataPoint {
  label: string;
  value: number;
  date: Date;
}

export interface DateRange {
  start: Date;
  end: Date;
}

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDay(date: Date) {
  return `${MONTH_ABBR[date.getMonth()]} ${date.getDate()}`;
}

function formatMonth(date: Date) {
  return MONTH_ABBR[date.getMonth()];
}

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function diffInDays(a: Date, b: Date) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round(
    (startOfDay(a).getTime() - startOfDay(b).getTime()) / MS_PER_DAY,
  );
}

// "2026-10-28" -> local midnight. new Date("2026-10-28") would parse as UTC
// and can land on the previous day.
function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const METRIC_FIELD = {
  sales: "gross_sales",
  profit: "gross_profit",
} as const;

export function quickRange(
  timeframe: Timeframe,
  anchor: Date = new Date(),
): DateRange {
  const end = startOfDay(anchor);
  const spanByTimeframe: Record<Timeframe, number> = {
    "7d": 6,
    "30d": 29,
    "90d": 89,
  };
  const start = addDays(end, -spanByTimeframe[timeframe]);
  return { start, end };
}

// Returns the matching quick timeframe for a range, or null if it's custom.
export function matchesQuickRange(
  range: DateRange,
  anchor: Date = new Date(),
): Timeframe | null {
  const timeframes: Timeframe[] = ["7d", "30d", "90d"];
  for (const tf of timeframes) {
    const q = quickRange(tf, anchor);
    if (
      startOfDay(q.start).getTime() === startOfDay(range.start).getTime() &&
      startOfDay(q.end).getTime() === startOfDay(range.end).getTime()
    ) {
      return tf;
    }
  }
  return null;
}

export function niceMax(rawMax: number) {
  const step = Math.pow(10, Math.floor(Math.log10(rawMax || 1)) - 1) * 3;
  return Math.ceil(rawMax / step) * step || step;
}

/**
 * Buckets the daily series for `metric` into a chart-friendly series for an
 * arbitrary [start, end] range — daily for short spans, otherwise grouped
 * into ~10-12 summed buckets so the chart doesn't get overcrowded.
 */
export function buildSeries(
  metric: Metric,
  range: DateRange,
  daily: DailySeriesPoint[] = [],
): DataPoint[] {
  const field = METRIC_FIELD[metric];
  const start = startOfDay(range.start);
  const end = startOfDay(range.end);

  const inRange = daily
    .map((p) => ({ date: parseYmd(p.date), value: p[field] }))
    .filter((p) => p.date >= start && p.date <= end);
  if (inRange.length === 0) return [];

  const spanDays = diffInDays(end, start) + 1;

  if (spanDays <= 14) {
    return inRange.map((p) => ({
      label: formatDay(p.date),
      value: p.value,
      date: p.date,
    }));
  }

  const targetBuckets = spanDays <= 60 ? 10 : 12;
  const bucketSize = Math.ceil(inRange.length / targetBuckets);
  const buckets: DataPoint[] = [];

  for (let i = 0; i < inRange.length; i += bucketSize) {
    const chunk = inRange.slice(i, i + bucketSize);
    const sum = chunk.reduce((acc, p) => acc + p.value, 0);
    const first = chunk[0].date;
    buckets.push({
      label: spanDays <= 60 ? formatDay(first) : formatMonth(first),
      value: sum,
      date: first,
    });
  }

  return buckets;
}
