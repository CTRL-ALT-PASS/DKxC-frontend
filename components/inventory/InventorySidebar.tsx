import logo from "@/assets/icons/darcy-mark.png";
import { router, usePathname } from "expo-router";
import { Image, Pressable, View } from "react-native";

import {
  Activity,
  ClipboardList,
  LogOut,
  Package,
  ShoppingBag,
  Users,
  type LucideIcon
} from "lucide-react-native";

interface NavItem {
  key: string;
  route: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  {
    key: "dashboard",
    route: "/(inventory)/dashboard",
    icon: Activity,
  },
  {
    key: "sales",
    route: "/(inventory)/sales",
    icon: ClipboardList,
  },
  {
    key: "products",
    route: "/(inventory)/products",
    icon: ShoppingBag,
  },
  {
    key: "inventory",
    route: "/(inventory)/inventory",
    icon: Package,
  },
  {
    key: "users",
    route: "/(inventory)/users",
    icon: Users,
  },
];

export default function InventorySidebar() {
  const pathname = usePathname();

  return (
    <View className="w-16 bg-darcy items-center py-3 justify-between">

      {/* Logo + Navigation */}
      <View className="items-center w-full">

      <View className="mb-6 items-center justify-center">
        <Image
          source={logo}
          style={{ width: 40, height: 40 }}
          resizeMode="contain"
        />
      </View>

        {/* Navigation */}
        <View className="w-full items-center">
          {navItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.route ||
              pathname.endsWith(item.route.split("/").pop() ?? "");

            return (
              <Pressable
                key={item.key}
                onPress={() => router.push(item.route as any)}
                className="w-12 h-12 items-center justify-center mb-3 relative"
              >
                {/* Active indicator */}
                {isActive && (
                  <View className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />
                )}

                {/* Icon */}
                <View
                  style={{
                    transform: [{ translateX: isActive ? 3 : 0 }],
                  }}
                >
                  <Icon
                    size={24}
                    color="white"
                    strokeWidth={1.8}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Logout */}
      <Pressable
        onPress={() => {
          router.replace("/login")
        }}
        className="w-12 h-12 items-center justify-center"
      >
        <LogOut
          size={24}
          color="white"
          strokeWidth={1.8}
        />
      </Pressable>

    </View>
  );
}