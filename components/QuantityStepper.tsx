import { View, Text, Pressable } from "react-native";

interface QuantityStepperProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

export default function QuantityStepper({ quantity, onIncrease, onDecrease }: QuantityStepperProps) {
  return (
    <View className="flex-row items-center justify-between mt-2">
      <Pressable onPress={onDecrease} className="w-8 h-8 items-center justify-center border border-slate-300 rounded-md">
        <Text className="text-lg">-</Text>
      </Pressable>
      <Text className="font-medium">{quantity}</Text>
      <Pressable onPress={onIncrease} className="w-8 h-8 items-center justify-center border border-slate-300 rounded-md">
        <Text className="text-lg">+</Text>
      </Pressable>
    </View>
  );
}
