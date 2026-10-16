import { AlertCircle, CheckCircle2, XCircle, type LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";

export type StockStatus = "sufficient" | "low" | "critical";

interface StockNotificationProps {
  status?: StockStatus;
  message?: string;
}

const STATUS_CONFIG: Record<
  StockStatus,
  { color: string; tint: string; icon: LucideIcon; label: string }
> = {
  sufficient: {
    color: "#2E7D46",
    tint: "#E8F3EB",
    icon: CheckCircle2,
    label: "All good",
  },
  low: {
    color: "#B8860B",
    tint: "#FBF1DD",
    icon: AlertCircle,
    label: "Running low",
  },
  critical: {
    color: "#C0392B",
    tint: "#FBE9E7",
    icon: XCircle,
    label: "Needs attention",
  },
};

export default function StockNotification({
  status = "sufficient",
  message = "Stock levels are sufficient to maintain operation.",
}: StockNotificationProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <View className="flex-row items-center gap-4 rounded-3xl bg-white p-5 shadow-sm">
      <View
        style={{ backgroundColor: config.tint }}
        className="h-11 w-11 items-center justify-center rounded-full"
      >
        <Icon size={20} color={config.color} />
      </View>

      <View className="flex-1">
        <Text
          style={{ color: config.color }}
          className="text-xs font-semibold"
        >
          {config.label}
        </Text>
        <Text className="mt-0.5 text-sm leading-5 text-[#141813]">
          {message}
        </Text>
      </View>
    </View>
  );
}
