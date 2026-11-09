import type { Product } from "@/services/productsApi";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import {
  getDiscountAmount,
  getLineTotal,
  getUnitPrice,
  PROMO_DISCOUNTS,
  type OrderOptions,
} from "../constants/pricing";
import QuantityStepper from "./QuantityStepper";

export interface ProductOptionsResult {
  options: OrderOptions;
  quantity: number;
  discountPercent?: number;
}

interface ProductOptionsModalProps {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: (result: ProductOptionsResult) => void;
  initialOptions?: OrderOptions;
  initialQuantity?: number;
  initialDiscountPercent?: number;
  confirmLabel?: string;
}

function getDefaultSelections(
  product: Product | null,
  initialOptions?: OrderOptions,
): OrderOptions {
  if (initialOptions) return initialOptions;
  if (!product || product.sizes.length === 0) return { addOnIds: [] };
  // Default to the size with no surcharge (e.g. "Iced 12oz"), else the first one
  const base =
    product.sizes.find((s) => parseFloat(s.additional_price) === 0) ??
    product.sizes[0];
  return { sizeId: base.size_id, addOnIds: [] };
}

function Pill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full border ${
        selected ? "bg-primary border-primary" : "bg-white border-slate-300"
      }`}
    >
      <Text className={selected ? "text-white" : "text-slate-700"}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function ProductOptionsModal({
  product,
  visible,
  onClose,
  onConfirm,
  initialOptions,
  initialQuantity = 1,
  initialDiscountPercent,
  confirmLabel = "Confirm",
}: ProductOptionsModalProps) {
  // Lazy initializers run once per mount; the parent remounts via `key`.
  const [selections, setSelections] = useState<OrderOptions>(() =>
    getDefaultSelections(product, initialOptions),
  );
  const [quantity, setQuantity] = useState(initialQuantity);
  const [discountPercent, setDiscountPercent] = useState<number | undefined>(
    initialDiscountPercent,
  );

  if (!product) return null;

  const addOns = product.add_ons.filter((a) => a.enabled);
  const unitPrice = getUnitPrice(product, selections);
  const discountAmount = getDiscountAmount(unitPrice, discountPercent);
  const total = getLineTotal(product, selections, quantity, discountPercent);

  const toggleAddOn = (id: number) =>
    setSelections((prev) => ({
      ...prev,
      addOnIds: prev.addOnIds.includes(id)
        ? prev.addOnIds.filter((x) => x !== id)
        : [...prev.addOnIds, id],
    }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <View className="bg-neutral rounded-3xl p-6 w-full max-w-lg">
          <Pressable
            onPress={onClose}
            hitSlop={8}
            className="absolute top-3 right-4 z-10 p-2"
          >
            <Text className="text-2xl text-slate-700">×</Text>
          </Pressable>

          <Text className="text-2xl font-semibold text-secondary text-center mb-1 mt-2">
            {product.product_name}
          </Text>
          <Text className="text-center text-slate-500 mb-6">
            ₱{unitPrice.toFixed(2)} each
          </Text>

          <ScrollView className="max-h-96">
            {product.sizes.length > 0 && (
              <View className="flex-row items-start justify-between mb-4">
                <Text className="text-slate-700 w-32 mt-2">Size:</Text>
                <View className="flex-row flex-wrap flex-1 justify-end gap-2">
                  {product.sizes.map((size) => {
                    const extra = parseFloat(size.additional_price);
                    return (
                      <Pill
                        key={size.size_id}
                        label={`${size.size_label}${extra ? ` (+₱${extra})` : ""}`}
                        selected={selections.sizeId === size.size_id}
                        onPress={() =>
                          setSelections((prev) => ({
                            ...prev,
                            sizeId: size.size_id,
                          }))
                        }
                      />
                    );
                  })}
                </View>
              </View>
            )}

            {addOns.length > 0 && (
              <View className="flex-row items-start justify-between mb-4">
                <Text className="text-slate-700 w-32 mt-2">Add-ons:</Text>
                <View className="flex-row flex-wrap flex-1 justify-end gap-2">
                  {addOns.map((addOn) => {
                    const price = parseFloat(addOn.price);
                    return (
                      <Pill
                        key={addOn.add_on_id}
                        label={`${addOn.add_on_name}${price ? ` (+₱${price})` : ""}`}
                        selected={selections.addOnIds.includes(addOn.add_on_id)}
                        onPress={() => toggleAddOn(addOn.add_on_id)}
                      />
                    );
                  })}
                </View>
              </View>
            )}

            <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Promo
            </Text>
            <View className="flex-row items-start justify-between mb-1">
              <Text className="text-slate-700 w-32 mt-2">Discount:</Text>
              <View className="flex-row flex-wrap flex-1 justify-end gap-2">
                <Pill
                  label="None"
                  selected={discountPercent === undefined}
                  onPress={() => setDiscountPercent(undefined)}
                />
                {PROMO_DISCOUNTS.map((percent) => (
                  <Pill
                    key={percent}
                    label={`${percent}% off`}
                    selected={discountPercent === percent}
                    onPress={() => setDiscountPercent(percent)}
                  />
                ))}
              </View>
            </View>
            <Text className="text-xs text-slate-400 text-right mb-4">
              {quantity > 1
                ? `Applies to 1 of the ${quantity} items`
                : "Applies to this item"}
            </Text>
          </ScrollView>

          <View className="flex-row items-center justify-between mt-2 mb-3">
            <Text className="text-slate-700 w-32">Quantity:</Text>
            <View className="w-32">
              <QuantityStepper
                className=""
                quantity={quantity}
                onIncrease={() => setQuantity((q) => q + 1)}
                onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
              />
            </View>
          </View>

          {!!discountPercent && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-slate-500">
                {discountPercent}% promo (1 item)
              </Text>
              <Text className="text-sm text-primary font-medium">
                −₱{discountAmount.toFixed(2)}
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => {
              onConfirm({ options: selections, quantity, discountPercent });
              onClose();
            }}
            className="bg-primary rounded-xl py-4 items-center mt-1"
          >
            <Text className="text-white text-lg font-semibold">
              {confirmLabel} — ₱{total.toFixed(2)}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
