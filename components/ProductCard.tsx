import type { Product } from "@/constants/mockData";
import { Image } from "expo-image";
import { ImageSourcePropType, Pressable, Text, View } from "react-native";
import Badge from "./Badge";
import QuantityStepper from "./QuantityStepper";

interface ProductCardProps {
  product: Product;
  quantity?: number;
  addIcon: ImageSourcePropType;
  onIncrease: () => void;
  onDecrease: () => void;
  onOpenSpecs?: () => void;
  cardWidth?: number;
}

export default function ProductCard({
  product,
  quantity = 0,
  addIcon,
  onIncrease,
  onDecrease,
  onOpenSpecs,
  cardWidth = 100,
}: ProductCardProps) {
  const hasSpecs = !!product.specs?.length;

  return (
    <Pressable onPress={hasSpecs ? onOpenSpecs : onIncrease}>
      <View
        style={{ width: cardWidth }}
        className="bg-white rounded-2xl p-3 mr-4 mb-4"
      >
        <Image
          source={product.image}
          style={{
            width: "100%",
            height: Math.round(cardWidth * 0.8),
            borderRadius: 12,
            marginBottom: 8,
          }}
          contentFit="cover"
        />
        <Text className="font-semibold text-slate-800">{product.name}</Text>
        <Text className="text-slate-500 mb-2">₱{product.price.toFixed(2)}</Text>
        <View className="flex-row items-center justify-between">
          <Badge label={product.category} />
          {(hasSpecs || quantity === 0) && (
            <Image
              source={addIcon}
              style={{ width: 15, height: 20 }}
              contentFit="contain"
            />
          )}
        </View>
        {!hasSpecs && quantity > 0 && (
          <QuantityStepper
            quantity={quantity}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
          />
        )}
      </View>
    </Pressable>
  );
}
