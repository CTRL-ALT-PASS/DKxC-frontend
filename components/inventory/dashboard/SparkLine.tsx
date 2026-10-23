import { useState } from "react";
import { type LayoutChangeEvent, View } from "react-native";
import Svg, {
    Circle,
    Defs,
    LinearGradient,
    Path,
    Stop,
} from "react-native-svg";

interface SparkLineProps {
  values: number[];
  height?: number;
  lineColor?: string;
  dotColor?: string;
  gradientId: string; // unique per instance so web doesn't share <defs> ids
}

const PAD_X = 6;
const PAD_Y = 8;
const MAX_DOTS = 14;

export default function SparkLine({
  values,
  height = 72,
  lineColor = "#FB7185", // tertiary
  dotColor = "#FFFFFF",
  gradientId,
}: SparkLineProps) {
  const [width, setWidth] = useState(0);

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  const n = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const points =
    width > 0 && n > 1
      ? values.map((v, i) => ({
          x: PAD_X + (i / (n - 1)) * (width - PAD_X * 2),
          y: PAD_Y + (1 - (v - min) / span) * (height - PAD_Y * 2),
        }))
      : [];

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const areaPath = points.length
    ? `${linePath} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`
    : "";

  // Long ranges would crowd the line with dots, so thin them out
  // but always keep the last point.
  const step = Math.max(1, Math.ceil(n / MAX_DOTS));

  return (
    <View onLayout={onLayout} style={{ height }}>
      {points.length > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={lineColor} stopOpacity={0.35} />
              <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          <Path d={areaPath} fill={`url(#${gradientId})`} />
          <Path
            d={linePath}
            stroke={lineColor}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />

          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            if (!isLast && i % step !== 0) return null;
            return (
              <Circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={isLast ? 4.5 : 3}
                fill={dotColor}
                stroke={lineColor}
                strokeWidth={2}
              />
            );
          })}
        </Svg>
      )}
    </View>
  );
}