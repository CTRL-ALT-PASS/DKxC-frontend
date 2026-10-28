import SearchBar from "@/components/shared/SearchBar"; // adjust path
import { useOrderReceipt, useSalesOrders } from "@/hooks/use-sales-orders";
import type { OrderStatus, SalesOrderEntry } from "@/services/salesApi";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

// ---------- constants ----------

const STATUS_FILTERS: { label: string; value: OrderStatus | null }[] = [
  { label: "All", value: null },
  { label: "Completed", value: "Completed" },
  { label: "Pending", value: "Pending" },
  { label: "Cancelled", value: "Cancelled" },
];

// full class strings so NativeWind can see them at build time
const STATUS_BADGE: Record<
  OrderStatus,
  { pill: string; text: string; dot: string }
> = {
  Completed: {
    pill: "bg-success/15",
    text: "text-success-dark",
    dot: "bg-success",
  },
  Pending: { pill: "bg-warn/10", text: "text-warn", dot: "bg-warn" },
  Cancelled: {
    pill: "bg-secondary/10",
    text: "text-secondary",
    dot: "bg-secondary",
  },
};

// ---------- helpers ----------

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// order_date is "YYYY-MM-DD" and order_time is "HH:MM:SS" (separate columns in the DB).
// Parsed by hand so the device timezone can never shift the date.
function formatOrderDateTime(dateStr: string, timeStr: string) {
  const [y, mo, d] = dateStr.slice(0, 10).split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return {
    date: `${MONTHS[mo - 1]} ${d}, ${y}`,
    time: `${h % 12 || 12}:${String(mi).padStart(2, "0")} ${ampm}`,
  };
}

function formatPeso(n: number) {
  const [whole, dec] = Math.abs(n).toFixed(2).split(".");
  return `₱${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`;
}

// ---------- screen ----------

