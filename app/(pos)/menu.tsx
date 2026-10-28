import SearchBar from "@/components/shared/SearchBar";
import { useProducts } from "@/hooks/use-products";
import { useSearch } from "@/hooks/use-search";
import type { Product } from "@/services/productsApi";
import { useRouter } from "expo-router";
import { ClipboardCheck } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import addIcon from "../../assets/icons/basket-add.png";
import chevronIcon from "../../assets/icons/chevron-down.png";
import CategoryDropdown from "../../components/CategoryDropdown";
import Header from "../../components/Header";
import ProductCard from "../../components/ProductCard";
import ProductOptionsModal from "../../components/ProductOptionsModal";
import ProductGrid from "../../components/shared/ProductGrid";
import {
  formatOptions,
  formatPromo,
  getLineTotal,
  SENIOR_PWD_DISCOUNT_PERCENT,
} from "../../constants/pricing";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

// TODO: replace with a /categories endpoint. IDs match the seeded `category` table.
const CATEGORY_NAMES: Record<number, string> = {
  1: "Espresso",
  2: "Pasta",
  3: "Chicken Katsu Series",
  4: "Snacks",
  5: "Chicken Karaage",
  6: "All-Day Breakfast",
  7: "Fruit Tea",
  8: "Non-Coffee",
  9: "Matcha",
};
const CATEGORY_OPTIONS = ["All", ...Object.values(CATEGORY_NAMES)];
const CATEGORY_ID_BY_NAME: Record<string, number> = Object.fromEntries(
  Object.entries(CATEGORY_NAMES).map(([id, name]) => [name, Number(id)]),
);

// Stable reference so useProducts doesn't see a new filters object each render
const POS_FILTERS = { product_status: "Active" } as const;

