import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { Metric } from "./StatsCards";

type Timeframe = "7d" | "30d" | "90d";

interface DataPoint {
  label: string;
  value: number;
}

interface GrossChartProps {
  metric: Metric;
}

// Mock data
const CHART_DATA: Record<Metric, Record<Timeframe, DataPoint[]>> = {
  profit: {
    "7d": [
      { label: "Sep 7", value: 880 },
      { label: "Sep 8", value: 760 },
      { label: "Sep 9", value: 910 },
      { label: "Sep 10", value: 700 },
      { label: "Sep 11", value: 950 },
      { label: "Sep 12", value: 820 },
      { label: "Sep 13", value: 890 },
    ],
    "30d": [
      { label: "Aug 9", value: 1050 },
      { label: "Aug 12", value: 880 },
      { label: "Aug 16", value: 700 },
      { label: "Aug 19", value: 680 },
      { label: "Aug 23", value: 1150 },
      { label: "Aug 26", value: 830 },
      { label: "Aug 29", value: 720 },
      { label: "Sep 2", value: 870 },
      { label: "Sep 5", value: 780 },
      { label: "Sep 7", value: 880 },
    ],
    "90d": [
      { label: "Jun", value: 6200 },
      { label: "Jul", value: 7100 },
      { label: "Aug", value: 8300 },
      { label: "Sep", value: 5400 },
    ],
  },
  sales: {
    "7d": [
      { label: "Sep 7", value: 1700 },
      { label: "Sep 8", value: 1500 },
      { label: "Sep 9", value: 1850 },
      { label: "Sep 10", value: 1400 },
      { label: "Sep 11", value: 1950 },
      { label: "Sep 12", value: 1620 },
      { label: "Sep 13", value: 1780 },
    ],
    "30d": [
      { label: "Aug 9", value: 2100 },
      { label: "Aug 12", value: 1760 },
      { label: "Aug 16", value: 1400 },
      { label: "Aug 19", value: 1360 },
      { label: "Aug 23", value: 2300 },
      { label: "Aug 26", value: 1660 },
      { label: "Aug 29", value: 1440 },
      { label: "Sep 2", value: 1740 },
      { label: "Sep 5", value: 1560 },
      { label: "Sep 7", value: 1760 },
    ],
    "90d": [
      { label: "Jun", value: 12400 },
      { label: "Jul", value: 14200 },
      { label: "Aug", value: 16600 },
      { label: "Sep", value: 10800 },
    ],
  },
};

const TIMEFRAMES: Timeframe[] = ["7d", "30d", "90d"];
const CHART_HEIGHT = 190;
const GRIDLINE_COUNT = 5;

function niceMax(rawMax: number) {
  const step = Math.pow(10, Math.floor(Math.log10(rawMax || 1)) - 1) * 3;
  return Math.ceil(rawMax / step) * step || step;
}

export default function GrossChart({ metric }: GrossChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");

  const data = CHART_DATA[metric][timeframe];
  const title = metric === "sales" ? "Gross Sales" : "Gross Profit";

  const maxValue = useMemo(() => {
    const rawMax = Math.max(...data.map((d) => d.value));
    return niceMax(rawMax);
  }, [data]);

  const gridlines = useMemo(() => {
    const step = maxValue / GRIDLINE_COUNT;
    return Array.from({ length: GRIDLINE_COUNT }, (_, i) =>
      Math.round(step * (GRIDLINE_COUNT - i))
    );
  }, [maxValue]);

  return (
    <View className="flex-1 rounded-2xl border border-black/10 bg-[#F7F4ED] p-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-bold text-black">{title}</Text>

        <View className="flex-row gap-2">
          {TIMEFRAMES.map((tf) => {
            const active = tf === timeframe;
            return (
              <Pressable
                key={tf}
                onPress={() => setTimeframe(tf)}
                className={`rounded-full border px-4 py-1.5 ${
                  active
                    ? "border-[#3F5A4A] bg-[#3F5A4A]"
                    : "border-black/20 bg-transparent"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    active ? "text-white" : "text-black"
                  }`}
                >
                  {tf}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="mt-6 flex-row">
        {/* Y-axis labels */}
        <View
          style={{ height: CHART_HEIGHT }}
          className="mr-3 justify-between"
        >
          {gridlines.map((g) => (
            <Text key={g} className="text-xs text-black/50">
              ₱{g}
            </Text>
          ))}
        </View>

        {/* Chart area */}
        <View className="flex-1">
          <View style={{ height: CHART_HEIGHT }} className="relative">
            {/* gridlines */}
            <View className="absolute inset-0 justify-between">
              {gridlines.map((g) => (
                <View key={g} className="h-px w-full bg-black/10" />
              ))}
            </View>

            {/* bars */}
            <View className="absolute inset-0 flex-row items-end justify-between px-1">
              {data.map((point) => (
                <View
                  key={point.label}
                  className="mx-1 flex-1 items-center justify-end"
                >
                  <View
                    style={{
                      height: (point.value / maxValue) * CHART_HEIGHT,
                    }}
                    className="w-full max-w-[28px] rounded-t-sm bg-black"
                  />
                </View>
              ))}
            </View>
          </View>

          {/* X-axis labels */}
          <View className="mt-2 flex-row justify-between px-1">
            {data.map((point) => (
              <Text
                key={point.label}
                className="mx-1 flex-1 text-center text-xs text-black/50"
              >
                {point.label}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
