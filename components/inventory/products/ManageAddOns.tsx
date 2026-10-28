import Button from "@/components/Button";
import { useInventoryItems } from "@/hooks/use-inventory-items";
import {
    createAddOn,
    deleteAddOn,
    updateAddOn,
    type AddOn,
} from "@/services/addOnsApi";
import { ApiError } from "@/services/apiClient";
import type { Category } from "@/services/categoriesApi";
import { useMemo, useRef, useState } from "react";
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

const TERTIARY_SOFT = "#FDA4AF";

type Props = {
  addOns: AddOn[];
  categories: Category[];
  onClose: () => void;
  /** Called after every successful create/update/delete so the parent can refetch add-ons. */
  onChanged: () => void | Promise<unknown>;
};

type Row = { key: string; itemId: number | null; qty: string };

const toNum = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
};

const peso = (v: string | number) => `₱${Number(v).toFixed(2)}`;

function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const firstFieldError = e.errors && Object.values(e.errors)[0]?.[0];
    return firstFieldError ?? e.message;
  }
  return "Something went wrong. Please try again.";
}

/* ---------- small building blocks (same look as the Add Item modal) ---------- */

function Label({ children }: { children: string }) {
  return (
    <Text className="text-[12px] font-bold tracking-wider text-secondary/70 mb-1.5">
      {children}
    </Text>
  );
}

