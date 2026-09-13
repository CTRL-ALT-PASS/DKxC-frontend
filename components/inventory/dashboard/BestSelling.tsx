import { Text, View } from "react-native";

interface RankedItem {
  name: string;
  value: number;
}

// Mock data 
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

function RankedList({ title, items }: { title: string; items: RankedItem[] }) {
  return (
    <View>
      <Text className="text-center text-lg font-bold text-black">
        {title}
      </Text>
      <View className="mt-3 gap-2">
        {items.map((item, index) => (
          <Text key={item.name} className="text-right text-sm text-black/80">
            {index + 1}. {item.name} – ₱{item.value}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function BestSelling() {
  return (
    <View className="gap-6 rounded-2xl p-5">
      <RankedList title="Best Selling Products" items={BEST_SELLING_PRODUCTS} />
      <RankedList
        title="Best Selling Categories"
        items={BEST_SELLING_CATEGORIES}
      />
    </View>
  );
}
