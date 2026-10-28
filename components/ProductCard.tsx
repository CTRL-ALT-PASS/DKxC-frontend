import type { Product } from "@/services/productsApi";
import { Image } from "expo-image";
import { ImageSourcePropType, Pressable, Text, View } from "react-native";
import QuantityStepper from "./QuantityStepper";
import MarqueeBadge from "./inventory/products/MarqueeBadge";
import { PRODUCT_CARD_WIDTH } from "./shared/ProductGrid";

interface ProductCardProps {
  product: Product;
  categoryName: string;
  quantity?: number;
  addIcon: ImageSourcePropType;
  onIncrease: () => void;
  onDecrease: () => void;
  onOpenSpecs?: () => void;
}

export default function ProductCard({
  product,
  categoryName,
  quantity = 0,
  addIcon,
  onIncrease,
  onDecrease,
  onOpenSpecs,
}: ProductCardProps) {
  // Anything with sizes or add-ons needs the options modal
  const hasSpecs = product.sizes.length > 0 || product.add_ons.length > 0;
  const available = product.is_available && product.product_status === "Active";
  const price = parseFloat(product.selling_price);

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
        {/* The API has no image field yet, so show an initial placeholder */}
        <View
          style={{
            width: "100%",
            height: 124,
            borderRadius: 12,
            marginBottom: 8,
          }}
          className="bg-slate-100 items-center justify-center"
        >
          <Text className="text-4xl font-bold text-slate-300">
            {product.product_name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text className="font-semibold text-slate-800">
          {product.product_name}
        </Text>
        <Text className="text-slate-500 mb-2">
          {product.sizes.length > 0 ? "from " : ""}₱{price.toFixed(2)}
        </Text>

        <View className="flex-row items-center justify-between">
          <MarqueeBadge label={categoryName} />
          {available && (hasSpecs || quantity === 0) && (
            <Image
              source={addIcon}
              style={{ width: 15, height: 20 }}
              contentFit="contain"
            />
          )}
        </View>

        {!available && (
          <Text className="text-xs text-warn mt-2">Unavailable</Text>
        )}

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
