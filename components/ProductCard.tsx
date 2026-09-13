import { Image } from "expo-image";
import { ImageSourcePropType, Pressable, Text, View } from "react-native";
import type { Product } from "../constants/mockData";
import Badge from "./Badge";
import QuantityStepper from "./QuantityStepper";

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

  const cardContent = (
    <View className="bg-white rounded-2xl p-3 w-40 mr-4 mb-4">
      <Image
        source={product.image}
        style={{
          width: "100%",
          height: 120,
          borderRadius: 12,
          marginBottom: 8,
        }}
        contentFit="cover"
      />
      <Text className="font-semibold text-slate-800">{product.name}</Text>
      <Text className="text-slate-500 mb-2">₱{product.price.toFixed(2)}</Text>
      <View className="flex-row items-center justify-between">
        <Badge label={product.category} />
        {hasSpecs ? (
          // Whole card is already one big Pressable for spec'd products (see below),
          // so this is just a plain icon, not its own Pressable.
          <Image
            source={addIcon}
            style={{ width: 20, height: 20 }}
            contentFit="contain"
          />
        ) : (
          quantity === 0 && (
            <Pressable onPress={onIncrease}>
              <Image
                source={addIcon}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
              />
            </Pressable>
          )
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
  );

  // Only wrap the whole card in a single Pressable for spec'd products. Simple
  // products keep their original structure (separate inner Pressables for the
  // icon and the stepper) so tapping +/- can't also trigger a card-level handler.
  if (hasSpecs) {
    return <Pressable onPress={onOpenSpecs}>{cardContent}</Pressable>;
  }

  return cardContent;
}
