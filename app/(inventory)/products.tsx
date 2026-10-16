import { useRouter } from "expo-router";
import { Pencil, Plus, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import TextField from "../../components/TextField";
import InventoryProductCard from "../../components/inventory/products/InventoryProductCard";
import { CATEGORIES, PRODUCTS } from "../../constants/mockData";

const PRODUCT_FORM_ROUTE = "/(inventory)/product-form";

export default function ProductsScreen() {
  const router = useRouter();
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
        <View className="flex-1 mr-4">
          <TextField
            icon={<Search size={18} color="#94a3b8" />}
            placeholder="Search for a product"
            value={search}
            onChangeText={setSearch}
            className="flex-1"
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
      <View className="flex-1">
        <View className="flex-row flex-wrap">
          {filtered.map((item) => (
            <View key={item.id} className="mb-3 mr-3">
              <InventoryProductCard
                product={item}
                available={item.available ?? true}
                onPress={() => openEditProduct(item.id)}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
