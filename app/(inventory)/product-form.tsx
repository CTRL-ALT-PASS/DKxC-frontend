import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import ProductFormScreen, {
  type AddOnOption,
  type Option,
  type ProductFormValues,
} from "../../components/inventory/products/ProductFormScreen";
import {
  toFormValues,
  toPayload,
} from "../../components/inventory/products/productFormMapper";
import { useAddOns } from "../../hooks/use-add-ons";
import { useCategories } from "../../hooks/use-categories";
import { useInventoryItems } from "../../hooks/use-inventory-items";
import { useProduct } from "../../hooks/use-products";
import { ApiError } from "../../services/apiClient";
import {
  createProduct,
  deleteProduct,
  deleteProductImage,
  updateProduct,
  uploadProductImage,
} from "../../services/productsApi";
import { confirm, describeError, notify } from "../../utils/dialogs";

export default function ProductFormRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const productId = id ? Number(id) : null;
  const isEdit = productId !== null;

  const { categories, loading: catLoading, error: catError } = useCategories();
  const {
    items,
    loading: itemsLoading,
    error: itemsError,
  } = useInventoryItems();
  const { addOns, loading: addOnsLoading, error: addOnsError } = useAddOns();
  const {
    product,
    loading: productLoading,
    error: productError,
  } = useProduct(productId);

  const categoryOptions = useMemo<Option[]>(
    () =>
      categories.map((c) => ({
        id: String(c.category_id),
        label: c.category_name,
      })),
    [categories],
  );

  // `unit` is the base unit: recipe quantities are always stored in it.
  const ingredientOptions = useMemo<Option[]>(
    () =>
      items.map((i) => ({
        id: String(i.inventory_item_id),
        label: i.item_name,
        unit: i.base_unit,
      })),
    [items],
  );

  const addOnOptions = useMemo<AddOnOption[]>(
    () =>
      addOns.map((a) => ({
        id: a.add_on_id,
        name: a.add_on_name,
        price: a.price,
        categoryIds: a.category_ids,
      })),
    [addOns],
  );

  const initialValues = useMemo<Partial<ProductFormValues> | undefined>(
    () => (product ? toFormValues(product) : undefined),
    [product],
  );

  const handleSave = async (values: ProductFormValues) => {
    // 1) Save the product itself.
    let savedId: number;
    try {
      const payload = toPayload(values);
      if (isEdit) {
        await updateProduct(productId, payload);
        savedId = productId;
      } else {
        savedId = (await createProduct(payload)).data.product_id;
      }
    } catch (e) {
      notify("Couldn't save product", describeError(e));
      return;
    }

    // 2) The photo has its own endpoint, so it's applied once the product exists.
    try {
      const change = values.imageChange;
      if (change?.type === "upload") {
        await uploadProductImage(savedId, change.file);
      } else if (change?.type === "remove") {
        await deleteProductImage(savedId);
      }
    } catch (e) {
      notify("Product saved, but the photo wasn't", describeError(e));
      // A new product exists now: switch this screen to edit mode so pressing
      // Save again updates it instead of creating a duplicate.
      if (!isEdit) router.setParams({ id: String(savedId) });
      return;
    }

    router.back(); // the products screen refetches on focus
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    const ok = await confirm(
      "Delete product?",
      "This also removes its recipe, sizes and add-on settings.",
      "Delete",
    );
    if (!ok) return;

    try {
      await deleteProduct(productId);
      router.back();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const discontinue = await confirm(
          "Can't delete",
          "This product has sales history. Set it to Discontinued instead?",
          "Discontinue",
        );
        if (discontinue) {
          try {
            await updateProduct(productId, { product_status: "Discontinued" });
            router.back();
          } catch (err) {
            notify("Couldn't update product", describeError(err));
          }
        }
        return;
      }
      notify("Couldn't delete product", describeError(e));
    }
  };

  const loading =
    catLoading || itemsLoading || addOnsLoading || (isEdit && productLoading);
  const loadError = catError ?? itemsError ?? addOnsError ?? productError;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {loading ? (
        <View className="flex-1 items-center justify-center bg-neutral">
          <ActivityIndicator color="#BE185D" />
        </View>
      ) : loadError ? (
        <View className="flex-1 items-center justify-center bg-neutral p-6">
          <Text className="text-secondary mb-3">{loadError.message}</Text>
          <Pressable
            onPress={() => router.back()}
            className="bg-primary rounded-lg px-4 py-2"
          >
            <Text className="text-white font-medium">Go back</Text>
          </Pressable>
        </View>
      ) : (
        <ProductFormScreen
          mode={isEdit ? "edit" : "new"}
          initialValues={initialValues}
          categoryOptions={categoryOptions}
          ingredientOptions={ingredientOptions}
          addOns={addOnOptions}
          onSave={handleSave}
          onDelete={isEdit ? handleDelete : undefined}
          onCancel={() => router.replace("/(inventory)/products")}
        />
      )}
    </>
  );
}