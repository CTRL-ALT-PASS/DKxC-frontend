import Header from "@/components/Header";
import PaymentModeModal from "@/components/PaymentModeModal";
import ProductOptionsModal from "@/components/ProductOptionsModal";
import QuantityStepper from "@/components/QuantityStepper";
import { PROMO_CODE_BY_PERCENT } from "@/constants/pricing";
import { peso, useOrderLookup } from "@/hooks/use-order-lookup";
import { useOrders } from "@/hooks/use-orders";
import {
  orderDateTime,
  orderErrorMessage,
  orderItemsToInput,
  type Order,
  type OrderItem,
  type OrderItemInput,
} from "@/services/ordersApi";
import { useFocusEffect } from "expo-router";
import {
  CheckCircle2,
  Clock3,
  Pencil,
  ShoppingBag,
  Trash2,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

const POS_PRIMARY = "#BE185D";
const PENDING = { status: "Pending" } as const;
const PROMO_CODES = Object.values(PROMO_CODE_BY_PERCENT);

// A discount can't cover more units than the line has
const withQuantity = (
  it: OrderItemInput,
  quantity: number,
): OrderItemInput => ({
  ...it,
  quantity,
  discounts: it.discounts?.map((d) => ({
    ...d,
    units: Math.min(d.units, quantity),
  })),
});

export default function PendingOrdersScreen() {
  const { orders, loading, error, saving, refetch, update, complete, cancel } =
    useOrders(PENDING);
  const { getProduct, describeItem } = useOrderLookup();

  const [editing, setEditing] = useState<{
    order: Order;
    item: OrderItem;
  } | null>(null);
  const [paymentOrderId, setPaymentOrderId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const paymentOrder = orders.find((o) => o.order_id === paymentOrderId);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Other cashiers and other devices share this queue, so refresh whenever it's shown
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const run = async (fn: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      setActionError(orderErrorMessage(e));
    }
  };

  const changeQuantity = (order: Order, itemOrder: number, delta: number) =>
    run(() =>
      update(order.order_id, {
        order_type: order.order_type,
        items: orderItemsToInput(order).map((it, i) =>
          order.items[i].item_order === itemOrder
            ? withQuantity(it, Math.max(1, it.quantity + delta))
            : it,
        ),
      }),
    );

  // The API needs at least one item, so removing the last one cancels the order
  const removeItem = (order: Order, itemOrder: number) =>
    run(() =>
      order.items.length === 1
        ? cancel(order.order_id)
        : update(order.order_id, {
            order_type: order.order_type,
            items: orderItemsToInput(order).filter(
              (_, i) => order.items[i].item_order !== itemOrder,
            ),
          }),
    );

  const saveEdit = (
    order: Order,
    itemOrder: number,
    result: {
      options: { sizeId?: number; addOnIds: number[] };
      quantity: number;
      discountPercent?: number;
    },
  ) => {
    const quantity = Math.max(1, Math.floor(result.quantity));
    return run(() =>
      update(order.order_id, {
        order_type: order.order_type,
        items: orderItemsToInput(order).map((it, i) => {
          if (order.items[i].item_order !== itemOrder) return it;
          // Keep non-promo discounts, replace the promo with whatever was just picked
          const kept = (it.discounts ?? []).filter(
            (d) => !PROMO_CODES.includes(d.discount_code),
          );
          const promo = result.discountPercent
            ? [
                {
                  discount_code: PROMO_CODE_BY_PERCENT[result.discountPercent],
                  units: 1,
                },
              ]
            : [];
          return withQuantity(
            {
              ...it,
              size_id: result.options.sizeId ?? null,
              add_on_ids: result.options.addOnIds,
              discounts: [...kept, ...promo],
            },
            quantity,
          );
        }),
      }),
    );
  };

  // The API has no payment_mode column yet, so the choice is not stored
  const finishOrder = async (_mode: "Cash" | "Cashless") => {
    if (paymentOrderId == null) return;
    const id = paymentOrderId;
    setPaymentOrderId(null);
    await run(() => complete(id));
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
              {orders.length} pending
            </Text>
          </View>
        </View>

        {actionError && (
          <View className="mb-4 max-w-4xl rounded-xl bg-red-50 p-3">
            <Text className="text-sm text-warn">{actionError}</Text>
          </View>
        )}

        {loading && orders.length === 0 ? (
          <View className="mt-16 items-center">
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View className="mt-10">
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
        ) : orders.length === 0 ? (
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
          orders.map((order) => (
            <View
              key={order.order_id}
              className="mb-5 max-w-4xl rounded-2xl border border-tertiary-soft/50 bg-white p-5"
            >
              <View className="mb-4 flex-row flex-wrap items-start justify-between gap-3">
                <View>
                  <Text className="text-lg font-semibold text-secondary">
                    Order #{order.order_id}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    {orderDateTime(order).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {order.employee_id}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="rounded-full bg-neutral px-3 py-1.5">
                    <Text className="text-sm font-medium text-slate-700">
                      {order.order_type}
                    </Text>
                  </View>
                  <View className="rounded-full bg-amber-50 px-3 py-1.5">
                    <Text className="text-sm font-medium text-amber-700">
                      Pending
                    </Text>
                  </View>
                </View>
              </View>

              {order.items.map((item) => {
                const d = describeItem(item);
                const canEdit =
                  !!d.product &&
                  (d.product.sizes.length > 0 || d.product.add_ons.length > 0);
                return (
                  <View
                    key={item.item_order}
                    className="mb-3 rounded-xl bg-[#F8F7F5] p-4"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-3">
                        <Text className="font-semibold text-slate-800">
                          {d.name}
                        </Text>
                        <Text className="mt-1 text-sm text-slate-500">
                          {d.optionsText || "Standard"}
                        </Text>
                        {d.discountLabels.map((label) => (
                          <Text
                            key={label}
                            className="mt-1 text-xs font-medium text-primary"
                          >
                            {label}
                          </Text>
                        ))}
                      </View>
                      <Text className="font-semibold text-slate-800">
                        {peso(d.lineTotal)}
                      </Text>
                    </View>

                    <View className="mt-3 flex-row items-center justify-between">
                      <View
                        className="w-32"
                        pointerEvents={saving ? "none" : "auto"}
                        style={{ opacity: saving ? 0.5 : 1 }}
                      >
                        <QuantityStepper
                          quantity={item.quantity}
                          className=""
                          onIncrease={() =>
                            changeQuantity(order, item.item_order, 1)
                          }
                          onDecrease={() =>
                            changeQuantity(order, item.item_order, -1)
                          }
                        />
                      </View>
                      <View className="flex-row items-center gap-4">
                        {canEdit && (
                          <Pressable
                            disabled={saving}
                            onPress={() => setEditing({ order, item })}
                            className="flex-row items-center"
                            accessibilityLabel={`Edit ${d.name} options`}
                          >
                            <Pencil size={15} color={POS_PRIMARY} />
                            <Text className="ml-1 text-sm font-medium text-primary">
                              Edit
                            </Text>
                          </Pressable>
                        )}
                        <Pressable
                          disabled={saving}
                          onPress={() => removeItem(order, item.item_order)}
                          className="flex-row items-center"
                          accessibilityLabel={`Remove ${d.name} from order`}
                        >
                          <Trash2 size={16} color="#B42318" />
                          <Text className="ml-1 text-sm font-medium text-warn">
                            Remove
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}

              <View className="mb-4 border-t border-slate-200 pt-3">
                {parseFloat(order.discount_amount) > 0 && (
                  <>
                    <View className="mb-1 flex-row justify-between">
                      <Text className="text-sm text-slate-500">Subtotal</Text>
                      <Text className="text-sm text-slate-500">
                        {peso(order.gross_amount)}
                      </Text>
                    </View>
                    <View className="mb-2 flex-row justify-between">
                      <Text className="text-sm font-medium text-primary">
                        Discounts
                      </Text>
                      <Text className="text-sm font-medium text-primary">
                        −{peso(order.discount_amount)}
                      </Text>
                    </View>
                  </>
                )}
                <View className="flex-row justify-between">
                  <Text className="font-semibold text-slate-800">
                    Total ({order.items.reduce((s, i) => s + i.quantity, 0)}{" "}
                    items)
                  </Text>
                  <Text className="font-semibold text-slate-800">
                    {peso(order.total_amount)}
                  </Text>
                </View>
              </View>

              <Pressable
                disabled={saving}
                onPress={() => setPaymentOrderId(order.order_id)}
                className={`flex-row items-center justify-center rounded-xl py-3 ${
                  saving ? "bg-slate-300" : "bg-primary"
                }`}
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
          editing
            ? `${editing.order.order_id}:${editing.item.item_order}`
            : "pending-edit-closed"
        }
        product={editing ? (getProduct(editing.item.product_id) ?? null) : null}
        visible={!!editing}
        onClose={() => setEditing(null)}
        initialOptions={
          editing ? describeItem(editing.item).options : undefined
        }
        initialQuantity={editing?.item.quantity}
        initialDiscountPercent={
          editing
            ? Number(
                editing.item.discounts.find((d) =>
                  PROMO_CODES.includes(d.discount_code),
                )?.rate_applied,
              ) || undefined
            : undefined
        }
        confirmLabel="Save changes"
        onConfirm={(result) => {
          if (!editing) return;
          saveEdit(editing.order, editing.item.item_order, result);
        }}
      />

      <PaymentModeModal
        visible={!!paymentOrder}
        total={paymentOrder ? parseFloat(paymentOrder.total_amount) : 0}
        onClose={() => setPaymentOrderId(null)}
        onConfirm={finishOrder}
      />
    </View>
  );
}
