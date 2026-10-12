import { CATEGORIES, PRODUCTS, type Product } from "../constants/mockData";
import { mockDelay } from "./client";

// When a real backend exists, only the bodies of these functions change --
// every screen that uses them (through hooks/use-products) stays as it is.

export async function fetchProducts(): Promise<Product[]> {
  return mockDelay(PRODUCTS);
  // Later:
  // const res = await fetch(`${API_BASE_URL}/products`);
  // if (!res.ok) throw new Error("Failed to load products");
  // return res.json();
}

export async function fetchCategories(): Promise<string[]> {
  return mockDelay(CATEGORIES);
  // Later:
  // const res = await fetch(`${API_BASE_URL}/categories`);
  // if (!res.ok) throw new Error("Failed to load categories");
  // return res.json();
}
