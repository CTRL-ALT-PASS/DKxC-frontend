import { View, TextInput, Image, Pressable, ImageSourcePropType, TextInputProps } from "react-native";
import { isValidElement, ReactNode } from "react";

interface TextFieldProps extends TextInputProps {
  icon?: ImageSourcePropType | ReactNode;
  rightIcon?: ImageSourcePropType;
  onRightIconPress?: () => void;
  className?: string;
}

export default function TextField({ icon, rightIcon, onRightIconPress, className = "", ...inputProps }: TextFieldProps) {
  return (
    <View className={`flex-row items-center border-2 bg-green rounded-xl px-4 h-12 ${className}`}>
      {icon && (
        isValidElement(icon) ? (
          <View className="mr-2">{icon}</View>
        ) : (
          <Image
            source={icon as ImageSourcePropType}
            style={{ width: 18, height: 18 }}
            resizeMode="contain"
            className="mr-2"
          />
        )
      )}
      <TextInput className="flex-1 text-slate-800" placeholderTextColor="#94A3B8" {...inputProps} />
      {rightIcon && (
        <Pressable onPress={onRightIconPress}>
          <Image source={rightIcon} style={{ width: 18, height: 18 }} resizeMode="contain" />
        </Pressable>
      )}
    </View>
  );
}