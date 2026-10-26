import Header from "@/components/Header";
import { View } from "react-native";

// Placeholder for the pending-orders screen -- intentionally empty for now.
export default function PendingOrdersScreen() {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <View className="flex-1 bg-cream">
      <Header title="Pending Orders" date={today} />
    </View>
  );
}
