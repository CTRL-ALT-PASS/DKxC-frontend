import Button from "@/components/Button";
import {
    Check,
    ChevronDown,
    Info,
    Lock,
    Plus,
    SlidersHorizontal,
    Trash2,
    X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    DEFAULT_CATEGORY,
    getCategory,
    INVENTORY_CATEGORIES,
    InventoryCategory,
} from "../../../types/inventoryCategories";
import { InventoryItem, StockUnit } from "./InventoryRow";

const PINK = "#BE185D";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 2 });

export type InventoryItemPatch = {
  itemName: string;
  category: InventoryCategory;
  baseCost: number;
  reorderLevel: number;
  units: StockUnit[];
};

type Props = {
  item: InventoryItem | null; // null = closed
  onClose: () => void;
  onSave: (id: string, patch: InventoryItemPatch) => void | Promise<void>;
};

/* ---------- small building blocks ---------- */

function Label({ children, right }: { children: string; right?: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between mb-1.5">
      <Text className="text-[12px] font-bold tracking-wider text-secondary/70">
        {children}
      </Text>
      {right}
    </View>
  );
}

function Hint({ children }: { children: string }) {
  return (
    <View className="flex-row items-start mt-1.5">
      <Info size={12} color="#6B7280" style={{ marginTop: 2 }} />
      <Text className="ml-1.5 flex-1 text-[11px] text-secondary/60">
        {children}
      </Text>
    </View>
  );
}

