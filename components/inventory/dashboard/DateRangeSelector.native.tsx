import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar } from "lucide-react-native";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import {
    type DateRange,
    type Timeframe,
    matchesQuickRange,
    quickRange,
} from "./chartData";

interface DateRangeSelectorProps {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
}

const TIMEFRAMES: Timeframe[] = ["7d", "30d", "90d"];

function formatShort(date: Date) {
  const safe = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(safe.getTime())) return "--";
  return safe.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DateRangeSelector({
  range,
  onRangeChange,
}: DateRangeSelectorProps) {
  const [pickerOpenFor, setPickerOpenFor] = useState<"start" | "end" | null>(
    null,
  );

  const activeQuick = matchesQuickRange(range);

  function handlePick(date: Date, which: "start" | "end") {
    setPickerOpenFor(null);

    if (which === "start") {
      const end = date > range.end ? date : range.end;
      onRangeChange({ start: date, end });
    } else {
      const start = date < range.start ? date : range.start;
      onRangeChange({ start, end: date });
    }
  }

  // The native picker's callback value isn't guaranteed to be a real Date
  // in this JS context, so rebuild it with `new Date(...)` before it
  // reaches state.
  function handlePickerValue(value: unknown, which: "start" | "end") {
    const raw =
      value instanceof Date
        ? value.getTime()
        : ((value as any)?.nativeEvent?.timestamp ??
          (value as any)?.timestamp ??
          value);

    const date = new Date(raw as number);
    if (!Number.isNaN(date.getTime())) {
      handlePick(date, which);
    } else {
      setPickerOpenFor(null);
    }
  }

  return (
    <View className="flex-row flex-wrap items-center gap-3">
      <View className="flex-row items-center gap-2 rounded-full border border-black/10 bg-white px-2 py-1.5 shadow-sm">
        <Pressable
          onPress={() => setPickerOpenFor("start")}
          className="flex-row items-center gap-1.5 rounded-full px-2 py-1"
        >
          <Calendar size={15} color="#3F5A4A" />
          <Text className="text-sm font-medium text-black">
            {formatShort(range.start)}
          </Text>
        </Pressable>

        <Text className="text-black/30">–</Text>

        <Pressable
          onPress={() => setPickerOpenFor("end")}
          className="flex-row items-center gap-1.5 rounded-full px-2 py-1"
        >
          <Calendar size={15} color="#3F5A4A" />
          <Text className="text-sm font-medium text-black">
            {formatShort(range.end)}
          </Text>
        </Pressable>
      </View>

      <View className="flex-row gap-2">
        {TIMEFRAMES.map((tf) => {
          const active = tf === activeQuick;
          // Same element tree for active/inactive so Android doesn't have
          // to mount/unmount a native view on every tap.
          return (
            <Pressable
              key={tf}
              onPress={() => onRangeChange(quickRange(tf))}
              className="rounded-full"
            >
              <LinearGradient
                colors={
                  active ? ["#4C6E5A", "#2B4335"] : ["#FFFFFF", "#FFFFFF"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: active ? 0 : 1,
                  borderColor: "rgba(0,0,0,0.15)",
                }}
              >
                <Text
                  className={`text-sm font-semibold ${
                    active ? "text-white" : "text-black/70"
                  }`}
                >
                  {tf}
                </Text>
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>

      {pickerOpenFor && (
        <DateTimePicker
          value={pickerOpenFor === "start" ? range.start : range.end}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          maximumDate={new Date()}
          onValueChange={(value) => handlePickerValue(value, pickerOpenFor)}
          onDismiss={() => setPickerOpenFor(null)}
        />
      )}
    </View>
  );
}
