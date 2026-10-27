import Button from "@/components/Button";
import { ApiError, type BaseUnit } from "@/services/inventoryApi";
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

// Base units selectable when creating an item (the API also accepts "kg" and "L").
const BASE_UNIT_OPTIONS: BaseUnit[] = ["g", "mL", "pcs"];

export type InventoryItemCreate = InventoryItemPatch & { unit: BaseUnit };

type Props = {
  item: InventoryItem | null; // edit mode when set
  adding?: boolean; // add mode when true (and no item)
  onClose: () => void;
  onSave: (id: string, patch: InventoryItemPatch) => void | Promise<void>;
  onCreate?: (payload: InventoryItemCreate) => void | Promise<void>;
};

/* ---------- small building blocks ---------- */

function Label({
  children,
  right,
}: {
  children: string;
  right?: React.ReactNode;
}) {
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

export default function InventoryItemActions({
  item,
  adding: addingItem = false,
  onClose,
  onSave,
  onCreate,
}: Props) {
  const isAdd = addingItem && !item;
  const [baseUnit, setBaseUnit] = useState<BaseUnit>(BASE_UNIT_OPTIONS[0]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<InventoryCategory>(DEFAULT_CATEGORY);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [cost, setCost] = useState("");
  const [reorder, setReorder] = useState("");
  const [units, setUnits] = useState<StockUnit[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFactor, setNewFactor] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset the form every time a different item is opened.
  useEffect(() => {
    if (item) {
      setName(item.itemName);
      setCategory(getCategory(item.category).name);
      setCost(String(item.baseCost));
      setReorder(String(item.reorderLevel ?? 0));
      setUnits(item.units ?? []);
    } else if (addingItem) {
      setName("");
      setCategory(DEFAULT_CATEGORY);
      setCost("");
      setReorder("0");
      setUnits([]);
      setBaseUnit(BASE_UNIT_OPTIONS[0]);
    } else {
      return;
    }
    setCategoryOpen(false);
    setAdding(false);
    setNewName("");
    setNewFactor("");
    setSaving(false);
    setFormError(null);
  }, [item, addingItem]);

  if (!item && !isAdd) return null;

  // Base unit: locked to the item's unit when editing, chosen by the user when adding.
  const unit = isAdd ? baseUnit : item!.unit;

  // Keep custom-unit notes in sync if the base unit changes while adding.
  const pickBaseUnit = (u: BaseUnit) => {
    setBaseUnit(u);
    setUnits((prev) =>
      prev.map((x) => ({
        ...x,
        note: `1 ${x.name} = ${fmt(x.factor)} ${u}`,
      })),
    );
  };

  const costNum = toNum(cost);
  const reorderNum = toNum(reorder);
  const canSave =
    name.trim().length > 0 &&
    Number.isFinite(costNum) &&
    costNum >= 0 &&
    Number.isFinite(reorderNum) &&
    reorderNum >= 0 &&
    !saving;

  const trimmedNewName = newName.trim();
  const newFactorNum = toNum(newFactor);
  // Unit names must be unique (the server has no ids) and can't repeat the base unit.
  const isDuplicate =
    trimmedNewName.toLowerCase() === unit.toLowerCase() ||
    units.some((u) => u.name.toLowerCase() === trimmedNewName.toLowerCase());
  const canAddUnit =
    trimmedNewName.length > 0 && newFactorNum > 0 && !isDuplicate;

  const addUnit = () => {
    if (!canAddUnit) return;
    setUnits((prev) => [
      ...prev,
      {
        id: trimmedNewName,
        name: trimmedNewName,
        note: `1 ${trimmedNewName} = ${fmt(newFactorNum)} ${unit}`,
        factor: newFactorNum,
      },
    ]);
    setNewName("");
    setNewFactor("");
    setAdding(false);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setFormError(null);
    try {
      const patch: InventoryItemPatch = {
        itemName: name.trim(),
        category,
        baseCost: costNum,
        reorderLevel: reorderNum,
        units,
      };
      if (isAdd) {
        await onCreate?.({ ...patch, unit: baseUnit });
      } else {
        await onSave(item!.id, patch);
      }
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        const firstFieldError =
          e.fieldErrors && Object.values(e.fieldErrors)[0]?.[0];
        setFormError(firstFieldError ?? e.message);
      } else if (!(e instanceof Error && e.message === "SESSION_INVALID")) {
        // SESSION_INVALID is handled by the hook (signs the user out).
        setFormError("Something went wrong. Please try again.");
      }
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
                  {isAdd ? "Add New Item" : `Reconfigure: ${item!.itemName}`}
                </Text>
                {!isAdd && (
                  <Text className="text-[12px] font-semibold text-secondary/60">
                    Item ID: #{item!.id}
                  </Text>
                )}
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
                  {isAdd
                    ? "Base unit can't be changed after the item is created"
                    : "Only Name, Category, Base Cost & Reorder Level are editable"}
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
                        transform: [
                          { rotate: categoryOpen ? "180deg" : "0deg" },
                        ],
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
                      isAdd ? undefined : (
                        <View className="flex-row items-center">
                          <Lock size={11} color="#6B7280" />
                          <Text className="ml-1 text-[11px] text-secondary/60">
                            Locked
                          </Text>
                        </View>
                      )
                    }
                  >
                    {isAdd
                      ? "BASE UNIT OF DEDUCTION *"
                      : "BASE UNIT OF DEDUCTION"}
                  </Label>
                  {isAdd ? (
                    <View className="h-12 flex-row items-center">
                      {BASE_UNIT_OPTIONS.map((u, i) => {
                        const selected = u === baseUnit;
                        return (
                          <Pressable
                            key={u}
                            onPress={() => pickBaseUnit(u)}
                            accessibilityRole="button"
                            accessibilityLabel={`Base unit ${u}`}
                            className={`h-12 flex-1 items-center justify-center rounded-xl border ${
                              i > 0 ? "ml-2" : ""
                            } ${
                              selected
                                ? "border-primary bg-neutral"
                                : "border-tertiary-soft bg-white"
                            }`}
                          >
                            <Text
                              className={`text-[15px] ${
                                selected
                                  ? "font-semibold text-primary"
                                  : "text-secondary"
                              }`}
                            >
                              {u}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <Field
                      value={`${unit} (System Base Unit)`}
                      editable={false}
                    />
                  )}
                  <Hint>
                    {isAdd
                      ? "Choose carefully: it is fixed once the item is created to keep point-of-sale deduction accurate."
                      : "Base unit is fixed to ensure point-of-sale deduction integrity."}
                  </Hint>
                </View>

                <View className="flex-1">
                  <Label>BASE COST PER BASE UNIT *</Label>
                  <Field
                    value={cost}
                    onChangeText={setCost}
                    prefix="₱"
                    suffix={`/ ${unit}`}
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
                  suffix={unit}
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
                    mapped to <Text className="font-bold">{unit}</Text>.
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
                      {isDuplicate && trimmedNewName.length > 0 && (
                        <Hint>A unit with this name already exists.</Hint>
                      )}
                    </View>
                    <View className="flex-[1.5]">
                      <Label>{`1 UNIT = ? ${unit.toUpperCase()}`}</Label>
                      <Field
                        value={newFactor}
                        onChangeText={setNewFactor}
                        suffix={unit}
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
                    <Button
                      label="Add"
                      onPress={addUnit}
                      // disabled={!canAddUnit}
                    />
                  </View>
                </View>
              )}

              <View className="mt-4">
                {units.length === 0 && !adding && (
                  <Text className="py-4 text-center text-[13px] text-secondary/60">
                    No custom units yet. Stock is tracked in {unit} only.
                  </Text>
                )}
                {units.map((u) => (
                  <View
                    key={u.id}
                    className="mb-3 flex-row items-center rounded-xl border border-tertiary-soft/60 bg-white px-4 py-3"
                  >
                    <View className="flex-1">
                      <Text className="text-[15px] font-semibold text-secondary">
                        {u.name}
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
                        ₱
                        {fmt(
                          (Number.isFinite(costNum) ? costNum : 0) * u.factor,
                        )}
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

            {/* Error banner */}
            {formError && (
              <View className="border-t border-tertiary-soft/60 bg-white px-6 py-3">
                <Text className="text-[13px] text-red-700">{formError}</Text>
              </View>
            )}

            {/* Footer */}
            <View className="flex-row justify-end border-t border-tertiary-soft/60 bg-neutral px-6 py-4">
              <Button label="Cancel" variant="outline" onPress={onClose} />
              <View className="w-3" />
              <Button
                label={saving ? "Saving…" : isAdd ? "Add Item" : "Save Changes"}
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
