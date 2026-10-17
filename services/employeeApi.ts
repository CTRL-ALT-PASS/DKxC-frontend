import { API_BASE_URL, API_PREFIX } from "../config/api/apiConfig";
import { getAuthToken } from "./authStorage";

export type EmploymentStatus = "Active" | "Inactive" | "Terminated";

export interface Employee {
  employee_id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  phone_number: string | null;
  hire_date: string | null;
  employment_status: EmploymentStatus | null;
}

export interface CreateEmployeePayload {
  employee_id: string;
  first_name: string;
  last_name: string;
  position?: string;
  phone_number?: string;
  hire_date?: string; // YYYY-MM-DD
  employment_status?: EmploymentStatus;
  pin_code: string;
}

export type UpdateEmployeePayload = Partial<
  Omit<CreateEmployeePayload, "employee_id">
>;

interface MessageWithData {
  message: string;
  data: Employee;
}

/** Thrown for any non-2xx response or network failure. */
export class ApiError extends Error {
  status: number;
  /** Laravel 422 validation errors: { field: ["message", ...] } */
  fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const BASE_URL = `${API_BASE_URL}${API_PREFIX}`;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;

  const token = await getAuthToken();

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json", // makes Laravel return 422 JSON instead of redirecting
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Check the connection and the API URL.",
      0,
    );
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      body?.message ?? `Request failed (${response.status})`,
      response.status,
      body?.errors ?? {},
    );
  }

  return body as T;
}

const employeePath = (id: string) => `/employees/${encodeURIComponent(id)}`;

// GET /employees
export const getEmployees = () => request<Employee[]>("/employees");

// GET /employees/{employee}
export const getEmployee = (id: string) => request<Employee>(employeePath(id));

// POST /employees
export const createEmployee = (payload: CreateEmployeePayload) =>
  request<MessageWithData>("/employees", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// PATCH /employees/{employee}
export const updateEmployee = (id: string, payload: UpdateEmployeePayload) =>
  request<MessageWithData>(employeePath(id), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

// DELETE /employees/{employee}
export const deleteEmployee = (id: string) =>
  request<{ message: string }>(employeePath(id), { method: "DELETE" });
