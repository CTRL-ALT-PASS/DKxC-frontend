import { useMemo } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X } from "lucide-react-native";
import {
  buildSeries,
  niceMax,
  type DateRange,
  type Metric,
} from "./chartData";

interface ChartModalProps {
  metric: Metric | null;
  range: DateRange;
  onClose: () => void;
}

const CHART_HEIGHT = 220;
const GRIDLINE_COUNT = 5;
const BAR_SLOT_WIDTH = 46;

const METRIC_LABEL: Record<Metric, string> = {
  sales: "Gross Sales",
  profit: "Gross Profit",
};

// Same two gradients used on the stat cards, so the modal reads as a
// continuation of whichever card was tapped, not a different surface.
const METRIC_GRADIENT: Record<Metric, [string, string]> = {
  sales: ["#3F5A4A", "#1F2E24"],
  profit: ["#4C6E5A", "#2B4335"],
};

function formatPeso(value: number) {
  return `₱${(value / 1000).toFixed(1)}k`;
}

function formatRange(range: DateRange) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(range.start)} – ${fmt(range.end)}`;
}

export default function ChartModal({ metric, range, onClose }: ChartModalProps) {
  const visible = metric !== null;

  const data = useMemo(
    () => (metric ? buildSeries(metric, range) : []),
    [metric, range]
  );

  const total = useMemo(
    () => data.reduce((sum, p) => sum + p.value, 0),
    [data]
  );

  const maxValue = useMemo(() => {
    if (data.length === 0) return 0;
    return niceMax(Math.max(...data.map((d) => d.value)));
  }, [data]);

  const gridlines = useMemo(() => {
    const step = maxValue / GRIDLINE_COUNT;
    return Array.from({ length: GRIDLINE_COUNT }, (_, i) =>
      Math.round(step * (GRIDLINE_COUNT - i))
    );
  }, [maxValue]);

  const needsScroll = data.length > 10;

  if (!metric) return null;

  const gradient = METRIC_GRADIENT[metric];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/45 px-6"
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        >
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 24 }}
          >
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-sm font-medium text-white/70">
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
                <X size={18} color="#fff" />
              </Pressable>
            </View>
          </LinearGradient>

          {data.length === 0 ? (
            <View className="items-center justify-center py-16">
              <Text className="text-black/40">No data in this range.</Text>
            </View>
          ) : (
            <View className="flex-row p-6">
              <View
                style={{ height: CHART_HEIGHT }}
                className="mr-3 justify-between"
              >
                {gridlines.map((g) => (
                  <Text key={g} className="text-xs text-black/40">
                    ₱{g}
                  </Text>
                ))}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEnabled={needsScroll}
              >
                <View style={{ minWidth: data.length * BAR_SLOT_WIDTH }}>
                  <View style={{ height: CHART_HEIGHT }} className="relative">
                    <View className="absolute inset-0 justify-between">
                      {gridlines.map((g) => (
                        <View key={g} className="h-px w-full bg-black/10" />
                      ))}
                    </View>

                    <View className="absolute inset-0 flex-row items-end">
                      {data.map((point, i) => (
                        <View
                          key={`${point.label}-${i}`}
                          style={{ width: BAR_SLOT_WIDTH }}
                          className="items-center justify-end px-1"
                        >
                          <View
                            style={{
                              height: Math.max(
                                3,
                                (point.value / maxValue) * CHART_HEIGHT
                              ),
                            }}
                            className="w-full max-w-[28px] overflow-hidden rounded-t-md"
                          >
                            <LinearGradient
                              colors={gradient}
                              start={{ x: 0, y: 1 }}
                              end={{ x: 0, y: 0 }}
                              style={{ flex: 1 }}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View className="mt-2 flex-row">
                    {data.map((point, i) => (
                      <Text
                        key={`${point.label}-${i}`}
                        style={{ width: BAR_SLOT_WIDTH }}
                        className="text-center text-xs text-black/50"
                      >
                        {point.label}
                      </Text>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
