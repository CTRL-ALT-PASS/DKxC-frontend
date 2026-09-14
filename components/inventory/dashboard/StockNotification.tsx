import { AlertCircle, CheckCircle2, XCircle, type LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";

export type StockStatus = "sufficient" | "low" | "critical";

interface StockNotificationProps {
  status?: StockStatus;
  message?: string;
}

const STATUS_CONFIG: Record<
  StockStatus,
  { color: string; icon: LucideIcon }
> = {
  sufficient: { color: "#2E7D46", icon: CheckCircle2 },
  low: { color: "#B8860B", icon: AlertCircle },
  critical: { color: "#C0392B", icon: XCircle },
};

export default function StockNotification({
  status = "sufficient",
  message = "Stock levels are sufficient to maintain operation.",
}: StockNotificationProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <View
      style={{ borderColor: config.color }}
      className="flex-row items-center gap-3 rounded-2xl border bg-[#F7F4ED] p-5"
    >
      <Icon size={22} color={config.color} />
      <Text
        style={{ color: config.color }}
        className="flex-1 text-center text-base font-medium"
      >
        {message}
      </Text>
    </View>
  );
}
