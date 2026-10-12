import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { TrendingUp } from "lucide-react-native";
import MiniChart from "./MiniChart";
import type { DateRange, Metric } from "./chartData";

interface StatsCardsProps {
  grossSales: number;
  grossProfit: number;
  range: DateRange;
  onExpand: (metric: Metric) => void;
}

function formatPeso(value: number) {
  return `₱${(value / 1000).toFixed(1)}k`;
}

// Both cards use the same "selected" treatment (gradient fill, white text) —
// distinguished from each other by a slightly different green, not by one
// looking active and the other inactive.
const CARD_CONFIG: {
  metric: Metric;
  label: string;
  gradient: [string, string];
  labelColor: string;
  valueColor: string;
  barColor: string;
}[] = [
  {
    metric: "sales",
    label: "Gross Sales",
    gradient: ["#3F5A4A", "#1F2E24"],
    labelColor: "#E7EFE9",
    valueColor: "#FFFFFF",
    barColor: "#FFFFFF",
  },
  {
    metric: "profit",
    label: "Gross Profit",
    gradient: ["#4C6E5A", "#2B4335"],
    labelColor: "#E7EFE9",
    valueColor: "#FFFFFF",
    barColor: "#FFFFFF",
  },
];

export default function StatsCards({
  grossSales,
  grossProfit,
  range,
  onExpand,
}: StatsCardsProps) {
  const amounts: Record<Metric, number> = {
    sales: grossSales,
    profit: grossProfit,
  };

  return (
    <View className="flex-row gap-4">
      {CARD_CONFIG.map((card) => (
        <Pressable
          key={card.metric}
          onPress={() => onExpand(card.metric)}
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.985 : 1 }],
          })}
          className="flex-1 overflow-hidden rounded-3xl shadow-md"
        >
          <LinearGradient
            colors={card.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 22, minHeight: 210 }}
          >
            <View className="flex-row items-start justify-between">
              <Text
                style={{ color: card.labelColor }}
                className="text-lg font-semibold"
              >
                {card.label}
              </Text>

              <View className="items-end">
                <Text
                  style={{ color: card.valueColor }}
                  className="text-4xl font-extrabold"
                >
                  {formatPeso(amounts[card.metric])}
                </Text>
                <View className="mt-1.5 flex-row items-center gap-1 opacity-70">
                  <TrendingUp size={13} color={card.valueColor} />
                  <Text
                    style={{ color: card.valueColor }}
                    className="text-xs font-medium"
                  >
                    Tap to expand
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-7">
              <MiniChart
                metric={card.metric}
                range={range}
                barColor={card.barColor}
                height={72}
              />
            </View>
          </LinearGradient>
        </Pressable>
      ))}
    </View>
  );
}
