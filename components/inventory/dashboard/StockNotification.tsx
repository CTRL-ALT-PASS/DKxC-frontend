import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export type StockStatus = "sufficient" | "low" | "critical";

interface StockNotificationProps {
  status?: StockStatus;
  message?: string;
}

const STATUS_CONFIG: Record<
  StockStatus,
  {
    color: string; // icon + circle border/tint
    labelColor: string; // darker, for text on the white card
    icon: LucideIcon;
    label: string;
    message: string;
  }
> = {
  sufficient: {
    color: "#34D399", // success
    labelColor: "#065F46", // success.dark
    icon: CheckCircle2,
    label: "All good",
    message: "Stock levels are sufficient to maintain operation.",
  },
  low: {
    color: "#B8860B", // no token yet
    labelColor: "#B8860B",
    icon: AlertCircle,
    label: "Running low",
    message: "Some items are running low on stock.",
  },
  critical: {
    color: "#DC2626", // warn
    labelColor: "#DC2626",
    icon: XCircle,
    label: "Needs attention",
    message: "Some items are out of stock or nearly depleted.",
  },
};

// DEV: order the icon tap cycles through. Remove with the state below.
const DEV_CYCLE: StockStatus[] = ["sufficient", "low", "critical"];

export default function StockNotification({
  status: initialStatus = "sufficient",
  message,
}: StockNotificationProps) {
  // DEV: local state so the icon can be tapped to preview each state
  // without reading real inventory. Replace with the `status` prop when
  // the inventory check exists.
  const [status, setStatus] = useState<StockStatus>(initialStatus);

  function devCycleStatus() {
    setStatus((current) => {
      const next = (DEV_CYCLE.indexOf(current) + 1) % DEV_CYCLE.length;
      return DEV_CYCLE[next];
    });
  }

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <View className="flex-row items-center gap-4 rounded-3xl border border-tertiary-soft/40 bg-white p-5 shadow-sm">
      {/* DEV: Pressable wrapper is temporary; revert to a plain View later. */}
      <Pressable
        onPress={devCycleStatus}
        style={{
          backgroundColor: `${config.color}1F`, // ~12% fill
          borderColor: `${config.color}80`, // ~50% border
          borderWidth: 1.5,
        }}
        className="h-11 w-11 items-center justify-center rounded-2xl"
      >
        <Icon size={20} color={config.color} />
      </Pressable>

      <View className="flex-1">
        <Text
          style={{ color: config.labelColor }}
          className="text-xs font-bold uppercase tracking-wider"
        >
          {config.label}
        </Text>
        <Text className="mt-0.5 text-sm leading-5 text-secondary/80">
          {message ?? config.message}
        </Text>
      </View>
    </View>
  );
}