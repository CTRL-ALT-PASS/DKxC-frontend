import SearchBar from "@/components/shared/SearchBar";
import { useInventory, type InventoryListItem } from "@/hooks/use-inventory";
import { useSearch } from "@/hooks/use-search";
import {
  getCategory,
  type InventoryCategory,
} from "@/types/inventoryCategories";
import { useRouter, type Href } from "expo-router";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  History,
  Plus,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import Button from "../../components/Button";
import CategoryFilter from "../../components/inventory/inventory/CategoryFilter";
import InventoryItemActions from "../../components/inventory/inventory/InventoryItemActions";
import InventoryRow, {
  COLUMN_WIDTHS,
  InventoryItem,
  NAME_ICON_OFFSET,
} from "../../components/inventory/inventory/InventoryRow";
import StockAdjustSheet from "../../components/inventory/inventory/StockAdjustSheet";

const PINK = "#BE185D";

/* ------------------------------ sorting ------------------------------ */

type SortKey = "itemName" | "lastUpdate" | "stocks" | "status" | "baseCost";
type SortDir = "asc" | "desc";

// Most urgent first when ascending.
const STATUS_RANK: Record<string, number> = {
  "Out of Stock": 0,
  "Low Stock": 1,
  Available: 2,
};

const compareItems = (
  a: InventoryListItem,
  b: InventoryListItem,
  key: SortKey,
): number => {
  switch (key) {
    case "itemName":
      return a.itemName.localeCompare(b.itemName);
    case "stocks":
      return a.stocks - b.stocks;
    case "baseCost":
      return a.baseCost - b.baseCost;
    case "status":
      return (STATUS_RANK[a.status] ?? 3) - (STATUS_RANK[b.status] ?? 3);
    case "lastUpdate": {
      const at = (i: InventoryListItem) => {
        const t = i.lastStockUpdateAt ? Date.parse(i.lastStockUpdateAt) : 0;
        return Number.isFinite(t) ? t : 0; // never restocked sorts as oldest
      };
      return at(a) - at(b);
    }
  }
};

