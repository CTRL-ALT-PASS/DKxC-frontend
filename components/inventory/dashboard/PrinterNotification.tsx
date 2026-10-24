import { Printer, Settings } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface PrinterNotificationProps {
  connected?: boolean;
  onSettingsPress?: () => void;
}

const STATUS_CONFIG = {
  connected: {
    color: "#34D399", // success
    labelColor: "#065F46", // success.dark
    icon: Printer,
    label: "Printer ready",
    message: "Connected to Receipt Printer.",
  },
  disconnected: {
    color: "#BE185D", // primary
    labelColor: "#BE185D",
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
    <View className="flex-row items-center gap-4 rounded-3xl border border-tertiary-soft/40 bg-white p-5 shadow-sm">
      <View
        style={{
          backgroundColor: `${config.color}1F`,
          borderColor: `${config.color}80`,
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

      <Pressable
        onPress={onSettingsPress}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Printer settings"
        className="h-9 w-9 items-center justify-center rounded-full active:bg-neutral"
      >
        <Settings size={18} color="#4C051999" />
      </Pressable>
    </View>
  );
}