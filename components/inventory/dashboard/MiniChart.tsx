import { View } from "react-native";
import { buildSeries, niceMax, type DateRange, type Metric } from "./chartData";

interface MiniChartProps {
  metric: Metric;
  range: DateRange;
  barColor: string;
  height?: number;
}

/** A small, label-free bar chart meant to live inside a stat card. */
export default function MiniChart({
  metric,
  range,
  barColor,
  height = 64,
}: MiniChartProps) {
  const data = buildSeries(metric, range);
  if (data.length === 0) return <View style={{ height }} />;

  const maxValue = niceMax(Math.max(...data.map((d) => d.value)));

  return (
    <View
      style={{ height }}
      className="flex-row items-end justify-between gap-1"
    >
      {data.map((point, i) => (
        <View
          key={`${point.label}-${i}`}
          style={{
            height: Math.max(3, (point.value / maxValue) * height),
            backgroundColor: barColor,
          }}
          className="flex-1 rounded-full"
        />
      ))}
    </View>
  );
}
