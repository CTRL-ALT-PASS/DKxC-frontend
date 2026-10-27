// ProductFormScreen.tsx
// Create / Edit Product screen for the POS + Inventory app (Expo + React Native + NativeWind v4).
// Restyled to match the Stitch design: card sections, rose/maroon theme, linked-deduction chips.
//
// Only the page body + sticky footer live here. The sidebar, top bar and breadcrumb belong to
// your app layout, so this screen renders a plain <View className="flex-1"> (no SafeAreaView).
//
// Packages:
//   npx expo install expo-image-picker
//   (@expo/vector-icons is bundled with Expo)
//
// Colors use Tailwind's built-in `rose` palette (rose-700 accent, rose-950 ≈ your sidebar maroon),
// so no tailwind.config changes are needed.
//
// Usage with expo-router, e.g. app/products/new.tsx:
//   <ProductFormScreen
//     categoryOptions={...}
//     ingredientOptions={...}   // [{ id, label, unit: "g" }, ...]
//     onCancel={() => router.back()}
//     onSave={async (values) => { await api.createProduct(values); router.back(); }}
//   />

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import {
  Alert,
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
  View,
} from "react-native";

// Old architecture needs this flag for LayoutAnimation on Android (no-op on new arch).
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ----------------------------- Types ----------------------------- */

// `unit` is optional: ingredient options can carry their unit of measurement (e.g. "g", "ml").
// When an ingredient is picked, its unit is copied into the row; otherwise it stays "u".
export type Option = { id: string; label: string; unit?: string };

export type IngredientLine = {
  id: string; // local row id
  ingredientId: string | null;
  qty: string;
  unit: string;
};

export type Variant = {
  id: string;
  name: string;
  extraCost: string;
  ingredients: IngredientLine[]; // "linked deductions"
};

export type ProductFormValues = {
  imageUri: string | null;
  name: string;
  categoryId: string | null;
  price: string;
  ingredients: IngredientLine[];
  sizesEnabled: boolean;
  sizes: Variant[];
  addOnsEnabled: boolean;
  addOns: Variant[];
};

type Props = {
  mode?: "new" | "edit";
  initialValues?: Partial<ProductFormValues>;
  categoryOptions: Option[];
  ingredientOptions: Option[];
  syncActive?: boolean; // shows the green "Inventory Sync Active" pill
  onSave: (values: ProductFormValues) => void | Promise<void>;
  onCancel: () => void;
};

/* ----------------------------- Helpers ----------------------------- */

const DEFAULT_UNIT = "u";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ROSE = "#be123c"; // rose-700
const ROSE_SOFT = "#fda4af"; // rose-300
const MUTED = "#a3a3a3"; // neutral-400

const uid = () => Math.random().toString(36).slice(2, 10);
const newLine = (): IngredientLine => ({
  id: uid(),
  ingredientId: null,
  qty: "",
  unit: DEFAULT_UNIT,
});
const newVariant = (): Variant => ({
  id: uid(),
  name: "",
  extraCost: "",
  ingredients: [newLine()],
});
const decimalOnly = (t: string) => t.replace(/[^0-9.]/g, "");
const animate = () =>
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

// Drop half-filled ingredient rows before saving.
const cleanLines = (lines: IngredientLine[]) =>
  lines.filter((l) => l.ingredientId && l.qty.length > 0);
const cleanVariants = (rows: Variant[]) =>
  rows
    .filter((r) => r.name.trim().length > 0)
    .map((r) => ({
      ...r,
      name: r.name.trim(),
      ingredients: cleanLines(r.ingredients),
    }));

const patchLine = (
  lines: IngredientLine[],
  id: string,
  patch: Partial<IngredientLine>,
) => lines.map((l) => (l.id === id ? { ...l, ...patch } : l));

const pickIngredient = (
  lines: IngredientLine[],
  lineId: string,
  ingredientId: string,
  options: Option[],
) =>
  patchLine(lines, lineId, {
    ingredientId,
    unit: options.find((o) => o.id === ingredientId)?.unit ?? DEFAULT_UNIT,
  });

