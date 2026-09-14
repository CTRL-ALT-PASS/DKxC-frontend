import { Slot } from "expo-router";
import { View } from "react-native";
import InventorySidebar from "@/components/inventory/InventorySidebar";

export default function TabsLayout() {
  return (
    <View className="flex-1 flex-row">
      <InventorySidebar />

      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}