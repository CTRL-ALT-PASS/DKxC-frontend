import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

// Swap these for your theme tokens if StatsCards uses named colors.
const MAROON = "#4a0d27";
const ACCENT = "#b3125f";

type Props = {
  totalItems: number;
  totalValue: number;
  onAuditLogPress?: () => void;
  onValuationReportPress?: () => void;
};

const formatPeso = (n: number) =>
  "₱" +
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

type CardProps = {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  children: React.ReactNode;
  footer: React.ReactNode;
  linkLabel: string;
  onLinkPress?: () => void;
};

function Card({
  label,
  icon,
  children,
  footer,
  linkLabel,
  onLinkPress,
}: CardProps) {
  return (
    <View className="flex-1 rounded-2xl border border-[#f3dde4] bg-white p-5">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-xs uppercase tracking-wide text-[#3d3a3b]">
            {label}
          </Text>
          {children}
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#fbe9ee]">
          <Feather name={icon} size={18} color={ACCENT} />
        </View>
      </View>

      <View className="mt-4 flex-row items-center justify-between border-t border-[#f3dde4] pt-3">
        <View className="flex-row items-center gap-1.5">{footer}</View>
        <Pressable onPress={onLinkPress} hitSlop={8}>
          <Text className="text-xs font-medium" style={{ color: ACCENT }}>
            {linkLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function InventoryStatCards({
  totalItems,
  totalValue,
  onAuditLogPress,
  onValuationReportPress,
}: Props) {
  return (
    <View className="flex-row gap-4">
      <Card
        label="Total raw stock items"
        icon="box"
        linkLabel="Audit log"
        onLinkPress={onAuditLogPress}
        footer={
          <>
            <View className="h-2 w-2 rounded-full bg-emerald-500" />
            <Text className="text-xs text-[#5c5759]">
              All categories monitored
            </Text>
          </>
        }
      >
        <View className="mt-2 flex-row items-baseline gap-1.5">
          <Text className="text-4xl font-bold" style={{ color: MAROON }}>
            {totalItems}
          </Text>
          <Text className="text-base text-[#8a8486]">skus</Text>
        </View>
      </Card>

      <Card
        label="Total raw inventory value"
        icon="dollar-sign"
        linkLabel="Valuation report"
        onLinkPress={onValuationReportPress}
        footer={
          <Text className="text-xs font-medium text-emerald-600">
            ▲ Live valuation
          </Text>
        }
      >
        <Text
          className="mt-2 text-4xl font-bold"
          style={{ color: MAROON }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatPeso(totalValue)}
        </Text>
      </Card>
    </View>
  );
}
