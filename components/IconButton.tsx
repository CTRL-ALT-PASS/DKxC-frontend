import { Image, ImageSourcePropType, Pressable } from "react-native";

interface IconButtonProps {
  icon: ImageSourcePropType;
  size?: number;
  onPress?: () => void;
  className?: string;
}

export default function IconButton({
  icon,
  size = 22,
  onPress,
  className = "",
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`items-center justify-center w-12 h-12 rounded-xl ${className}`}
    >
      <Image
        source={icon}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Pressable>
  );
}
