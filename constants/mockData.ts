import type { ImageSourcePropType } from "react-native";

export interface User {
  employeeId: string;
  pin: string;
  name: string;
  avatar: ImageSourcePropType;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: ImageSourcePropType;
}

export interface InventoryItem {
  id: string;
  lastStockUpdate: string;
  itemName: string;
  category: string;
  stocks: number;
  variance: number;
  unitCost: number;
}

export const CURRENT_USER: User = {
  employeeId: "DCY-001",
  pin: "12345",
  name: "Joshua Garcia",
  avatar: require("../assets/images/avatar.png"),
};

export const ADMIN_USER: User = {
  employeeId: "DCY-002",
  pin: "54321",
  name: "Joshua David",
  avatar: require("../assets/images/avatar.png"),
};

export const CATEGORIES = ["All Menu", "Coffee", "Non-Coffee", "Pastries", "Tea"];

export const PRODUCTS: Product[] = [
  { id: "p1", name: "Americano", price: 120, category: "Coffee", image: require("@/assets/images/americano.png") },
  { id: "p2", name: "Cappuccino", price: 120, category: "Coffee", image: require("@/assets/images/cappuccino.png") },
  { id: "p3", name: "Mocha Latte", price: 120, category: "Coffee", image: require("@/assets/images/mocha-latte.png") },
  { id: "p4", name: "Matcha", price: 120, category: "Non-Coffee", image: require("@/assets/images/matcha.png") },
  { id: "p5", name: "Egg Pie", price: 40, category: "Pastries", image: require("@/assets/images/egg-pie.png") },
  { id: "p6", name: "Egg Pie", price: 40, category: "Pastries", image: require("@/assets/images/egg-pie.png"), available: 0 },
];

export const LOW_STOCK_THRESHOLD = 5;

export const INVENTORY: InventoryItem[] = [
  { id: "i1", lastStockUpdate: "14/8/2026", itemName: "Coffee Beans", category: "Coffee", stocks: 2, variance: 2, unitCost: 300 },
  { id: "i2", lastStockUpdate: "14/8/2026", itemName: "Milk", category: "Coffee", stocks: 20, variance: 0, unitCost: 125 },
  { id: "i3", lastStockUpdate: "14/8/2026", itemName: "Syrup", category: "Coffee", stocks: 15, variance: 1, unitCost: 300 },
  { id: "i5", lastStockUpdate: "14/8/2026", itemName: "Fruit Tea", category: "Tea", stocks: 5, variance: -1, unitCost: 350 },
];
