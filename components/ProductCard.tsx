import { View, Text, Pressable, ImageSourcePropType } from "react-native";
import { Image } from "expo-image";
import Badge from "./Badge";
import QuantityStepper from "./QuantityStepper";
import type { Product } from "../constants/mockData";

interface ProductCardProps {
  product: Product;
  quantity?: number;
  addIcon: ImageSourcePropType;
  onIncrease: () => void;
  onDecrease: () => void;
}

export default function ProductCard({ product, quantity = 0, addIcon, onIncrease, onDecrease }: ProductCardProps) {
  return (
    <View className="bg-white rounded-2xl p-3 w-40 mr-4 mb-4">
      <Image
        source={product.image}
        style={{ width: "100%", height: 124, borderRadius: 12, marginBottom: 8 }}
        contentFit="cover"
      />
      <Text className="font-semibold text-slate-800">{product.name}</Text>
      <Text className="text-slate-500 mb-2">₱{product.price.toFixed(2)}</Text>
      <View className="flex-row items-center justify-between">
        <Badge label={product.category} />
        {quantity === 0 && (
          <Pressable onPress={onIncrease}>
            <Image source={addIcon} style={{ width: 20, height: 20 }} contentFit="contain" />
          </Pressable>
        )}
      </View>
      {quantity > 0 && <QuantityStepper quantity={quantity} onIncrease={onIncrease} onDecrease={onDecrease} />}
    </View>
  );
}