// Column label that toggles sorting. `className` carries the column width.
function SortHeader({
  label,
  className,
  active,
  dir,
  onPress,
}: {
  label: string;
  className: string;
  active: boolean;
  dir: SortDir;
  onPress: () => void;
}) {
  const Icon = !active
    ? ChevronsUpDown
    : dir === "asc"
      ? ChevronUp
      : ChevronDown;
  return (
    <View className={className}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Sort by ${label}`}
        hitSlop={6}
        className="flex-row items-center self-start"
      >
        <Text
          className={`text-[13px] font-semibold ${
            active ? "text-primary" : "text-secondary/70"
          }`}
        >
          {label}
        </Text>
        <View className="ml-1">
          <Icon size={13} color={active ? PINK : "#9CA3AF"} />
        </View>
      </Pressable>
    </View>
  );
}

export default function InventoryScreen() {
  const router = useRouter();
  const {
    items,
    isLoading,
    isRefreshing,
    error,
    refresh,
    retry,
    recordMovement,
    updateItem,
    createItem, // NEW: must be provided by useInventory (see notes)
  } = useInventory();
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<
    InventoryCategory[]
  >([]);

  const toggleCategory = (category: InventoryCategory) =>
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  const clearCategories = () => setSelectedCategories([]);

  // 1) Category toggles (none selected = show everything).
  const categoryFiltered = useMemo(
    () =>
      selectedCategories.length === 0
        ? items
        : items.filter((i) =>
            selectedCategories.includes(getCategory(i.category).name),
          ),
    [items, selectedCategories],
  );

  // 2) Search matches the item name OR its category name.
  const {
    query,
    setQuery,
    results: filtered,
  } = useSearch(
    categoryFiltered,
    (i) => `${i.itemName} ${getCategory(i.category).name}`,
  );

  const isFiltering = query.length > 0 || selectedCategories.length > 0;

  // "Clear" in the category filter resets the search box too.
  const clearFilters = () => {
    clearCategories();
    setQuery("");
  };

  // 3) Single active sort (defaults to alphabetical by item name).
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "itemName",
    dir: "asc",
  });

  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );

  const sorted = useMemo(() => {
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort(
      (a, b) =>
        compareItems(a, b, sort.key) * factor ||
        a.itemName.localeCompare(b.itemName),
    );
  }, [filtered, sort]);

  const headerProps = (key: SortKey) => ({
    active: sort.key === key,
    dir: sort.dir,
    onPress: () => toggleSort(key),
  });

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="mt-12 items-center">
          <ActivityIndicator size="large" color="#BE185D" />
        </View>
      );
    }

    if (error) {
      return (
        <View className="mt-12 items-center">
          <Text className="mb-4 text-center text-secondary/70">{error}</Text>
          <Button label="Try Again" variant="outline" onPress={retry} />
        </View>
      );
    }

    return (
      <Text className="text-center text-secondary/60 mt-8">
        {isFiltering ? "No items found" : "No ingredients yet"}
      </Text>
    );
  };

  return (
    <View className="flex-1 bg-neutral">
      <View className="flex-1 p-8">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search item or category"
              className="w-80 mr-3"
            />
            <CategoryFilter
              selected={selectedCategories}
              onToggle={toggleCategory}
              onClear={clearFilters}
            />
          </View>

          <View className="flex-row items-center">
            <Pressable
              onPress={() => setIsAdding(true)}
              accessibilityRole="button"
              accessibilityLabel="Add Item"
              className="h-11 flex-row items-center rounded-full bg-primary px-5 active:opacity-80"
            >
              <Plus size={16} color="#FFFFFF" />
              <Text className="ml-2 text-[14px] font-semibold text-white">
                Add Item
              </Text>
            </Pressable>
            <Pressable
              // inventory-logs.tsx is not built yet; this assumes it will sit
              // next to this screen. Adjust the path if it lands elsewhere.
              onPress={() => router.push("/(inventory)/inventory-logs" as Href)}
              accessibilityRole="button"
              accessibilityLabel="Inventory Logs"
              className="ml-3 h-11 flex-row items-center rounded-full border border-tertiary-soft bg-white px-5 active:bg-neutral"
            >
              <History size={16} color={PINK} />
              <Text className="ml-2 text-[14px] font-semibold text-primary">
                Inventory Logs
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Column labels (plain text, no filled header bar) */}
        <View className="flex-row px-5 mb-3">
          <SortHeader
            label="Item Name"
            className={`flex-1 ${NAME_ICON_OFFSET}`}
            {...headerProps("itemName")}
          />
          <Text
            className={`${COLUMN_WIDTHS.category} text-[13px] font-semibold text-secondary/70`}
          >
            Category
          </Text>
          <SortHeader
            label="Last Stock Update"
            className={COLUMN_WIDTHS.lastUpdate}
            {...headerProps("lastUpdate")}
          />
          <SortHeader
            label="In Stock"
            className={COLUMN_WIDTHS.stocks}
            {...headerProps("stocks")}
          />
          <SortHeader
            label="Status"
            className={COLUMN_WIDTHS.status}
            {...headerProps("status")}
          />
          <SortHeader
            label="Base Cost"
            className={COLUMN_WIDTHS.baseCost}
            {...headerProps("baseCost")}
          />
          <View className={COLUMN_WIDTHS.adjust} />
          <View className={COLUMN_WIDTHS.menu} />
        </View>

        <FlatList
          data={sorted}
          keyExtractor={(i) => i.id}
          ItemSeparatorComponent={() => <View className="h-3" />}
          refreshing={isRefreshing}
          onRefresh={refresh}
          renderItem={({ item }) => (
            <InventoryRow
              item={item}
              onPressAdjust={setAdjusting}
              onPressMenu={setEditing}
            />
          )}
          ListEmptyComponent={renderEmpty}
        />
      </View>

      <StockAdjustSheet
        item={adjusting}
        onClose={() => setAdjusting(null)}
        onConfirm={recordMovement}
      />

      {/* One modal for both flows: `item` = edit, `adding` = create */}
      <InventoryItemActions
        item={editing}
        adding={isAdding}
        onClose={() => {
          setEditing(null);
          setIsAdding(false);
        }}
        onSave={updateItem}
        onCreate={createItem}
      />
    </View>
  );
}
