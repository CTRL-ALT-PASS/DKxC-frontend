import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { X, Plus, Image as ImageIcon, Pencil, Settings } from "lucide-react-native";

/**
 * Props
 * -----
 * visible        : boolean                     - controls the Modal
 * onClose        : () => void                  - fired on X / Cancel
 * onSubmit       : (data: ProductFormData) => void
 * categories     : string[]                    - existing categories for the dropdown
 * inventoryItems : string[]                    - existing inventory items available as ingredients
 * initialData    : ProductFormData | null       - pass to reuse this modal for "Edit product"
 */

export type ProductFormData = {
  name: string;
  category: string;
  price: string;
  imageUri: string | null;
  ingredients: string[];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  categories?: string[];
  inventoryItems?: string[];
  initialData?: ProductFormData | null;
};

const CURRENCY = "\u20B1"; // ₱

export default function AddProductModal({
  visible,
  onClose,
  onSubmit,
  categories = ["Coffee", "Tea", "Pastries", "Cold Drinks"],
  inventoryItems = [
    "Espresso Shot",
    "Matcha Powder",
    "Whole Milk",
    "Oat Milk",
    "Vanilla Syrup",
    "Ice",
    "Whipped Cream",
  ],
  initialData = null,
}: Props) {
  const [productName, setProductName] = useState(initialData?.name ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [price, setPrice] = useState(initialData?.price ?? "");
  const [imageUri, setImageUri] = useState<string | null>(initialData?.imageUri ?? null);
  const [ingredients, setIngredients] = useState<string[]>(
    initialData?.ingredients?.length ? initialData.ingredients : [""]
  );

  const isEditing = Boolean(initialData);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleIngredientChange = (index: number, value: string) => {
    setIngredients((prev) => prev.map((val, i) => (i === index ? value : val)));
  };

  const handleAddIngredientRow = () => {
    setIngredients((prev) => [...prev, ""]);
  };

  const handleRemoveIngredientRow = (index: number) => {
    setIngredients((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  // Prevent the same inventory item from being picked in two rows at once
  const availableFor = (index: number) => {
    const chosenElsewhere = ingredients.filter((val, i) => i !== index && val);
    return inventoryItems.filter((item) => !chosenElsewhere.includes(item));
  };

  const resetAndClose = () => {
    onClose();
  };

  const handleSubmit = () => {
    onSubmit({
      name: productName,
      category,
      price,
      imageUri,
      ingredients: ingredients.filter(Boolean),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={resetAndClose}>
      {/* backdrop */}
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        {/* card */}
        <View className="w-full max-w-2xl rounded-2xl bg-[#f7f3ea] p-6">
          {/* header */}
          <View className="mb-5 flex-row items-center justify-between">
            <Text className="text-2xl font-semibold text-[#1f3a2e]">
              {isEditing ? "Edit product" : "Add product"}
            </Text>
            <TouchableOpacity onPress={resetAndClose} hitSlop={10}>
              <X size={24} color="#dc2626" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row gap-6">
              {/* image picker */}
              <TouchableOpacity
                onPress={handlePickImage}
                className="h-32 w-32 items-center justify-center rounded-xl border-2 border-[#1f3a2e]"
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} className="h-full w-full rounded-lg" />
                ) : (
                  <View className="items-center gap-1 px-2">
                    <ImageIcon size={32} color="#1f3a2e" strokeWidth={1.5} />
                    <Text className="text-center text-xs text-[#1f3a2e]">
                      Tap to add image
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* two form columns */}
              <View className="flex-1 flex-row gap-6">
                {/* left column: name, category, price */}
                <View className="flex-1 gap-4">
                  <View>
                    <Text className="mb-1 text-[#1f3a2e]">Product name</Text>
                    <TextInput
                      value={productName}
                      onChangeText={setProductName}
                      className="rounded-md border border-[#c9c2b3] bg-white px-3 py-2 text-[#1f3a2e]"
                    />
                  </View>

                  <View>
                    <Text className="mb-1 text-[#1f3a2e]">Category</Text>
                    <View className="rounded-md border border-[#c9c2b3] bg-white">
                      <Picker
                        selectedValue={category}
                        onValueChange={(val: string) => setCategory(val)}
                      >
                        <Picker.Item label="Select category" value="" />
                        {categories.map((cat) => (
                          <Picker.Item key={cat} label={cat} value={cat} />
                        ))}
                      </Picker>
                    </View>
                  </View>

                  <View>
                    <Text className="mb-1 text-[#1f3a2e]">Price</Text>
                    <View className="flex-row items-center gap-2 rounded-md border border-[#c9c2b3] bg-white px-3 py-2">
                      <Text className="text-[#1f3a2e]">{CURRENCY}</Text>
                      <TextInput
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="decimal-pad"
                        className="flex-1 text-[#1f3a2e]"
                      />
                    </View>
                  </View>
                </View>

                {/* right column: ingredients */}
                <View className="flex-1 gap-3">
                  <Text className="mb-1 text-[#1f3a2e]">Ingredients</Text>
                  {ingredients.map((val, index) => (
                    <View key={index} className="flex-row items-center gap-2">
                      <View className="flex-1 rounded-md border border-[#c9c2b3] bg-white">
                        <Picker
                          selectedValue={val}
                          onValueChange={(v: string) => handleIngredientChange(index, v)}
                        >
                          <Picker.Item label="Select ingredient" value="" />
                          {availableFor(index).map((item) => (
                            <Picker.Item key={item} label={item} value={item} />
                          ))}
                        </Picker>
                      </View>
                      {index > 0 && (
                        <TouchableOpacity
                          onPress={() => handleRemoveIngredientRow(index)}
                          hitSlop={8}
                        >
                          <X size={16} color="#8a8072" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={handleAddIngredientRow}
                    className="mt-1 h-9 w-9 items-center justify-center self-center rounded-full border-2 border-[#1f3a2e]"
                  >
                    <Plus size={18} color="#1f3a2e" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* footer actions */}
          <View className="mt-6 flex-row gap-4">
            <TouchableOpacity
              onPress={handleSubmit}
              className="flex-row items-center gap-2 rounded-md bg-[#1f3a2e] px-5 py-3"
            >
              <Plus size={18} color="white" />
              <Text className="font-medium text-white">
                {isEditing ? "Save changes" : "Add new product"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={resetAndClose}
              className="rounded-md border border-[#1f3a2e] px-6 py-3"
            >
              <Text className="font-medium text-[#1f3a2e]">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * ProductCardCorner
 * -----------------------------------------------------------------------
 * The edit/settings toggle shown on each product card. "edit" opens
 * AddProductModal in edit mode; "settings" opens your availability/settings
 * panel. Styling follows the selected(green)/unselected(white) pattern used
 * on the Dashboard.
 *
 * Usage:
 *   const [mode, setMode] = useState<"edit" | "settings">("edit");
 *   <ProductCardCorner mode={mode} onChange={setMode} />
 */
type CornerProps = {
  mode: "edit" | "settings";
  onChange: (mode: "edit" | "settings") => void;
};

export function ProductCardCorner({ mode, onChange }: CornerProps) {
  const baseClass = "h-8 w-8 items-center justify-center rounded-md border";

  return (
    <View className="gap-1">
      <TouchableOpacity
        onPress={() => onChange("edit")}
        className={`${baseClass} ${
          mode === "edit" ? "bg-[#1f3a2e] border-[#1f3a2e]" : "bg-white border-[#c9c2b3]"
        }`}
      >
        <Pencil size={16} color={mode === "edit" ? "white" : "#1f3a2e"} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onChange("settings")}
        className={`${baseClass} ${
          mode === "settings" ? "bg-[#1f3a2e] border-[#1f3a2e]" : "bg-white border-[#c9c2b3]"
        }`}
      >
        <Settings size={16} color={mode === "settings" ? "white" : "#1f3a2e"} />
      </TouchableOpacity>
    </View>
  );
}
