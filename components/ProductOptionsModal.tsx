import { getUnitPrice, type Product } from "@/constants/mockData";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import {
  getDiscountAmount,
  getLineTotal,
  PROMO_DISCOUNTS,
} from "../constants/pricing";
import QuantityStepper from "./QuantityStepper";

export interface ProductOptionsResult {
  options: Record<string, string>;
  quantity: number;
  discountPercent?: number;
}

interface ProductOptionsModalProps {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: (result: ProductOptionsResult) => void;
  initialOptions?: Record<string, string>;
  initialQuantity?: number;
  initialDiscountPercent?: number;
  confirmLabel?: string;
}

function getDefaultSelections(
  product: Product | null,
  initialOptions?: Record<string, string>,
): Record<string, string> {
  if (initialOptions) return initialOptions;
  const defaults: Record<string, string> = {};
  product?.specs?.forEach((group) => {
    defaults[group.key] = group.defaultLabel ?? group.options[0].label;
  });
  return defaults;
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
  // Lazy initializers run once per mount. The parent remounts this component
  // (via a `key`) every time a different product opens, so everything resets
  // to its starting values naturally, with no effect needed.
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    getDefaultSelections(product, initialOptions),
  );
  const [quantity, setQuantity] = useState(initialQuantity);
  const [discountPercent, setDiscountPercent] = useState<number | undefined>(
    initialDiscountPercent,
  );

  if (!product) return null;

  const unitPrice = getUnitPrice(product, selections);
  const discountAmount = getDiscountAmount(unitPrice, discountPercent);
  const total = getLineTotal(product, selections, quantity, discountPercent);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <View className="bg-neutral rounded-3xl p-6 w-full max-w-lg">
          {/* Close button sits in the upper-right corner of the card */}
          <Pressable
            onPress={onClose}
            hitSlop={8}
            className="absolute top-3 right-4 z-10 p-2"
          >
            <Text className="text-2xl text-slate-700">×</Text>
          </Pressable>

          <Text className="text-2xl font-semibold text-secondary text-center mb-1 mt-2">
            {product.name}
          </Text>
          <Text className="text-center text-slate-500 mb-6">
            ₱{unitPrice.toFixed(2)} each
          </Text>

          <ScrollView className="max-h-96">
            {product.specs?.map((group, index) => {
              const showSection =
                !!group.section &&
                group.section !== product.specs?.[index - 1]?.section;
              return (
                <View key={group.key}>
                  {showSection && (
                    <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                      {group.section}
                    </Text>
                  )}
                  <View className="flex-row items-start justify-between mb-4">
                    <Text className="text-slate-700 w-32 mt-2">
                      {group.label}
                    </Text>
                    <View className="flex-row flex-wrap flex-1 justify-end gap-2">
                      {group.options.map((option) => (
                        <Pill
                          key={option.label}
                          label={`${option.label}${
                            option.priceDelta ? ` (+₱${option.priceDelta})` : ""
                          }`}
                          selected={selections[group.key] === option.label}
                          onPress={() =>
                            setSelections((prev) => ({
                              ...prev,
                              [group.key]: option.label,
                            }))
                          }
                        />
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}

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
                ? `Applies to 1 of the ${quantity} drinks`
                : "Applies to this drink"}
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
                {discountPercent}% promo (1 drink)
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
