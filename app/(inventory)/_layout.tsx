import { Slot, usePathname, useRouter } from "expo-router";
import { View } from "react-native";
import Sidebar from "@/components/Sidebar";
import gridIcon from "@/assets/icons/grid.png";
import inventoryIcon from "@/assets/icons/inventory.png";
import logoutIcon from "@/assets/icons/logout.png";

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname(); // "/" or "/inventory"

  // "order" and "cart" both live on the Order screen (the summary panel is
  // always visible there, matching the reference design) so they share the
  // same isActive check. If you'd rather the bag icon open a separate,
  // full-screen checkout/review page instead, say the word and I'll split
  // it into its own route.
  const navItems = [
    { key: "order", icon: gridIcon, isActive: pathname === "/", onPress: () => router.navigate("/") },
    { key: "inventory", icon: inventoryIcon, isActive: pathname === "/inventory", onPress: () => router.navigate("/inventory") },
  ];

  return (
    <View className="flex-1 flex-row">
      <Sidebar navItems={navItems} logoutIcon={logoutIcon} onLogout={() => router.replace("/login")} />
      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}
