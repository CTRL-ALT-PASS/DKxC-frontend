import { Pressable, Image, ImageSourcePropType } from "react-native";

interface IconButtonProps {
  icon: ImageSourcePropType;
  size?: number;
  onPress?: () => void;
  active?: boolean;
  className?: string;
}

export default function IconButton({ icon, size = 22, onPress, active = false, className = "" }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`items-center justify-center w-12 h-12 rounded-xl ${active ? "bg-white/20" : ""} ${className}`}
    >
      <Image source={icon} style={{ width: size, height: size }} resizeMode="contain" />
    </Pressable>
  );
}
