import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import ProductFormScreen, {
  Option,
  ProductFormValues,
} from "../../components/inventory/products/ProductFormScreen";
import { CATEGORIES, INVENTORY, PRODUCTS } from "../../constants/mockData";

// Adjust the field names below if your mock data differs (assumes INVENTORY items have `id` and `name`).
const categoryOptions: Option[] = CATEGORIES.filter((c) => c !== "All").map(
  (c) => ({
    id: c,
    label: c,
  }),
);

const ingredientOptions: Option[] = INVENTORY.map((i) => ({
  id: String(i.id),
  label: i.itemName,
}));

export default function ProductFormRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const initialValues = useMemo<Partial<ProductFormValues> | undefined>(() => {
    if (!id) return undefined;
    const product = PRODUCTS.find((p) => String(p.id) === id);
    if (!product) return undefined;
    return {
      name: product.name,
      categoryId: product.category,
      price: String(product.price ?? ""),
      // ingredients / sizes / add-ons will come from the API once the backend is connected
    };
  }, [id]);

  const handleSave = async (values: ProductFormValues) => {
    console.log(isEdit ? "Update product:" : "New product:", id, values);
    // TODO: call Laravel API here
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ProductFormScreen
        mode={isEdit ? "edit" : "new"}
        initialValues={initialValues}
        categoryOptions={categoryOptions}
        ingredientOptions={ingredientOptions}
        onSave={handleSave}
        onCancel={() => router.back()}
      />
    </>
  );
}
