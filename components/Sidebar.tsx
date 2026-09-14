import { Image, ImageSourcePropType, View } from "react-native";
import IconButton from "./IconButton";

interface NavItem {
  key: string;
  icon: ImageSourcePropType;
  onPress: () => void;
  isActive?: boolean;
}

interface SidebarProps {
  navItems: NavItem[];
  logoutIcon: ImageSourcePropType;
  onLogout: () => void;
  logo?: ImageSourcePropType;
}

export default function Sidebar({
  navItems,
  logoutIcon,
  onLogout,
  logo,
}: SidebarProps) {
  return (
    <View className="w-16 bg-darcy items-center py-6 justify-between">
      <View className="items-center w-full">
        {logo && (
          <View className="mb-6">
            <Image
              source={logo}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </View>
        )}
        {navItems.map((item) => (
          <View key={item.key} className="relative w-full items-center mb-4">
            {item.isActive && (
              <View className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full" />
            )}
            <IconButton icon={item.icon} onPress={item.onPress} />
          </View>
        ))}
      </View>
      <IconButton icon={logoutIcon} onPress={onLogout} />
    </View>
  );
}
