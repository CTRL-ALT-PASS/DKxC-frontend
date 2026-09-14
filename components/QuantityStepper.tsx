import { GestureResponderEvent, Pressable, Text, View } from "react-native";

interface QuantityStepperProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

export default function QuantityStepper({
  quantity,
  onIncrease,
  onDecrease,
}: QuantityStepperProps) {
  // Stops the tap here from also reaching a parent Pressable (e.g. a whole
  // product card wrapped in its own onPress). Needed specifically for web,
  // where nested Pressables bubble clicks; harmless no-op on native.
  const handle = (e: GestureResponderEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <View className="flex-row items-center justify-between mt-2">
      <Pressable
        onPress={(e) => handle(e, onDecrease)}
        className="w-8 h-8 items-center justify-center border border-slate-300 rounded-md"
      >
        <Text className="text-lg">-</Text>
      </Pressable>
      <Text className="font-medium">{quantity}</Text>
      <Pressable
        onPress={(e) => handle(e, onIncrease)}
        className="w-8 h-8 items-center justify-center border border-slate-300 rounded-md"
      >
        <Text className="text-lg">+</Text>
      </Pressable>
    </View>
  );
}
