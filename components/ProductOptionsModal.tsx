import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { getUnitPrice, type Product } from "../constants/mockData";

interface ProductOptionsModalProps {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: (options: Record<string, string>) => void;
}

function getDefaultSelections(product: Product | null): Record<string, string> {
  const defaults: Record<string, string> = {};
  product?.specs?.forEach((group) => {
    defaults[group.key] = group.options[0].label;
  });
  return defaults;
}

export default function ProductOptionsModal({
  product,
  visible,
  onClose,
  onConfirm,
}: ProductOptionsModalProps) {
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    getDefaultSelections(product),
  );

  if (!product) return null;

  const previewPrice = getUnitPrice(product, selections);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <View className="bg-cream rounded-3xl p-6 w-full max-w-lg">
          <Pressable onPress={onClose} className="mb-2">
            <Text className="text-2xl text-slate-700">×</Text>
          </Pressable>

          <Text className="text-2xl font-semibold text-darcy text-center mb-1">
            {product.name}
          </Text>
          <Text className="text-center text-slate-500 mb-6">
            ₱{previewPrice.toFixed(2)}
          </Text>

          <ScrollView className="max-h-96">
            {product.specs?.map((group) => (
              <View
                key={group.key}
                className="flex-row items-start justify-between mb-4"
              >
                <Text className="text-slate-700 w-28 mt-2">{group.label}</Text>
                <View className="flex-row flex-wrap flex-1 justify-end gap-2">
                  {group.options.map((option) => {
                    const isSelected = selections[group.key] === option.label;
                    return (
                      <Pressable
                        key={option.label}
                        onPress={() =>
                          setSelections((prev) => ({
                            ...prev,
                            [group.key]: option.label,
                          }))
                        }
                        className={`px-4 py-2 rounded-full border ${
                          isSelected
                            ? "bg-darcy border-darcy"
                            : "bg-white border-slate-300"
                        }`}
                      >
                        <Text
                          className={
                            isSelected ? "text-white" : "text-slate-700"
                          }
                        >
                          {option.label}
                          {!!option.priceDelta && ` (+₱${option.priceDelta})`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable
            onPress={() => {
              onConfirm(selections);
              onClose();
            }}
            className="bg-darcy rounded-xl py-4 items-center mt-2"
          >
            <Text className="text-white text-lg font-semibold">
              Confirm — ₱{previewPrice.toFixed(2)}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
