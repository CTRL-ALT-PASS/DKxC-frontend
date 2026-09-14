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

  return (
    <View
      style={{ width: cardWidth }}
      className="bg-white rounded-2xl p-3 mr-4 mb-4"
    >
      <View>
        <Image
          source={entry.product.image}
          style={{
            width: "100%",
            height: Math.round(cardWidth * 0.75),
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
      <Text className="font-semibold text-slate-800">{entry.product.name}</Text>
      <Text className="text-slate-500 mb-1">₱{unitPrice.toFixed(2)}</Text>
      {entry.options && (
        <Text className="text-xs text-slate-500 mb-2" numberOfLines={1}>
          {Object.values(entry.options).join(", ")}
        </Text>
      )}
      <QuantityStepper
        quantity={entry.quantity}
        onIncrease={onIncrease}
        onDecrease={onDecrease}
      />
    </View>
  );
}
