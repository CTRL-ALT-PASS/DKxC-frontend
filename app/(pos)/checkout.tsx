import { ScrollView, Text, View } from "react-native";
import Header from "../../components/Header";
import {
  formatOptions,
  formatPromo,
  getLineTotal,
  SENIOR_PWD_DISCOUNT_PERCENT,
} from "../../constants/pricing";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

export default function TransactionHistoryScreen() {
  const { user } = useAuth();
  const { myTransactions } = useCart();
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // This route is only reachable after logging in, so user is always set here.
  if (!user) return null;

  return (
    <View className="flex-1 bg-neutral">
      <Header
        title="Order History"
        date={today}
        // user={user}
        // chevronIcon={chevronIcon}
      />

      <ScrollView className="flex-1 p-6">
        {myTransactions.length === 0 && (
          <Text className="text-slate-400 text-center mt-12">
            You haven&apos;t processed any orders yet.
          </Text>
        )}

        {myTransactions.map((tx) => (
          <View key={tx.id} className="bg-white rounded-2xl p-5 mb-4 max-w-xl">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-semibold text-darcy">
                {new Date(tx.completedAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
              <View className="flex-row gap-2">
                <View className="bg-cream px-2 py-1 rounded-md">
                  <Text className="text-xs text-slate-600">{tx.orderType}</Text>
                </View>
                <View className="bg-cream px-2 py-1 rounded-md">
                  <Text className="text-xs text-slate-600">
                    {tx.paymentMode}
                  </Text>
                </View>
              </View>
            </View>

            {tx.items.map((entry) => (
              <View key={entry.key} className="flex-row justify-between mb-1">
                <View className="flex-1 pr-2">
                  <Text className="text-sm">
                    {entry.product.name} ({entry.quantity}x)
                  </Text>
                  {entry.options && (
                    <Text className="text-xs text-slate-500">
                      {formatOptions(entry.options)}
                    </Text>
                  )}
                  {!!entry.discountPercent && (
                    <Text className="text-xs text-darcy font-medium">
                      {formatPromo(
                        entry.product,
                        entry.options,
                        entry.discountPercent,
                      )}
                    </Text>
                  )}
                </View>
                <Text className="text-sm">
                  ₱
                  {getLineTotal(
                    entry.product,
                    entry.options,
                    entry.quantity,
                    entry.discountPercent,
                  ).toFixed(2)}
                </Text>
              </View>
            ))}

            <View className="mt-3 pt-3 border-t border-slate-200">
              {!!tx.seniorPwdDiscount && (
                <>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-sm text-slate-500">Subtotal</Text>
                    <Text className="text-sm text-slate-500">
                      ₱{tx.subtotal.toFixed(2)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-sm text-darcy font-medium">
                      PWD / Senior ({SENIOR_PWD_DISCOUNT_PERCENT}%)
                    </Text>
                    <Text className="text-sm text-darcy font-medium">
                      −₱{tx.seniorPwdDiscount.toFixed(2)}
                    </Text>
                  </View>
                </>
              )}
              <View className="flex-row justify-between">
                <Text className="font-semibold">Total</Text>
                <Text className="font-semibold">₱{tx.total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
