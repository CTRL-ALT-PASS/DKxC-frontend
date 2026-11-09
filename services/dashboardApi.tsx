import { request } from "@/services/apiClient";

// Mirrors GET /api/dashboard. Amounts are real numbers here (the controller
// rounds them), unlike the string decimals returned by the other endpoints.

export interface DashboardSales {
  orders_count: number;
  gross_sales: number;
  discount_amount: number;
  net_sales: number;
  cogs: number;
  gross_profit: number; // net sales - COGS
  gross_margin_pct: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  units_sold: number;
  revenue: number;
}

export interface TopCategory {
  category_id: number;
  category_name: string;
  units_sold: number;
  revenue: number;
}

export interface StockItem {
  inventory_item_id: number;
  item_name: string;
  base_unit: string;
  quantity_on_hand: number;
  reorder_level: number;
}

export interface StockTier {
  count: number;
  items: StockItem[];
}

export interface DashboardInventory {
  total_items: number;
  total_value: number;
  critical_count: number; // out of stock + at/below reorder level
  out_of_stock: StockTier;
  below_reorder: StockTier;
  nearing_reorder: StockTier;
}

export interface DailySeriesPoint {
  date: string; // YYYY-MM-DD, one row per day in the range (zero-filled)
  gross_sales: number;
  gross_profit: number;
}

export interface DashboardData {
  from: string;
  to: string;
  sales: DashboardSales;
  top_products: TopProduct[];
  top_categories: TopCategory[];
  inventory: DashboardInventory;
  series: DailySeriesPoint[];
}

export interface DashboardParams {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  limit?: number;
  sort?: "units" | "revenue";
}

export function getDashboard(
  { from, to, limit, sort }: DashboardParams,
  signal?: AbortSignal,
) {
  return request<DashboardData>("/dashboard", {
    query: { from, to, limit, sort },
    signal,
  });
}
