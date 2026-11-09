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
    <View style={{ width: ICON_SIZE, height: ICON_SIZE, flexShrink: 0 }}>
      <Icon
        size={ICON_SIZE}
        color={isActive ? COLORS.textActive : COLORS.text}
        strokeWidth={ICON_STROKE}
      />
    </View>
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
      {/* Outer wrapper is 12px wider than the visible sidebar so the toggle
          circle sits inside its bounds (needed for taps on Android). */}
      <Animated.View
        pointerEvents="box-none"
        style={{
          width: Animated.add(width, 12),
          marginRight: -12, // gutter overlaps the content area, no layout shift
          paddingRight: 12,
          zIndex: 10,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.bg,
            paddingVertical: 16,
            paddingHorizontal: 12,
            justifyContent: "space-between",
            overflow: "hidden",
          }}
        >
          <View>
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
                  // marginLeft: 2 centers the logo over the nav icons
                  style={{ width: 40, height: 40, borderRadius: 10, marginLeft: 2 }}
                  resizeMode="contain"
                />
              )}
              <Animated.View
                style={{ flex: 1, marginLeft: 10, opacity: labelOpacity }}
                pointerEvents="none"
              >
                <Text numberOfLines={1} style={{ color: "white", fontWeight: "700", fontSize: 13 }}>
                  {title}
                </Text>
                <Text numberOfLines={1} style={{ color: COLORS.text, fontSize: 10, opacity: 0.8 }}>
                  {subtitle}
                </Text>
              </Animated.View>
            </View>

            <View style={{ height: 1, backgroundColor: COLORS.divider, marginBottom: 12 }} />

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
            <View style={{ height: 1, backgroundColor: COLORS.divider, marginBottom: 12 }} />
            <SidebarItem
              icon={logoutIcon}
              label="Logout"
              onPress={() => setShowLogoutConfirmation(true)}
              collapsed={collapsed}
              labelOpacity={labelOpacity}
            />
          </View>
        </View>

        {/* Toggle: circle centered on the sidebar's right edge, in line with the logo.
            Logo center = 16 (padding) + 22 (half the 44px header row) = 38,
            so top = 38 - 12 (half of the 24px circle) = 26. */}
        <Pressable
          onPress={toggle}
          hitSlop={8}
          accessibilityLabel={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            position: "absolute",
            right: 0,
            top: 26,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: COLORS.active, // was white
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1.5,
            borderColor: "white", // thin white ring so it stays visible against the maroon sidebar
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
            elevation: 3,
          }}
        >
          <ToggleIcon size={14} color={COLORS.textActive} strokeWidth={2.2} />
        </Pressable>
      </Animated.View>

      <LogoutConfirmation
        visible={showLogoutConfirmation}
        onCancel={() => setShowLogoutConfirmation(false)}
        onConfirm={onLogout}
      />
    </>
  );
}
