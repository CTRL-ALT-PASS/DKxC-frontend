import { useRouter } from "expo-router";
import { Pencil, Plus, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import TextField from "../../components/TextField";
import InventoryProductCard from "../../components/inventory/products/InventoryProductCard";
import { CATEGORIES, PRODUCTS } from "../../constants/mockData";

const PRODUCT_FORM_ROUTE = "/(inventory)/product-form";

const SCREEN_PADDING = 24; // p-6
const CARD_WIDTH = 160; // w-40
const GAP = 12; // spacing between cards

export default function ProductsScreen() {
  const router = useRouter();
  const [containerWidth, setContainerWidth] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Menu");

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchesCategory =
        category === "All Menu" || p.category === category;

      return (
        matchesCategory && p.name.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [search, category]);

  // n cards + (n - 1) gaps must fit: n * CARD_WIDTH + (n - 1) * GAP <= available
  const numColumns = useMemo(() => {
    if (containerWidth <= 0) return 1;
    return Math.max(1, Math.floor((containerWidth + GAP) / (CARD_WIDTH + GAP)));
  }, [containerWidth]);

  const openAddProduct = () => router.push(PRODUCT_FORM_ROUTE as any);

  const openEditProduct = (id: string) =>
    router.push({
      pathname: PRODUCT_FORM_ROUTE as any,
      params: { id },
    });

  return (
    <View className="flex-1 bg-cream p-6">
      {/* Search and actions */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="w-80 mr-4">
          <TextField
            icon={<Search size={18} color="#94a3b8" />}
            placeholder="Search for a product"
            value={search}
            onChangeText={setSearch}
            className="h-12 bg-white rounded-lg px-3"
          />
        </View>

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
      <View
        className="flex-1"
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        {containerWidth > 0 && (
          <FlatList
            key={numColumns} // forces re-mount when column count changes
            data={filtered}
            numColumns={numColumns}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View
                style={{
                  marginRight: (index + 1) % numColumns === 0 ? 0 : GAP,
                  marginBottom: GAP,
                }}
              >
                <InventoryProductCard
                  product={item}
                  available={item.available ?? true}
                  onPress={() => openEditProduct(item.id)}
                />
              </View>
            )}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text className="text-slate-500 mt-8 text-center">
                No products found
              </Text>
            }
          />
        )}
      </View>
    </View>
  );
}
