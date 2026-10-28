import Header from "@/components/Header";
import PaymentModeModal from "@/components/PaymentModeModal";
import ProductOptionsModal from "@/components/ProductOptionsModal";
import QuantityStepper from "@/components/QuantityStepper";
import {
  formatOptions,
  formatPromo,
  getLineTotal,
  SENIOR_PWD_DISCOUNT_PERCENT,
} from "@/constants/pricing";
import {
  type CartItem,
  useCart,
} from "@/context/CartContext";
import {
  CheckCircle2,
  Clock3,
  Pencil,
  ShoppingBag,
  Trash2,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const POS_PRIMARY = "#BE185D";

export default function PendingOrdersScreen() {
  const {
    pendingOrders,
    dispatch,
    completePendingOrder,
  } = useCart();
  const [editingItem, setEditingItem] = useState<{
    orderId: string;
    item: CartItem;
  } | null>(null);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const paymentOrder = pendingOrders.find(
    (order) => order.id === paymentOrderId,
  );
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const finishOrder = (mode: "Cash" | "Cashless") => {
    if (!paymentOrderId) return;
    completePendingOrder(paymentOrderId, mode);
    setPaymentOrderId(null);
  };

  return (
    <View className="flex-1 bg-neutral">
      <Header title="Pending Orders" date={today} />

      <ScrollView className="flex-1 p-6">
        <View className="mb-5 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-semibold text-secondary">
              Order queue
            </Text>
            <Text className="mt-1 text-slate-500">
              Review, update, and finish customer orders.
            </Text>
          </View>
          <View className="flex-row items-center rounded-full bg-white px-4 py-2">
            <Clock3 size={16} color="#6B7280" />
            <Text className="ml-2 font-semibold text-slate-700">
              {pendingOrders.length} pending
            </Text>
          </View>
        </View>

        {pendingOrders.length === 0 ? (
          <View className="mt-16 items-center rounded-2xl bg-white px-6 py-10">
            <ShoppingBag size={36} color={POS_PRIMARY} />
            <Text className="mt-4 text-lg font-semibold text-secondary">
              No pending orders
            </Text>
            <Text className="mt-2 text-center text-slate-500">
              Orders placed from the menu will appear here.
            </Text>
          </View>
        ) : (
          pendingOrders.map((order) => (
            <View
              key={order.id}
              className="mb-5 max-w-4xl rounded-2xl border border-tertiary-soft/50 bg-white p-5"
            >
              <View className="mb-4 flex-row flex-wrap items-start justify-between gap-3">
                <View>
                  <Text className="text-lg font-semibold text-secondary">
                    Order #{order.id.slice(-6).toUpperCase()}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {order.cashierName}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="rounded-full bg-neutral px-3 py-1.5">
                    <Text className="text-sm font-medium text-slate-700">
                      {order.orderType}
                    </Text>
                  </View>
                  <View className="rounded-full bg-amber-50 px-3 py-1.5">
                    <Text className="text-sm font-medium text-amber-700">
                      Pending
                    </Text>
                  </View>
                </View>
              </View>

              {order.items.map((entry) => (
                <View
                  key={entry.key}
                  className="mb-3 rounded-xl bg-[#F8F7F5] p-4"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="font-semibold text-slate-800">
                        {entry.product.name}
                      </Text>
                      {!!entry.options && (
                        <Text className="mt-1 text-sm text-slate-500">
                          {formatOptions(entry.options) || "Standard"}
                        </Text>
                      )}
                      {!!entry.discountPercent && (
                        <Text className="mt-1 text-xs font-medium text-primary">
                          {formatPromo(
                            entry.product,
                            entry.options,
                            entry.discountPercent,
                          )}
                        </Text>
                      )}
                    </View>
                    <Text className="font-semibold text-slate-800">
                      ₱
                      {getLineTotal(
                        entry.product,
                        entry.options,
                        entry.quantity,
                        entry.discountPercent,
                      ).toFixed(2)}
                    </Text>
                  </View>

                  <View className="mt-3 flex-row items-center justify-between">
                    <View className="w-32">
                      <QuantityStepper
                        quantity={entry.quantity}
                        className=""
                        onIncrease={() =>
                          dispatch({
                            type: "CHANGE_PENDING_ITEM_QUANTITY",
                            orderId: order.id,
                            key: entry.key,
                            delta: 1,
                          })
                        }
                        onDecrease={() =>
                          dispatch({
                            type: "CHANGE_PENDING_ITEM_QUANTITY",
                            orderId: order.id,
                            key: entry.key,
                            delta: -1,
                          })
                        }
                      />
                    </View>
                    <View className="flex-row items-center gap-4">
                      {!!entry.product.specs?.length && (
                        <Pressable
                          onPress={() => setEditingItem({ orderId: order.id, item: entry })}
                          className="flex-row items-center"
                          accessibilityLabel={`Edit ${entry.product.name} specifications`}
                        >
                          <Pencil size={15} color={POS_PRIMARY} />
                          <Text className="ml-1 text-sm font-medium text-primary">
                            Edit
                          </Text>
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() =>
                          dispatch({
                            type: "REMOVE_PENDING_ITEM",
                            orderId: order.id,
                            key: entry.key,
                          })
                        }
                        className="flex-row items-center"
                        accessibilityLabel={`Remove ${entry.product.name} from order`}
                      >
                        <Trash2 size={16} color="#B42318" />
                        <Text className="ml-1 text-sm font-medium text-warn">
                          Remove
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}

              <View className="mb-4 border-t border-slate-200 pt-3">
                {!!order.seniorPwdDiscount && (
                  <>
                    <View className="mb-1 flex-row justify-between">
                      <Text className="text-sm text-slate-500">Subtotal</Text>
                      <Text className="text-sm text-slate-500">
                        ₱{order.subtotal.toFixed(2)}
                      </Text>
                    </View>
                    <View className="mb-2 flex-row justify-between">
                      <Text className="text-sm font-medium text-primary">
                        PWD / Senior ({SENIOR_PWD_DISCOUNT_PERCENT}%)
                      </Text>
                      <Text className="text-sm font-medium text-primary">
                        −₱{order.seniorPwdDiscount.toFixed(2)}
                      </Text>
                    </View>
                  </>
                )}
                <View className="flex-row justify-between">
                  <Text className="font-semibold text-slate-800">
                    Total ({order.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                    items)
                  </Text>
                  <Text className="font-semibold text-slate-800">
                    ₱{order.total.toFixed(2)}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setPaymentOrderId(order.id)}
                className="flex-row items-center justify-center rounded-xl bg-primary py-3"
              >
                <CheckCircle2 size={18} color="white" />
                <Text className="ml-2 font-semibold text-white">
                  Finish order
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <ProductOptionsModal
        key={
          editingItem
            ? `${editingItem.orderId}:${editingItem.item.key}`
            : "pending-edit-closed"
        }
        product={editingItem?.item.product ?? null}
        visible={!!editingItem}
        onClose={() => setEditingItem(null)}
        initialOptions={editingItem?.item.options}
        initialQuantity={editingItem?.item.quantity}
        initialDiscountPercent={editingItem?.item.discountPercent}
        confirmLabel="Save changes"
        onConfirm={({ options, quantity, discountPercent }) => {
          if (!editingItem) return;
          dispatch({
            type: "EDIT_PENDING_ITEM",
            orderId: editingItem.orderId,
            key: editingItem.item.key,
            options,
            quantity,
            discountPercent,
          });
        }}
      />

      <PaymentModeModal
        visible={!!paymentOrder}
        total={paymentOrder?.total ?? 0}
        onClose={() => setPaymentOrderId(null)}
        onConfirm={finishOrder}
      />
    </View>
  );
}
