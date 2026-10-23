import { LinearGradient } from "expo-linear-gradient";
import { ArrowUpRight } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import {
  buildSeries,
  matchesQuickRange,
  type DateRange,
  type Metric,
} from "./chartData";
import SparkLine from "./SparkLine";

interface StatsCardsProps {
  grossSales: number;
  grossProfit: number;
  range: DateRange;
  onExpand: (metric: Metric) => void;
}

function formatPeso(value: number) {
  return `₱${(value / 1000).toFixed(1)}k`;
}

// Percent change of the second half of the range vs. the first half.
function halfOverHalfChange(values: number[]) {
  const mid = Math.floor(values.length / 2);
  const sum = (arr: number[]) => arr.reduce((s, v) => s + v, 0);
  const before = sum(values.slice(0, mid));
  const after = sum(values.slice(mid));
  return before === 0 ? 0 : ((after - before) / before) * 100;
}

const CARDS: { metric: Metric; label: string }[] = [
  { metric: "sales", label: "Gross Sales" },
  { metric: "profit", label: "Gross Profit" },
];

export default function StatsCards({
  grossSales,
  grossProfit,
  range,
  onExpand,
}: StatsCardsProps) {
  const series = useMemo(
    () => ({
      sales: buildSeries("sales", range).map((p) => p.value),
      profit: buildSeries("profit", range).map((p) => p.value),
    }),
    [range],
  );

  const amounts: Record<Metric, number> = {
    sales: grossSales,
    profit: grossProfit,
  };

  const quick = matchesQuickRange(range);
  const days =
    quick?.replace("d", "") ??
    String(
      Math.max(
        1,
        Math.round((range.end.getTime() - range.start.getTime()) / 86400000),
      ),
    );
  const margin =
    grossSales > 0 ? ((grossProfit / grossSales) * 100).toFixed(1) : "0.0";

  const subtitles: Record<Metric, string> = {
    sales: `${days}-Day Velocity`,
    profit: `${margin}% Net Margin`,
  };

  return (
    <View className="flex-row gap-4">
      {CARDS.map((card) => {
        const change = halfOverHalfChange(series[card.metric]);
        const up = change >= 0;

        return (
          <Pressable
            key={card.metric}
            onPress={() => onExpand(card.metric)}
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? 0.985 : 1 }],
            })}
            className="flex-1 overflow-hidden rounded-3xl shadow-md"
          >
            <LinearGradient
              colors={["#4C0519", "#2A030F"]} // secondary -> canvas.mid
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 20, minHeight: 210 }}
            >
              <View className="flex-row items-start justify-between">
                <View>
                  <Text className="text-xs font-semibold uppercase tracking-wider text-neutral/80">
                    {card.label}
                  </Text>
                  <Text className="mt-1 text-4xl font-extrabold text-white">
                    {formatPeso(amounts[card.metric])}
                  </Text>
                </View>

                <View className="flex-row items-center gap-1 rounded-full border border-tertiary/40 px-2 py-1">
                  <ArrowUpRight size={11} color="#FB7185" />
                  <Text className="text-[10px] font-medium text-tertiary">
                    Tap to expand
                  </Text>
                </View>
              </View>

              <View className="mt-5 flex-row items-center justify-between">
                <Text className="text-xs font-medium text-tertiary">
                  {subtitles[card.metric]}
                </Text>
                <Text
                  className={`text-xs font-bold ${up ? "text-success" : "text-tertiary"}`}
                >
                  {up ? "▲ +" : "▼ "}
                  {Math.abs(change).toFixed(1)}%
                </Text>
              </View>

              <View className="mt-2">
                <SparkLine
                  values={series[card.metric]}
                  height={72}
                  gradientId={`spark-${card.metric}`}
                />
              </View>
            </LinearGradient>
          </Pressable>
        );
      })}
    </View>
  );
}