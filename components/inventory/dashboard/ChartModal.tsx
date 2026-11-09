import type { DailySeriesPoint } from "@/services/dashboardApi";
import { LinearGradient } from "expo-linear-gradient";
import { X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  Path,
  Stop,
  LinearGradient as SvgGradient,
} from "react-native-svg";
import { buildSeries, niceMax, type DateRange, type Metric } from "./chartData";

interface ChartModalProps {
  metric: Metric | null;
  range: DateRange;
  series: DailySeriesPoint[];
  onClose: () => void;
}

const CHART_HEIGHT = 220;
const GRIDLINE_COUNT = 5; // intervals, so GRIDLINE_COUNT + 1 lines including 0
const SLOT_WIDTH = 46;
const MIN_SLOT_WIDTH = 46; // was SLOT_WIDTH
const PLOT_PAD = 10; // keeps the top/bottom dots from being clipped

const PRIMARY = "#BE185D";
const GRID = "#FDA4AF"; // tertiary.soft

const METRIC_LABEL: Record<Metric, string> = {
  sales: "Gross Sales",
  profit: "Gross Profit",
};

function formatPeso(value: number) {
  return `₱${(value / 1000).toFixed(1)}k`;
}

function formatAxis(value: number) {
  return value === 0 ? "₱0" : `₱${(value / 1000).toFixed(1)}k`;
}

function formatRange(range: DateRange) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(range.start)} – ${fmt(range.end)}`;
}

function LineChart({
  values,
  maxValue,
  slotWidth,
}: {
  values: number[];
  maxValue: number;
  slotWidth: number;
}) {
  const width = slotWidth * values.length;
  const plotH = CHART_HEIGHT - PLOT_PAD * 2;
  const safeMax = maxValue || 1;

  const points = values.map((v, i) => ({
    x: slotWidth * (i + 0.5),
    y: PLOT_PAD + (1 - v / safeMax) * plotH,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${
    PLOT_PAD + plotH
  } L${points[0].x},${PLOT_PAD + plotH} Z`;

  return (
    <Svg width={width} height={CHART_HEIGHT}>
      <Defs>
        <SvgGradient id="modal-area" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={PRIMARY} stopOpacity={0.25} />
          <Stop offset="1" stopColor={PRIMARY} stopOpacity={0} />
        </SvgGradient>
      </Defs>

      {Array.from({ length: GRIDLINE_COUNT + 1 }, (_, i) => {
        const y = PLOT_PAD + (i / GRIDLINE_COUNT) * plotH;
        return (
          <Line
            key={i}
            x1={0}
            x2={width}
            y1={y}
            y2={y}
            stroke={GRID}
            strokeOpacity={0.4}
            strokeWidth={1}
          />
        );
      })}

      <Path d={areaPath} fill="url(#modal-area)" />
      <Path
        d={linePath}
        stroke={PRIMARY}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      {points.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill="#FFFFFF"
          stroke={PRIMARY}
          strokeWidth={2.5}
        />
      ))}
    </Svg>
  );
}

export default function ChartModal({
  metric,
  range,
  series,
  onClose,
}: ChartModalProps) {
  const [viewportWidth, setViewportWidth] = useState(0);

  const data = useMemo(
    () => (metric ? buildSeries(metric, range, series) : []),
    [metric, range, series],
  );

  const total = useMemo(
    () => data.reduce((sum, p) => sum + p.value, 0),
    [data],
  );

  const maxValue = useMemo(() => {
    if (data.length === 0) return 0;
    return niceMax(Math.max(...data.map((d) => d.value)));
  }, [data]);

  const gridlines = useMemo(() => {
    const step = maxValue / GRIDLINE_COUNT;
    return Array.from({ length: GRIDLINE_COUNT + 1 }, (_, i) =>
      Math.round(step * (GRIDLINE_COUNT - i)),
    );
  }, [maxValue]);

  if (!metric) return null;

  // Short ranges spread across the whole width; long ranges use fixed slots
  // inside a horizontal scroll.
  const slotWidth =
    viewportWidth > 0 && data.length > 0
      ? Math.max(MIN_SLOT_WIDTH, viewportWidth / data.length)
      : 0;

  const needsScroll = slotWidth * data.length > viewportWidth + 1;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center bg-canvas/60 px-6"
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        >
          <LinearGradient
            colors={["#4C0519", "#2A030F"]} // secondary -> canvas.mid
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 24 }}
          >
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-sm font-medium text-neutral/70">
                  {METRIC_LABEL[metric]} · {formatRange(range)}
                </Text>
                <Text className="mt-1 text-4xl font-extrabold text-white">
                  {formatPeso(total)}
                </Text>
              </View>

              <Pressable
                onPress={onClose}
                className="rounded-full bg-white/15 p-2"
                hitSlop={8}
              >
                <X size={18} color="#FB7185" />
              </Pressable>
            </View>
          </LinearGradient>

          {data.length === 0 ? (
            <View className="items-center justify-center py-16">
              <Text className="text-secondary/40">No data in this range.</Text>
            </View>
          ) : (
            <View className="flex-row p-6">
              <View
                style={{
                  height: CHART_HEIGHT,
                  justifyContent: "space-between",
                  paddingVertical: 2,
                }}
                className="mr-3"
              >
                {gridlines.map((g, i) => (
                  <Text key={i} className="text-xs text-secondary/50">
                    {formatAxis(g)}
                  </Text>
                ))}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEnabled={needsScroll}
                style={{ flex: 1 }}
                onLayout={(e: LayoutChangeEvent) =>
                  setViewportWidth(e.nativeEvent.layout.width)
                }
              >
                {slotWidth > 0 && (
                  <View>
                    <LineChart
                      values={data.map((d) => d.value)}
                      maxValue={maxValue}
                      slotWidth={slotWidth}
                    />

                    <View className="mt-2 flex-row">
                      {data.map((point, i) => (
                        <Text
                          key={`${point.label}-${i}`}
                          style={{ width: slotWidth }}
                          className="text-center text-xs text-secondary/60"
                        >
                          {point.label}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
