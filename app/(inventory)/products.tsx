import { useState, useMemo } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { Search, SlidersHorizontal, Plus, Pencil } from "lucide-react-native";
import TextField from "../../components/TextField";
import InventoryProductCard from "../../components/inventory/products/InventoryProductCard";
import AddProductModal, { ProductFormData } from "../../components/inventory/products/AddProductModal";
import { PRODUCTS, CATEGORIES, INVENTORY } from "../../constants/mockData";

export default function ProductsScreen() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Menu");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchesCategory = category === "All Menu" || p.category === category;
      return matchesCategory && p.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, category]);

  const handleAddProduct = (data: ProductFormData) => {
    console.log("New product:", data);
    setIsAddModalVisible(false);
  };

  return (
    <View className="flex-1 bg-cream p-6">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center flex-1 mr-4">
          <TextField
            icon={<Search size={18} color="#94a3b8" />}
            placeholder="Search for a product"
            value={search}
            onChangeText={setSearch}
            className="flex-1 mr-3"
          />
        </View>

        <View className="flex-row">
          <Pressable
            onPress={() => setIsAddModalVisible(true)}
            className="flex-row items-center bg-darcy rounded-lg px-4 py-2 mr-3"
          >
            <Plus size={18} color="#fff" />
            <Text className="text-white font-medium ml-2">Add product</Text>
          </Pressable>
    
          <AddProductModal
            visible={isAddModalVisible}
            onClose={() => setIsAddModalVisible(false)}
            onSubmit={handleAddProduct}
            categories={CATEGORIES}
            inventoryItems={INVENTORY}
          />
          <Pressable className="flex-row items-center bg-white border border-slate-300 rounded-lg px-4 py-2">
            <Pencil size={18} color="#334155" />
            <Text className="text-slate-700 font-medium ml-2">Edit categories</Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-row flex-wrap mb-4">
        {CATEGORIES.map((c) => (
          <Text
            key={c}
            onPress={() => setCategory(c)}
            className={`mr-3 mb-2 px-3 py-1 rounded-full overflow-hidden ${
              c === category ? "bg-darcy text-white" : "bg-white text-slate-600"
            }`}
          >
            {c}
          </Text>
        ))}
      </View>

      <FlatList
        data={filtered}
        numColumns={4}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <InventoryProductCard
            product={item}
            available={item.available ?? true}
            onPress={() => {
              // edit modal logic
            }}
          />
        )}
      />
    </View>
  );
}