function Field({
  value,
  onChangeText,
  prefix,
  suffix,
  numeric,
  placeholder,
  editable = true,
}: {
  value: string;
  onChangeText: (v: string) => void;
  prefix?: string;
  suffix?: string;
  numeric?: boolean;
  placeholder?: string;
  editable?: boolean;
}) {
  return (
    <View className="h-12 flex-row items-center rounded-xl border border-tertiary-soft bg-white px-4">
      {prefix ? (
        <Text className="mr-2 text-[15px] text-secondary/70">{prefix}</Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        keyboardType={numeric ? "decimal-pad" : "default"}
        className="flex-1 text-[16px] text-secondary"
        placeholderTextColor="#9CA3AF"
      />
      {suffix ? (
        <Text className="ml-2 text-[12px] text-secondary/60">{suffix}</Text>
      ) : null}
    </View>
  );
}

/* ---------- ingredient picker (searchable dropdown) ---------- */

type PickerItem = {
  inventory_item_id: number;
  item_name: string;
  base_unit: string;
};

function IngredientPicker({
  value,
  items,
  takenIds,
  onChange,
}: {
  value: number | null;
  items: PickerItem[];
  takenIds: Set<number>;
  onChange: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = items.find((i) => i.inventory_item_id === value);
  const options = items.filter(
    (i) =>
      (i.inventory_item_id === value || !takenIds.has(i.inventory_item_id)) &&
      i.item_name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className={`h-12 flex-row items-center rounded-xl border bg-white px-4 ${
          open ? "border-primary" : "border-tertiary-soft"
        }`}
      >
        <Text
          className={`flex-1 text-[15px] ${
            selected ? "text-secondary" : "text-secondary/40"
          }`}
          numberOfLines={1}
        >
          {selected ? selected.item_name : "Select ingredient"}
        </Text>
        <Text className="text-secondary/60 ml-2">{open ? "▲" : "▼"}</Text>
      </Pressable>

      {open && (
        <View className="mt-2 rounded-xl border border-tertiary-soft bg-white overflow-hidden">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search ingredients"
            placeholderTextColor="#9CA3AF"
            className="px-4 py-2 text-[14px] text-secondary border-b border-tertiary-soft/40"
          />
          <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
            {options.length === 0 ? (
              <Text className="px-4 py-3 text-secondary/60 text-[13px]">
                No ingredients found
              </Text>
            ) : (
              options.map((i) => {
                const isSel = i.inventory_item_id === value;
                return (
                  <Pressable
                    key={i.inventory_item_id}
                    onPress={() => {
                      onChange(i.inventory_item_id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`h-11 flex-row items-center px-4 border-t border-tertiary-soft/40 active:bg-neutral ${
                      isSel ? "bg-neutral" : "bg-white"
                    }`}
                  >
                    <Text
                      className={`flex-1 text-[14px] ${
                        isSel ? "font-semibold text-primary" : "text-secondary"
                      }`}
                      numberOfLines={1}
                    >
                      {i.item_name}
                    </Text>
                    <Text className="text-[12px] text-secondary/60 ml-2">
                      {i.base_unit}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

/* ---------- modal ---------- */

export default function ManageAddOns({
  addOns,
  categories,
  onClose,
  onChanged,
}: Props) {
  const { items: inventoryItems } = useInventoryItems();
  const pickerItems = inventoryItems as unknown as PickerItem[];

  // selectedId: number = editing that add-on, null = creating a new one
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [listSearch, setListSearch] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [rows, setRows] = useState<Row[]>([]);

  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [blockedBySales, setBlockedBySales] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const rowCounter = useRef(0);
  const newRow = (itemId: number | null = null, qty = ""): Row => ({
    key: `r${rowCounter.current++}`,
    itemId,
    qty,
  });

  const resetStatus = () => {
    setFormError(null);
    setConfirmingDelete(false);
    setBlockedBySales(false);
  };

  const startCreate = () => {
    setSelectedId(null);
    setName("");
    setPrice("");
    setCategoryIds([]);
    setRows([]);
    resetStatus();
  };

  const selectAddOn = (a: AddOn) => {
    setSelectedId(a.add_on_id);
    setName(a.add_on_name);
    setPrice(String(Number(a.price)));
    setCategoryIds(a.category_ids ?? []);
    setRows(
      (a.ingredients ?? []).map((ing) =>
        newRow(ing.inventory_item_id, String(Number(ing.quantity))),
      ),
    );
    resetStatus();
  };

  const filteredAddOns = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    return q
      ? addOns.filter((a) => a.add_on_name.toLowerCase().includes(q))
      : addOns;
  }, [addOns, listSearch]);

  const categoryName = useMemo(
    () => new Map(categories.map((c) => [c.category_id, c.category_name])),
    [categories],
  );

  const unitOf = (itemId: number | null) =>
    pickerItems.find((i) => i.inventory_item_id === itemId)?.base_unit ?? "";

  const takenIds = new Set(
    rows.map((r) => r.itemId).filter((id): id is number => id !== null),
  );

  const toggleCategory = (id: number) =>
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );

  /* ---------------- save ---------------- */

  const validate = (): string | null => {
    if (!name.trim()) return "Add-on name is required.";
    const p = toNum(price);
    if (!Number.isFinite(p) || p < 0) return "Enter a valid price (0 or more).";
    if (categoryIds.length === 0) return "Pick at least one category.";
    for (const r of rows) {
      if (r.itemId === null)
        return "Pick an ingredient for every row, or remove the empty row.";
      const q = toNum(r.qty);
      if (!Number.isFinite(q) || q <= 0)
        return "Each ingredient needs a quantity greater than 0.";
    }
    return null;
  };

  const handleSave = async () => {
    if (saving) return;
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    setSaving(true);
    setFormError(null);
    setBlockedBySales(false);
    const body = {
      add_on_name: name.trim(),
      price: String(toNum(price)),
      category_ids: categoryIds,
      ingredients: rows.map((r) => ({
        inventory_item_id: r.itemId as number,
        quantity: String(toNum(r.qty)),
      })),
    };
    try {
      const res =
        selectedId === null
          ? await createAddOn(body)
          : await updateAddOn(selectedId, body);
      setSelectedId(res.data.add_on_id);
      await onChanged();
    } catch (e) {
      setFormError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- delete ---------------- */

  const handleDelete = async () => {
    if (selectedId === null || saving) return;
    setSaving(true);
    setFormError(null);
    try {
      await deleteAddOn(selectedId);
      await onChanged();
      startCreate();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        // Sold before: can't delete, but can stop offering it.
        setBlockedBySales(true);
      }
      setFormError(errorMessage(e));
      setConfirmingDelete(false);
    } finally {
      setSaving(false);
    }
  };

  const removeFromAllCategories = async () => {
    if (selectedId === null || saving) return;
    setSaving(true);
    setFormError(null);
    try {
      await updateAddOn(selectedId, { category_ids: [] });
      setCategoryIds([]);
      setBlockedBySales(false);
      await onChanged();
    } catch (e) {
      setFormError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const isCreate = selectedId === null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center bg-black/60"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="w-full items-center px-6"
          style={{ height: "100%", justifyContent: "center" }}
        >
          <Pressable
            onPress={() => {}}
            className="w-full overflow-hidden rounded-2xl border border-tertiary-soft bg-white"
            style={{ maxWidth: 980, height: "88%" }}
          >
            {/* Header */}
            <View className="flex-row items-center px-6 py-4 bg-neutral border-b border-tertiary-soft/60">
              <View className="flex-1">
                <Text className="text-[16px] font-semibold text-secondary">
                  Manage Add-ons
                </Text>
                <Text className="text-[12px] text-secondary/60">
                  Create modifiers, choose which categories offer them, and set
                  the ingredients they use.
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                accessibilityLabel="Close"
              >
                <Text className="text-secondary text-xl">✕</Text>
              </Pressable>
            </View>

            <View className="flex-1 flex-row min-h-0">
              {/* ---------------- Left: list ---------------- */}
              <View className="w-[300px] border-r border-tertiary-soft/60 bg-neutral/50">
                <View className="p-4">
                  <Pressable
                    onPress={startCreate}
                    className={`h-11 items-center justify-center rounded-xl ${
                      isCreate ? "bg-primary" : "bg-white border border-primary"
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        isCreate ? "text-white" : "text-primary"
                      }`}
                    >
                      + Create add-on
                    </Text>
                  </Pressable>
                  <TextInput
                    value={listSearch}
                    onChangeText={setListSearch}
                    placeholder="Search add-ons"
                    placeholderTextColor="#9CA3AF"
                    className="mt-3 h-10 rounded-xl border border-tertiary-soft bg-white px-3 text-secondary"
                  />
                </View>

                <Text className="px-4 pb-2 text-[11px] font-bold tracking-wider text-secondary/60">
                  CONFIGURED ADD-ONS ({addOns.length})
                </Text>

                <ScrollView
                  className="flex-1"
                  contentContainerStyle={{
                    paddingHorizontal: 12,
                    paddingBottom: 12,
                  }}
                >
                  {filteredAddOns.length === 0 ? (
                    <Text className="text-center text-secondary/60 py-6 text-[13px]">
                      No add-ons found
                    </Text>
                  ) : (
                    filteredAddOns.map((a) => {
                      const active = a.add_on_id === selectedId;
                      const catCount = a.category_ids?.length ?? 0;
                      return (
                        <Pressable
                          key={a.add_on_id}
                          onPress={() => selectAddOn(a)}
                          className={`mb-2 rounded-xl border p-3 ${
                            active
                              ? "border-primary bg-white"
                              : "border-tertiary-soft/60 bg-white"
                          }`}
                        >
                          <View className="flex-row items-start justify-between">
                            <Text
                              className="flex-1 pr-2 font-semibold text-secondary"
                              numberOfLines={1}
                            >
                              {a.add_on_name}
                            </Text>
                            <Text className="font-semibold text-primary">
                              +{peso(a.price)}
                            </Text>
                          </View>
                          <Text className="mt-1 text-[12px] text-secondary/60">
                            {catCount === 0
                              ? "Not offered anywhere"
                              : `${catCount} ${catCount === 1 ? "category" : "categories"}`}
                            {a.ingredients?.length
                              ? ` · ${a.ingredients.length} ingredient${a.ingredients.length === 1 ? "" : "s"}`
                              : " · no stock deduction"}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </ScrollView>
              </View>

              {/* ---------------- Right: form ---------------- */}
              <View className="flex-1 min-w-0">
                <ScrollView
                  contentContainerStyle={{ padding: 24 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text className="text-[16px] font-semibold text-secondary mb-4">
                    {isCreate ? "New add-on" : `Edit: ${name || "add-on"}`}
                  </Text>

                  {/* 1. Basics */}
                  <Text className="text-[12px] font-bold tracking-wider text-secondary/70 mb-3">
                    1. BASIC SPECIFICATIONS
                  </Text>
                  <View className="flex-row">
                    <View className="flex-[3] mr-3">
                      <Label>ADD-ON NAME *</Label>
                      <Field
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Extra Espresso Shot"
                      />
                    </View>
                    <View className="flex-[2]">
                      <Label>ADDITIONAL PRICE (+₱) *</Label>
                      <Field
                        value={price}
                        onChangeText={setPrice}
                        prefix="₱"
                        numeric
                        placeholder="0.00"
                      />
                    </View>
                  </View>

                  {/* 2. Categories */}
                  <Text className="mt-8 text-[12px] font-bold tracking-wider text-secondary/70">
                    2. APPLICABLE CATEGORIES *
                  </Text>
                  <Text className="mt-1 mb-3 text-[13px] text-secondary/70">
                    The add-on is offered on every product in the selected
                    categories.
                  </Text>
                  <View className="flex-row flex-wrap">
                    {categories.map((c) => {
                      const on = categoryIds.includes(c.category_id);
                      return (
                        <Pressable
                          key={c.category_id}
                          onPress={() => toggleCategory(c.category_id)}
                          className={`mr-2 mb-2 rounded-full border px-3 py-1.5 ${
                            on
                              ? "bg-primary border-primary"
                              : "bg-white border-tertiary-soft"
                          }`}
                        >
                          <Text
                            className={on ? "text-white" : "text-secondary"}
                          >
                            {c.category_name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {/* Categories the add-on has that no longer exist in the list */}
                  {categoryIds.some((id) => !categoryName.has(id)) && (
                    <Text className="text-[12px] text-secondary/60">
                      Some selected categories are no longer available.
                    </Text>
                  )}

                  {/* 3. Ingredients */}
                  <View className="mt-8 flex-row items-start justify-between">
                    <View className="flex-1 pr-4">
                      <Text className="text-[12px] font-bold tracking-wider text-secondary/70">
                        3. LINKED INVENTORY DEDUCTIONS
                      </Text>
                      <Text className="mt-1 text-[13px] text-secondary/70">
                        Ingredients deducted from stock each time the add-on is
                        sold. Leave empty for no deduction.
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setRows((prev) => [...prev, newRow()])}
                      className="py-1"
                    >
                      <Text className="text-[14px] font-semibold text-primary">
                        + Add ingredient
                      </Text>
                    </Pressable>
                  </View>

                  <View className="mt-3">
                    {rows.length === 0 ? (
                      <Text className="py-4 text-center text-[13px] text-secondary/60">
                        No ingredients linked. This add-on won't deduct stock.
                      </Text>
                    ) : (
                      rows.map((r) => (
                        <View
                          key={r.key}
                          className="mb-3 rounded-xl border border-tertiary-soft/60 bg-neutral/60 p-3"
                        >
                          <View className="flex-row items-start">
                            <View className="flex-[3] mr-3">
                              <Label>RAW INVENTORY ITEM</Label>
                              <IngredientPicker
                                value={r.itemId}
                                items={pickerItems}
                                takenIds={takenIds}
                                onChange={(id) =>
                                  updateRow(r.key, { itemId: id })
                                }
                              />
                            </View>
                            <View className="flex-[1.5] mr-3">
                              <Label>DEDUCTION QTY</Label>
                              <Field
                                value={r.qty}
                                onChangeText={(v) =>
                                  updateRow(r.key, { qty: v })
                                }
                                suffix={unitOf(r.itemId)}
                                numeric
                                placeholder="0"
                              />
                            </View>
                            <Pressable
                              onPress={() =>
                                setRows((prev) =>
                                  prev.filter((x) => x.key !== r.key),
                                )
                              }
                              hitSlop={8}
                              accessibilityLabel="Remove ingredient"
                              className="mt-7 h-12 justify-center"
                            >
                              <Text className="text-warn font-medium">
                                Remove
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </ScrollView>

                {/* Error banner */}
                {formError && (
                  <View className="border-t border-tertiary-soft/60 bg-white px-6 py-3">
                    <Text className="text-[13px] text-warn">{formError}</Text>
                    {blockedBySales && (
                      <Pressable
                        onPress={removeFromAllCategories}
                        disabled={saving}
                        className="mt-2 self-start rounded-lg border border-primary px-3 py-1"
                      >
                        <Text className="text-primary font-medium">
                          Remove from all categories
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {/* Footer */}
                <View className="flex-row items-center border-t border-tertiary-soft/60 bg-neutral px-6 py-4">
                  <View className="flex-1 flex-row items-center">
                    {!isCreate &&
                      (confirmingDelete ? (
                        <>
                          <Text className="text-secondary text-sm mr-3">
                            Delete this add-on?
                          </Text>
                          <Pressable
                            onPress={handleDelete}
                            disabled={saving}
                            className="bg-warn rounded-lg px-3 py-1 mr-2"
                          >
                            <Text className="text-white font-medium">
                              Delete
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => setConfirmingDelete(false)}
                            className="border border-tertiary-soft rounded-lg px-3 py-1"
                          >
                            <Text className="text-secondary">Keep</Text>
                          </Pressable>
                        </>
                      ) : (
                        <Pressable
                          onPress={() => {
                            resetStatus();
                            setConfirmingDelete(true);
                          }}
                          className="border border-warn rounded-lg px-3 py-2"
                        >
                          <Text className="text-warn font-medium">Delete</Text>
                        </Pressable>
                      ))}
                  </View>
                  <Button label="Close" variant="outline" onPress={onClose} />
                  <View className="w-3" />
                  <Button
                    label={
                      saving
                        ? "Saving…"
                        : isCreate
                          ? "Create Add-on"
                          : "Save Changes"
                    }
                    onPress={handleSave}
                  />
                </View>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
