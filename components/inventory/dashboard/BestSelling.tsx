import { Pressable, Text, View } from "react-native";

interface RankedItem {
  name: string;
  value: number;
}

// Mock data — replace with real aggregation later, and swap this
// layout for a pie chart when that's ready.
const BEST_SELLING_PRODUCTS: RankedItem[] = [
  { name: "Green Matcha Latte", value: 500 },
  { name: "Salted Caramel Frappe", value: 300 },
  { name: "Croissant", value: 200 },
];

const BEST_SELLING_CATEGORIES: RankedItem[] = [
  { name: "Coffee", value: 800 },
  { name: "Pastries", value: 200 },
  { name: "Fruit tea", value: 200 },
];

// canvas -> secondary -> secondary at 70%, dark to light like the mockup
const RANK_TINTS = ["#1A0208", "#4C0519", "#4C0519B3"];

function RankedList({
  title,
  items,
  actionLabel,
  onActionPress,
}: {
  title: string;
  items: RankedItem[];
  actionLabel?: string;
  onActionPress?: () => void;
}) {
  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-secondary">{title}</Text>
        {actionLabel && (
          <Pressable onPress={onActionPress} hitSlop={8}>
            <Text className="text-xs font-medium text-primary">
              {actionLabel}
            </Text>
          </Pressable>
        )}
      </View>

      <View className="mt-3">
        {items.map((item, index) => (
          <View
            key={item.name}
            className={`flex-row items-center gap-3 py-2.5 ${
              index !== items.length - 1
                ? "border-b border-tertiary-soft/30"
                : ""
            }`}
          >
            <View
              style={{ backgroundColor: RANK_TINTS[index] ?? RANK_TINTS[2] }}
              className="h-6 w-6 items-center justify-center rounded-full"
            >
              <Text className="text-xs font-bold text-white">{index + 1}</Text>
            </View>
            <Text className="flex-1 text-sm text-secondary" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-sm font-semibold text-secondary">
              ₱{item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface BestSellingProps {
  onViewAllPress?: () => void;
  onBreakdownPress?: () => void;
}

export default function BestSelling({
  onViewAllPress,
  onBreakdownPress,
}: BestSellingProps) {
  return (
    <View className="rounded-3xl border border-tertiary-soft/40 bg-white p-5 shadow-sm">
      <RankedList
        title="Best Selling Products"
        items={BEST_SELLING_PRODUCTS}
        actionLabel="View All"
        onActionPress={onViewAllPress}
      />

      <View className="my-4 h-px bg-tertiary-soft/40" />

      <RankedList
        title="Best Selling Categories"
        items={BEST_SELLING_CATEGORIES}
        actionLabel="Breakdown"
        onActionPress={onBreakdownPress}
      />
    </View>
  );
}