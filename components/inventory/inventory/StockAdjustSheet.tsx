import {
  ApiError,
  type MovementType,
  type RecordMovementInput,
} from "@/services/inventoryApi";
import { Minus, Plus, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, Text, TextInput, View } from "react-native";
import type { InventoryItem, StockUnit } from "./InventoryRow";

type Mode = "add" | "remove";

type Props = {
  item: InventoryItem | null; // null = closed
  onClose: () => void;
  /**
   * Should send the movement to the backend. Reject/throw on failure so the
   * sheet can show the error and stay open; resolve on success.
   */
  onConfirm: (item: InventoryItem, input: RecordMovementInput) => Promise<void>;
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 2 });

const ADD_COLOR = "#0F766E";
const REMOVE_COLOR = "#B91C1C";
const PANEL_WIDTH = 540;

// Which backend movement types each mode offers.
const TYPE_OPTIONS: Record<Mode, { value: MovementType; label: string }[]> = {
  add: [
    { value: "Restock", label: "Restock" },
    { value: "Return", label: "Return" },
    { value: "Adjustment", label: "Adjustment" },
  ],
  remove: [
    { value: "Spoilage", label: "Spoilage" },
    { value: "Damage", label: "Damage" },
    { value: "Adjustment", label: "Adjustment" },
  ],
};

const DEFAULT_TYPE: Record<Mode, MovementType> = {
  add: "Restock",
  remove: "Spoilage",
};

function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    // 422: show the first field error; 403 INSUFFICIENT_STOCK etc: server message.
    const firstFieldError =
      e.fieldErrors && Object.values(e.fieldErrors)[0]?.[0];
    return firstFieldError ?? e.message;
  }
  return "Couldn't update stock. Check your connection and try again.";
}

