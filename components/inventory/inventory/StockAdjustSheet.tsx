import { Minus, Plus, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import type { InventoryItem, StockUnit } from "./InventoryRow";

type Mode = "add" | "remove";

type Props = {
  item: InventoryItem | null; // null = closed
  onClose: () => void;
  /** delta is in BASE units; positive for add, negative for remove */
  onConfirm: (item: InventoryItem, deltaBase: number, mode: Mode) => void;
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 2 });

const ADD_COLOR = "#0F766E";
const REMOVE_COLOR = "#B91C1C";

export default function StockAdjustSheet({ item, onClose, onConfirm }: Props) {
  const [mode, setMode] = useState<Mode>("add");
  const [qty, setQty] = useState("1");
  const [unitId, setUnitId] = useState("base");

  // Reset whenever a different item is opened.
  useEffect(() => {
    setMode("add");
    setQty("1");
    setUnitId("base");
  }, [item?.id]);

  const units: StockUnit[] = useMemo(
    () =>
      item
        ? [
            {
              id: "base",
              name: item.unit,
              note: "Base unit",
              factor: 1,
            },
            ...(item.units ?? []),
          ]
        : [],
    [item],
  );

  if (!item) return null;

  const unit = units.find((u) => u.id === unitId) ?? units[0];
  const q = parseFloat(qty.replace(/,/g, "")) || 0;
  const base = q * unit.factor;

  const isAdd = mode === "add";
  const next = isAdd ? item.stocks + base : item.stocks - base;
  const tooMuch = !isAdd && next < 0;
  const canConfirm = q > 0 && !tooMuch;

  const eq =
    unit.factor === 1
      ? `${fmt(q)} ${item.unit}`
      : `${fmt(q)} × ${unit.name} (${fmt(unit.factor)} ${item.unit})`;

  // Use teal for adding and red for removing stock.
  const actionColor = isAdd ? ADD_COLOR : REMOVE_COLOR;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      supportedOrientations={["landscape", "portrait"]}
    >
      {/* Dimmed backdrop; tap to dismiss */}
      <Pressable
        className="flex-1 bg-[#1B2421]/50 flex-row justify-end"
        onPress={onClose}
      >
        {/* Right-hand panel; inner Pressable swallows taps */}
        <Pressable
          onPress={() => {}}
          className="w-[540px] max-w-full h-full bg-white px-8 py-7 overflow-hidden"
          style={{ elevation: 16 }}
        >
          {/* Header */}
          <View className="flex-row items-start mb-4">
            <View className="flex-1">
              <Text className="text-[26px] font-bold text-[#1B2421]">
                {item.itemName}
              </Text>

              <Text className="text-[15px] text-[#5B6762] mt-1">
                In stock:{" "}
                <Text className="font-bold text-[#1B2421]">
                  {fmt(item.stocks)} {item.unit}
                </Text>
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityLabel="Close"
              className="w-12 h-12 rounded-xl border border-[#C9D1CD] items-center justify-center"
            >
              <X size={22} color="#1B2421" strokeWidth={2} />
            </Pressable>
          </View>

          {/* Add / Remove toggle */}
          <View className="flex-row gap-1 p-1 bg-[#EEF2F0] rounded-[14px] mb-5">
            {(["add", "remove"] as Mode[]).map((m) => {
              const active = mode === m;
              const activeColor = m === "remove" ? REMOVE_COLOR : ADD_COLOR;

              return (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={`flex-1 h-[52px] rounded-[10px] items-center justify-center ${
                    active ? "" : ""
                  }`}
                  style={active ? { backgroundColor: activeColor } : undefined}
                >
                  <Text
                    className={`text-[17px] ${
                      active
                        ? "font-bold text-white"
                        : "font-semibold text-[#34413C]"
                    }`}
                  >
                    {m === "add" ? "Add stock" : "Remove stock"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Quantity */}
          <Text className="text-sm font-semibold text-[#34413C] mb-2">
            Quantity
          </Text>

          <View className="flex-row gap-[10px] mb-5">
            <Pressable
              onPress={() => setQty(String(Math.max(0, q - 1)))}
              accessibilityLabel="Decrease quantity"
              accessibilityRole="button"
              className="w-16 h-16 shrink-0 rounded-xl border border-[#C9D1CD] items-center justify-center"
            >
              <Minus size={26} color="#1B2421" />
            </Pressable>

            <TextInput
              value={qty}
              onChangeText={setQty}
              keyboardType="decimal-pad"
              selectTextOnFocus
              style={{ minWidth: 0, width: 0 }}
              className="flex-1 min-w-0 h-16 text-center text-[32px] font-bold text-[#1B2421] border-[1.5px] border-[#0F766E] rounded-xl"
            />

            <Pressable
              onPress={() => setQty(String(q + 1))}
              accessibilityLabel="Increase quantity"
              accessibilityRole="button"
              className="w-16 h-16 shrink-0 rounded-xl border border-[#C9D1CD] items-center justify-center"
            >
              <Plus size={26} color="#1B2421" />
            </Pressable>
          </View>

          {/* Unit picker */}
          <Text className="text-sm font-semibold text-[#34413C] mb-2">
            Unit
          </Text>

          <View className="flex-row flex-wrap gap-[10px] mb-5">
            {units.map((u) => {
              const sel = u.id === unit.id;

              return (
                <Pressable
                  key={u.id}
                  onPress={() => setUnitId(u.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sel }}
                  className={`w-[48%] h-16 px-4 rounded-xl justify-center ${
                    sel
                      ? "border-2 border-[#0F766E] bg-[#E3F2EF]"
                      : "border-[1.5px] border-[#C9D1CD] bg-white"
                  }`}
                >
                  <Text
                    className={`text-[17px] ${
                      sel
                        ? "font-bold text-[#0B5C55]"
                        : "font-semibold text-[#1B2421]"
                    }`}
                  >
                    {u.name}
                  </Text>

                  <Text
                    className={`text-[13px] ${
                      sel ? "text-[#0B5C55]" : "text-[#5B6762]"
                    }`}
                  >
                    {u.note}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Summary */}
          <View className="bg-[#EEF2F0] rounded-[14px] px-[18px] py-4 gap-2">
            <View className="flex-row justify-between">
              <Text className="text-[15px] text-[#34413C]">{eq}</Text>

              <Text className="text-[15px] font-bold text-[#34413C]">
                {isAdd ? "+" : "−"}
                {fmt(base)} {item.unit}
              </Text>
            </View>

            <View className="h-px bg-[#D3DBD7]" />

            <View className="flex-row justify-between items-baseline">
              <Text className="text-[15px] text-[#34413C]">
                New stock level
              </Text>

              <Text className="text-[26px] font-bold text-[#1B2421]">
                {tooMuch ? "—" : `${fmt(next)} ${item.unit}`}
              </Text>
            </View>

            {tooMuch && (
              <Text className="text-sm font-semibold text-[#9F1D1D]">
                Not enough stock. Only {fmt(item.stocks)} {item.unit} on hand.
              </Text>
            )}
          </View>

          <View className="flex-1" />

          {/* Actions */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              className="h-14 px-7 rounded-xl border border-[#C9D1CD] items-center justify-center"
            >
              <Text className="text-[17px] font-semibold text-[#1B2421]">
                Cancel
              </Text>
            </Pressable>

            <Pressable
              disabled={!canConfirm}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canConfirm }}
              onPress={() => {
                onConfirm(item, isAdd ? base : -base, mode);
                onClose();
              }}
              className="flex-1 h-14 rounded-xl items-center justify-center"
              style={{
                backgroundColor: canConfirm ? actionColor : "#E3E8E5",
              }}
            >
              <Text
                className={`text-[18px] font-bold ${
                  canConfirm ? "text-white" : "text-[#5B6762]"
                }`}
              >
                {isAdd ? "Add to stock" : "Remove from stock"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
