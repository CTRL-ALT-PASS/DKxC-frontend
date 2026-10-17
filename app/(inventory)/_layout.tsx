import darcyMark from "@/assets/icons/darcy-mark.png";
import Header from "@/components/Header";
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
  { key: "dashboard", icon: Activity, title: "Dashboard" },
  { key: "sales", icon: ClipboardList, title: "Sales" },
  {
    key: "products",
    icon: ShoppingBag,
    title: "Products",
    alsoMatches: ["product-form"], // add/edit screen belongs to Products
  },
  { key: "inventory", icon: Package, title: "Inventory" },
  { key: "users", icon: Users, title: "Users" },
];

const matchesSection = (item: (typeof NAV)[number], pathname: string) =>
  [item.key, ...(("alsoMatches" in item && item.alsoMatches) || [])].some(
    (seg) => pathname === `/${seg}` || pathname.startsWith(`/${seg}/`),
  );

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

  const navItems = NAV.map((item) => ({
    key: item.key,
    icon: item.icon,
    isActive: matchesSection(item, pathname),
    onPress: () => router.navigate(`/(inventory)/${item.key}` as any),
  }));

  const activeTitle =
    NAV.find((item) => matchesSection(item, pathname))?.title ?? "";

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <View className="flex-1 flex-row">
      <Sidebar navItems={navItems} onLogout={handleLogout} logo={darcyMark} />
      <View className="flex-1">
        <Header title={activeTitle} date={today} />
        <Slot />
      </View>
    </View>
  );
}
