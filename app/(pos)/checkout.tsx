import { peso, useOrderLookup } from "@/hooks/use-order-lookup";
import { useOrders } from "@/hooks/use-orders";
import { orderDateTime } from "@/services/ordersApi";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";

export default function TransactionHistoryScreen() {
  const { user } = useAuth();
  const filters = useMemo(
    () => ({ status: "Completed" as const, employee_id: user?.employee_id }),
    [user?.employee_id],
  );
  const { orders, loading, error, refetch } = useOrders(filters);
  const { describeItem } = useOrderLookup();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // This route is only reachable after logging in, so user is always set here.
  if (!user) return null;

  // Safety net in case the server ignores the employee_id filter
  const mine = orders.filter((o) => o.employee_id === user.employee_id);

  return (
    <View className="flex-1 bg-neutral">
      <Header title="Order History" date={today} />

      <ScrollView className="flex-1 p-6">
        {loading && mine.length === 0 ? (
          <View className="mt-12 items-center">
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View className="mt-6">
            <Text className="mb-2 text-warn">
              Couldn&apos;t load orders: {error.message}
            </Text>
            <Pressable
              onPress={refetch}
              className="self-start rounded-xl bg-primary px-4 py-2"
            >
              <Text className="font-semibold text-white">Retry</Text>
            </Pressable>
          </View>
        ) : mine.length === 0 ? (
          <Text className="text-slate-400 text-center mt-12">
            You haven&apos;t processed any orders yet.
          </Text>
        ) : null}

        {mine.map((order) => (
          <View
            key={order.order_id}
            className="bg-white rounded-2xl p-5 mb-4 max-w-xl"
          >
            <View className="flex-row justify-between items-center mb-3">
              <View>
                <Text className="font-semibold text-secondary">
                  Order #{order.order_id}
                </Text>
                <Text className="text-xs text-slate-500">
                  {orderDateTime(order).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <View className="bg-neutral px-2 py-1 rounded-md">
                <Text className="text-xs text-slate-600">
                  {order.order_type}
                </Text>
              </View>
            </View>

            {order.items.map((item) => {
              const d = describeItem(item);
              return (
                <View
                  key={item.item_order}
                  className="flex-row justify-between mb-1"
                >
                  <View className="flex-1 pr-2">
                    <Text className="text-sm">
                      {d.name} ({item.quantity}x)
                    </Text>
                    {!!d.optionsText && (
                      <Text className="text-xs text-slate-500">
                        {d.optionsText}
                      </Text>
                    )}
                    {d.discountLabels.map((label) => (
                      <Text
                        key={label}
                        className="text-xs text-primary font-medium"
                      >
                        {label}
                      </Text>
                    ))}
                  </View>
                  <Text className="text-sm">{peso(d.lineTotal)}</Text>
                </View>
              );
            })}

            <View className="mt-3 pt-3 border-t border-slate-200">
              {parseFloat(order.discount_amount) > 0 && (
                <>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-sm text-slate-500">Subtotal</Text>
                    <Text className="text-sm text-slate-500">
                      {peso(order.gross_amount)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-sm text-primary font-medium">
                      Discounts
                    </Text>
                    <Text className="text-sm text-primary font-medium">
                      −{peso(order.discount_amount)}
                    </Text>
                  </View>
                </>
              )}
              <View className="flex-row justify-between">
                <Text className="font-semibold">Total</Text>
                <Text className="font-semibold">
                  {peso(order.total_amount)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
