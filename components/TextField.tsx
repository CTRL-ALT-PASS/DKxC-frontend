import { View, TextInput, Image, Pressable, ImageSourcePropType, TextInputProps } from "react-native";

interface TextFieldProps extends TextInputProps {
  icon?: ImageSourcePropType;
  rightIcon?: ImageSourcePropType;
  onRightIconPress?: () => void;
  className?: string;
}

export default function TextField({ icon, rightIcon, onRightIconPress, className = "", ...inputProps }: TextFieldProps) {
  return (
    <View className={`flex-row items-center border-2 bg-green rounded-xl px-4 h-12 ${className}`}>
      {icon && <Image source={icon} style={{ width: 18, height: 18 }} resizeMode="contain" className="mr-2" />}
      <TextInput className="flex-1 text-slate-800" placeholderTextColor="#94A3B8" {...inputProps} />
      {rightIcon && (
        <Pressable onPress={onRightIconPress}>
          <Image source={rightIcon} style={{ width: 18, height: 18 }} resizeMode="contain" />
        </Pressable>
      )}
    </View>
  );
}
