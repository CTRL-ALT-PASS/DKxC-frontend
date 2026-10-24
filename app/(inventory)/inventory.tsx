import SearchBar from "@/components/shared/SearchBar";
import { useInventory } from "@/hooks/use-inventory";
import { useSearch } from "@/hooks/use-search";
import { useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import Button from "../../components/Button";
import InventoryRow, {
  COLUMN_WIDTHS,
  InventoryItem,
} from "../../components/inventory/inventory/InventoryRow";
import StockAdjustSheet from "../../components/inventory/inventory/StockAdjustSheet";

export default function InventoryScreen() {
  const { items, isLoading, isRefreshing, error, refresh, retry } =
    useInventory();
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);

  const {
    query,
    setQuery,
    results: filtered,
  } = useSearch(items, (i) => i.itemName);

  // TODO (next step): call recordStockMovement() here, then refresh().
  const handleAdjust = (_target: InventoryItem, _deltaBase: number) => {};

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
        {query ? "No items found" : "No ingredients yet"}
      </Text>
    );
  };

  return (
    <View className="flex-1 bg-neutral">
      <View className="flex-1 p-8">
        <View className="flex-row items-center justify-between mb-4">
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search Item"
            className="w-80 mr-3"
          />
          <Button label="Inventory Logs" variant="outline" />
        </View>

        {/* Column labels (plain text, no filled header bar) */}
        <View className="flex-row px-5 mb-3">
          <Text className="flex-1 text-[13px] font-semibold text-secondary/70">
            Item Name
          </Text>
          <Text
            className={`${COLUMN_WIDTHS.lastUpdate} text-[13px] font-semibold text-secondary/70`}
          >
            Last Stock Update
          </Text>
          <Text
            className={`${COLUMN_WIDTHS.stocks} text-[13px] font-semibold text-secondary/70`}
          >
            In Stock
          </Text>
          <Text
            className={`${COLUMN_WIDTHS.status} text-[13px] font-semibold text-secondary/70`}
          >
            Status
          </Text>
          <Text
            className={`${COLUMN_WIDTHS.baseCost} text-[13px] font-semibold text-secondary/70`}
          >
            Base Cost
          </Text>
          <View className={COLUMN_WIDTHS.adjust} />
          <View className={COLUMN_WIDTHS.menu} />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          ItemSeparatorComponent={() => <View className="h-3" />}
          refreshing={isRefreshing}
          onRefresh={refresh}
          renderItem={({ item }) => (
            <InventoryRow item={item} onPressAdjust={setAdjusting} />
          )}
          ListEmptyComponent={renderEmpty}
        />
      </View>

      <StockAdjustSheet
        item={adjusting}
        onClose={() => setAdjusting(null)}
        onConfirm={handleAdjust}
      />
    </View>
  );
}