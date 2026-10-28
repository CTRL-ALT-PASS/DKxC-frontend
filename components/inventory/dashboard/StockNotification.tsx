import type { DashboardInventory, StockTier } from "@/services/dashboardApi";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

export type StockStatus = "sufficient" | "low" | "critical";

interface StockNotificationProps {
  // Pass undefined while the dashboard is still loading.
  inventory?: DashboardInventory;
  onPress?: () => void;
}

interface View_ {
  color: string; // icon + circle border/tint
  labelColor: string; // darker, for text on the white card
  icon: LucideIcon;
  label: string;
  message: string;
}

const STATUS_CONFIG: Record<StockStatus, Omit<View_, "message">> = {
  sufficient: {
    color: "#34D399", // success
    labelColor: "#065F46", // success.dark
    icon: CheckCircle2,
    label: "All good",
  },
  low: {
    color: "#B8860B", // no token yet
    labelColor: "#B8860B",
    icon: AlertCircle,
    label: "Running low",
  },
  critical: {
    color: "#DC2626", // warn
    labelColor: "#DC2626",
    icon: XCircle,
    label: "Needs attention",
  },
};

const LOADING_VIEW: View_ = {
  color: "#9CA3AF",
  labelColor: "#6B7280",
  icon: AlertCircle,
  label: "Checking stock",
  message: "Loading inventory levels…",
};

// "Kiwi syrup", "Oat milk and Capers", "Oat milk, Capers +2 more"
function nameList(tier: StockTier, show = 2) {
  const names = tier.items.slice(0, show).map((i) => i.item_name);
  const rest = tier.count - names.length;
  if (rest > 0) return `${names.join(", ")} +${rest} more`;
  return names.length === 2 ? `${names[0]} and ${names[1]}` : names.join("");
}

const verb = (tier: StockTier) => (tier.count === 1 ? "is" : "are");

function describe(inv: DashboardInventory): View_ {
  // Critical = out of stock or at/below reorder level.
  if (inv.critical_count > 0) {
    const parts: string[] = [];
    if (inv.out_of_stock.count > 0)
      parts.push(
        `${nameList(inv.out_of_stock)} ${verb(inv.out_of_stock)} out of stock.`,
      );
    if (inv.below_reorder.count > 0)
      parts.push(
        `${nameList(inv.below_reorder)} ${verb(inv.below_reorder)} below reorder level.`,
      );
    return { ...STATUS_CONFIG.critical, message: parts.join(" ") };
  }

  if (inv.nearing_reorder.count > 0) {
    return {
      ...STATUS_CONFIG.low,
      message: `${nameList(inv.nearing_reorder)} ${verb(inv.nearing_reorder)} nearing reorder level.`,
    };
  }

  return {
    ...STATUS_CONFIG.sufficient,
    message: "Stock levels are sufficient to maintain operation.",
  };
}

export default function StockNotification({
  inventory,
  onPress,
}: StockNotificationProps) {
  const config = inventory ? describe(inventory) : LOADING_VIEW;
  const Icon = config.icon;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center gap-4 rounded-3xl border border-tertiary-soft/40 bg-white p-5 shadow-sm"
    >
      <View
        style={{
          backgroundColor: `${config.color}1F`, // ~12% fill
          borderColor: `${config.color}80`, // ~50% border
          borderWidth: 1.5,
        }}
        className="h-11 w-11 items-center justify-center rounded-2xl"
      >
        <Icon size={20} color={config.color} />
      </View>

      <View className="flex-1">
        <Text
          style={{ color: config.labelColor }}
          className="text-xs font-bold uppercase tracking-wider"
        >
          {config.label}
        </Text>
        <Text className="mt-0.5 text-sm leading-5 text-secondary/80">
          {config.message}
        </Text>
      </View>
    </Pressable>
  );
}
