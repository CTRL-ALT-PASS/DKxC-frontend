import { Pressable, Text } from "react-native";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "outline" | "danger";
  className?: string;
}

export default function Button({ label, onPress, variant = "primary", className = "" }: ButtonProps) {
  const variants = { primary: "bg-darcy", outline: "bg-green border border-darcy", danger: "bg-warn" };
  const textVariants = {
    primary: "text-white font-semibold",
    outline: "text-darcy font-semibold",
    danger: "text-white font-semibold",
  };
  return (
    <Pressable onPress={onPress} className={`rounded-full py-3 px-6 items-center justify-center ${variants[variant]} ${className}`}>
      <Text className={textVariants[variant]}>{label}</Text>
    </Pressable>
  );
}
