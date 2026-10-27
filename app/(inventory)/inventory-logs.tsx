import CategoryFilter from "@/components/inventory/inventory/CategoryFilter"; // adjust path
import SearchBar from "@/components/shared/SearchBar"; // adjust path
import { useInventoryMovements } from "@/hooks/use-inventory-movements";
import type {
    MovementLogEntry,
    MovementLogType,
} from "@/services/inventoryApi";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

// ---------- constants ----------

const FILTERS: { label: string; value: MovementLogType | null }[] = [
  { label: "All", value: null },
  { label: "Sales", value: "Sale" },
  { label: "Restock", value: "Restock" },
  { label: "Spoilage", value: "Spoilage" },
  { label: "Damage", value: "Damage" },
  { label: "Adjustment", value: "Adjustment" },
  { label: "Return", value: "Return" },
];

// full class strings so NativeWind can see them at build time
const BADGE: Record<
  MovementLogType,
  { pill: string; text: string; dot: string }
> = {
  Sale: { pill: "bg-primary/10", text: "text-primary", dot: "bg-primary" },
  Restock: {
    pill: "bg-success/15",
    text: "text-success-dark",
    dot: "bg-success",
  },
  Spoilage: { pill: "bg-warn/10", text: "text-warn", dot: "bg-warn" },
  Damage: { pill: "bg-warn/10", text: "text-warn", dot: "bg-warn" },
  Adjustment: {
    pill: "bg-tertiary-soft/30",
    text: "text-secondary",
    dot: "bg-tertiary",
  },
  Return: {
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

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return {
    date: `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
    time: `${h % 12 || 12}:${m} ${ampm}`,
  };
}

function formatNumber(n: number) {
  // strips trailing zeros from "6000.000" and adds thousands separators
  return String(parseFloat(n.toFixed(3))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ---------- screen ----------
export default function InventoryLogs() {
  const {
    rows,
    filter,
    page,
    error,
    goNext,
    goPrev,
    hasNext,
    setFilter: changeFilter,
    search,
    setSearch,
    categories,
    toggleCategory,
    clearFilters,
    hasActiveFilters,
    isLoading: loading,
    reload: load,
  } = useInventoryMovements();

  return (
    <View className="flex-1 bg-neutral px-7 pt-6 pb-6">
      {/* Search + category filter */}
      <View className="flex-row flex-wrap items-center justify-between gap-3 mb-5">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by item or employee"
          className="w-96"
        />
        <CategoryFilter
          selected={categories}
          onToggle={toggleCategory}
          onClear={clearFilters}
          extraActive={search.trim() !== ""}
        />
      </View>

      {/* Filter bar */}
      <View className="flex-row flex-wrap gap-2 rounded-2xl border border-secondary/10 bg-white p-4 mb-5">
        {FILTERS.map((f) => {
          const active = f.value === filter;
          return (
            <Pressable
              key={f.label}
              onPress={() => changeFilter(f.value)}
              className={`rounded-xl px-5 py-3 border ${
                active
                  ? "bg-darcy-dark border-darcy-dark"
                  : "bg-white border-secondary/15"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${active ? "text-white" : "text-secondary"}`}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Table card */}
      <View className="flex-1 rounded-2xl border border-secondary/10 bg-white overflow-hidden">
        {/* Header row */}
        <View className="flex-row items-center bg-cream/60 px-7 py-4 border-b border-secondary/10">
          <HeaderCell className="flex-[1.4]">Date &amp; Time</HeaderCell>
          <HeaderCell className="flex-[2]">Item</HeaderCell>
          <HeaderCell className="flex-[1.3]">Type</HeaderCell>
          <HeaderCell className="flex-[1.5]">Change</HeaderCell>
          <HeaderCell className="flex-[2]">Reason / Reference</HeaderCell>
          <HeaderCell className="flex-[1.5]">Recorded By</HeaderCell>
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
                  ? "No movements match your search or filters."
                  : "No stock movements found."}
              </Text>
            </View>
          ) : (
            <ScrollView className={loading ? "opacity-50" : ""}>
              {rows.map((m) => (
                <MovementRow key={m.ledger_id} m={m} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-between border-t border-secondary/10 px-7 py-4">
          <Text className="text-sm text-secondary/60">
            Showing {rows.length} movement{rows.length === 1 ? "" : "s"}
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

function MovementRow({ m }: { m: MovementLogEntry }) {
  const { date, time } = formatDateTime(m.occurred_at);
  const change = m.quantity_change; // already a number
  const unit = m.base_unit ?? "";
  const badge = BADGE[m.movement_type];

  return (
    <View className="flex-row items-center px-7 py-5 border-b border-secondary/10">
      {/* Date & time */}
      <View className="flex-[1.4]">
        <Text className="text-secondary font-medium">{date}</Text>
        <Text className="text-xs text-secondary/50 mt-0.5">{time}</Text>
      </View>

      {/* Item */}
      <Text
        className="flex-[2] font-bold text-secondary pr-3"
        numberOfLines={2}
      >
        {m.item_name ?? `Item #${m.inventory_item_id}`}
      </Text>

      {/* Type pill */}
      <View className="flex-[1.3] items-start">
        <View
          className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 ${badge.pill}`}
        >
          <View className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
          <Text className={`text-xs font-semibold ${badge.text}`}>
            {m.movement_type}
          </Text>
        </View>
      </View>

      {/* Change */}
      <View className="flex-[1.5]">
        <Text
          className={`font-bold ${change < 0 ? "text-warn" : "text-success-dark"}`}
        >
          {change > 0 ? "+" : ""}
          {formatNumber(change)} {unit}
        </Text>
        {m.entered_quantity !== null && m.entered_unit && (
          <Text className="text-xs text-secondary/50 mt-0.5">
            entered as {formatNumber(m.entered_quantity)} {m.entered_unit}
          </Text>
        )}
      </View>

      {/* Reason / reference */}
      <View className="flex-[2] pr-3">
        {m.order_id ? (
          <Text className="text-secondary">Order #{m.order_id}</Text>
        ) : (
          <Text className="text-secondary" numberOfLines={2}>
            {m.reason ?? "—"}
          </Text>
        )}
        {m.reference_number && (
          <View className="mt-1 self-start rounded bg-secondary/10 px-2 py-0.5">
            <Text
              className="text-[11px] font-bold text-secondary"
              style={{ fontFamily: "monospace" }}
            >
              {m.reference_number}
            </Text>
          </View>
        )}
      </View>

      {/* Recorded by */}
      <Text className="flex-[1.5] text-secondary">
        {m.employee_name ?? "—"}
      </Text>
    </View>
  );
}
