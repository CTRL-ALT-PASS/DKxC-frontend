// Shared mock data generation + date-range bucketing for the dashboard charts.
// Swap `buildDailyPool` for a real API call once the backend is wired up —
// everything downstream (quick ranges, custom ranges, bucketing) stays the same.

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
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / MS_PER_DAY);
}

// Deterministic seeded PRNG (mulberry32) so mock values stay stable across
// re-renders instead of jumping around on every repaint.
function seededRandom(seed: number) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const POOL_DAYS = 120;
const METRIC_SEED: Record<Metric, number> = { sales: 11, profit: 29 };
const METRIC_BASE: Record<Metric, number> = { sales: 1650, profit: 820 };
const METRIC_SWING: Record<Metric, number> = { sales: 550, profit: 320 };

const pools: Partial<Record<Metric, { date: Date; value: number }[]>> = {};

function buildDailyPool(metric: Metric) {
  if (pools[metric]) return pools[metric]!;

  const anchor = startOfDay(new Date());
  const base = METRIC_BASE[metric];
  const swing = METRIC_SWING[metric];
  const seed = METRIC_SEED[metric];

  const pool = Array.from({ length: POOL_DAYS }, (_, i) => {
    const dayOffset = -(POOL_DAYS - 1) + i;
    const date = addDays(anchor, dayOffset);
    const weekendBoost = date.getDay() === 0 || date.getDay() === 6 ? 1.15 : 1;
    const noise = seededRandom(seed * 1000 + i) - 0.5; // -0.5..0.5
    const wave = Math.sin(i / 6) * 0.3;
    const value = Math.max(
      150,
      Math.round(base * weekendBoost + swing * (noise + wave))
    );
    return { date, value };
  });

  pools[metric] = pool;
  return pool;
}

export function quickRange(timeframe: Timeframe, anchor: Date = new Date()): DateRange {
  const end = startOfDay(anchor);
  const spanByTimeframe: Record<Timeframe, number> = { "7d": 6, "30d": 29, "90d": 89 };
  const start = addDays(end, -spanByTimeframe[timeframe]);
  return { start, end };
}

// Returns the matching quick timeframe for a range, or null if it's custom.
export function matchesQuickRange(range: DateRange, anchor: Date = new Date()): Timeframe | null {
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
 * Buckets the daily mock pool for `metric` into a chart-friendly series for
 * an arbitrary [start, end] range — daily for short spans, otherwise grouped
 * into ~10-12 summed buckets so the chart doesn't get overcrowded.
 */
export function buildSeries(metric: Metric, range: DateRange): DataPoint[] {
  const pool = buildDailyPool(metric);
  const start = startOfDay(range.start);
  const end = startOfDay(range.end);

  const inRange = pool.filter((p) => p.date >= start && p.date <= end);
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
