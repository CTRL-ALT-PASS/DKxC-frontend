import { API_BASE_URL, API_PREFIX } from "./apiConfig";

export type AuthUser = {
  employee_id: string;
  fullname: string;
  role: string;
};

export type LoginResult = {
  token: string;
  employee: AuthUser;
};

export async function login(
  employeeId: string,
  pinCode: string,
): Promise<LoginResult> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      employee_id: employeeId.trim(),
      pin_code: pinCode,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Invalid employee ID or PIN.");
  }

  const employee = data.employee;
  const token = data.token;

  if (
    !employee ||
    !token ||
    !employee.employee_id ||
    !employee.fullname ||
    !employee.role
  ) {
    throw new Error("The server returned an unexpected login response.");
  }

  return {
    token,
    employee: {
      employee_id: employee.employee_id,
      fullname: employee.fullname,
      role: employee.role,
    },
  };
}

export async function getCurrentEmployee(token: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/user`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  // The saved token is no longer valid.
  if (response.status === 401) {
    throw new Error("SESSION_INVALID");
  }

  if (!response.ok) {
    throw new Error(`Unable to restore session (${response.status}).`);
  }

  const data = await response.json();
  const employee = data.employee;

  if (!employee?.employee_id || !employee?.fullname || !employee?.role) {
    throw new Error("The server returned an unexpected user response.");
  }

  return {
    employee_id: employee.employee_id,
    fullname: employee.fullname,
    role: employee.role,
  };
}