// "Regular 12oz (Hot/Cold)" -> "12oz"; otherwise first 3 letters.
const sizeBadge = (name: string, index: number) => {
  const m = name.match(/\d+(\.\d+)?\s?(oz|ml|l|g|kg)\b/i);
  if (m) return m[0].replace(/\s/g, "").toLowerCase();
  return name.trim().slice(0, 3).toUpperCase() || `#${index + 1}`;
};
const addOnBadge = () => "+";

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

/* ----------------------------- Base recipe rows (Basic Information card) ----------------------------- */

function BaseRecipe({
  lines,
  ingredientOptions,
  onChange,
}: {
  lines: IngredientLine[];
  ingredientOptions: Option[];
  onChange: (lines: IngredientLine[]) => void;
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

      <View className="gap-2 rounded-xl border border-rose-100 bg-rose-50/60 p-3">
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
                  onChange(
                    pickIngredient(lines, line.id, id, ingredientOptions),
                  )
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
                {line.unit}
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
    </View>
  );
}

/* ----------------------------- Linked deduction chips (inside a variant) ----------------------------- */

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
          onChange={(id) =>
            onChange({
              ingredientId: id,
              unit:
                ingredientOptions.find((o) => o.id === id)?.unit ??
                DEFAULT_UNIT,
            })
          }
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
      <Text className="w-7 text-xs text-neutral-500">{line.unit}</Text>
      <Pressable onPress={onRemove} hitSlop={8}>
        <Ionicons name="close" size={16} color={MUTED} />
      </Pressable>
    </View>
  );
}

/* ----------------------------- Variant card (Sizes / Add-ons) ----------------------------- */

