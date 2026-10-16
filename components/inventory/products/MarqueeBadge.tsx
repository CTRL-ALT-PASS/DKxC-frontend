// components/MarqueeBadge.tsx
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
    Easing,
    cancelAnimation,
    scrollTo,
    useAnimatedRef,
    useDerivedValue,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

interface MarqueeBadgeProps {
  label: string;
  width?: number; // total badge width, including horizontal padding
}

const H_PADDING = 8;
const MS_PER_PX = 40; // scroll speed: higher = slower
const PAUSE_MS = 1000;

export default function MarqueeBadge({ label, width = 56 }: MarqueeBadgeProps) {
  const ref = useAnimatedRef<Animated.ScrollView>();
  const reduceMotion = useReducedMotion();
  const offset = useSharedValue(0);
  const [contentWidth, setContentWidth] = useState(0);

  const visibleWidth = width - H_PADDING * 2;
  const overflow = Math.max(0, contentWidth - visibleWidth);

  useEffect(() => {
    cancelAnimation(offset);
    offset.value = 0;

    if (overflow > 0 && !reduceMotion) {
      const duration = overflow * MS_PER_PX;
      offset.value = withRepeat(
        withSequence(
          withDelay(
            PAUSE_MS,
            withTiming(overflow, { duration, easing: Easing.linear }),
          ),
          withDelay(
            PAUSE_MS,
            withTiming(0, { duration, easing: Easing.linear }),
          ),
        ),
        -1,
      );
    }
    return () => cancelAnimation(offset);
  }, [overflow, reduceMotion]);

  // Runs on the UI thread, so no JS-thread work per frame
  useDerivedValue(() => {
    scrollTo(ref, offset.value, 0, false);
  });

  return (
    <View
      className="bg-slate-100 rounded-full py-0.5"
      style={{ width, paddingHorizontal: H_PADDING, flexShrink: 0 }}
    >
      <Animated.ScrollView
        ref={ref}
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ width: visibleWidth, flexGrow: 0 }}
        contentContainerStyle={{
          minWidth: visibleWidth,
          justifyContent: "center",
        }}
        onContentSizeChange={(w) => setContentWidth(w)}
      >
        <Text numberOfLines={1} className="text-xs font-medium text-slate-600">
          {label}
        </Text>
      </Animated.ScrollView>
    </View>
  );
}
