import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { Eye, EyeOff } from "lucide-react-native";
import Badge from "../../Badge";
import type { Product } from "../../../constants/mockData";

interface InventoryProductCardProps {
  product: Product;
  available?: boolean;
  onPress?: () => void;
}

export default function InventoryProductCard({
  product,
  available = true,
  onPress,
}: InventoryProductCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl p-3 w-40 mr-4 mb-4 border border-slate-200"
    >
      <Image
        source={product.image}
        style={{ width: "100%", height: 124, borderRadius: 12, marginBottom: 8 }}
        contentFit="cover"
      />
      <Text className="font-semibold text-slate-800">{product.name}</Text>

      <View className="flex-row items-center justify-between mt-2">
        <View className="flex-row items-center">
          {available ? (
            <Eye size={14} color="#16a34a" />
          ) : (
            <EyeOff size={14} color="#dc2626" />
          )}
          <Text
            className={`ml-1 text-xs font-medium ${
              available ? "text-green-600" : "text-red-600"
            }`}
          >
            {available ? "Available" : "Unavailable"}
          </Text>
        </View>
        <Badge label={product.category} />
      </View>
    </Pressable>
  );
}