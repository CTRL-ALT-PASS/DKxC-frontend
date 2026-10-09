// ProductFormScreen.tsx
// Add / Edit Product screen for the POS + Inventory app (Expo + React Native + NativeWind v4).
//
// Extra packages used (both ship with / are supported by Expo):
//   npx expo install expo-image-picker
//   (@expo/vector-icons is already bundled with Expo)
//
// Usage with expo-router, e.g. app/products/new.tsx:
//   export default function NewProduct() {
//     const router = useRouter();
//     return (
//       <ProductFormScreen
//         ingredientOptions={...}
//         categoryOptions={...}
//         onCancel={() => router.back()}
//         onSave={async (values) => { await api.createProduct(values); router.back(); }}
//       />
//     );
//   }

import { useState } from "react";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

// Old architecture needs this flag for LayoutAnimation on Android (no-op on new arch).
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ----------------------------- Types ----------------------------- */

export type Option = { id: string; label: string };

export type IngredientLine = {
  id: string; // local row id
  ingredientId: string | null;
  qty: string;
};

export type Variant = {
  id: string;
  name: string;
  extraCost: string;
  ingredients: IngredientLine[];
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
  onSave: (values: ProductFormValues) => void | Promise<void>;
  onCancel: () => void;
};

/* ----------------------------- Helpers ----------------------------- */

const uid = () => Math.random().toString(36).slice(2, 10);
const newLine = (): IngredientLine => ({ id: uid(), ingredientId: null, qty: "" });
const newVariant = (): Variant => ({
  id: uid(),
  name: "",
  extraCost: "",
  ingredients: [newLine()],
});
const decimalOnly = (t: string) => t.replace(/[^0-9.]/g, "");

const animate = () =>
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

/* ----------------------------- Select ----------------------------- */

function Select({
  value,
  options,
  placeholder = "Select",
  onChange,
}: {
  value: string | null;
  options: Option[];
  placeholder?: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="h-10 flex-row items-center justify-between rounded-lg border border-black px-3"
      >
        <Text
          numberOfLines={1}
          className={selected ? "text-black" : "text-neutral-400"}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#000" />
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable
          className="flex-1 items-center justify-center bg-black/40"
          onPress={() => setOpen(false)}
        >
          <View className="max-h-[70%] w-80 rounded-xl bg-white py-2">
            <ScrollView>
              {options.map((o) => (
                <Pressable
                  key={o.id}
                  onPress={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  className="flex-row items-center justify-between px-4 py-3 active:bg-neutral-100"
                >
                  <Text className="text-base text-black">{o.label}</Text>
                  {o.id === value && <Ionicons name="checkmark" size={18} color="#15803d" />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/* ----------------------------- Small UI pieces ----------------------------- */

function RemoveButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} className="h-8 w-8 items-center justify-center">
      <Ionicons name="close" size={22} color="#b91c1c" />
    </Pressable>
  );
}

function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 self-center py-2">
      <View className="h-8 w-8 items-center justify-center rounded-lg bg-green-700">
        <Ionicons name="add" size={20} color="#fff" />
      </View>
      <Text className="text-base text-black">{label}</Text>
    </Pressable>
  );
}

function PesoInput({
  value,
  onChange,
  placeholder = "0.00",
  large = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  large?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <Text className={large ? "text-2xl font-bold text-black" : "text-lg font-bold text-black"}>₱</Text>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(decimalOnly(t))}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor="#a3a3a3"
        className={`min-w-24 border-b border-black text-black ${large ? "text-2xl" : "text-lg"}`}
      />
    </View>
  );
}

/* ----------------------------- Ingredient rows ----------------------------- */

function IngredientRows({
  lines,
  ingredientOptions,
  onChange,
  addLabel = "Add ingredient",
}: {
  lines: IngredientLine[];
  ingredientOptions: Option[];
  onChange: (lines: IngredientLine[]) => void;
  addLabel?: string;
}) {
  const update = (id: string, patch: Partial<IngredientLine>) =>
    onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <View className="gap-3">
      {lines.map((line) => (
        <View key={line.id} className="flex-row items-center gap-2">
          <RemoveButton onPress={() => onChange(lines.filter((l) => l.id !== line.id))} />
          <View className="flex-1">
            <Select
              value={line.ingredientId}
              options={ingredientOptions}
              onChange={(ingredientId) => update(line.id, { ingredientId })}
            />
          </View>
          <TextInput
            value={line.qty}
            onChangeText={(t) => update(line.id, { qty: decimalOnly(t) })}
            keyboardType="decimal-pad"
            className="h-10 w-20 rounded-lg border border-black px-2 text-center text-black"
          />
        </View>
      ))}
      <AddButton label={addLabel} onPress={() => onChange([...lines, newLine()])} />
    </View>
  );
}

