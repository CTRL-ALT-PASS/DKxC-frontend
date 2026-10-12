import type { Transaction } from "../context/CartContext";
import { mockDelay } from "./client";

// CartContext keeps completed transactions in memory so the History screen
// updates instantly. This is the call that would ALSO save each one to a
// server once one exists.
export async function recordTransaction(transaction: Transaction): Promise<Transaction> {
  return mockDelay(transaction);
  // Later:
  // const res = await fetch(`${API_BASE_URL}/transactions`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(transaction),
  // });
  // if (!res.ok) throw new Error("Failed to save transaction");
  // return res.json();
}
