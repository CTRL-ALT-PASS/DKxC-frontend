import type { ImageSourcePropType } from "react-native";

export interface User {
  employeeId: string;
  pin: string;
  name: string;
  avatar: ImageSourcePropType;
}

export interface ProductSpecOption {
  label: string;
  priceDelta?: number;
}

export interface ProductSpecGroup {
  key: string;
  label: string;
  options: ProductSpecOption[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: ImageSourcePropType;
  specs?: ProductSpecGroup[];
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

export const CATEGORIES = [
  "All Menu",
  "Coffee",
  "Non-Coffee",
  "Pastries",
  "Tea",
  "Other",
];

// Shared by every drink product. priceDelta is added on top of the product's
// base price for that one cart line -- e.g. a ₱120 Americano with "Large"
// (+30) and "Velvet Creme" (+20) becomes ₱170 for that specific order line,
// while a Small/no-toppings Americano in the same cart stays ₱120.
const DRINK_SPECS: ProductSpecGroup[] = [
  {
    key: "size",
    label: "Size:",
    options: [
      { label: "Small", priceDelta: 0 },
      { label: "Medium", priceDelta: 15 },
      { label: "Large", priceDelta: 30 },
    ],
  },
  {
    key: "temperature",
    label: "Temperature:",
    options: [
      { label: "Cold", priceDelta: 0 },
      { label: "Hot", priceDelta: 0 },
    ],
  },
  {
    key: "sugarType",
    label: "Sugar Type:",
    options: [
      { label: "None", priceDelta: 0 },
      { label: "White Sugar", priceDelta: 0 },
      { label: "Cane", priceDelta: 0 },
      { label: "Muscovado", priceDelta: 5 },
    ],
  },
  {
    key: "sugarLevel",
    label: "Sugar Level:",
    options: [
      { label: "0", priceDelta: 0 },
      { label: "25", priceDelta: 0 },
      { label: "50", priceDelta: 0 },
      { label: "75", priceDelta: 0 },
      { label: "100", priceDelta: 0 },
    ],
  },
  {
    key: "toppings",
    label: "Toppings:",
    options: [
      { label: "None", priceDelta: 0 },
      { label: "Velvet Creme", priceDelta: 20 },
      { label: "Jelly Strips", priceDelta: 15 },
      { label: "Coffee Jelly", priceDelta: 15 },
    ],
  },
  {
    key: "syrup",
    label: "Syrup:",
    options: [
      { label: "None", priceDelta: 0 },
      { label: "Salted Caramel", priceDelta: 10 },
      { label: "French Vanilla", priceDelta: 10 },
    ],
  },
  {
    key: "whippedCream",
    label: "Whipped Cream:",
    options: [
      { label: "Yes", priceDelta: 15 },
      { label: "No", priceDelta: 0 },
    ],
  },
];

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Americano",
    price: 120,
    category: "Coffee",
    image: require("@/assets/images/americano.png"),
    specs: DRINK_SPECS,
  },
  {
    id: "p2",
    name: "Cappuccino",
    price: 120,
    category: "Coffee",
    image: require("@/assets/images/cappuccino.png"),
    specs: DRINK_SPECS,
  },
  {
    id: "p3",
    name: "Mocha Latte",
    price: 120,
    category: "Coffee",
    image: require("@/assets/images/mocha-latte.png"),
    specs: DRINK_SPECS,
  },
  {
    id: "p4",
    name: "Matcha",
    price: 120,
    category: "Non-Coffee",
    image: require("@/assets/images/matcha.png"),
    specs: DRINK_SPECS,
  },
  {
    id: "p5",
    name: "Egg Pie",
    price: 40,
    category: "Pastries",
    image: require("@/assets/images/egg-pie.png"),
  },
]
  
export const ADMIN_USER: User = {
  employeeId: "DCY-002",
  pin: "54321",
  name: "Joshua David",
  avatar: require("../assets/images/avatar.png"),
};


// One unit's real price once its selected options are factored in. Products
// with no specs (or calls with no options) just return the plain base price.
export function getUnitPrice(
  product: Product,
  options?: Record<string, string>,
): number {
  if (!options || !product.specs) return product.price;
  let total = product.price;
  for (const group of product.specs) {
    const selectedLabel = options[group.key];
    if (!selectedLabel) continue;
    const option = group.options.find((o) => o.label === selectedLabel);
    if (option?.priceDelta) total += option.priceDelta;
  }
  return total;
}

export const LOW_STOCK_THRESHOLD = 5;

export const INVENTORY: InventoryItem[] = [
  {
    id: "i1",
    lastStockUpdate: "14/8/2026",
    itemName: "Coffee Beans",
    category: "Coffee",
    stocks: 2,
    variance: 2,
    unitCost: 300,
  },
  {
    id: "i2",
    lastStockUpdate: "14/8/2026",
    itemName: "Milk",
    category: "Coffee",
    stocks: 20,
    variance: 0,
    unitCost: 125,
  },
  {
    id: "i3",
    lastStockUpdate: "14/8/2026",
    itemName: "Syrup",
    category: "Coffee",
    stocks: 15,
    variance: 1,
    unitCost: 300,
  },
  {
    id: "i5",
    lastStockUpdate: "14/8/2026",
    itemName: "Fruit Tea",
    category: "Tea",
    stocks: 5,
    variance: -1,
    unitCost: 350,
  },
  {
    id: "i6",
    lastStockUpdate: "14/8/2026",
    itemName: "Green Tea",
    category: "Tea",
    stocks: 10,
    variance: 0,
    unitCost: 200,
  },
  {
    id: "i7",
    lastStockUpdate: "14/8/2026",
    itemName: "Black Tea",
    category: "Tea",
    stocks: 8,
    variance: 0,
    unitCost: 150,
  },
];
