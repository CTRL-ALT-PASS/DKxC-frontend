import bagIcon from "@/assets/icons/bag.png";
import darcyMark from "@/assets/icons/darcy-mark.png";
import gridIcon from "@/assets/icons/grid.png";
import logoutIcon from "@/assets/icons/logout.png";
import Sidebar from "@/components/Sidebar";
import { Slot, usePathname, useRouter } from "expo-router";
import { View } from "react-native";

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      key: "order",
      icon: gridIcon,
      isActive: pathname === "/",
      onPress: () => router.navigate("/"),
    },
    {
      key: "checkout",
      icon: bagIcon,
      isActive: pathname === "/checkout",
      onPress: () => router.navigate("/checkout"),
    },
  ];

  return (
    <View className="flex-1 flex-row">
      <Sidebar
        navItems={navItems}
        logoutIcon={logoutIcon}
        logo={darcyMark}
        onLogout={() => router.replace("/login")}
      />
      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}
