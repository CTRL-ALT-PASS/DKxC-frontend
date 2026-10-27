// ProductFormScreen.tsx
// Create / Edit Product screen (Expo + React Native + NativeWind v4).
//
// Add-ons are NOT created here. Which add-ons a category offers is managed in the add-on
// management flow; this screen only lets you switch off add-ons for this one product.

import { notify } from "@/utils/dialogs";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  UIManager,
  View
} from "react-native";

// Old architecture needs this flag for LayoutAnimation on Android (no-op on new arch).
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ----------------------------- Types ----------------------------- */

// `unit` is the ingredient's base unit (g, mL, pcs...). Recipe quantities are always in it.
export type Option = { id: string; label: string; unit?: string };

export type AddOnOption = {
  id: number;
  name: string;
  price: string;
  categoryIds: number[]; // categories that offer this add-on
};

export type ProductStatus = "Active" | "Inactive" | "Discontinued";

export type IngredientLine = {
  id: string; // local row id
  ingredientId: string | null;
  qty: string;
};

export type SizeRow = {
  id: string; // local row id
  sizeId?: number; // set for sizes that already exist (must be sent back on PATCH)
  name: string;
  extraCost: string;
  ingredients: IngredientLine[];
};

export type ProductFormValues = {
  name: string;
  imageUri: string | null;
  description: string;
  categoryId: string | null;
  price: string;
  status: ProductStatus;
  ingredients: IngredientLine[];
  sizesEnabled: boolean;
  sizes: SizeRow[];
  disabledAddOnIds: number[];
};

type Props = {
  mode?: "new" | "edit";
  initialValues?: Partial<ProductFormValues>;
  categoryOptions: Option[];
  ingredientOptions: Option[];
  addOns: AddOnOption[]; // every add-on; the form filters by the selected category
  onSave: (values: ProductFormValues) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onCancel: () => void;
};

/* ----------------------------- Helpers ----------------------------- */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ROSE = "#be123c"; // rose-700
const MUTED = "#a3a3a3"; // neutral-400

const STATUS_OPTIONS: Option[] = [
  { id: "Active", label: "Active" },
  { id: "Inactive", label: "Inactive" },
  { id: "Discontinued", label: "Discontinued" },
];

export const uid = () => Math.random().toString(36).slice(2, 10);
const newLine = (): IngredientLine => ({
  id: uid(),
  ingredientId: null,
  qty: "",
});
const newSize = (): SizeRow => ({
  id: uid(),
  name: "",
  extraCost: "",
  ingredients: [newLine()],
});
const decimalOnly = (t: string) => t.replace(/[^0-9.]/g, "");
const animate = () =>
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

const unitFor = (options: Option[], ingredientId: string | null) =>
  options.find((o) => o.id === ingredientId)?.unit ?? "—";

// Drop half-filled (or zero-quantity) ingredient rows before validating/saving.
const cleanLines = (lines: IngredientLine[]) =>
  lines.filter((l) => l.ingredientId && Number(l.qty) > 0);
const cleanSizes = (rows: SizeRow[]) =>
  rows
    .filter((r) => r.name.trim().length > 0)
    .map((r) => ({
      ...r,
      name: r.name.trim(),
      ingredients: cleanLines(r.ingredients),
    }));

const hasDuplicateIngredient = (lines: IngredientLine[]) =>
  new Set(lines.map((l) => l.ingredientId)).size !== lines.length;

const patchLine = (
  lines: IngredientLine[],
  id: string,
  patch: Partial<IngredientLine>,
) => lines.map((l) => (l.id === id ? { ...l, ...patch } : l));

// "Regular 12oz (Hot/Cold)" -> "12oz"; otherwise first 3 letters.
const sizeBadge = (name: string, index: number) => {
  const m = name.match(/\d+(\.\d+)?\s?(oz|ml|l|g|kg)\b/i);
  if (m) return m[0].replace(/\s/g, "").toLowerCase();
  return name.trim().slice(0, 3).toUpperCase() || `#${index + 1}`;
};

const formatPeso = (v: string) => `₱${Number(v).toFixed(2)}`;

/* ----------------------------- Small UI pieces ----------------------------- */

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
      {text}
      {required ? <Text className="text-rose-600"> *</Text> : null}
    </Text>
  );
}

function ErrorText({ text }: { text?: string }) {
  if (!text) return null;
  return <Text className="mt-1 text-xs text-rose-600">{text}</Text>;
}

