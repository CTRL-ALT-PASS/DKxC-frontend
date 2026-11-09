import { Image } from "expo-image";
import { Eye, EyeOff, ImageIcon } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import MarqueeBadge from "./MarqueeBadge";

/**
 * The slice of an API product this card needs. The `Product` type from
 * services/productsApi satisfies it as-is, so pass those objects straight in.
 */
export interface InventoryCardProduct {
  product_name: string;
  /** Full public URL of the photo (image_path is only the storage key). null = no photo yet. */
  image_url: string | null;
  is_available?: boolean;
}

interface InventoryProductCardProps {
  product: InventoryCardProduct;
  /** Category name. The API product only has category_id, so the parent looks the name up. */
  categoryName?: string;
  /** Overrides product.is_available */
  available?: boolean;
  onPress?: () => void;
}

export default function InventoryProductCard({
  product,
  categoryName,
  available = product.is_available ?? true,
  onPress,
}: InventoryProductCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl p-3 w-40 border border-slate-200"
    >
      {product.image_url ? (
        <Image
          source={{ uri: product.image_url }}
          style={{
            width: "100%",
            height: 124,
            borderRadius: 12,
            marginBottom: 8,
          }}
          contentFit="cover"
        />
      ) : (
        <View className="w-full h-32 items-center justify-center bg-slate-100">
          <ImageIcon size={28} color="#94a3b8" />
        </View>
      )}

      <Text className="font-semibold text-slate-800">
        {product.product_name}
      </Text>

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
        {categoryName ? <MarqueeBadge label={categoryName} /> : null}
      </View>
    </Pressable>
  );
}