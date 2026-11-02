import { API_BASE_URL, API_PREFIX } from "../config/api/apiConfig";
import {
  toCategory,
  type InventoryCategory,
} from "../types/inventoryCategories";
import { formatDateTime } from "../utils/formatDateTime";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type BaseUnit = "g" | "kg" | "mL" | "L" | "pcs";

export type InventoryStatus = "Available" | "Low Stock" | "Out of Stock";

export type MovementType =
  "Restock" | "Return" | "Spoilage" | "Damage" | "Adjustment";

export type InventoryUnit = {
  unit_name: string;
  factor_to_base: number;
};

export type InventoryItem = {
  inventory_item_id: number;
  item_name: string;
  item_category: InventoryCategory; // normalized: unknown/missing -> "Other"
  base_unit: BaseUnit;
  quantity_on_hand: number;
  reorder_level: number;
  cost_per_base_unit: number;
  inventory_status: InventoryStatus;
  last_restocked: string | null;
  last_restocked_label: string; // formatted for display
  units: InventoryUnit[];
};

export type StockMovement = {
  ledger_id: number;
  inventory_item_id: number;
  movement_type: MovementType;
  quantity_change: number;
  entered_quantity: number;
  entered_unit: string;
  unit_cost: number | null;
  order_id: number | null;
  employee_id: string;
  reason: string | null;
  reference_number: string | null;
  occurred_at: string;
  occurred_at_label: string; // formatted for display
};

// The log endpoint also returns "Sale" rows; manual movements can't be Sale.
export type MovementLogType = MovementType | "Sale";

export type MovementLogEntry = Omit<
  StockMovement,
  "movement_type" | "entered_quantity" | "entered_unit"
> & {
  movement_type: MovementLogType;
  // Sale rows have no entered quantity/unit, so these can be null.
  entered_quantity: number | null;
  entered_unit: string | null;
  item_name: string | null;
  base_unit: BaseUnit | null;
  employee_name: string | null;
};

export type MovementLogFilters = {
  type?: MovementLogType[];
  source?: "sale" | "manual"; // manual = everything except Sale
  inventory_item_id?: number;
  employee_id?: string;
  order_id?: number;
  search?: string; // matches item name or employee name
  category?: InventoryCategory[];
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  per_page?: number;
  cursor?: string;
};

export type MovementLogPage = {
  data: MovementLogEntry[];
  nextCursor: string | null;
};

export type InventoryListFilters = {
  search?: string;
  inventory_status?: InventoryStatus;
  item_category?: InventoryCategory;
};

export type CreateInventoryItemInput = {
  item_name: string;
  item_category: InventoryCategory;
  base_unit: BaseUnit;
  reorder_level?: number;
  cost_per_base_unit?: number;
  units?: InventoryUnit[];
};

// base_unit, quantity_on_hand and inventory_status cannot be sent on update.
export type UpdateInventoryItemInput = {
  item_name?: string;
  item_category?: InventoryCategory;
  reorder_level?: number;
  cost_per_base_unit?: number;
  // Replaces the WHOLE list on the server. Always send every unit you want to keep.
  units?: InventoryUnit[];
};

export type RecordMovementInput = {
  movement_type: MovementType;
  // Positive for everything except "Adjustment", which may be negative. Never 0.
  quantity: number;
  // Base unit or one of the item's units. Defaults to the base unit if omitted.
  unit?: string;
  reason?: string;
  reference_number?: string;
};

export type RecordMovementResult = {
  ledger: StockMovement;
  inventory_item: InventoryItem;
};

/* -------------------------------------------------------------------------- */
/*                                   Errors                                   */
/* -------------------------------------------------------------------------- */

/**
 * Thrown for any non-2xx response except 401.
 * 401 throws Error("SESSION_INVALID"), matching authApi.ts.
 */
export class ApiError extends Error {
  status: number;
  code?: string; // e.g. "INSUFFICIENT_STOCK"
  fieldErrors?: Record<string, string[]>; // from 422 responses