export default function SalesScreen() {
  const {
    rows,
    total,
    perPage,
    status,
    setStatus,
    search,
    setSearch,
    clearFilters,
    hasActiveFilters,
    page,
    goNext,
    goPrev,
    hasNext,
    error,
    isLoading: loading,
    reload: load,
  } = useSalesOrders();

  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = (page - 1) * perPage + rows.length;

  return (
    <View className="flex-1 bg-neutral px-7 pt-6 pb-6">
      {/* Search */}
      <View className="flex-row flex-wrap items-center justify-between gap-3 mb-5">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by order # or cashier"
          className="w-96"
        />
        {hasActiveFilters && (
          <Pressable
            onPress={clearFilters}
            className="flex-row items-center gap-1.5 rounded-xl border border-secondary/15 bg-white px-4 py-3"
          >
            <Ionicons name="close-circle-outline" size={16} color="#6b7280" />
            <Text className="text-sm font-semibold text-secondary">
              Clear filters
            </Text>
          </Pressable>
        )}
      </View>

      {/* Filter bar: status */}
      <View className="flex-row flex-wrap gap-2 rounded-2xl border border-secondary/10 bg-white p-4 mb-5">
        {STATUS_FILTERS.map((f) => (
          <FilterChip
            key={f.label}
            label={f.label}
            active={f.value === status}
            onPress={() => setStatus(f.value)}
          />
        ))}
      </View>

      {/* Table card */}
      <View className="flex-1 rounded-2xl border border-secondary/10 bg-white overflow-hidden">
        {/* Header row */}
        <View className="flex-row items-center bg-cream/60 px-7 py-4 border-b border-secondary/10">
          <HeaderCell className="flex-[1.5]">Date &amp; Time</HeaderCell>
          <HeaderCell className="flex-[1.2]">Order</HeaderCell>
          <HeaderCell className="flex-[1.5]">Status</HeaderCell>
          <HeaderCell className="flex-[1.6]">Total</HeaderCell>
          <HeaderCell className="flex-[1.6]">Cashier</HeaderCell>
          <View className="w-6" />
        </View>

        {/* Body */}
        <View className="flex-1">
          {error ? (
            <View className="flex-1 items-center justify-center gap-3">
              <Text className="text-warn font-semibold">{error}</Text>
              <Pressable
                onPress={load}
                className="rounded-xl bg-darcy-dark px-5 py-3"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </Pressable>
            </View>
          ) : loading && rows.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#BE185D" />
            </View>
          ) : rows.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-secondary/50">
                {hasActiveFilters
                  ? "No orders match your search or filters."
                  : "No transactions yet."}
              </Text>
            </View>
          ) : (
            <ScrollView className={loading ? "opacity-50" : ""}>
              {rows.map((o) => (
                <OrderRow key={o.order_id} o={o} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-between border-t border-secondary/10 px-7 py-4">
          <Text className="text-sm text-secondary/60">
            {total === 0
              ? "No orders"
              : `Showing ${from}–${to} of ${total} order${total === 1 ? "" : "s"}`}
          </Text>
          <View className="flex-row items-center gap-3">
            <PagerButton
              label="Previous"
              disabled={page === 1 || loading}
              onPress={goPrev}
            />
            <Text className="text-sm font-semibold text-secondary">
              Page {page}
            </Text>
            <PagerButton
              label="Next"
              disabled={!hasNext || loading}
              onPress={goNext}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------- pieces ----------

function FilterChip({
  label,
  active,
  onPress,
  small,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  small?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-xl border ${small ? "px-4 py-2" : "px-5 py-3"} ${
        active
          ? "bg-darcy-dark border-darcy-dark"
          : "bg-white border-secondary/15"
      }`}
    >
      <Text
        className={`${small ? "text-xs" : "text-sm"} font-semibold ${
          active ? "text-white" : "text-secondary"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function HeaderCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Text
      className={`text-[11px] font-semibold uppercase tracking-widest text-secondary/60 ${className}`}
    >
      {children}
    </Text>
  );
}

function PagerButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`rounded-lg border border-secondary/15 px-4 py-2 ${disabled ? "opacity-40" : ""}`}
    >
      <Text className="text-sm text-secondary">{label}</Text>
    </Pressable>
  );
}

function OrderRow({ o }: { o: SalesOrderEntry }) {
  const [expanded, setExpanded] = useState(false);
  const { date, time } = formatOrderDateTime(o.order_date, o.order_time);
  const badge = STATUS_BADGE[o.order_status];
  const cancelled = o.order_status === "Cancelled";

  return (
    <View className="border-b border-secondary/10">
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        className="flex-row items-center px-7 py-5 active:bg-cream/40"
      >
        {/* Date & time */}
        <View className="flex-[1.5]">
          <Text className="text-secondary font-medium">{date}</Text>
          <Text className="text-xs text-secondary/50 mt-0.5">{time}</Text>
        </View>

        {/* Order # */}
        <Text className="flex-[1.2] font-bold text-secondary">
          #{o.order_id}
        </Text>

        {/* Status pill */}
        <View className="flex-[1.5] items-start">
          <View
            className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 ${badge.pill}`}
          >
            <View className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
            <Text className={`text-xs font-semibold ${badge.text}`}>
              {o.order_status}
            </Text>
          </View>
        </View>

        {/* Total */}
        <View className="flex-[1.6]">
          <Text
            className={`font-bold ${cancelled ? "text-secondary/40 line-through" : "text-secondary"}`}
          >
            {formatPeso(o.total_amount)}
          </Text>
          {o.discount_amount > 0 && (
            <Text className="text-xs text-secondary/50 mt-0.5">
              −{formatPeso(o.discount_amount)} discount
            </Text>
          )}
        </View>

        {/* Cashier */}
        <Text className="flex-[1.6] text-secondary">
          {o.employee_name ?? o.employee_id ?? "—"}
        </Text>

        {/* Expand indicator */}
        <View className="w-6 items-end">
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#9ca3af"
          />
        </View>
      </Pressable>

      {expanded && <OrderDetails orderId={o.order_id} />}
    </View>
  );
}

// Fetches the receipt the first time a row is opened.
function OrderDetails({ orderId }: { orderId: number }) {
  const { receipt, isLoading, error, reload } = useOrderReceipt(orderId, true);

  if (error) {
    return (
      <View className="flex-row items-center gap-3 bg-cream/30 px-7 py-4">
        <Text className="text-warn font-semibold">{error}</Text>
        <Pressable
          onPress={reload}
          className="rounded-lg bg-darcy-dark px-4 py-2"
        >
          <Text className="text-white text-sm font-semibold">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading || !receipt) {
    return (
      <View className="items-center bg-cream/30 py-5">
        <ActivityIndicator color="#BE185D" />
      </View>
    );
  }

  const payment = receipt.payment
    ? formatOrderDateTime(
        receipt.payment.payment_date,
        receipt.payment.payment_time,
      )
    : null;

  return (
    <View className="gap-2 bg-cream/30 px-7 pb-5 pt-1">
      {receipt.items.map((line) => (
        <View
          key={line.item_order}
          className="flex-row items-start justify-between rounded-xl border border-secondary/10 bg-white px-4 py-3"
        >
          <View className="flex-1 pr-4">
            <Text className="font-semibold text-secondary">
              {line.quantity}× {line.name}
              {line.size ? ` · ${line.size}` : ""}
            </Text>
            {line.add_ons.length > 0 && (
              <Text className="mt-0.5 text-xs text-secondary/60">
                + {line.add_ons.map((a) => a.name).join(", ")}
              </Text>
            )}
            {line.discounts.map((d, i) => (
              <Text key={i} className="mt-0.5 text-xs text-warn">
                {d.name} −{formatPeso(d.amount)}
              </Text>
            ))}
          </View>
          <Text className="font-semibold text-secondary">
            {formatPeso(line.line_total)}
          </Text>
        </View>
      ))}

      {/* Totals + payment */}
      <View className="mt-1 flex-row items-end justify-between">
        <Text className="text-xs text-secondary/60">
          {payment
            ? `Paid ${formatPeso(receipt.payment!.amount)} on ${payment.date}, ${payment.time}`
            : "No payment recorded"}
        </Text>
        <Text className="text-xs text-secondary/60">
          Gross {formatPeso(receipt.gross_amount)}
          {receipt.discount_amount > 0
            ? `  ·  Discount −${formatPeso(receipt.discount_amount)}`
            : ""}
        </Text>
      </View>
    </View>
  );
}