function VariantCard({
  row,
  index,
  nameLabel,
  namePlaceholder,
  costLabel,
  badge,
  ingredientOptions,
  onChange,
  onRemove,
}: {
  row: Variant;
  index: number;
  nameLabel: string;
  namePlaceholder: string;
  costLabel: string;
  badge: string;
  ingredientOptions: Option[];
  onChange: (patch: Partial<Variant>) => void;
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
          <Label text={nameLabel} />
          <TextInput
            value={row.name}
            onChangeText={(name) => onChange({ name })}
            placeholder={namePlaceholder}
            placeholderTextColor={MUTED}
            className="h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 focus:border-rose-500"
          />
        </View>

        <View className="w-48">
          <Label text={costLabel} />
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
                  {row.name.trim() || "this item"}
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

/* ----------------------------- Toggleable variant section card ----------------------------- */

function VariantSection({
  icon,
  title,
  subtitle,
  enabled,
  onToggle,
  rows,
  onChange,
  ingredientOptions,
  nameLabel,
  namePlaceholder,
  costLabel,
  addLabel,
  badgeFor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  rows: Variant[];
  onChange: (rows: Variant[]) => void;
  ingredientOptions: Option[];
  nameLabel: string;
  namePlaceholder: string;
  costLabel: string;
  addLabel: string;
  badgeFor: (name: string, index: number) => string;
}) {
  return (
    <Card>
      <CardHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
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
            <VariantCard
              key={row.id}
              row={row}
              index={i}
              nameLabel={nameLabel}
              namePlaceholder={namePlaceholder}
              costLabel={costLabel}
              badge={badgeFor(row.name, i)}
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
              onChange([...rows, newVariant()]);
            }}
            className="h-11 flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-rose-300 active:bg-rose-50"
          >
            <Ionicons name="add" size={18} color={ROSE} />
            <Text className="text-sm font-semibold text-rose-700">
              {addLabel}
            </Text>
          </Pressable>
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
  syncActive = true,
  onSave,
  onCancel,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);

  const [imageUri, setImageUri] = useState(initialValues?.imageUri ?? null);
  const [name, setName] = useState(initialValues?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    initialValues?.categoryId ?? null,
  );
  const [price, setPrice] = useState(initialValues?.price ?? "");
  const [ingredients, setIngredients] = useState<IngredientLine[]>(
    initialValues?.ingredients ?? [newLine()],
  );
  const [sizesEnabled, setSizesEnabled] = useState(
    initialValues?.sizesEnabled ?? false,
  );
  const [sizes, setSizes] = useState<Variant[]>(
    initialValues?.sizes ?? [newVariant()],
  );
  const [addOnsEnabled, setAddOnsEnabled] = useState(
    initialValues?.addOnsEnabled ?? false,
  );
  const [addOns, setAddOns] = useState<Variant[]>(
    initialValues?.addOns ?? [newVariant()],
  );
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    name: name.trim().length === 0 ? "Product name is required" : undefined,
    category: categoryId === null ? "Pick a category" : undefined,
    price: price.length === 0 ? "Base price is required" : undefined,
  };
  const isValid = !errors.name && !errors.category && !errors.price;

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
      Alert.alert("Image too large", "Please choose a photo up to 5MB.");
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
      // Half-filled rows are dropped; sections toggled off are saved as empty.
      await onSave({
        imageUri,
        name: name.trim(),
        categoryId,
        price,
        ingredients: cleanLines(ingredients),
        sizesEnabled,
        sizes: sizesEnabled ? cleanVariants(sizes) : [],
        addOnsEnabled,
        addOns: addOnsEnabled ? cleanVariants(addOns) : [],
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
          <View className="flex-row items-start justify-between">
            <View className="flex-1 gap-1">
              <Text className="text-3xl font-bold text-neutral-900">
                {mode === "new" ? "Create New Product" : "Edit Product"}
              </Text>
              <Text className="text-xs text-neutral-500">
                Configure base details, pricing, standard recipe deductions, cup
                sizes, and beverage add-ons.
              </Text>
            </View>
            {syncActive && (
              <View className="flex-row items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1">
                <View className="h-1.5 w-1.5 rounded-full bg-green-600" />
                <Text className="text-[11px] font-medium text-green-700">
                  Inventory Sync Active
                </Text>
              </View>
            )}
          </View>

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
                    className={`h-11 rounded-lg border bg-white px-3 text-sm text-neutral-900 focus:border-rose-500 ${submitted && errors.name ? "border-rose-500" : "border-neutral-200"}`}
                  />
                  {submitted && <ErrorText text={errors.name} />}
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
                </View>

                <BaseRecipe
                  lines={ingredients}
                  ingredientOptions={ingredientOptions}
                  onChange={setIngredients}
                />
              </View>
            </View>
          </Card>

          {/* Sizes & Portions */}
          <VariantSection
            icon="resize-outline"
            title="Sizes & Portions"
            subtitle="Define serving sizes, additional price charges, and specific inventory subtractions."
            enabled={sizesEnabled}
            onToggle={setSizesEnabled}
            rows={sizes}
            onChange={setSizes}
            ingredientOptions={ingredientOptions}
            nameLabel="Variant name"
            namePlaceholder="e.g. Regular 12oz (Hot/Cold)"
            costLabel="Additional cost (+₱)"
            addLabel="Add Size"
            badgeFor={sizeBadge}
          />

          {/* Add-ons */}
          <VariantSection
            icon="add-circle-outline"
            title="Add-ons & Extras"
            subtitle="Optional extras customers can add, with their own price and inventory deductions."
            enabled={addOnsEnabled}
            onToggle={setAddOnsEnabled}
            rows={addOns}
            onChange={setAddOns}
            ingredientOptions={ingredientOptions}
            nameLabel="Add-on name"
            namePlaceholder="e.g. Extra shot"
            costLabel="Additional cost (+₱)"
            addLabel="Add Add-on"
            badgeFor={addOnBadge}
          />
        </ScrollView>

        {/* Sticky action bar */}
        <View className="flex-row items-center justify-between border-t border-rose-100 bg-white px-8 py-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="cloud-done-outline" size={16} color={ROSE} />
            <Text className="text-xs text-neutral-500">
              Changes ready to publish to POS terminals
            </Text>
          </View>
          <View className="flex-row gap-3">
            <Pressable
              onPress={onCancel}
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
