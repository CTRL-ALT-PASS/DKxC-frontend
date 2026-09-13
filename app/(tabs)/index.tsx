import addIcon from "@/assets/icons/basket-add.png";
import chevronIcon from "@/assets/icons/chevron-down.png";
import searchIcon from "@/assets/icons/search.png";
import CategoryDropdown from "@/components/CategoryDropdown";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import ProductOptionsModal from "@/components/ProductOptionsModal";
import TextField from "@/components/TextField";
import { useCart } from "@/context/CartContext";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import {
  CATEGORIES,
  CURRENT_USER,
  getUnitPrice,
  PRODUCTS,
  type Product,
} from "../../constants/mockData";

export default function POSScreen() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Menu");
  const [orderType, setOrderType] = useState<"Dine In" | "Take out">("Dine In");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const { items, list, total, dispatch } = useCart();
  const isCartEmpty = list.length === 0;

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchesCategory =
        category === "All Menu" || p.category === category;
      return (
        matchesCategory && p.name.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [search, category]);

  return (
    <View className="flex-1 bg-cream">
      <Header
        title="Darcy's Kitchen & Cafe POS"
        date={today}
        user={CURRENT_USER}
        chevronIcon={chevronIcon}
      />

      <View className="flex-1 flex-row">
        <View className="flex-1 p-6">
          <View className="flex-row mb-4">
            <TextField
              icon={searchIcon}
              placeholder="Search for a product"
              value={search}
              onChangeText={setSearch}
              className="flex-1 mr-3"
            />
            <CategoryDropdown
              categories={CATEGORIES}
              selected={category}
              onSelect={setCategory}
              chevronIcon={chevronIcon}
            />
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
                onDecrease={() => dispatch({ type: "DECREASE", key: item.id })}
                onOpenSpecs={() => setActiveProduct(item)}
              />
            )}
          />
        </View>

        <View className="w-72 bg-white p-6 border-l border-slate-200">
          <Text className="text-lg font-semibold text-darcy mb-4">Summary</Text>
          {list.map((entry) => (
            <View key={entry.key} className="flex-row justify-between mb-2">
              <View className="flex-1 pr-2">
                <Text>
                  {entry.product.name} ({entry.quantity}x)
                </Text>
                {entry.options && (
                  <Text className="text-xs text-slate-500">
                    {Object.values(entry.options).join(", ")}
                  </Text>
                )}
              </View>
              <Text>
                ₱
                {(
                  getUnitPrice(entry.product, entry.options) * entry.quantity
                ).toFixed(2)}
              </Text>
            </View>
          ))}

          <View className="mt-auto pt-4 border-t border-slate-200">
            <View className="flex-row gap-2 mb-4">
              <Pressable
                onPress={() => setOrderType("Dine In")}
                className={`flex-1 py-2 rounded-xl items-center justify-center ${
                  orderType === "Dine In"
                    ? "bg-darcy"
                    : "bg-white border border-darcy"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${orderType === "Dine In" ? "text-white" : "text-darcy"}`}
                  numberOfLines={1}
                >
                  Dine In
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setOrderType("Take out")}
                className={`flex-1 py-2 rounded-xl items-center justify-center ${
                  orderType === "Take out"
                    ? "bg-darcy"
                    : "bg-white border border-darcy"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${orderType === "Take out" ? "text-white" : "text-darcy"}`}
                  numberOfLines={1}
                >
                  Take out
                </Text>
              </Pressable>
              <Pressable
                disabled={isCartEmpty}
                onPress={() => dispatch({ type: "CLEAR" })}
                className={`flex-1 py-2 rounded-xl items-center justify-center ${isCartEmpty ? "bg-slate-300" : "bg-warn"}`}
              >
                <Text
                  className={`text-sm font-semibold ${isCartEmpty ? "text-slate-500" : "text-white"}`}
                  numberOfLines={1}
                >
                  Clear
                </Text>
              </Pressable>
            </View>

            <View className="flex-row justify-between">
              <Text className="font-semibold">
                Total ({list.reduce((s, i) => s + i.quantity, 0)} items):
              </Text>
              <Text className="font-semibold">₱{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>

      <ProductOptionsModal
        key={activeProduct?.id ?? "closed"}
        product={activeProduct}
        visible={!!activeProduct}
        onClose={() => setActiveProduct(null)}
        onConfirm={(options) =>
          activeProduct &&
          dispatch({ type: "ADD", product: activeProduct, options })
        }
      />
    </View>
  );
}
