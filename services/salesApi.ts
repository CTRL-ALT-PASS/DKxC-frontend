import { API_BASE_URL, API_PREFIX } from "../config/api/apiConfig";
import { ApiError } from "./inventoryApi";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type OrderStatus = "Pending" | "Completed" | "Cancelled";

export type SalesOrderEntry = {
  order_id: number;
  employee_id: string;
  employee_name: string | null;
  order_date: string; // "YYYY-MM-DD"
  order_time: string; // "HH:MM:SS"
  order_status: OrderStatus;
  gross_amount: number;
  discount_amount: number;
  total_amount: number;
};

export type OrderListFilters = {
  status?: OrderStatus;
  employee_id?: string;
};

export type ReceiptLine = {
  item_order: number;
  name: string;
  size: string | null;
  quantity: number;
  unit_price: number;
  add_ons: { name: string; price: number }[];
  discounts: {
    code: string;
    name: string;
    rate_applied: number;
    amount: number;
  }[];
  subtotal: number;
  discount_amount: number;
  line_total: number;
};

export type OrderReceipt = {
  order_id: number;
  order_date: string;
  order_time: string;
  order_status: OrderStatus;
  cashier_name: string | null;
  items: ReceiptLine[];
  gross_amount: number;
  discount_amount: number;
  total_amount: number;
  payment: {
    amount: number;
    payment_date: string;
    payment_time: string;
  } | null;
};

/* -------------------------------------------------------------------------- */
/*                              Request helper                                */
/* -------------------------------------------------------------------------- */

// Same behavior as the helper in inventoryApi.ts. Worth extracting both into a
// shared apiClient.ts later so there is only one copy.
async function request<T>(
  token: string,
  path: string,
  query?: Record<string, string | undefined>,
): Promise<T> {
  const queryString = query
    ? Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(
          ([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`,
        )
        .join("&")
    : "";

  const response = await fetch(
    `${API_BASE_URL}${API_PREFIX}${path}${queryString ? `?${queryString}` : ""}`,
    {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    },
  );

  if (response.status === 401) throw new Error("SESSION_INVALID");

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // Empty or non-JSON body.
  }

  if (!response.ok) {
    throw new ApiError(
      data?.message ?? `Request failed (${response.status}).`,
      response.status,
      data?.code,
      data?.errors,
    );
  }

  return data as T;
}

/* -------------------------------------------------------------------------- */
/*                                  Mappers                                   */
/* -------------------------------------------------------------------------- */

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// ASSUMPTION: OrderPresenter's exact shape isn't known yet, so the cashier name
// is read from the likeliest places. Tighten this once the presenter is shared.
function cashierName(raw: any): string | null {
  if (raw.employee_name) return raw.employee_name;
  if (raw.cashier_name) return raw.cashier_name;
  if (raw.cashier?.fullname) return raw.cashier.fullname;
  if (raw.employee?.first_name) {
    return `${raw.employee.first_name} ${raw.employee.last_name ?? ""}`.trim();
  }
  return null;
}

function mapOrder(raw: any): SalesOrderEntry {
  return {
    order_id: raw.order_id,
    employee_id: String(raw.employee_id ?? ""),
    employee_name: cashierName(raw),
    order_date: raw.order_date,
    order_time: raw.order_time,
    order_status: raw.order_status ?? raw.status,
    gross_amount: toNumber(raw.gross_amount),
    discount_amount: toNumber(raw.discount_amount),
    total_amount: toNumber(raw.total_amount),
  };
}

function mapReceipt(raw: any): OrderReceipt {
  return {
    order_id: raw.order_id,
    order_date: raw.order_date,
    order_time: raw.order_time,
    order_status: raw.order_status,
    cashier_name: raw.cashier?.fullname ?? null,
    gross_amount: toNumber(raw.gross_amount),
    discount_amount: toNumber(raw.discount_amount),
    total_amount: toNumber(raw.total_amount),
    items: (raw.items ?? []).map((l: any) => ({
      item_order: l.item_order,
      name: l.name,
      size: l.size ?? null,
      quantity: toNumber(l.quantity),
      unit_price: toNumber(l.unit_price),
      add_ons: (l.add_ons ?? []).map((a: any) => ({
        name: a.name,
        price: toNumber(a.price),
      })),
      discounts: (l.discounts ?? []).map((d: any) => ({
        code: d.code,
        name: d.name,
        rate_applied: toNumber(d.rate_applied),
        amount: toNumber(d.amount),
      })),
      subtotal: toNumber(l.subtotal),
      discount_amount: toNumber(l.discount_amount),
      line_total: toNumber(l.line_total),
    })),
    payment: raw.payment
      ? {
          amount: toNumber(raw.payment.amount),
          payment_date: raw.payment.payment_date,
          payment_time: raw.payment.payment_time,
        }
      : null,
  };
}

/* -------------------------------------------------------------------------- */
/*                                 Endpoints                                  */
/* -------------------------------------------------------------------------- */

// ASSUMPTION: routes are GET /orders and GET /orders/{id}/receipt. Adjust if
// routes/api.php says otherwise.

/** Returns EVERY matching order, newest first. The endpoint has no pagination. */
export async function getOrders(
  token: string,
  filters: OrderListFilters = {},
): Promise<SalesOrderEntry[]> {
  const data = await request<any[]>(token, "/orders", {
    status: filters.status,
    employee_id: filters.employee_id,
  });
  return data.map(mapOrder);
}

export async function getOrderReceipt(
  token: string,
  orderId: number,
): Promise<OrderReceipt> {
  const data = await request<any>(token, `/orders/${orderId}/receipt`);
  return mapReceipt(data);
}
