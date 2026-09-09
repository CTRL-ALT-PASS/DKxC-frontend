import { View, ImageSourcePropType } from "react-native";
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
}

export default function Sidebar({ navItems, logoutIcon, onLogout }: SidebarProps) {
  return (
    <View className="w-16 bg-darcy items-center py-6 justify-between">
      <View className="items-center">
        {navItems.map((item) => (
          <IconButton key={item.key} icon={item.icon} active={item.isActive} onPress={item.onPress} className="mb-4" />
        ))}
      </View>
      <IconButton icon={logoutIcon} onPress={onLogout} />
    </View>
  );
}