/* ----------------------------- Collapsible section (toggle) ----------------------------- */

function ToggleSection({
  title,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <View>
      <View className="flex-row items-center gap-4">
        <Text className="text-2xl font-medium text-black">{title}</Text>
        <Switch
          value={enabled}
          onValueChange={(v) => {
            animate();
            onToggle(v);
          }}
          trackColor={{ false: "#d4d4d4", true: "#15803d" }}
          thumbColor="#fff"
        />
      </View>
      {/* Not rendered when off → section collapses. State lives in the parent, so nothing is lost. */}
      {enabled && <View className="mt-4">{children}</View>}
    </View>
  );
}

/* ----------------------------- Variant table (used by Sizes and Add-ons) ----------------------------- */

function VariantTable({
  rows,
  onChange,
  ingredientOptions,
  nameLabel,
  namePlaceholder,
  addLabel,
}: {
  rows: Variant[];
  onChange: (rows: Variant[]) => void;
  ingredientOptions: Option[];
  nameLabel: string;
  namePlaceholder: string;
  addLabel: string;
}) {
  const update = (id: string, patch: Partial<Variant>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <View className="rounded-xl border border-neutral-300">
      {/* Header */}
      <View className="flex-row border-b border-neutral-400">
        <Text className="flex-[2] px-4 py-2 text-center text-base text-neutral-500">{nameLabel}</Text>
        <Text className="flex-[5] border-l border-neutral-400 px-4 py-2 text-center text-base text-neutral-500">
          Additional ingredients / Qty.
        </Text>
        <Text className="flex-[2] border-l border-neutral-400 px-4 py-2 text-center text-base text-neutral-500">
          Additional cost
        </Text>
      </View>

      {/* Rows */}
      {rows.map((row) => (
        <View key={row.id} className="flex-row border-b border-neutral-300">
          <View className="flex-[2] flex-row items-start gap-1 p-3">
            <RemoveButton onPress={() => onChange(rows.filter((r) => r.id !== row.id))} />
            <TextInput
              value={row.name}
              onChangeText={(name) => update(row.id, { name })}
              placeholder={namePlaceholder}
              placeholderTextColor="#a3a3a3"
              className="min-h-8 flex-1 border-b border-black text-base text-black"
            />
          </View>
          <View className="flex-[5] border-l border-neutral-400 p-3">
            <IngredientRows
              lines={row.ingredients}
              ingredientOptions={ingredientOptions}
              onChange={(ingredients) => update(row.id, { ingredients })}
            />
          </View>
          <View className="flex-[2] items-center border-l border-neutral-400 p-3">
            <PesoInput value={row.extraCost} onChange={(extraCost) => update(row.id, { extraCost })} />
          </View>
        </View>
      ))}

      <View className="py-2">
        <AddButton
          label={addLabel}
          onPress={() => {
            animate();
            onChange([...rows, newVariant()]);
          }}
        />
      </View>
    </View>
  );
}

/* ----------------------------- Screen ----------------------------- */