  constructor(
    message: string,
    status: number,
    code?: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

/* -------------------------------------------------------------------------- */
/*                              Request helper                                */
/* -------------------------------------------------------------------------- */

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | undefined>;
  body?: unknown;
};

async function request<T>(
  token: string,
  path: string,
  { method = "GET", query, body }: RequestOptions = {},
): Promise<T> {
  const queryString = query
    ? Object.entries(query)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`,
        )
        .join("&")
    : "";

  const url = `${API_BASE_URL}${API_PREFIX}${path}${
    queryString ? `?${queryString}` : ""
  }`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    throw new Error("SESSION_INVALID");
  }

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

// The API returns decimals as strings ("1500.000"). Convert once, here.
function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapInventoryItem(raw: any): InventoryItem {
  return {
    inventory_item_id: raw.inventory_item_id,
    item_name: raw.item_name,
    item_category: toCategory(raw.item_category),
    base_unit: raw.base_unit,
    quantity_on_hand: toNumber(raw.quantity_on_hand),
    reorder_level: toNumber(raw.reorder_level),
    cost_per_base_unit: toNumber(raw.cost_per_base_unit),
    inventory_status: raw.inventory_status,
    last_restocked: raw.last_restocked ?? null,
    last_restocked_label: formatDateTime(raw.last_restocked, "No stock yet"),
    units: (raw.units ?? []).map((unit: any) => ({
      unit_name: unit.unit_name,
      factor_to_base: toNumber(unit.factor_to_base),
    })),
  };
}

function mapMovement(raw: any): StockMovement {
  return {
    ledger_id: raw.ledger_id,
    inventory_item_id: raw.inventory_item_id,
    movement_type: raw.movement_type,
    quantity_change: toNumber(raw.quantity_change),
    entered_quantity: toNumber(raw.entered_quantity),
    entered_unit: raw.entered_unit,
    unit_cost: toNullableNumber(raw.unit_cost),
    order_id: raw.order_id ?? null,
    employee_id: raw.employee_id,
    reason: raw.reason ?? null,
    reference_number: raw.reference_number ?? null,
    occurred_at: raw.occurred_at,
    occurred_at_label: formatDateTime(raw.occurred_at),
  };
}

function mapMovementLogEntry(raw: any): MovementLogEntry {
  return {
    ledger_id: raw.ledger_id,
    inventory_item_id: raw.inventory_item_id,
    movement_type: raw.movement_type,
    quantity_change: toNumber(raw.quantity_change),
    entered_quantity: toNullableNumber(raw.entered_quantity),
    entered_unit: raw.entered_unit ?? null,
    unit_cost: toNullableNumber(raw.unit_cost),
    order_id: raw.order_id ?? null,
    employee_id: raw.employee_id,
    reason: raw.reason ?? null,
    reference_number: raw.reference_number ?? null,
    occurred_at: raw.occurred_at,
    occurred_at_label: formatDateTime(raw.occurred_at),
    item_name: raw.item?.item_name ?? null,
    base_unit: raw.item?.base_unit ?? null,
    employee_name: raw.employee
      ? `${raw.employee.first_name} ${raw.employee.last_name}`
      : null,
  };
}

// The API expects decimal fields as strings in request bodies.
function serializeUnits(units: InventoryUnit[]) {
  return units.map((unit) => ({
    unit_name: unit.unit_name.trim(),
    factor_to_base: String(unit.factor_to_base),
  }));
}

/* -------------------------------------------------------------------------- */
/*                                 Endpoints                                  */
/* -------------------------------------------------------------------------- */

export async function getInventoryItems(
  token: string,
  filters: InventoryListFilters = {},
): Promise<InventoryItem[]> {
  const data = await request<any[]>(token, "/inventory-items", {
    query: {
      search: filters.search?.trim(),
      inventory_status: filters.inventory_status,
      item_category: filters.item_category,
    },
  });

  return data.map(mapInventoryItem);
}

export async function getInventoryItem(
  token: string,
  id: number,
): Promise<InventoryItem> {
  const data = await request<any>(token, `/inventory-items/${id}`);
  return mapInventoryItem(data);
}

export async function createInventoryItem(
  token: string,
  input: CreateInventoryItemInput,
): Promise<InventoryItem> {
  const data = await request<{ data: any }>(token, "/inventory-items", {
    method: "POST",
    body: {
      item_name: input.item_name.trim(),
      base_unit: input.base_unit,
      item_category: input.item_category,
      ...(input.reorder_level !== undefined && {
        reorder_level: String(input.reorder_level),
      }),
      ...(input.cost_per_base_unit !== undefined && {
        cost_per_base_unit: String(input.cost_per_base_unit),
      }),
      ...(input.units !== undefined && { units: serializeUnits(input.units) }),
    },
  });

  return mapInventoryItem(data.data);
}

export async function updateInventoryItem(
  token: string,
  id: number,
  input: UpdateInventoryItemInput,
): Promise<InventoryItem> {
  const data = await request<{ data: any }>(token, `/inventory-items/${id}`, {
    method: "PATCH",
    body: {
      ...(input.item_name !== undefined && {
        item_name: input.item_name.trim(),
      }),
      ...(input.item_category !== undefined && {
        item_category: input.item_category,
      }),
      ...(input.reorder_level !== undefined && {
        reorder_level: String(input.reorder_level),
      }),
      ...(input.cost_per_base_unit !== undefined && {
        cost_per_base_unit: String(input.cost_per_base_unit),
      }),
      ...(input.units !== undefined && { units: serializeUnits(input.units) }),
    },
  });

  return mapInventoryItem(data.data);
}

/** Throws ApiError with status 409 if the item has recipes or movement history. */
export async function deleteInventoryItem(
  token: string,
  id: number,
): Promise<void> {
  await request<{ message: string }>(token, `/inventory-items/${id}`, {
    method: "DELETE",
  });
}

export async function getStockMovements(
  token: string,
  id: number,
): Promise<StockMovement[]> {
  const data = await request<any[]>(token, `/inventory-items/${id}/movements`);
  return data.map(mapMovement);
}

/**
 * The only way to change stock. Throws ApiError with code "INSUFFICIENT_STOCK"
 * (403) if the movement would take stock below 0.
 */
export async function recordStockMovement(
  token: string,
  id: number,
  input: RecordMovementInput,
): Promise<RecordMovementResult> {
  const data = await request<{ data: { ledger: any; inventory_item: any } }>(
    token,
    `/inventory-items/${id}/movements`,
    {
      method: "POST",
      body: {
        movement_type: input.movement_type,
        quantity: input.quantity,
        ...(input.unit && { unit: input.unit }),
        ...(input.reason && { reason: input.reason.trim() }),
        ...(input.reference_number && {
          reference_number: input.reference_number.trim(),
        }),
      },
    },
  );

  return {
    ledger: mapMovement(data.data.ledger),
    inventory_item: mapInventoryItem(data.data.inventory_item),
  };
}

/** Paginated (cursor) movements across ALL items. Pass `nextCursor` back as `cursor` for the next page. */
export async function getInventoryMovements(
  token: string,
  filters: MovementLogFilters = {},
): Promise<MovementLogPage> {
  const data = await request<{ data: any[]; next_cursor: string | null }>(
    token,
    "/inventory-movements",
    {
      query: {
        type: filters.type?.length ? filters.type.join(",") : undefined,
        source: filters.source,
        inventory_item_id: filters.inventory_item_id?.toString(),
        employee_id: filters.employee_id,
        order_id: filters.order_id?.toString(),
        search: filters.search?.trim(),
        category: filters.category?.length
          ? filters.category.join(",")
          : undefined,
        from: filters.from,
        to: filters.to,
        per_page: filters.per_page?.toString(),
        cursor: filters.cursor,
      },
    },
  );

  return {
    data: data.data.map(mapMovementLogEntry),
    nextCursor: data.next_cursor ?? null,
  };
}
