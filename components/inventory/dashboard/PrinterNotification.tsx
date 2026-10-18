import { Printer, Settings, type LucideIcon } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface PrinterNotificationProps {
  connected?: boolean;
  onSettingsPress?: () => void;
}

const STATUS_CONFIG: Record<
  "connected" | "disconnected",
  {
    color: string;
    tint: string;
    icon: LucideIcon;
    label: string;
    message: string;
  }
> = {
  connected: {
    color: "#2E7D46",
    tint: "#E8F3EB",
    icon: Printer,
    label: "Printer ready",
    message: "Connected to Receipt Printer.",
  },
  disconnected: {
    color: "#C0392B",
    tint: "#FBE9E7",
    icon: Printer,
    label: "Printer offline",
    message: "Not connected to Receipt Printer.",
  },
};

export default function PrinterNotification({
  connected = false,
  onSettingsPress,
}: PrinterNotificationProps) {
  const config = STATUS_CONFIG[connected ? "connected" : "disconnected"];
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
        <Text style={{ color: config.color }} className="text-xs font-semibold">
          {config.label}
        </Text>
        <Text className="mt-0.5 text-sm leading-5 text-[#141813]">
          {config.message}
        </Text>
      </View>

      <Pressable
        onPress={onSettingsPress}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Printer settings"
        className="h-9 w-9 items-center justify-center rounded-full active:bg-[#F1EEE6]"
      >
        <Settings size={18} color="#6B6F68" />
      </Pressable>
    </View>
  );
}
