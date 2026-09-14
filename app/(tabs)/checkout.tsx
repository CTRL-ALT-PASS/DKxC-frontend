import chevronIcon from "@/assets/icons/chevron-down.png";
import Header from "@/components/Header";
import ProductOptionsModal from "@/components/ProductOptionsModal";
import { CURRENT_USER, getUnitPrice } from "@/constants/mockData";
import { useCart, type CartItem } from "@/context/CartContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import menuIcon from "../../assets/icons/more.png";
import CartItemCard from "../../components/CartItemCard";

const SIDEBAR_WIDTH = 64;
const GRID_PADDING = 24;
const CARD_GAP = 16;
const MAX_CARD_WIDTH = 160;

export default function CheckoutScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { list, total, dispatch } = useCart();
  const [editingEntry, setEditingEntry] = useState<CartItem | null>(null);
  const isCartEmpty = list.length === 0;

  const numColumns = width < 700 ? 2 : width < 1000 ? 3 : 4;
  const summaryWidth = Math.min(320, Math.max(220, Math.round(width * 0.22)));
  const gridAreaWidth = width - SIDEBAR_WIDTH - summaryWidth - GRID_PADDING * 2;
  const cardWidth = Math.min(
    MAX_CARD_WIDTH,
    Math.floor((gridAreaWidth - CARD_GAP * (numColumns - 1)) / numColumns),
  );

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
          <View className="flex-row flex-wrap">
            {list.map((entry) => (
              <CartItemCard
                key={entry.key}
                entry={entry}
                menuIcon={menuIcon}
                cardWidth={cardWidth}
                onIncrease={() =>
                  dispatch({ type: "INCREMENT_KEY", key: entry.key })
                }
                onDecrease={() =>
                  dispatch({ type: "DECREASE", key: entry.key })
                }
                onEdit={() => setEditingEntry(entry)}
              />
            ))}

            <Pressable
              onPress={() => router.navigate("/")}
              style={{
                width: cardWidth,
                height: Math.round(cardWidth * 0.75) + 96,
              }}
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
        key={editingEntry?.key ?? "closed"}
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
    </View>
  );
}
