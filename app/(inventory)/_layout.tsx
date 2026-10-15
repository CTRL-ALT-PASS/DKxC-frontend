import darcyMark from "@/assets/icons/darcy-mark.png";
import Sidebar from "@/components/Sidebar";
import { Slot, usePathname, useRouter } from "expo-router";
import {
  Activity,
  ClipboardList,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react-native";
import { View } from "react-native";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { key: "dashboard", icon: Activity },
  { key: "sales", icon: ClipboardList },
  { key: "products", icon: ShoppingBag },
  { key: "inventory", icon: Package },
  { key: "users", icon: Users },
];

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

  const navItems = NAV.map(({ key, icon }) => {
    const path = `/${key}`;
    return {
      key,
      icon,
      // usePathname() omits group segments like (inventory), so compare to "/dashboard" etc.
      isActive: pathname === path || pathname.startsWith(`${path}/`),
      onPress: () => router.navigate(`/(inventory)${path}` as any),
    };
  });

  return (
    <View className="flex-1 flex-row">
      <Sidebar navItems={navItems} onLogout={handleLogout} logo={darcyMark} />
      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}
