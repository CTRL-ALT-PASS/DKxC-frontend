import { Pressable, Text, View } from "react-native";

interface RankedItem {
  name: string;
  value: number;
}

// canvas -> secondary -> secondary at 70%, dark to light like the mockup
const RANK_TINTS = ["#1A0208", "#4C0519", "#4C0519B3"];

const formatPeso = (n: number) =>
  "₱" +
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

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
    // flex-1: both lists split the card's height equally
    <View className="flex-1">
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

      {/* Rows share the list's height evenly; minHeight keeps them
          readable when there's no spare space (e.g. a short screen). */}
      <View className="mt-3 flex-1">
        {items.length === 0 && (
          <View className="flex-1 items-center justify-center">
            <Text className="text-sm text-secondary/60">
              No sales in this range
            </Text>
          </View>
        )}
        {items.map((item, index) => (
          <View
            key={item.name}
            style={{ minHeight: 44 }}
            className={`flex-1 flex-row items-center gap-3 ${
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
              {formatPeso(item.value)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface BestSellingProps {
  products: RankedItem[]; // value = revenue
  categories: RankedItem[];
  onViewAllPress?: () => void;
  onBreakdownPress?: () => void;
}

export default function BestSelling({
  products,
  categories,
  onViewAllPress,
  onBreakdownPress,
}: BestSellingProps) {
  return (
    <View className="flex-1 rounded-3xl border border-tertiary-soft/40 bg-white p-5 shadow-sm">
      <RankedList
        title="Best Selling Products"
        items={products}
        actionLabel="View All"
        onActionPress={onViewAllPress}
      />

      <View className="my-4 h-px bg-tertiary-soft/40" />

      <RankedList
        title="Best Selling Categories"
        items={categories}
        actionLabel="Breakdown"
        onActionPress={onBreakdownPress}
      />
    </View>
  );
}
