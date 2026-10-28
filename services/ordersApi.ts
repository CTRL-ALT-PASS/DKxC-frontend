import { ApiError, request } from "@/services/apiClient";

export type OrderStatus = "Pending" | "Completed" | "Cancelled";
export type ApiOrderType = "Dine-In" | "Takeout" | "Delivery";

export interface OrderItemAddOn {
  add_on_id: number;
  price_at_purchase: string;
}
export interface OrderItemDiscount {
  discount_code: string;
  rate_applied: string;
  amount: string;
}
export interface OrderItem {
  item_order: number;
  product_id: number;
  size_id: number | null;
  quantity: number;
  unit_price: string; // base + size surcharge, excludes add-ons
  subtotal: string; // quantity x (unit_price + add-ons), before discount
  discount_amount: string;
  add_ons: OrderItemAddOn[];
  discounts: OrderItemDiscount[];
}
export interface Order {
  order_id: number;
  employee_id: string;
  order_date: string;
  order_time: string;
  order_status: OrderStatus;
  order_type: ApiOrderType;
  gross_amount: string;
  discount_amount: string;
  total_amount: string;
  items: OrderItem[];
}

export interface OrderFilters {
  status?: OrderStatus;
  order_type?: ApiOrderType;
}

export interface OrderDiscountInput {
  discount_code: string;
  units: number;
  id_number?: string;
  holder_name?: string;
  approval_token?: string;
}
export interface OrderItemInput {
  product_id: number;
  size_id: number | null; // null for products without sizes (needs the backend fix)
  quantity: number;
  add_on_ids: number[];
  discounts?: OrderDiscountInput[];
}
export interface OrderInput {
  order_type: ApiOrderType;
  items: OrderItemInput[];
}

export interface StockLine {
  inventory_item_id: number;
  item_name: string;
  base_unit: string;
  required_quantity: string;
  available_quantity: string;
  shortage_quantity: string;
  sufficient: boolean;
}
export interface OrderQuote {
  order_type: ApiOrderType;
  gross_amount: string;
  discount_amount: string;
  total_amount: string;
  items: OrderItem[];
  inventory_check: {
    sufficient: boolean;
    ingredients: StockLine[];
    shortages: StockLine[];
  };
}

export interface CompleteResult {
  order_id: number;
  order_status: OrderStatus;
  total_amount: string;
  completed_at: string;
  inventory_deducted: boolean;
  ingredients: {
    inventory_item_id: number;
    item_name: string;
    quantity_deducted: string;
    base_unit: string;
  }[];
}

export interface Receipt {
  order_id: number;
  order_date: string;
  order_time: string;
  order_type: ApiOrderType;
  order_status: OrderStatus;
  cashier: { employee_id: string; fullname: string } | null;
  items: {
    item_order: number;
    name: string;
    size: string | null;
    quantity: number;
    unit_price: string;
    add_ons: { name: string; price: string }[];
    discounts: {
      code: string;
      name: string;
      rate_applied: string;
      amount: string;
    }[];
    subtotal: string;
    discount_amount: string;
    line_total: string;
  }[];
  gross_amount: string;
  discount_amount: string;
  total_amount: string;
  payment: {
    amount: string;
    payment_date: string;
    payment_time: string;
  } | null;
}

interface OrderMutation {
  message: string;
  data: Order;
}

/* ------------------------------------------------------------------ */

export function getOrders(
  filters: OrderFilters = {},
  signal?: AbortSignal,
): Promise<Order[]> {
  return request<Order[]>("/orders", { query: { ...filters }, signal });
}

export function getOrder(id: number, signal?: AbortSignal): Promise<Order> {
  return request<Order>(`/orders/${id}`, { signal });
}

export function getReceipt(id: number, signal?: AbortSignal): Promise<Receipt> {
  return request<Receipt>(`/orders/${id}/receipt`, { signal });
}

/** The server returns 400 without an Idempotency-Key. Reuse the same key when retrying the same payload. */
export function createOrder(
  input: OrderInput,
  idempotencyKey: string,
): Promise<OrderMutation> {
  return request<OrderMutation>("/orders", {
    method: "POST",
    body: input,
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

/** Read-only price + stock check. Nothing is saved or reserved. */
export function quoteOrder(
  input: OrderInput,
  signal?: AbortSignal,
): Promise<{ message: string; data: OrderQuote }> {
  return request("/orders/quote", { method: "POST", body: input, signal });
}

/** Pending orders only. Replaces ALL items, so always send the full list. */
export function updateOrder(
  id: number,
  input: OrderInput,
): Promise<OrderMutation> {
  return request<OrderMutation>(`/orders/${id}`, {
    method: "PUT",
    body: input,
  });
}

/** 422 if stock is short, 409 if already completed or cancelled. */
export function completeOrder(
  id: number,
): Promise<{ message: string; data: CompleteResult }> {
  return request(`/orders/${id}/complete`, { method: "POST" });
}

/** Pending orders need no token. Completed orders need a manager approval_token. */
export function cancelOrder(
  id: number,
  approvalToken?: string,
): Promise<{ message: string; data: unknown }> {
  return request(`/orders/${id}/cancel`, {
    method: "POST",
    body: approvalToken ? { approval_token: approvalToken } : undefined,
  });
}

/* ------------------------------------------------------------------ */

/** One readable message for a failed order call (422 field errors, 409/403 messages, network errors). */
export function orderErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const first = Object.values(e.errors ?? {})[0]?.[0];
    return first ?? e.message;
  }
  return e instanceof Error ? e.message : "Something went wrong";
}

export { ApiError };