export default function StockAdjustSheet({ item: itemProp, onClose, onConfirm }: Props) {
  // Keep the last item mounted so the panel can slide out before unmounting.
  const [item, setItem] = useState<InventoryItem | null>(itemProp);
  const open = itemProp !== null;

  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  const [mode, setMode] = useState<Mode>("add");
  const [type, setType] = useState<MovementType>("Restock");
  const [qty, setQty] = useState("1");
  const [unitId, setUnitId] = useState("base");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Follow the prop while open; hold the last value while closing.
  useEffect(() => {
    if (itemProp) setItem(itemProp);
  }, [itemProp]);

  // Slide in from the right / out to the right.
  useEffect(() => {
    if (open) {
      translateX.setValue(PANEL_WIDTH);
      backdrop.setValue(0);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: PANEL_WIDTH,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setItem(null); // unmount after the slide-out
      });
    }
  }, [open]);

  // Reset whenever a different item is opened.
  useEffect(() => {
    setMode("add");
    setType("Restock");
    setQty("1");
    setUnitId("base");
    setReason("");
    setError(null);
    setSubmitting(false);
  }, [itemProp?.id]);

  const units: StockUnit[] = useMemo(
    () =>
      item
        ? [
            { id: "base", name: item.unit, note: "Base unit", factor: 1 },
            ...(item.units ?? []),
          ]
        : [],
    [item],
  );

  // Don't allow dismissing while a request is in flight.
  const requestClose = () => {
    if (!submitting) onClose();
  };

  const changeMode = (m: Mode) => {
    setMode(m);
    setType(DEFAULT_TYPE[m]);
    setError(null);
  };

  if (!item) return null;

  const unit = units.find((u) => u.id === unitId) ?? units[0];
  const q = parseFloat(qty.replace(/,/g, "")) || 0;
  const base = q * unit.factor;

  const isAdd = mode === "add";
  const next = isAdd ? item.stocks + base : item.stocks - base;
  const tooMuch = !isAdd && next < 0;
  const canConfirm = q > 0 && !tooMuch && !submitting;

  const eq =
    unit.factor === 1
      ? `${fmt(q)} ${item.unit}`
      : `${fmt(q)} × ${unit.name} (${fmt(unit.factor)} ${item.unit})`;

  // Use teal for adding and red for removing stock.
  const actionColor = isAdd ? ADD_COLOR : REMOVE_COLOR;

  const handleConfirm = async () => {
    if (!canConfirm) return;

    setSubmitting(true);
    setError(null);

    try {
      await onConfirm(item, {
        movement_type: type,
        // Only "Adjustment" takes a signed quantity; Spoilage/Damage are
        // positive and the backend subtracts them.
        quantity: !isAdd && type === "Adjustment" ? -q : q,
        // Send the unit the employee picked; the backend converts to base.
        unit: unit.id === "base" ? item.unit : unit.name,
        ...(reason.trim() && { reason: reason.trim() }),
      });
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={requestClose}
      supportedOrientations={["landscape", "portrait"]}
    >
      <View className="flex-1 flex-row justify-end">
        {/* Fading dim layer; tap to dismiss */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(26,2,8,0.5)",
            opacity: backdrop,
          }}
        />
        <Pressable
          onPress={requestClose}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        />

        {/* Sliding panel */}
        <Animated.View
          style={{
            width: PANEL_WIDTH,
            maxWidth: "100%",
            height: "100%",
            transform: [{ translateX }],
            elevation: 16,
          }}
        >
          {/* Inner Pressable swallows taps */}
          <Pressable
            onPress={() => {}}
            className="flex-1 bg-white px-8 py-7 overflow-hidden"
          >
            {/* Header */}
            <View className="flex-row items-start mb-4">
              <View className="flex-1">
                <Text className="text-[26px] font-bold text-secondary">
                  {item.itemName}
                </Text>

                <Text className="text-[15px] text-secondary/70 mt-1">
                  In stock:{" "}
                  <Text className="font-bold text-secondary">
                    {fmt(item.stocks)} {item.unit}
                  </Text>
                </Text>
              </View>

              <Pressable
                onPress={requestClose}
                accessibilityLabel="Close"
                className="w-12 h-12 rounded-xl border border-tertiary-soft items-center justify-center"
              >
                <X size={22} color="#4C0519" strokeWidth={2} />
              </Pressable>
            </View>

            {/* Add / Remove toggle */}
            <View className="flex-row gap-1 p-1 bg-neutral rounded-[14px] mb-5">
              {(["add", "remove"] as Mode[]).map((m) => {
                const active = mode === m;
                const activeColor = m === "remove" ? REMOVE_COLOR : ADD_COLOR;

                return (
                  <Pressable
                    key={m}
                    onPress={() => changeMode(m)}
                    disabled={submitting}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className="flex-1 h-[52px] rounded-[10px] items-center justify-center"
                    style={active ? { backgroundColor: activeColor } : undefined}
                  >
                    <Text
                      className={`text-[17px] ${
                        active
                          ? "font-bold text-white"
                          : "font-semibold text-secondary"
                      }`}
                    >
                      {m === "add" ? "Add stock" : "Remove stock"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Movement type */}
            <Text className="text-sm font-semibold text-secondary mb-2">
              Type
            </Text>

            <View className="flex-row gap-[10px] mb-5">
              {TYPE_OPTIONS[mode].map((t) => {
                const sel = t.value === type;

                return (
                  <Pressable
                    key={t.value}
                    onPress={() => setType(t.value)}
                    disabled={submitting}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel }}
                    className={`flex-1 h-12 rounded-xl items-center justify-center ${
                      sel
                        ? "border-2 border-primary bg-neutral"
                        : "border-[1.5px] border-tertiary-soft/60 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-[15px] ${
                        sel
                          ? "font-bold text-primary"
                          : "font-semibold text-secondary"
                      }`}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Quantity */}
            <Text className="text-sm font-semibold text-secondary mb-2">
              Quantity
            </Text>

            <View className="flex-row gap-[10px] mb-5">
              <Pressable
                onPress={() => setQty(String(Math.max(0, q - 1)))}
                disabled={submitting}
                accessibilityLabel="Decrease quantity"
                accessibilityRole="button"
                className="w-16 h-16 shrink-0 rounded-xl border border-[#C9D1CD] items-center justify-center"
              >
                <Minus size={26} color="#1B2421" />
              </Pressable>

              <TextInput
                value={qty}
                onChangeText={setQty}
                editable={!submitting}
                keyboardType="decimal-pad"
                selectTextOnFocus
                style={{ minWidth: 0, width: 0 }}
                className="flex-1 min-w-0 h-16 text-center text-[32px] font-bold text-secondary border-[1.5px] border-primary rounded-xl"
              />

              <Pressable
                onPress={() => setQty(String(q + 1))}
                disabled={submitting}
                accessibilityLabel="Increase quantity"
                accessibilityRole="button"
                className="w-16 h-16 shrink-0 rounded-xl border border-[#C9D1CD] items-center justify-center"
              >
                <Plus size={26} color="#1B2421" />
              </Pressable>
            </View>

            {/* Unit picker */}
            <Text className="text-sm font-semibold text-secondary mb-2">
              Unit
            </Text>

            <View className="flex-row flex-wrap gap-[10px] mb-5">
              {units.map((u) => {
                const sel = u.id === unit.id;

                return (
                  <Pressable
                    key={u.id}
                    onPress={() => setUnitId(u.id)}
                    disabled={submitting}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel }}
                    className={`w-[48%] h-16 px-4 rounded-xl justify-center ${
                      sel
                        ? "border-2 border-primary bg-neutral"
                        : "border-[1.5px] border-tertiary-soft/60 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-[17px] ${
                        sel
                          ? "font-bold text-primary"
                          : "font-semibold text-secondary"
                      }`}
                    >
                      {u.name}
                    </Text>

                    <Text
                      className={`text-[13px] ${
                        sel ? "text-primary" : "text-secondary/70"
                      }`}
                    >
                      {u.note}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Reason (optional, max 50 chars on the backend) */}
            <TextInput
              value={reason}
              onChangeText={setReason}
              editable={!submitting}
              maxLength={50}
              placeholder="Reason (optional)"
              className="h-12 px-4 mb-5 text-[16px] text-secondary border border-tertiary-soft rounded-xl"
            />

            {/* Summary */}
            <View className="bg-neutral border border-tertiary-soft/40 rounded-[14px] px-[18px] py-4 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-[15px] text-secondary/80">{eq}</Text>

                <Text
                  className="text-[15px] font-bold"
                  style={{ color: actionColor }}
                >
                  {isAdd ? "+" : "−"}
                  {fmt(base)} {item.unit}
                </Text>
              </View>

              <View className="h-px bg-tertiary-soft/50" />

              <View className="flex-row justify-between items-baseline">
                <Text className="text-[15px] text-secondary/80">
                  New stock level
                </Text>

                <Text className="text-[26px] font-bold text-secondary">
                  {tooMuch ? "—" : `${fmt(next)} ${item.unit}`}
                </Text>
              </View>

              {tooMuch && (
                <Text className="text-sm font-semibold text-warn">
                  Not enough stock. Only {fmt(item.stocks)} {item.unit} on hand.
                </Text>
              )}
            </View>

            {/* Server error (e.g. insufficient stock, validation, network) */}
            {error && (
              <Text className="mt-3 text-sm font-semibold text-warn">
                {error}
              </Text>
            )}

            <View className="flex-1" />

            {/* Actions */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={requestClose}
                disabled={submitting}
                accessibilityRole="button"
                className="h-14 px-7 rounded-xl border border-tertiary-soft items-center justify-center"
              >
                <Text className="text-[17px] font-semibold text-secondary">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                disabled={!canConfirm}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canConfirm }}
                onPress={handleConfirm}
                className="flex-1 h-14 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: canConfirm
                    ? actionColor
                    : "rgba(253,164,175,0.3)",
                }}
              >
                <Text
                  className={`text-[18px] font-bold ${
                    canConfirm ? "text-white" : "text-secondary/50"
                  }`}
                >
                  {submitting
                    ? "Saving…"
                    : isAdd
                      ? "Add to stock"
                      : "Remove from stock"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}