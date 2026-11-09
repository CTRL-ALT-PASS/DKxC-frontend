import type { PaymentMode } from "@/context/CartContext";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

interface PaymentModeModalProps {
  visible: boolean;
  total: number;
  onClose: () => void;
  onConfirm: (mode: PaymentMode) => void;
}

export default function PaymentModeModal({
  visible,
  total,
  onClose,
  onConfirm,
}: PaymentModeModalProps) {
  const [mode, setMode] = useState<PaymentMode>("Cash");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <View className="bg-neutral rounded-3xl p-6 w-full max-w-sm">
          <Pressable
            onPress={onClose}
            hitSlop={8}
            className="absolute top-3 right-4 z-10 p-2"
          >
            <Text className="text-2xl text-slate-700">×</Text>
          </Pressable>

          <Text className="text-xl font-semibold text-secondary text-center mb-1 mt-2">
            Payment Mode
          </Text>
          <Text className="text-center text-slate-500 mb-6">
            Total: ₱{total.toFixed(2)}
          </Text>

          <View className="flex-row gap-3 mb-6">
            <Pressable
              onPress={() => setMode("Cash")}
              className={`flex-1 py-4 rounded-xl items-center border ${
                mode === "Cash"
                  ? "bg-primary border-primary"
                  : "bg-white border-slate-300"
              }`}
            >
              <Text
                className={
                  mode === "Cash"
                    ? "text-white font-semibold"
                    : "text-slate-700 font-semibold"
                }
              >
                Cash
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("Cashless")}
              className={`flex-1 py-4 rounded-xl items-center border ${
                mode === "Cashless"
                  ? "bg-primary border-primary"
                  : "bg-white border-slate-300"
              }`}
            >
              <Text
                className={
                  mode === "Cashless"
                    ? "text-white font-semibold"
                    : "text-slate-700 font-semibold"
                }
              >
                Cashless
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => onConfirm(mode)}
            className="bg-primary rounded-xl py-4 items-center"
          >
            <Text className="text-white text-lg font-semibold">
              Confirm Payment
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
