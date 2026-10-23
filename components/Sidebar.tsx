import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from "lucide-react-native";
import { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Pressable,
  Text,
  View,
} from "react-native";

import LogoutConfirmation from "./LogoutConfirmation";

export interface NavItem {
  key: string;
  label: string; // shown when the sidebar is expanded
  icon: LucideIcon;
  onPress: () => void;
  isActive?: boolean;
}

interface SidebarProps {
  navItems: NavItem[];
  onLogout: () => void | Promise<void>;
  logoutIcon?: LucideIcon;
  logo?: ImageSourcePropType;
  title?: string;
  subtitle?: string;
  defaultCollapsed?: boolean;
}

// Color scheme (matches the Stitch frame)
const COLORS = {
  bg: "#33091B", // deep maroon
  active: "#B0285A", // raspberry pill
  text: "#E8CAD6", // muted blush
  textActive: "#FFFFFF",
  divider: "rgba(255,255,255,0.08)",
};

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 232;
const ICON_SIZE = 20;
const ICON_STROKE = 1.8;
const ANIM_MS = 220;

function SidebarItem({
  icon: Icon,
  label,
  onPress,
  isActive,
  collapsed,
  labelOpacity,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  isActive?: boolean;
  collapsed: boolean;
  labelOpacity: Animated.AnimatedInterpolation<number> | Animated.Value;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={{
        height: 44,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        // 16px side padding keeps the icon centered in the 72px collapsed rail
        paddingLeft: 12,
        paddingRight: 12,
        marginBottom: 6,
        backgroundColor: isActive ? COLORS.active : "transparent",
        overflow: "hidden",
      }}
    >
      <Icon
        size={ICON_SIZE}
        color={isActive ? COLORS.textActive : COLORS.text}
        strokeWidth={ICON_STROKE}
      />
      <Animated.View
        style={{ flex: 1, opacity: labelOpacity, marginLeft: 12 }}
        pointerEvents="none"
      >
        <Text
          numberOfLines={1}
          style={{
            color: isActive ? COLORS.textActive : COLORS.text,
            fontSize: 14,
            fontWeight: isActive ? "600" : "400",
          }}
        >
          {label}
        </Text>
      </Animated.View>
      {isActive && !collapsed && (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: "white",
          }}
        />
      )}
    </Pressable>
  );
}

export default function Sidebar({
  navItems,
  onLogout,
  logoutIcon = LogOut,
  logo,
  title = "DARCY'S",
  subtitle = "KITCHEN x CAFÉ",
  defaultCollapsed = false,
}: SidebarProps) {
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  // 0 = collapsed, 1 = expanded
  const progress = useRef(new Animated.Value(defaultCollapsed ? 0 : 1)).current;

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    Animated.timing(progress, {
      toValue: next ? 0 : 1,
      duration: ANIM_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width can't use the native driver
    }).start();
  };

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [COLLAPSED_WIDTH, EXPANDED_WIDTH],
  });
  // Labels only fade in during the last half so they don't wrap mid-animation
  const labelOpacity = progress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
  });

  const ToggleIcon = collapsed ? ChevronRight : ChevronLeft;

  return (
    <>
      <Animated.View
        style={{
          width,
          backgroundColor: COLORS.bg,
          paddingVertical: 16,
          paddingHorizontal: 12,
          justifyContent: "space-between",
          overflow: "hidden",
        }}
      >
        <View>
          {/* Header: logo + brand + collapse trigger */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              height: 44,
              marginBottom: 8,
            }}
          >
            {logo && (
              <Image
                source={logo}
                style={{ width: 40, height: 40, borderRadius: 10 }}
                resizeMode="contain"
              />
            )}
            <Animated.View
              style={{ flex: 1, marginLeft: 10, opacity: labelOpacity }}
              pointerEvents="none"
            >
              <Text
                numberOfLines={1}
                style={{ color: "white", fontWeight: "700", fontSize: 13 }}
              >
                {title}
              </Text>
              <Text
                numberOfLines={1}
                style={{ color: COLORS.text, fontSize: 10, opacity: 0.8 }}
              >
                {subtitle}
              </Text>
            </Animated.View>
            {!collapsed && (
              <Pressable
                onPress={toggle}
                hitSlop={10}
                accessibilityLabel="Collapse sidebar"
              >
                <ToggleIcon size={18} color={COLORS.text} />
              </Pressable>
            )}
          </View>

          {/* When collapsed, the trigger sits under the logo */}
          {collapsed && (
            <Pressable
              onPress={toggle}
              accessibilityLabel="Expand sidebar"
              style={{
                height: 32,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <ToggleIcon size={18} color={COLORS.text} />
            </Pressable>
          )}

          <View
            style={{
              height: 1,
              backgroundColor: COLORS.divider,
              marginBottom: 12,
            }}
          />

          {navItems.map((item) => (
            <SidebarItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              onPress={item.onPress}
              isActive={item.isActive}
              collapsed={collapsed}
              labelOpacity={labelOpacity}
            />
          ))}
        </View>

        <View>
          <View
            style={{
              height: 1,
              backgroundColor: COLORS.divider,
              marginBottom: 12,
            }}
          />
          {/* Open confirmation instead of logging out immediately */}
          <SidebarItem
            icon={logoutIcon}
            label="Logout"
            onPress={() => setShowLogoutConfirmation(true)}
            collapsed={collapsed}
            labelOpacity={labelOpacity}
          />
        </View>
      </Animated.View>

      <LogoutConfirmation
        visible={showLogoutConfirmation}
        onCancel={() => setShowLogoutConfirmation(false)}
        onConfirm={onLogout}
      />
    </>
  );
}
