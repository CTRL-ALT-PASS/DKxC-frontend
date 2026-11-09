import { LinearGradient } from "expo-linear-gradient";
import { Calendar } from "lucide-react-native";
import { useRef } from "react";
import { Pressable, Text, View } from "react-native";
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

// <input type="date"> speaks "YYYY-MM-DD" in LOCAL time. Avoid toISOString()
// (UTC) — in Asia/Manila it would shift dates back a day before 8 AM.
function toInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromInputValue(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function DateField({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const input = inputRef.current;
    if (!input) return;
    try {
      // Supported in Chrome 99+, Safari 16+, Firefox 101+
      input.showPicker();
    } catch {
      input.focus();
      input.click();
    }
  }

  return (
    <Pressable
      onPress={openPicker}
      className="flex-row items-center gap-1.5 rounded-full px-2 py-1"
    >
      <Calendar size={15} color="#BE185D"/>
      <Text className="text-sm font-medium text-secondary">
        {formatShort(value)}
      </Text>
      {/* Real DOM input, invisible but laid out under the button so the
          browser anchors its calendar popup here. Opened via showPicker(). */}
      <input
        ref={inputRef}
        type="date"
        value={toInputValue(value)}
        max={toInputValue(new Date())}
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          if (e.target.value) onChange(fromInputValue(e.target.value));
        }}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </Pressable>
  );
}

export default function DateRangeSelector({
  range,
  onRangeChange,
}: DateRangeSelectorProps) {
  const activeQuick = matchesQuickRange(range);

  function handleStart(date: Date) {
    const end = date > range.end ? date : range.end;
    onRangeChange({ start: date, end });
  }

  function handleEnd(date: Date) {
    const start = date < range.start ? date : range.start;
    onRangeChange({ start, end: date });
  }

  return (
    <View className="flex-row flex-wrap items-center gap-3">
      <View className="flex-row items-center gap-2 rounded-full border border-black/10 bg-white px-2 py-1.5 shadow-sm">
        <DateField value={range.start} onChange={handleStart} />
        <Text className="text-black/30">–</Text>
        <DateField value={range.end} onChange={handleEnd} />
      </View>

      <View className="flex-row gap-2">
        {TIMEFRAMES.map((tf) => {
          const active = tf === activeQuick;
          return (
            <Pressable
              key={tf}
              onPress={() => onRangeChange(quickRange(tf))}
              className="rounded-full"
            >
              <LinearGradient
                colors={active ? ["#E11D48", "#BE185D"] : ["#FFFFFF", "#FFFFFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: active ? 0 : 1,
                  borderColor: "rgba(253,164,175,0.6)",
                }}
              >
                <Text
                  className={`text-sm font-semibold ${active ? "text-white" : "text-secondary/70"}`}
                >
                  {tf}
                </Text>
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
