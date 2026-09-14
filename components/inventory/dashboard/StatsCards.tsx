import { Pressable, Text, View } from "react-native";

export type Metric = "sales" | "profit";

interface StatsCardsProps {
  grossSales: number;
  grossProfit: number;
  selectedMetric: Metric;
  onSelectMetric: (metric: Metric) => void;
}

function formatPeso(value: number) {
  return `₱${(value / 1000).toFixed(1)}k`;
}

const CARDS: { metric: Metric; label: string }[] = [
  { metric: "sales", label: "Gross Sales" },
  { metric: "profit", label: "Gross Profit" },
];

export default function StatsCards({
  grossSales,
  grossProfit,
  selectedMetric,
  onSelectMetric,
}: StatsCardsProps) {
  const amounts: Record<Metric, number> = {
    sales: grossSales,
    profit: grossProfit,
  };

  return (
    <View className="flex-row gap-4">
      {CARDS.map(({ metric, label }) => {
        const active = metric === selectedMetric;

        return (
          <Pressable
            key={metric}
            onPress={() => onSelectMetric(metric)}
            className={`flex-1 rounded-2xl p-5 ${
              active
                ? "border-2 border-white bg-[#3F5A4A]"
                : "border border-black/10 bg-[#F7F4ED]"
            }`}
          >
            <Text
              className={`text-lg font-semibold ${
                active ? "text-white" : "text-black"
              }`}
            >
              {label}
            </Text>
            <Text
              className={`mt-6 text-4xl font-extrabold ${
                active ? "text-white" : "text-black"
              }`}
            >
              {formatPeso(amounts[metric])}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
