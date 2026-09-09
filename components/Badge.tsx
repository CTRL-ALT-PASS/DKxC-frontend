import { View, Text } from "react-native";

export default function Badge({ label }: { label: string }) {
  return (
    <View className="bg-cream px-2 py-1 rounded-md self-start">
      <Text className="text-xs text-slate-600">{label}</Text>
    </View>
  );
}
