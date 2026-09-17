import { Image } from "expo-image";
import { ImageSourcePropType, Pressable, Text, View } from "react-native";
import { getUnitPrice } from "../constants/mockData";
import type { CartItem } from "../context/CartContext";
import QuantityStepper from "./QuantityStepper";

interface CartItemCardProps {
  entry: CartItem;
  menuIcon: ImageSourcePropType;
  onIncrease: () => void;
  onDecrease: () => void;
  onEdit: () => void;
  cardWidth?: number;
}

// Exported so checkout.tsx can size its "+" card to match exactly, even
// though that card has no image/name/price/stepper of its own to measure.
export function getCartCardHeight(cardWidth: number): number {
  return Math.round(cardWidth * 0.75) + 140;
}

export default function CartItemCard({
  entry,
  menuIcon,
  onIncrease,
  onDecrease,
  onEdit,
  cardWidth = 160,
}: CartItemCardProps) {
  const hasSpecs = !!entry.product.specs?.length;
  const unitPrice = getUnitPrice(entry.product, entry.options);
  const imageHeight = Math.round(cardWidth * 0.75);

  return (
    <View
      style={{ width: cardWidth, height: getCartCardHeight(cardWidth) }}
      className="bg-white rounded-2xl p-3 mr-4 mb-4"
    >
      <View>
        <Image
          source={entry.product.image}
          style={{
            width: "100%",
            height: imageHeight,
            borderRadius: 12,
            marginBottom: 8,
          }}
          contentFit="cover"
        />
        {hasSpecs && (
          <Pressable
            onPress={onEdit}
            className="absolute top-2 right-1 bg-white/90 rounded-full p-1.5"
          >
            <Image
              source={menuIcon}
              style={{ width: 14, height: 14 }}
              contentFit="contain"
            />
          </Pressable>
        )}
      </View>
      <Text className="font-semibold text-slate-800" numberOfLines={1}>
        {entry.product.name}
      </Text>
      <Text className="text-slate-500 mb-1">₱{unitPrice.toFixed(2)}</Text>
      {entry.options && (
        <Text className="text-xs text-slate-500 mb-2" numberOfLines={1}>
          {Object.values(entry.options).join(", ")}
        </Text>
      )}
      {/* Pins the stepper to the bottom regardless of whether the options
          line above exists, so every card's stepper lands at the same spot. */}
      <View style={{ marginTop: "auto" }}>
        <QuantityStepper
          quantity={entry.quantity}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
        />
      </View>
    </View>
  );
}