export default function POSScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [category, setCategory] = useState("All");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const { products, loading, error, refetch } = useProducts(POS_FILTERS);
  const {
    items,
    list,
    subtotal,
    seniorPwdDiscount,
    isSeniorPwd,
    total,
    orderType,
    dispatch,
    placeOrder,
  } = useCart();
  const isCartEmpty = list.length === 0;
  const summaryWidth = Math.min(320, Math.max(220, Math.round(width * 0.22)));

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const categoryFiltered = useMemo(
    () =>
      category === "All"
        ? products
        : products.filter(
            (p) => p.category_id === CATEGORY_ID_BY_NAME[category],
          ),
    [products, category],
  );

  const {
    query,
    setQuery,
    results: filtered,
  } = useSearch(categoryFiltered, (p) => p.product_name);

  const chooseOrderType = (type: "Dine In" | "Take out") => {
    dispatch({ type: "SET_ORDER_TYPE", orderType: type });
  };

  const handlePlaceOrder = () => {
    if (isCartEmpty) return;
    placeOrder();
    router.navigate("/pending");
  };

  // This route is only reachable after logging in, so user is always set here.
  if (!user) return null;

  return (
    <View className="flex-1 bg-neutral">
      <Header title="Darcy's Kitchen & Cafe POS" date={today} />

      <View className="flex-1 flex-row">
        <View className="flex-1 p-6">
          <View className="flex-row mb-4">
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search for a product"
              className="w-80 mr-4"
            />
            <CategoryDropdown
              categories={CATEGORY_OPTIONS}
              selected={category}
              onSelect={setCategory}
              chevronIcon={chevronIcon}
            />
          </View>

          {loading && products.length === 0 ? (
            <View className="mt-6 items-start">
              <ActivityIndicator />
            </View>
          ) : error ? (
            <View className="mt-6">
              <Text className="text-warn mb-2">
                Couldn't load products: {error.message}
              </Text>
              <Pressable
                onPress={refetch}
                className="self-start rounded-xl bg-primary px-4 py-2"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </Pressable>
            </View>
          ) : filtered.length === 0 ? (
            <Text className="text-slate-400 mt-6">No products found.</Text>
          ) : (
            <ProductGrid
              data={filtered}
              keyExtractor={(item) => String(item.product_id)}
              extraData={items}
              renderCard={(item) => (
                <ProductCard
                  product={item}
                  categoryName={CATEGORY_NAMES[item.category_id] ?? "Other"}
                  quantity={items[String(item.product_id)]?.quantity || 0}
                  addIcon={addIcon}
                  onIncrease={() => dispatch({ type: "ADD", product: item })}
                  onDecrease={() =>
                    dispatch({ type: "DECREASE", key: String(item.product_id) })
                  }
                  onOpenSpecs={() => setActiveProduct(item)}
                />
              )}
            />
          )}
        </View>

        <View
          style={{ width: summaryWidth }}
          className="bg-white p-6 border-l border-slate-200"
        >
          <Text className="text-lg font-semibold text-secondary mb-4">
            Summary
          </Text>
          {list.map((entry) => (
            <View
              key={entry.key}
              className="flex-row justify-between items-start mb-2"
            >
              <View className="flex-1 pr-2">
                <Text>
                  {entry.product.product_name} ({entry.quantity}x)
                </Text>
                {entry.options && (
                  <Text className="text-xs text-slate-500">
                    {formatOptions(entry.product, entry.options)}
                  </Text>
                )}
                {!!entry.discountPercent && (
                  <Text className="text-xs text-primary font-medium">
                    {formatPromo(
                      entry.product,
                      entry.options,
                      entry.discountPercent,
                    )}
                  </Text>
                )}
              </View>
              <Text className="mr-2">
                ₱
                {getLineTotal(
                  entry.product,
                  entry.options,
                  entry.quantity,
                  entry.discountPercent,
                ).toFixed(2)}
              </Text>
              <Pressable
                onPress={() => dispatch({ type: "REMOVE_KEY", key: entry.key })}
                hitSlop={8}
              >
                <Text className="text-warn font-bold">×</Text>
              </Pressable>
            </View>
          ))}

          <View className="mt-auto pt-4 border-t border-slate-200">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-semibold text-slate-800">
                  PWD / Senior Citizen
                </Text>
                <Text className="text-xs text-slate-500">
                  {SENIOR_PWD_DISCOUNT_PERCENT}% off the order
                </Text>
              </View>
              <Switch
                value={isSeniorPwd}
                onValueChange={(enabled) =>
                  dispatch({ type: "SET_SENIOR_PWD", enabled })
                }
                trackColor={{ false: "#CBD5E1", true: "#BE185D" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View className="flex-row gap-2 mb-4">
              <Pressable
                onPress={() => chooseOrderType("Dine In")}
                className={`flex-1 py-2 rounded-xl items-center justify-center ${
                  orderType === "Dine In"
                    ? "bg-primary"
                    : "bg-white border border-primary"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${orderType === "Dine In" ? "text-white" : "text-secondary"}`}
                  numberOfLines={1}
                >
                  Dine In
                </Text>
              </Pressable>
              <Pressable
                onPress={() => chooseOrderType("Take out")}
                className={`flex-1 py-2 rounded-xl items-center justify-center ${
                  orderType === "Take out"
                    ? "bg-primary"
                    : "bg-white border border-primary"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${orderType === "Take out" ? "text-white" : "text-secondary"}`}
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

            {isSeniorPwd && (
              <>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-slate-500">Subtotal</Text>
                  <Text className="text-sm text-slate-500">
                    ₱{subtotal.toFixed(2)}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-primary font-medium">
                    PWD / Senior ({SENIOR_PWD_DISCOUNT_PERCENT}%)
                  </Text>
                  <Text className="text-sm text-primary font-medium">
                    −₱{seniorPwdDiscount.toFixed(2)}
                  </Text>
                </View>
              </>
            )}

            <View className="flex-row justify-between">
              <Text className="font-semibold">
                Total ({list.reduce((s, i) => s + i.quantity, 0)} items):
              </Text>
              <Text className="font-semibold">₱{total.toFixed(2)}</Text>
            </View>
            <Pressable
              disabled={isCartEmpty}
              onPress={handlePlaceOrder}
              className={`mt-4 flex-row items-center justify-center gap-2 rounded-xl py-3 ${
                isCartEmpty ? "bg-slate-300" : "bg-primary"
              }`}
            >
              <ClipboardCheck
                size={18}
                color={isCartEmpty ? "#64748B" : "#FFFFFF"}
              />
              <Text
                className={`font-semibold ${isCartEmpty ? "text-slate-500" : "text-white"}`}
              >
                Place order
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ProductOptionsModal
        key={activeProduct?.product_id ?? "closed"}
        product={activeProduct}
        visible={!!activeProduct}
        onClose={() => setActiveProduct(null)}
        onConfirm={({ options, quantity, discountPercent }) =>
          activeProduct &&
          dispatch({
            type: "ADD_CUSTOMIZED",
            product: activeProduct,
            options,
            quantity,
            discountPercent,
          })
        }
      />
    </View>
  );
}