// Input shell with optional left/right adornments (₱, "/ mL", "mL").
function Field({
  value,
  onChangeText,
  prefix,
  suffix,
  numeric,
  editable = true,
  placeholder,
}: {
  value: string;
  onChangeText?: (v: string) => void;
  prefix?: string;
  suffix?: string;
  numeric?: boolean;
  editable?: boolean;
  placeholder?: string;
}) {
  return (
    <View
      className={`h-12 flex-row items-center rounded-xl border px-4 ${
        editable
          ? "bg-white border-tertiary-soft"
          : "bg-neutral border-tertiary-soft/60"
      }`}
    >
      {prefix ? (
        <Text className="mr-2 text-[15px] text-secondary/70">{prefix}</Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        keyboardType={numeric ? "decimal-pad" : "default"}
        className={`flex-1 text-[16px] ${
          editable ? "text-secondary" : "text-secondary/60"
        }`}
        placeholderTextColor="#9CA3AF"
      />
      {suffix ? (
        <Text className="ml-2 text-[12px] text-secondary/60">{suffix}</Text>
      ) : null}
    </View>
  );
}

const toNum = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
};

/* ---------- modal ---------- */

export default function InventoryItemActions({ item, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<InventoryCategory>(DEFAULT_CATEGORY);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [cost, setCost] = useState("");
  const [reorder, setReorder] = useState("");
  const [units, setUnits] = useState<StockUnit[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAbbr, setNewAbbr] = useState("");
  const [newFactor, setNewFactor] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset the form every time a different item is opened.
  useEffect(() => {
    if (!item) return;
    setName(item.itemName);
    setCategory(getCategory(item.category).name);
    setCategoryOpen(false);
    setCost(String(item.baseCost));
    setReorder(String(item.reorderLevel ?? 0));
    setUnits(item.units ?? []);
    setAdding(false);
    setNewName("");
    setNewAbbr("");
    setNewFactor("");
    setSaving(false);
  }, [item]);

  if (!item) return null;

  const costNum = toNum(cost);
  const reorderNum = toNum(reorder);
  const canSave =
    name.trim().length > 0 && costNum >= 0 && reorderNum >= 0 && !saving;

  const newFactorNum = toNum(newFactor);
  const canAddUnit =
    newName.trim().length > 0 && newFactorNum > 0 && newAbbr.trim().length > 0;

  const addUnit = () => {
    if (!canAddUnit) return;
    const abbr = newAbbr.trim();
    setUnits((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        name: newName.trim(),
        abbr,
        note: `1 ${abbr} = ${fmt(newFactorNum)} ${item.unit}`,
        factor: newFactorNum,
      },
    ]);
    setNewName("");
    setNewAbbr("");
    setNewFactor("");
    setAdding(false);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave(item.id, {
        itemName: name.trim(),
        category,
        baseCost: costNum,
        reorderLevel: reorderNum,
        units,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Scrim: dark + opaque enough that the page behind never competes with the card */}
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center bg-black/60"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="w-full items-center px-6"
        >
          {/* Card: SOLID white + border + shadow. Stops taps from closing the modal. */}
          <Pressable
            onPress={() => {}}
            className="w-full max-w-[640px] max-h-[92%] overflow-hidden rounded-2xl border border-tertiary-soft bg-white"
            style={{
              elevation: 24,
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 12 },
            }}
          >
            {/* Header */}
            <View className="flex-row items-center px-6 py-4 bg-neutral border-b border-tertiary-soft/60">
              <SlidersHorizontal size={22} color={PINK} />
              <View className="ml-4 flex-1">
                <Text className="text-[16px] font-semibold text-secondary">
                  Reconfigure: {item.itemName}
                </Text>
                <Text className="text-[12px] font-semibold text-secondary/60">
                  Item ID: #{item.id}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                accessibilityLabel="Close"
                className="h-9 w-9 items-center justify-center rounded-full active:bg-white"
              >
                <X size={20} color="#374151" />
              </Pressable>
            </View>

            <ScrollView
              className="bg-white"
              contentContainerStyle={{ padding: 24 }}
              keyboardShouldPersistTaps="handled"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-[16px] font-semibold text-secondary">
                  Core Item Specifications
                </Text>
                <Text className="text-[12px] text-secondary/60">
                  Only Name, Base Cost &amp; Reorder Level are editable
                </Text>
              </View>

              {/* Name + category */}
              <View className="flex-row">
                <View className="flex-[3] mr-3">
                  <Label>ITEM NAME *</Label>
                  <Field value={name} onChangeText={setName} />
                </View>

                <View className="flex-[2]">
                  <Label>CATEGORY *</Label>
                  <Pressable
                    onPress={() => setCategoryOpen((v) => !v)}
                    accessibilityRole="button"
                    accessibilityLabel={`Category: ${category}. Tap to change`}
                    className={`h-12 flex-row items-center rounded-xl border bg-white px-3 ${
                      categoryOpen ? "border-primary" : "border-tertiary-soft"
                    }`}
                  >
                    {(() => {
                      const Icon = getCategory(category).icon;
                      return <Icon size={18} color={PINK} />;
                    })()}
                    <Text
                      className="ml-2 flex-1 text-[15px] text-secondary"
                      numberOfLines={1}
                    >
                      {category}
                    </Text>
                    <ChevronDown
                      size={18}
                      color="#6B7280"
                      style={{
                        transform: [{ rotate: categoryOpen ? "180deg" : "0deg" }],
                      }}
                    />
                  </Pressable>
                </View>
              </View>

              {categoryOpen && (
                <View className="mt-2 overflow-hidden rounded-xl border border-tertiary-soft bg-white">
                  {INVENTORY_CATEGORIES.map((c, i) => {
                    const selected = c.name === category;
                    const Icon = c.icon;
                    return (
                      <Pressable
                        key={c.name}
                        onPress={() => {
                          setCategory(c.name);
                          setCategoryOpen(false);
                        }}
                        accessibilityRole="menuitem"
                        className={`h-12 flex-row items-center px-4 active:bg-neutral ${
                          selected ? "bg-neutral" : "bg-white"
                        } ${i > 0 ? "border-t border-tertiary-soft/40" : ""}`}
                      >
                        <Icon size={20} color={selected ? PINK : "#374151"} />
                        <Text
                          className={`ml-3 flex-1 text-[15px] ${
                            selected
                              ? "font-semibold text-primary"
                              : "text-secondary"
                          }`}
                        >
                          {c.name}
                        </Text>
                        {selected && <Check size={18} color={PINK} />}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Base unit + cost */}
              <View className="flex-row mt-5">
                <View className="flex-1 mr-3">
                  <Label
                    right={
                      <View className="flex-row items-center">
                        <Lock size={11} color="#6B7280" />
                        <Text className="ml-1 text-[11px] text-secondary/60">
                          Locked
                        </Text>
                      </View>
                    }
                  >
                    BASE UNIT OF DEDUCTION
                  </Label>
                  <Field value={`${item.unit} (System Base Unit)`} editable={false} />
                  <Hint>
                    Base unit is fixed to ensure point-of-sale deduction
                    integrity.
                  </Hint>
                </View>

                <View className="flex-1">
                  <Label>BASE COST PER BASE UNIT *</Label>
                  <Field
                    value={cost}
                    onChangeText={setCost}
                    prefix="₱"
                    suffix={`/ ${item.unit}`}
                    numeric
                  />
                  <Hint>Calculates real-time COGS for recipes and sales.</Hint>
                </View>
              </View>

              {/* Reorder */}
              <View className="mt-5">
                <Label>REORDER THRESHOLD QUANTITY *</Label>
                <Field
                  value={reorder}
                  onChangeText={setReorder}
                  suffix={item.unit}
                  numeric
                />
                <Hint>
                  Triggers low stock warnings across terminals when stock on
                  hand falls at or below this value.
                </Hint>
              </View>

              {/* Units */}
              <View className="mt-8 flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-[16px] font-semibold text-secondary">
                    Custom Units of Measurement
                  </Text>
                  <Text className="mt-1 text-[13px] text-secondary/70">
                    Define packaging, bulk purchase, and dispenser conversions
                    mapped to{" "}
                    <Text className="font-bold">{item.unit}</Text>.
                  </Text>
                </View>
                <Pressable
                  onPress={() => setAdding((v) => !v)}
                  className="flex-row items-center py-1"
                  accessibilityLabel="Add unit"
                >
                  <Plus size={16} color={PINK} />
                  <Text className="ml-1 text-[14px] font-semibold text-primary">
                    Add Unit
                  </Text>
                </Pressable>
              </View>

              {adding && (
                <View className="mt-4 rounded-xl border border-tertiary-soft bg-neutral p-4">
                  <View className="flex-row">
                    <View className="flex-[2] mr-3">
                      <Label>UNIT NAME</Label>
                      <Field
                        value={newName}
                        onChangeText={setNewName}
                        placeholder="e.g. Gallon"
                      />
                    </View>
                    <View className="flex-1 mr-3">
                      <Label>ABBR.</Label>
                      <Field
                        value={newAbbr}
                        onChangeText={setNewAbbr}
                        placeholder="GAL"
                      />
                    </View>
                    <View className="flex-[1.5]">
                      <Label>{`1 UNIT = ? ${item.unit.toUpperCase()}`}</Label>
                      <Field
                        value={newFactor}
                        onChangeText={setNewFactor}
                        suffix={item.unit}
                        numeric
                        placeholder="3785"
                      />
                    </View>
                  </View>
                  <View className="mt-4 flex-row justify-end">
                    <Button
                      label="Cancel"
                      variant="outline"
                      onPress={() => setAdding(false)}
                    />
                    <View className="w-3" />
                    <Button label="Add" onPress={addUnit} 
                        // disabled={!canAddUnit} 
                    />
                  </View>
                </View>
              )}

              <View className="mt-4">
                {units.length === 0 && !adding && (
                  <Text className="py-4 text-center text-[13px] text-secondary/60">
                    No custom units yet. Stock is tracked in {item.unit} only.
                  </Text>
                )}
                {units.map((u) => (
                  <View
                    key={u.id}
                    className="mb-3 flex-row items-center rounded-xl border border-tertiary-soft/60 bg-white px-4 py-3"
                  >
                    <View className="w-12 items-center">
                      <Text className="text-[12px] font-bold text-secondary/70">
                        {u.abbr ?? u.name.slice(0, 3).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-semibold text-secondary">
                        {u.name}{" "}
                        <Text className="text-[12px] font-normal text-secondary/60">
                          ({u.abbr ?? u.name.slice(0, 3).toUpperCase()})
                        </Text>
                      </Text>
                      <Text className="mt-0.5 text-[12px] text-secondary/60">
                        Factor: {u.note}
                      </Text>
                    </View>
                    <View className="mr-4 items-end">
                      <Text className="text-[10px] font-semibold tracking-wider text-secondary/50">
                        EQUIV. COST
                      </Text>
                      <Text className="text-[15px] font-semibold text-secondary">
                        ₱{fmt((Number.isFinite(costNum) ? costNum : 0) * u.factor)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        setUnits((prev) => prev.filter((x) => x.id !== u.id))
                      }
                      hitSlop={10}
                      accessibilityLabel={`Remove ${u.name}`}
                    >
                      <Trash2 size={18} color="#B91C1C" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Footer */}
            <View className="flex-row justify-end border-t border-tertiary-soft/60 bg-neutral px-6 py-4">
              <Button label="Cancel" variant="outline" onPress={onClose} />
              <View className="w-3" />
              <Button
                label={saving ? "Saving…" : "Save Changes"}
                onPress={handleSave}
                // disabled={!canSave}
              />
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}