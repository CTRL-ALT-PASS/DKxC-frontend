import {
    Boxes,
    ChefHat,
    Coffee,
    FlaskConical,
    Milk,
    Package,
    Wheat,
    type LucideIcon,
} from "lucide-react-native";

export const INVENTORY_CATEGORIES = [
  { name: "Beverage Bases", icon: Coffee },
  { name: "Dairy & Milks", icon: Milk },
  { name: "Syrups & Powders", icon: FlaskConical },
  { name: "Baking", icon: Wheat },
  { name: "Kitchen", icon: ChefHat },
  { name: "Packaging", icon: Package },
  { name: "Other", icon: Boxes },
] as const satisfies readonly { name: string; icon: LucideIcon }[];

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number]["name"];

export const DEFAULT_CATEGORY: InventoryCategory = "Other";

export const getCategory = (name?: string) =>
  INVENTORY_CATEGORIES.find((c) => c.name === name) ??
  INVENTORY_CATEGORIES[INVENTORY_CATEGORIES.length - 1];