import type { Product } from "@/constants/mockData";
import { Image } from "expo-image";
import { ImageSourcePropType, Pressable, Text, View } from "react-native";
import QuantityStepper from "./QuantityStepper";
import MarqueeBadge from "./inventory/products/MarqueeBadge";
import { PRODUCT_CARD_WIDTH } from "./shared/ProductGrid";

interface ProductCardProps {
  product: Product;
  quantity?: number;
  addIcon: ImageSourcePropType;
  onIncrease: () => void;
  onDecrease: () => void;
  onOpenSpecs?: () => void;
}

export default function ProductCard({
  product,
  quantity = 0,
  addIcon,
  onIncrease,
  onDecrease,
  onOpenSpecs,
}: ProductCardProps) {
  const hasSpecs = !!product.specs?.length;
  const available = product.available !== false;

  return (
    <Pressable
      onPress={hasSpecs ? onOpenSpecs : onIncrease}
      disabled={!available}
      style={{ opacity: available ? 1 : 0.5 }}
    >
      <View
        style={{ width: PRODUCT_CARD_WIDTH }}
        className="bg-white rounded-2xl p-3"
      >
        <Image
          source={product.image}
          style={{
            width: "100%",
            height: 124,
            borderRadius: 12,
            marginBottom: 8,
          }}
          contentFit="cover"
        />
        <Text className="font-semibold text-slate-800">{product.name}</Text>
        <Text className="text-slate-500 mb-2">₱{product.price.toFixed(2)}</Text>
        <View className="flex-row items-center justify-between">
          <MarqueeBadge label={product.category} />
          {available && (hasSpecs || quantity === 0) && (
            <Image
              source={addIcon}
              style={{ width: 15, height: 20 }}
              contentFit="contain"
            />
          )}
        </View>
        {available && !hasSpecs && quantity > 0 && (
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
