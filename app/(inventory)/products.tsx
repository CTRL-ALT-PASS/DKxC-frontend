import ProductGrid from "@/components/shared/ProductGrid";
import SearchBar from "@/components/shared/SearchBar";
import { useSearch } from "@/hooks/use-search";
import { useRouter } from "expo-router";
import { Pencil, Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import InventoryProductCard from "../../components/inventory/products/InventoryProductCard";
import { CATEGORIES, PRODUCTS } from "../../constants/mockData";

const PRODUCT_FORM_ROUTE = "/(inventory)/product-form";

const SCREEN_PADDING = 24; // p-6

export default function ProductsScreen() {
  const router = useRouter();
  const [containerWidth, setContainerWidth] = useState(0);
  const [category, setCategory] = useState("All");

  const categoryFiltered = useMemo(
    () => PRODUCTS.filter((p) => category === "All" || p.category === category),
    [category],
  );

  const {
    query,
    setQuery,
    results: filtered,
  } = useSearch(categoryFiltered, (p) => p.name);

  const openAddProduct = () => router.push(PRODUCT_FORM_ROUTE as any);

  const openEditProduct = (id: string) =>
    router.push({
      pathname: PRODUCT_FORM_ROUTE as any,
      params: { id },
    });

  return (
    <View className="flex-1 bg-neutral p-6">
      {/* Search and actions */}
      <View className="flex-row items-center justify-between mb-4">
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search for a product"
          className="w-80 mr-4"
        />

        <View className="flex-row">
          <Pressable
            onPress={openAddProduct}
            className="flex-row items-center bg-darcy rounded-lg px-4 py-2 mr-3"
          >
            <Plus size={18} color="#fff" />
            <Text className="text-white font-medium ml-2">Add product</Text>
          </Pressable>

          <Pressable className="flex-row items-center bg-white border border-slate-300 rounded-lg px-4 py-2">
            <Pencil size={18} color="#334155" />
            <Text className="text-slate-700 font-medium ml-2">
              Edit categories
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Categories */}
      <View className="flex-row flex-wrap mb-4">
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCategory(c)}
            className={`mr-3 mb-2 px-3 py-1 rounded-full ${
              c === category ? "bg-darcy" : "bg-white"
            }`}
          >
            <Text className={c === category ? "text-white" : "text-slate-600"}>
              {c}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Product grid */}
      <ProductGrid
        data={filtered}
        keyExtractor={(item) => item.id}
        renderCard={(item) => (
          <InventoryProductCard
            product={item}
            available={item.available ?? true}
            onPress={() => openEditProduct(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text className="text-slate-500 mt-8 text-center">
            No products found
          </Text>
        }
      />
    </View>
  );
}
