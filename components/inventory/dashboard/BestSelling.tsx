import { Text, View } from "react-native";

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

const RANK_TINTS = ["#3F5A4A", "#7C9484", "#B7C4BA"];

function RankedList({ title, items }: { title: string; items: RankedItem[] }) {
  return (
    <View>
      <Text className="text-base font-bold text-[#141813]">{title}</Text>
      <View className="mt-3">
        {items.map((item, index) => (
          <View
            key={item.name}
            className={`flex-row items-center gap-3 py-2.5 ${
              index !== items.length - 1 ? "border-b border-black/[0.06]" : ""
            }`}
          >
            <View
              style={{ backgroundColor: RANK_TINTS[index] ?? "#B7C4BA" }}
              className="h-6 w-6 items-center justify-center rounded-full"
            >
              <Text className="text-xs font-bold text-white">{index + 1}</Text>
            </View>
            <Text className="flex-1 text-sm text-[#141813]" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-sm font-semibold text-[#141813]/70">
              ₱{item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function BestSelling() {
  return (
    <View className="gap-6 rounded-3xl bg-white p-5 shadow-sm">
      <RankedList title="Best Selling Products" items={BEST_SELLING_PRODUCTS} />
      <RankedList
        title="Best Selling Categories"
        items={BEST_SELLING_CATEGORIES}
      />
    </View>
  );
}