function LinkButton({
  label,
  icon = "add-circle",
  onPress,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      className="flex-row items-center gap-1 active:opacity-60"
    >
      <Ionicons name={icon} size={14} color={ROSE} />
      <Text className="text-xs font-semibold text-rose-700">{label}</Text>
    </Pressable>
  );
}

function IconButton({
  name,
  onPress,
  color = MUTED,
  size = 18,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      className="h-8 w-8 items-center justify-center rounded-md active:bg-rose-100"
    >
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
      {children}
    </View>
  );
}

function CardHeader({
  icon,
  title,
  subtitle,
  right,
  divider,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  divider?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center gap-3 ${divider ? "mb-5 border-b border-rose-100 pb-4" : ""}`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-rose-50">
        <Ionicons name={icon} size={18} color={ROSE} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-neutral-900">
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-xs text-neutral-500">{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/* ----------------------------- Select ----------------------------- */

function Select({
  value,
  options,
  placeholder = "Select",
  onChange,
  error,
  flat,
}: {
  value: string | null;
  options: Option[];
  placeholder?: string;
  onChange: (id: string) => void;
  error?: boolean;
  flat?: boolean; // borderless variant used inside chips
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className={
          flat
            ? "h-10 flex-row items-center justify-between"
            : `h-11 flex-row items-center justify-between rounded-lg border bg-white px-3 ${error ? "border-rose-500" : "border-neutral-200"}`
        }
      >
        <Text
          numberOfLines={1}
          className={`flex-1 text-sm ${selected ? "text-neutral-900" : "text-neutral-400"}`}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={14} color={MUTED} />
      </Pressable>

      <Modal
        transparent
        animationType="fade"
        visible={open}
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/40"
          onPress={() => setOpen(false)}
        >
          <View className="max-h-[70%] w-96 overflow-hidden rounded-2xl bg-white py-2">
            <ScrollView nestedScrollEnabled>
              {options.length === 0 && (
                <Text className="px-4 py-3 text-sm text-neutral-400">
                  No options available
                </Text>
              )}
              {options.map((o) => (
                <Pressable
                  key={o.id}
                  onPress={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  className="flex-row items-center justify-between px-4 py-3 active:bg-rose-50"
                >
                  <Text className="text-base text-neutral-900">{o.label}</Text>
                  {o.id === value && (
                    <Ionicons name="checkmark" size={18} color={ROSE} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/* ----------------------------- Inputs ----------------------------- */

function PesoInput({
  value,
  onChange,
  placeholder = "0.00",
  prefix = "₱",
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  error?: boolean;
}) {
  return (
    <View
      className={`h-11 flex-row items-center gap-2 rounded-lg border bg-white px-3 ${error ? "border-rose-500" : "border-neutral-200"}`}
    >
      <Text className="text-sm font-semibold text-rose-700">{prefix}</Text>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(decimalOnly(t))}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        className="h-full flex-1 text-sm text-neutral-900"
      />
    </View>
  );
}

/* ----------------------------- Base recipe rows ----------------------------- */

function BaseRecipe({
  lines,
  ingredientOptions,
  onChange,
  error,
}: {
  lines: IngredientLine[];
  ingredientOptions: Option[];
  onChange: (lines: IngredientLine[]) => void;
  error?: string;
}) {
  return (
    <View>
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          Base recipe deduction{" "}
          <Text className="font-normal normal-case tracking-normal text-neutral-400">
            (standard ingredients deducted per order)
          </Text>
        </Text>
        <LinkButton
          label="Add Ingredient"
          onPress={() => {
            animate();
            onChange([...lines, newLine()]);
          }}
        />
      </View>

      <View
        className={`gap-2 rounded-xl border bg-rose-50/60 p-3 ${error ? "border-rose-400" : "border-rose-100"}`}
      >
        {lines.length === 0 && (
          <Text className="py-2 text-center text-xs text-neutral-400">
            No ingredients yet. Tap “Add Ingredient”.
          </Text>
        )}
        {lines.map((line) => (
          <View key={line.id} className="flex-row items-center gap-2">
            <View className="flex-1">
              <Select
                value={line.ingredientId}
                options={ingredientOptions}
                placeholder="Select ingredient"
                onChange={(id) =>
                  onChange(patchLine(lines, line.id, { ingredientId: id }))
                }
              />
            </View>
            <TextInput
              value={line.qty}
              onChangeText={(t) =>
                onChange(patchLine(lines, line.id, { qty: decimalOnly(t) }))
              }
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={MUTED}
              className="h-11 w-24 rounded-lg border border-neutral-200 bg-white text-center text-sm text-neutral-900 focus:border-rose-500"
            />
            <View className="h-11 w-20 items-center justify-center rounded-lg bg-rose-100">
              <Text className="text-xs font-semibold text-rose-800">
                {unitFor(ingredientOptions, line.ingredientId)}
              </Text>
            </View>
            <IconButton
              name="trash-outline"
              onPress={() => {
                animate();
                onChange(lines.filter((l) => l.id !== line.id));
              }}
            />
          </View>
        ))}
      </View>
      <ErrorText text={error} />
    </View>
  );
}

/* ----------------------------- Linked deduction chips (inside a size) ----------------------------- */

function DeductionChip({
  line,
  ingredientOptions,
  onChange,
  onRemove,
}: {
  line: IngredientLine;
  ingredientOptions: Option[];
  onChange: (patch: Partial<IngredientLine>) => void;
  onRemove: () => void;
}) {
  return (
    <View className="h-10 w-[49%] flex-row items-center gap-2 rounded-lg border border-neutral-200 bg-white pl-3 pr-2">
      <View className="h-1.5 w-1.5 rounded-full bg-rose-600" />
      <View className="flex-1">
        <Select
          flat
          value={line.ingredientId}
          options={ingredientOptions}
          placeholder="Select item"
          onChange={(id) => onChange({ ingredientId: id })}
        />
      </View>
      <TextInput
        value={line.qty}
        onChangeText={(t) => onChange({ qty: decimalOnly(t) })}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={MUTED}
        className="h-7 w-12 rounded bg-rose-50 px-1 text-center text-xs font-semibold text-neutral-900 focus:bg-rose-100"
      />
      <Text className="w-7 text-xs text-neutral-500">
        {unitFor(ingredientOptions, line.ingredientId)}
      </Text>
      <Pressable onPress={onRemove} hitSlop={8}>
        <Ionicons name="close" size={16} color={MUTED} />
      </Pressable>
    </View>
  );
}

/* ----------------------------- Size card ----------------------------- */

function SizeCard({
  row,
  badge,
  ingredientOptions,
  onChange,
  onRemove,
}: {
  row: SizeRow;
  badge: string;
  ingredientOptions: Option[];
  onChange: (patch: Partial<SizeRow>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
      <View className="flex-row items-end gap-4">
        <View className="h-11 min-w-12 items-center justify-center rounded-lg bg-rose-100 px-2">
          <Text className="text-xs font-bold text-rose-800">{badge}</Text>
        </View>

        <View className="flex-1">
          <Label text="Size name" />
          <TextInput
            value={row.name}
            onChangeText={(name) => onChange({ name })}
            placeholder="e.g. Iced 16oz"
            placeholderTextColor={MUTED}
            maxLength={30}
            className="h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 focus:border-rose-500"
          />
        </View>

        <View className="w-48">
          <Label text="Additional cost (+₱)" />
          <PesoInput
            prefix="+₱"
            value={row.extraCost}
            onChange={(extraCost) => onChange({ extraCost })}
          />
        </View>

        <Pressable
          onPress={() => {
            animate();
            setExpanded((e) => !e);
          }}
          className={`h-11 flex-row items-center gap-1.5 rounded-lg border px-3 ${expanded ? "border-rose-300 bg-rose-50" : "border-neutral-200 bg-white"}`}
        >
          <Ionicons
            name="list-outline"
            size={16}
            color={expanded ? ROSE : "#525252"}
          />
          <Text className="text-xs font-medium text-neutral-700">
            Recipe ({row.ingredients.length})
          </Text>
        </Pressable>

        <View className="h-11 justify-center">
          <IconButton name="trash-outline" onPress={onRemove} />
        </View>
      </View>

      {expanded && (
        <View className="mt-4 border-t border-rose-100 pt-4">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="link-outline" size={14} color={ROSE} />
              <Text className="text-xs font-medium text-neutral-600">
                Linked Deductions for{" "}
                <Text className="font-semibold text-neutral-800">
                  {row.name.trim() || "this size"}
                </Text>
                :
              </Text>
            </View>
            <LinkButton
              label="Add Item"
              icon="add"
              onPress={() => {
                animate();
                onChange({ ingredients: [...row.ingredients, newLine()] });
              }}
            />
          </View>

          {row.ingredients.length === 0 ? (
            <Text className="py-1 text-xs text-neutral-400">
              No linked deductions. Tap “Add Item”.
            </Text>
          ) : (
            <View className="flex-row flex-wrap justify-between gap-y-2">
              {row.ingredients.map((line) => (
                <DeductionChip
                  key={line.id}
                  line={line}
                  ingredientOptions={ingredientOptions}
                  onChange={(patch) =>
                    onChange({
                      ingredients: patchLine(row.ingredients, line.id, patch),
                    })
                  }
                  onRemove={() => {
                    animate();
                    onChange({
                      ingredients: row.ingredients.filter(
                        (l) => l.id !== line.id,
                      ),
                    });
                  }}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

/* ----------------------------- Sizes section ----------------------------- */

function SizesSection({
  enabled,
  onToggle,
  rows,
  onChange,
  ingredientOptions,
  error,
}: {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  rows: SizeRow[];
  onChange: (rows: SizeRow[]) => void;
  ingredientOptions: Option[];
  error?: string;
}) {
  return (
    <Card>
      <CardHeader
        icon="resize-outline"
        title="Sizes & Portions"
        subtitle="Serving sizes, additional price charges, and the extra inventory each size deducts. One size must cost +₱0 (the base size)."
        right={
          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-neutral-500">
              {enabled ? "Enabled" : "Disabled"}
            </Text>
            <Switch
              value={enabled}
              onValueChange={(v) => {
                animate();
                onToggle(v);
              }}
              trackColor={{ false: "#d4d4d4", true: ROSE }}
              thumbColor="#fff"
            />
          </View>
        }
      />

      {/* Not rendered when off. State lives in the parent, so nothing is lost on toggle. */}
      {enabled && (
        <View className="mt-5 gap-3">
          {rows.map((row, i) => (
            <SizeCard
              key={row.id}
              row={row}
              badge={sizeBadge(row.name, i)}
              ingredientOptions={ingredientOptions}
              onChange={(patch) =>
                onChange(
                  rows.map((r) => (r.id === row.id ? { ...r, ...patch } : r)),
                )
              }
              onRemove={() => {
                animate();
                onChange(rows.filter((r) => r.id !== row.id));
              }}
            />
          ))}

          <Pressable
            onPress={() => {
              animate();
              onChange([...rows, newSize()]);
            }}
            className="h-11 flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-rose-300 active:bg-rose-50"
          >
            <Ionicons name="add" size={18} color={ROSE} />
            <Text className="text-sm font-semibold text-rose-700">
              Add Size
            </Text>
          </Pressable>
          <ErrorText text={error} />
        </View>
      )}
    </Card>
  );
}

/* ----------------------------- Add-ons section (switch off per product) ----------------------------- */

function AddOnsSection({
  categoryChosen,
  offered,
  disabledIds,
  onToggle,
}: {
  categoryChosen: boolean;
  offered: AddOnOption[];
  disabledIds: number[];
  onToggle: (id: number, enabled: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader
        icon="add-circle-outline"
        title="Add-ons"
        subtitle="Offered by this product's category. Turn one off if it doesn't apply to this product. To change what a category offers, use Manage add-ons."
        divider
      />

      {!categoryChosen ? (
        <Text className="text-xs text-neutral-400">
          Select a category to see its add-ons.
        </Text>
      ) : offered.length === 0 ? (
        <Text className="text-xs text-neutral-400">
          This category doesn't offer any add-ons.
        </Text>
      ) : (
        <View className="gap-2">
          {offered.map((a) => {
            const enabled = !disabledIds.includes(a.id);
            return (
              <View
                key={a.id}
                className="flex-row items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/40 px-4 py-3"
              >
                <View className="flex-1">
                  <Text
                    className={`text-sm font-medium ${enabled ? "text-neutral-900" : "text-neutral-400"}`}
                  >
                    {a.name}
                  </Text>
                  <Text className="text-xs text-neutral-500">
                    +{formatPeso(a.price)}
                  </Text>
                </View>
                <Text className="text-xs text-neutral-500">
                  {enabled ? "Offered" : "Off for this product"}
                </Text>
                <Switch
                  value={enabled}
                  onValueChange={(v) => onToggle(a.id, v)}
                  trackColor={{ false: "#d4d4d4", true: ROSE }}
                  thumbColor="#fff"
                />
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

/* ----------------------------- Screen ----------------------------- */

export default function ProductFormScreen({
  mode = "new",
  initialValues,
  categoryOptions,
  ingredientOptions,
  addOns,
  onSave,
  onDelete,
  onCancel,
}: Props) {
  const [imageUri, setImageUri] = useState(initialValues?.imageUri ?? null);

  const scrollRef = useRef<ScrollView>(null);

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [categoryId, setCategoryId] = useState(
    initialValues?.categoryId ?? null,
  );
  const [price, setPrice] = useState(initialValues?.price ?? "");
  const [status, setStatus] = useState<ProductStatus>(
    initialValues?.status ?? "Active",
  );
  const [ingredients, setIngredients] = useState<IngredientLine[]>(
    initialValues?.ingredients ?? [newLine()],
  );
  const [sizesEnabled, setSizesEnabled] = useState(
    initialValues?.sizesEnabled ?? false,
  );
  const [sizes, setSizes] = useState<SizeRow[]>(
    initialValues?.sizes?.length ? initialValues.sizes : [newSize()],
  );
  const [disabledAddOnIds, setDisabledAddOnIds] = useState<number[]>(
    initialValues?.disabledAddOnIds ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Add-ons the selected category offers.
  const offeredAddOns = categoryId
    ? addOns.filter((a) => a.categoryIds.includes(Number(categoryId)))
    : [];

  /* ---- validation (mirrors the API rules) ---- */
  const cleanedBase = cleanLines(ingredients);
  const cleanedSizes = sizesEnabled ? cleanSizes(sizes) : [];

  const sizesError = (() => {
    if (!sizesEnabled) return undefined;
    if (cleanedSizes.length === 0)
      return "Add at least one size, or turn sizes off.";
    const names = cleanedSizes.map((s) => s.name.toLowerCase());
    if (new Set(names).size !== names.length)
      return "Size names must be different.";
    if (!cleanedSizes.some((s) => Number(s.extraCost || 0) === 0))
      return "One size must have an additional cost of +₱0 (the base size).";
    if (cleanedSizes.some((s) => hasDuplicateIngredient(s.ingredients)))
      return "A size recipe can't list the same ingredient twice.";
    return undefined;
  })();

  const errors = {
    name: name.trim().length === 0 ? "Product name is required" : undefined,
    category: categoryId === null ? "Pick a category" : undefined,
    price:
      price.length === 0 || Number.isNaN(Number(price))
        ? "Enter a valid base price"
        : undefined,
    ingredients:
      cleanedBase.length === 0
        ? "Add at least one ingredient with a quantity"
        : hasDuplicateIngredient(cleanedBase)
          ? "A recipe can't list the same ingredient twice"
          : undefined,
    sizes: sizesError,
  };
  const isValid = Object.values(errors).every((e) => !e);

  const toggleAddOn = (id: number, enabled: boolean) =>
    setDisabledAddOnIds((prev) =>
      enabled ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      notify("Image too large", "Please choose a photo up to 5MB.");
      return;
    }
    setImageUri(asset.uri);
  };

  const handleSave = async () => {
    if (saving) return;
    setSubmitted(true);
    if (!isValid) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setSaving(true);
    try {
      const offeredIds = new Set(offeredAddOns.map((a) => a.id));
      await onSave({
        imageUri,
        name: name.trim(),
        description: description.trim(),
        categoryId,
        price,
        status,
        ingredients: cleanedBase,
        sizesEnabled,
        sizes: cleanedSizes,
        // Only add-ons the chosen category still offers can be switched off.
        disabledAddOnIds: disabledAddOnIds.filter((id) => offeredIds.has(id)),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-rose-50/40">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerClassName="px-8 pt-8 pb-10 gap-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Page title */}
          <View className="gap-1">
            <Text className="text-3xl font-bold text-neutral-900">
              {mode === "new" ? "Create New Product" : "Edit Product"}
            </Text>
            <Text className="text-xs text-neutral-500">
              Configure base details, pricing, standard recipe deductions,
              sizes, and which category add-ons apply.
            </Text>
          </View>

          {submitted && !isValid && (
            <View className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3">
              <Text className="text-sm text-rose-700">
                Please fix the highlighted fields below.
              </Text>
            </View>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader icon="pricetag" title="Basic Information" divider />

            <View className="flex-row gap-6">
              {/* Photo */}
              <View>
                <Label text="Product photo" />
                <Pressable
                  onPress={pickImage}
                  className="h-44 w-44 items-center justify-center overflow-hidden rounded-xl border border-dashed border-rose-300 bg-rose-50/60 active:opacity-80"
                >
                  {imageUri ? (
                    <>
                      <Image
                        source={{ uri: imageUri }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                      <View className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded-full bg-black/60 px-2 py-1">
                        <Ionicons
                          name="camera-outline"
                          size={12}
                          color="#fff"
                        />
                        <Text className="text-[10px] text-white">Change</Text>
                      </View>
                    </>
                  ) : (
                    <View className="items-center gap-2 px-3">
                      <View className="h-11 w-11 items-center justify-center rounded-full bg-white">
                        <Ionicons name="cloud-upload" size={22} color={ROSE} />
                      </View>
                      <Text className="text-center text-xs font-medium text-neutral-800">
                        Click to upload photo
                      </Text>
                      <Text className="text-center text-[10px] text-neutral-400">
                        PNG, JPG, or WEBP up to 5MB
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>

              {/* Fields */}
              <View className="flex-1 gap-5">
                <View>
                  <Label text="Product name" required />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Iced Caramel Macchiato"
                    placeholderTextColor={MUTED}
                    maxLength={100}
                    className={`h-11 rounded-lg border bg-white px-3 text-sm text-neutral-900 focus:border-rose-500 ${submitted && errors.name ? "border-rose-500" : "border-neutral-200"}`}
                  />
                  {submitted && <ErrorText text={errors.name} />}
                </View>

                <View>
                  <Label text="Description" />
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Short description (optional)"
                    placeholderTextColor={MUTED}
                    maxLength={255}
                    className="h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 focus:border-rose-500"
                  />
                </View>

                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Label text="Category" required />
                    <Select
                      value={categoryId}
                      options={categoryOptions}
                      placeholder="Select category"
                      onChange={setCategoryId}
                      error={submitted && !!errors.category}
                    />
                    {submitted && <ErrorText text={errors.category} />}
                  </View>
                  <View className="flex-1">
                    <Label text="Base price (₱)" required />
                    <PesoInput
                      value={price}
                      onChange={setPrice}
                      placeholder="0.00"
                      error={submitted && !!errors.price}
                    />
                    {submitted && <ErrorText text={errors.price} />}
                  </View>
                  <View className="flex-1">
                    <Label text="Status" required />
                    <Select
                      value={status}
                      options={STATUS_OPTIONS}
                      onChange={(id) => setStatus(id as ProductStatus)}
                    />
                  </View>
                </View>

                <BaseRecipe
                  lines={ingredients}
                  ingredientOptions={ingredientOptions}
                  onChange={setIngredients}
                  error={submitted ? errors.ingredients : undefined}
                />
              </View>
            </View>
          </Card>

          {/* Sizes & Portions */}
          <SizesSection
            enabled={sizesEnabled}
            onToggle={setSizesEnabled}
            rows={sizes}
            onChange={setSizes}
            ingredientOptions={ingredientOptions}
            error={submitted ? errors.sizes : undefined}
          />

          {/* Add-ons (switch off per product) */}
          <AddOnsSection
            categoryChosen={categoryId !== null}
            offered={offeredAddOns}
            disabledIds={disabledAddOnIds}
            onToggle={toggleAddOn}
          />
        </ScrollView>

        {/* Sticky action bar */}
        <View className="flex-row items-center justify-between border-t border-rose-100 bg-white px-8 py-4">
          <View>
            {mode === "edit" && onDelete ? (
              <Pressable
                onPress={onDelete}
                disabled={saving}
                className="h-11 flex-row items-center gap-2 rounded-lg border border-rose-300 bg-white px-4 active:bg-rose-50"
              >
                <Ionicons name="trash-outline" size={16} color={ROSE} />
                <Text className="text-sm font-medium text-rose-700">
                  Delete product
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={onCancel}
              disabled={saving}
              className="h-11 items-center justify-center rounded-lg border border-neutral-300 bg-white px-6 active:bg-neutral-100"
            >
              <Text className="text-sm font-medium text-neutral-800">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              className={`h-11 flex-row items-center justify-center gap-2 rounded-lg px-6 ${saving ? "bg-rose-300" : "bg-rose-700 active:bg-rose-800"}`}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text className="text-sm font-semibold text-white">
                {saving ? "Saving…" : "Save Product"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
