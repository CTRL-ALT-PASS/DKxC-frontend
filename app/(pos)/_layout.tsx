import darcyMark from "@/assets/icons/darcy-mark.png";
import Sidebar from "@/components/Sidebar";
import { Slot, usePathname, useRouter } from "expo-router";
import { Clock, History, LayoutGrid } from "lucide-react-native";
import { View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    {
      key: "order",
      label: "Order",
      icon: LayoutGrid,
      isActive: pathname === "/menu",
      onPress: () => router.navigate("/menu"),
    },
    {
      key: "pending",
      label: "Pending",
      icon: Clock,
      isActive: pathname === "/pending",
      onPress: () => router.navigate("/pending"),
    },
    {
      key: "history",
      label: "History",
      icon: History,
      isActive: pathname === "/checkout",
      onPress: () => router.navigate("/checkout"),
    },
  ];

  return (
    <View className="flex-1 flex-row">
      <Sidebar navItems={navItems} onLogout={handleLogout} logo={darcyMark} />
      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}
