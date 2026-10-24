import menuIcon from "@/assets/icons/menu.png";
import warningIcon from "@/assets/icons/warning.png";
import { Diff } from "lucide-react-native";
import { Image, Pressable, Text, View } from "react-native";

// Alternative unit an item can be received/used in (e.g. Carton = 1000 mL).
export type StockUnit = {
  id: string;
  name: string; // "Carton"
  note: string; // "1 L = 1,000 mL"
  factor: number; // how many base units in one of this unit
};

export type InventoryItem = {
  id: string;
  itemName: string;
  stocks: number; // stock count, always in the item's base unit
  unit: string; // base unit: "mL", "g", "pcs"
  baseCost: number; // cost per 1 base unit
  lastStockUpdate: string; // display string, e.g. "Oct 15, 2026 · 3:42 PM"
  units?: StockUnit[]; // optional extra units besides the base unit
  status: "Available" | "Low Stock" | "Out of Stock";
};

// Shared with the header so the columns always line up.
export const COLUMN_WIDTHS = {
  lastUpdate: "w-[200px]",
  stocks: "w-[160px]",
  status: "w-[110px]",
  baseCost: "w-[140px]",
  adjust: "w-[56px]",
  menu: "w-[48px]",
} as const;

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 2 });

type Props = {
  item: InventoryItem;
  onPressAdjust?: (item: InventoryItem) => void;
  onPressMenu?: (item: InventoryItem) => void;
};

export default function InventoryRow({
  item,
  onPressAdjust,
  onPressMenu,
}: Props) {
  const isOut = item.status === "Out of Stock";
  const isLow = item.status !== "Available";
  
  return (
    <View className="flex-row items-center h-16 px-5 bg-white border border-tertiary-soft/50 rounded-xl">
      <Text
        className="flex-1 text-[17px] font-semibold text-secondary"
        numberOfLines={1}
      >
        {item.itemName}
      </Text>

      <Text
        className={`${COLUMN_WIDTHS.lastUpdate} text-[15px] text-secondary/70`}
        numberOfLines={1}
      >
        {item.lastStockUpdate}
      </Text>

      <View className={`${COLUMN_WIDTHS.stocks} flex-row items-center`}>
        <Text className="text-[17px] text-secondary">
          {fmt(item.stocks)} {item.unit}
        </Text>
      </View>

      <View className={`${COLUMN_WIDTHS.status} flex-row items-center`}>
        {isLow ? (
          <View className="flex-row items-center bg-warn/10 rounded-full px-3 py-1">
            <Image
              source={warningIcon}
              style={{ width: 14, height: 14 }}
              resizeMode="contain"
            />
            <Text className="ml-1 text-[13px] font-semibold text-warn">
              {isOut ? "Out" : "Low"}
            </Text>
          </View>
        ) : (
          <View className="bg-success/20 rounded-full px-3 py-1">
            <Text className="text-[13px] font-semibold text-success-dark">
              OK
            </Text>
          </View>
        )}
      </View>

      <Text className={`${COLUMN_WIDTHS.baseCost} text-[17px] text-secondary`}>
        ₱{fmt(item.baseCost)}/{item.unit}
      </Text>

      <Pressable
        onPress={() => onPressAdjust?.(item)}
        className="h-10 w-10 mr-4 items-center justify-center rounded-lg border border-tertiary-soft bg-white active:bg-neutral"
        accessibilityLabel={`Add or remove stock for ${item.itemName}`}
      >
        <Diff size={20} color="#BE185D" strokeWidth={2} />
      </Pressable>

      <Pressable
        onPress={() => onPressMenu?.(item)}
        className={`${COLUMN_WIDTHS.menu} h-12 items-end justify-center`}
        accessibilityLabel={`Actions for ${item.itemName}`}
      >
        <Image
          source={menuIcon}
          style={{ width: 18, height: 18 }}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
}