export default function ProductFormScreen({
  mode = "new",
  initialValues,
  categoryOptions,
  ingredientOptions,
  onSave,
  onCancel,
}: Props) {
  const [imageUri, setImageUri] = useState(initialValues?.imageUri ?? null);
  const [name, setName] = useState(initialValues?.name ?? "");
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? null);
  const [price, setPrice] = useState(initialValues?.price ?? "");
  const [ingredients, setIngredients] = useState<IngredientLine[]>(
    initialValues?.ingredients ?? [newLine()]
  );
  const [sizesEnabled, setSizesEnabled] = useState(initialValues?.sizesEnabled ?? false);
  const [sizes, setSizes] = useState<Variant[]>(initialValues?.sizes ?? [newVariant()]);
  const [addOnsEnabled, setAddOnsEnabled] = useState(initialValues?.addOnsEnabled ?? false);
  const [addOns, setAddOns] = useState<Variant[]>(initialValues?.addOns ?? [newVariant()]);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const canSave = name.trim().length > 0 && categoryId !== null && price.length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      // Sections that are toggled off are saved as empty so disabled data isn't submitted.
      await onSave({
        imageUri,
        name: name.trim(),
        categoryId,
        price,
        ingredients,
        sizesEnabled,
        sizes: sizesEnabled ? sizes : [],
        addOnsEnabled,
        addOns: addOnsEnabled ? addOns : [],
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="px-10 pt-6 pb-10 gap-8"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-3xl font-medium text-black">
            {mode === "new" ? "New product details" : "Edit product details"}
          </Text>

          {/* Top: image + basic fields + ingredients */}
          <View className="flex-row gap-10">
            {/* Image */}
            <Pressable onPress={pickImage} className="items-center gap-2 self-start">
              <View className="h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border-2 border-black">
                {imageUri ? (
                  <Image source={{ uri: imageUri }} className="h-full w-full" resizeMode="cover" />
                ) : (
                  <Ionicons name="image-outline" size={64} color="#000" />
                )}
              </View>
              <Text className="text-xs text-black">Click to edit image</Text>
            </Pressable>

            {/* Name / category / price */}
            <View className="flex-1 gap-5">
              <View className="flex-row items-center gap-4">
                <Text className="w-28 text-right text-lg text-black">Product name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  className="h-10 flex-1 rounded-lg border border-black px-3 text-black"
                />
              </View>
              <View className="flex-row items-center gap-4">
                <Text className="w-28 text-right text-lg text-black">Category</Text>
                <View className="flex-1">
                  <Select value={categoryId} options={categoryOptions} onChange={setCategoryId} />
                </View>
              </View>
              <View className="flex-row items-center gap-4">
                <Text className="w-28 text-right text-lg text-black">Price</Text>
                <PesoInput value={price} onChange={setPrice} placeholder="000.00" large />
              </View>
            </View>

            {/* Ingredients */}
            <View className="flex-1 gap-2">
              <View className="flex-row items-center gap-2">
                <View className="w-8" />
                <Text className="flex-1 text-center text-lg text-black">Ingredients</Text>
                <Text className="w-20 text-center text-lg text-black">Qty.</Text>
              </View>
              <IngredientRows
                lines={ingredients}
                ingredientOptions={ingredientOptions}
                onChange={setIngredients}
              />
            </View>
          </View>

          {/* Sizes */}
          <ToggleSection title="Sizes" enabled={sizesEnabled} onToggle={setSizesEnabled}>
            <VariantTable
              rows={sizes}
              onChange={setSizes}
              ingredientOptions={ingredientOptions}
              nameLabel="Name"
              namePlaceholder="e.g. Cold 12oz"
              addLabel="Add size"
            />
          </ToggleSection>

          {/* Add-ons */}
          <ToggleSection title="Add-ons" enabled={addOnsEnabled} onToggle={setAddOnsEnabled}>
            <VariantTable
              rows={addOns}
              onChange={setAddOns}
              ingredientOptions={ingredientOptions}
              nameLabel="Name"
              namePlaceholder="e.g. Extra shot"
              addLabel="Add add-on"
            />
          </ToggleSection>
        </ScrollView>

        {/* Sticky action bar */}
        <View className="flex-row justify-end gap-3 border-t border-neutral-200 bg-white px-10 py-4">
          <Pressable onPress={onCancel} className="rounded-lg border border-black px-6 py-3">
            <Text className="text-base text-black">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={!canSave || saving}
            className={`rounded-lg px-6 py-3 ${canSave && !saving ? "bg-green-700" : "bg-neutral-300"}`}
          >
            <Text className="text-base font-medium text-white">
              {saving ? "Saving…" : "Save product"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
