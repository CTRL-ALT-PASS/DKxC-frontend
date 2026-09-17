import chevronIcon from "@/assets/icons/chevron-down.png";
import menuIcon from "@/assets/icons/more.png";
import searchIcon from "@/assets/icons/search.png";
import CartItemCard, { getCartCardHeight } from "@/components/CartItemCard";
import CategoryDropdown from "@/components/CategoryDropdown";
import Header from "@/components/Header";
import ProductOptionsModal from "@/components/ProductOptionsModal";
import TextField from "@/components/TextField";
import {
  CATEGORIES,
  CURRENT_USER,
  getUnitPrice,
  type Product,
} from "@/constants/mockData";
import { useCart, type CartItem } from "@/context/CartContext";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";

const SIDEBAR_WIDTH = 64;
const GRID_PADDING = 24;
const CARD_GAP = 16;
const MAX_CARD_WIDTH = 160;

export default function CheckoutScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { list, total, dispatch } = useCart();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Menu");
  const [editingEntry, setEditingEntry] = useState<CartItem | null>(null);
  const [addingProduct, setAddingProduct] = useState<Product | null>(null);
  const isCartEmpty = list.length === 0;

  const numColumns = width < 700 ? 2 : width < 1000 ? 3 : 4;
  const summaryWidth = Math.min(320, Math.max(220, Math.round(width * 0.22)));
  const gridAreaWidth = width - SIDEBAR_WIDTH - summaryWidth - GRID_PADDING * 2;
  const cardWidth = Math.min(
    MAX_CARD_WIDTH,
    Math.floor((gridAreaWidth - CARD_GAP * (numColumns - 1)) / numColumns),
  );
  const cardHeight = getCartCardHeight(cardWidth);

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Search/filter only changes which cards are shown in the grid below --
  // the Summary panel and Total always reflect the whole order, unfiltered.
  const filteredList = useMemo(() => {
    return list.filter((entry) => {
      const matchesCategory =
        category === "All Menu" || entry.product.category === category;
      return (
        matchesCategory &&
        entry.product.name.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [list, search, category]);

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
          <View className="flex-row items-center mb-4">
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
            <Pressable
              disabled={isCartEmpty}
              onPress={() => dispatch({ type: "CLEAR" })}
              className={`ml-3 rounded-xl px-5 h-12 items-center justify-center ${isCartEmpty ? "bg-slate-300" : "bg-warn"}`}
            >
              <Text
                className={`font-semibold ${isCartEmpty ? "text-slate-500" : "text-white"}`}
              >
                Clear
              </Text>
            </Pressable>
          </View>

          <View className="flex-row flex-wrap">
            {filteredList.map((entry) => {
              const hasSpecs = !!entry.product.specs?.length;
              return (
                <CartItemCard
                  key={entry.key}
                  entry={entry}
                  menuIcon={menuIcon}
                  cardWidth={cardWidth}
                  onIncrease={() =>
                    hasSpecs
                      ? setAddingProduct(entry.product)
                      : dispatch({ type: "INCREMENT_KEY", key: entry.key })
                  }
                  onDecrease={() =>
                    dispatch({ type: "DECREASE", key: entry.key })
                  }
                  onEdit={() => setEditingEntry(entry)}
                />
              );
            })}

            <Pressable
              onPress={() => router.navigate("/")}
              style={{ width: cardWidth, height: cardHeight }}
              className="bg-white rounded-2xl items-center justify-center mr-4 mb-4"
            >
              <Text
                style={{ fontSize: 40, lineHeight: 40 }}
                className="text-slate-400"
              >
                +
              </Text>
            </Pressable>
          </View>
        </View>

        <View
          style={{ width: summaryWidth }}
          className="bg-white p-6 border-l border-slate-200"
        >
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
            <View className="flex-row justify-between mb-4">
              <Text className="font-semibold">
                Total ({list.reduce((s, i) => s + i.quantity, 0)} items):
              </Text>
              <Text className="font-semibold">₱{total.toFixed(2)}</Text>
            </View>
            <Pressable
              disabled={isCartEmpty}
              onPress={() => dispatch({ type: "CLEAR" })}
              className={`rounded-xl py-4 items-center ${isCartEmpty ? "bg-slate-300" : "bg-darcy"}`}
            >
              <Text
                className={`text-lg font-semibold ${isCartEmpty ? "text-slate-500" : "text-white"}`}
              >
                Checkout
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ProductOptionsModal
        key={`edit-${editingEntry?.key ?? "closed"}`}
        product={editingEntry?.product ?? null}
        visible={!!editingEntry}
        initialOptions={editingEntry?.options}
        confirmLabel="Save Changes"
        onClose={() => setEditingEntry(null)}
        onConfirm={(newOptions) =>
          editingEntry &&
          dispatch({
            type: "EDIT_OPTIONS",
            oldKey: editingEntry.key,
            product: editingEntry.product,
            quantity: editingEntry.quantity,
            newOptions,
          })
        }
      />

      <ProductOptionsModal
        key={`add-${addingProduct?.id ?? "closed"}`}
        product={addingProduct}
        visible={!!addingProduct}
        onClose={() => setAddingProduct(null)}
        onConfirm={(options) =>
          addingProduct &&
          dispatch({ type: "ADD", product: addingProduct, options })
        }
      />
    </View>
  );
}
