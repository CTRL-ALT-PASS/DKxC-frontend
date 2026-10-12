import type { ImageSourcePropType } from "react-native";
import { ADMIN_USER, CURRENT_USER } from "../constants/mockData";
import { mockDelay } from "./client";

export type Role = "cashier" | "admin";

// What the app keeps about whoever is logged in. It deliberately has no PIN:
// a real server never sends one back, so the app shouldn't have a field for it.
// `role` decides which half of the app they land in (POS vs inventory/admin).
export interface SessionUser {
  employeeId: string;
  name: string;
  role: Role;
  avatar?: ImageSourcePropType;
}

// Mock credential list. With a real backend this whole array disappears --
// the server holds the accounts and answers the login request instead.
const MOCK_ACCOUNTS: { user: typeof CURRENT_USER; role: Role }[] = [
  { user: CURRENT_USER, role: "cashier" },
  { user: ADMIN_USER, role: "admin" },
];

export async function login(employeeId: string, pin: string): Promise<SessionUser> {
  await mockDelay(null);
  const match = MOCK_ACCOUNTS.find((a) => a.user.employeeId === employeeId && a.user.pin === pin);
  if (!match) throw new Error("Invalid employee ID or PIN");

  // This mapping is the "server response -> SessionUser" step. Today it reads
  // from mock data; with a real backend it reads from the response body.
  return {
    employeeId: match.user.employeeId,
    name: match.user.name,
    role: match.role,
    avatar: match.user.avatar,
  };
  // Later:
  // const res = await fetch(`${API_BASE_URL}/login`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ employeeId, pin }),
  // });
  // if (!res.ok) throw new Error("Invalid employee ID or PIN");
  // const data = await res.json();
  // return {
  //   employeeId: data.employeeId,
  //   name: data.name,
  //   role: data.role,
  //   avatar: data.avatarUrl ? { uri: data.avatarUrl } : undefined,
  // };
  // (also store the auth token the server returns, and send it on later requests)
}
