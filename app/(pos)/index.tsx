import { useState, useMemo } from "react";
import { View, Text, FlatList } from "react-native";
import TextField from "../../components/TextField";
import ProductCard from "../../components/ProductCard";
import Button from "../../components/Button";
import { PRODUCTS, CATEGORIES } from "../../constants/mockData";
import { useCart } from "@/context/CartContext";
import searchIcon from "@/assets/icons/search.png";
import addIcon from "@/assets/icons/basket-add.png";

export default function POSScreen() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Menu");
  const { items, list, total, dispatch } = useCart();

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchesCategory = category === "All Menu" || p.category === category;
      return matchesCategory && p.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, category]);

  return (
    <View className="flex-1 flex-row bg-cream">
      <View className="flex-1 p-6">
        <TextField icon={searchIcon} placeholder="Search for a product" value={search} onChangeText={setSearch} className="mb-4" />

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
            <ProductCard
              product={item}
              quantity={items[item.id]?.quantity || 0}
              addIcon={addIcon}
              onIncrease={() => dispatch({ type: "ADD", product: item })}
              onDecrease={() => dispatch({ type: "DECREASE", productId: item.id })}
            />
          )}
        />
      </View>

      <View className="w-72 bg-white p-6 border-l border-slate-200">
        <Text className="text-lg font-semibold text-darcy mb-4">Summary</Text>
        {list.map(({ product, quantity }) => (
          <View key={product.id} className="flex-row justify-between mb-2">
            <Text>
              {product.name} ({quantity}x)
            </Text>
            <Text>₱{(product.price * quantity).toFixed(2)}</Text>
          </View>
        ))}
        <View className="mt-auto pt-4 border-t border-slate-200">
          <View className="flex-row justify-between mb-4">
            <Text className="font-semibold">Total ({list.reduce((s, i) => s + i.quantity, 0)} items):</Text>
            <Text className="font-semibold">₱{total.toFixed(2)}</Text>
          </View>
          <Button label="Checkout" onPress={() => dispatch({ type: "CLEAR" })} />
        </View>
      </View>
    </View>
  );
}
