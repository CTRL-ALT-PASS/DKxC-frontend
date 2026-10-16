import { LogOut, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { Image, ImageSourcePropType, Pressable, View } from "react-native";

import LogoutConfirmation from "./LogoutConfirmation";

export interface NavItem {
  key: string;
  icon: LucideIcon;
  onPress: () => void;
  isActive?: boolean;
}

interface SidebarProps {
  navItems: NavItem[];
  onLogout: () => void | Promise<void>;
  logoutIcon?: LucideIcon;
  logo?: ImageSourcePropType;
}

const ICON_SIZE = 24;
const ICON_STROKE = 1.8;

function SidebarButton({
  icon: Icon,
  onPress,
}: {
  icon: LucideIcon;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="w-12 h-12 items-center justify-center rounded-xl"
    >
      <Icon size={ICON_SIZE} color="white" strokeWidth={ICON_STROKE} />
    </Pressable>
  );
}

export default function Sidebar({
  navItems,
  onLogout,
  logoutIcon = LogOut,
  logo,
}: SidebarProps) {
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  return (
    <>
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
              <SidebarButton icon={item.icon} onPress={item.onPress} />
            </View>
          ))}
        </View>

        {/* Open confirmation instead of logging out immediately */}
        <SidebarButton
          icon={logoutIcon}
          onPress={() => setShowLogoutConfirmation(true)}
        />
      </View>

      <LogoutConfirmation
        visible={showLogoutConfirmation}
        onCancel={() => setShowLogoutConfirmation(false)}
        onConfirm={onLogout}
      />
    </>
  );
}
