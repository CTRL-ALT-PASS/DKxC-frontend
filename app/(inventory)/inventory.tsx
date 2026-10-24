import SearchBar from "@/components/shared/SearchBar";
import { useSearch } from "@/hooks/use-search";
import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import Button from "../../components/Button";
import InventoryRow, {
  COLUMN_WIDTHS,
  InventoryItem,
} from "../../components/inventory/inventory/InventoryRow";
import StockAdjustSheet from "../../components/inventory/inventory/StockAdjustSheet";
import { INVENTORY, LOW_STOCK_THRESHOLD } from "../../constants/mockData";

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>(
    INVENTORY as InventoryItem[],
  );
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);

  const {
    query,
    setQuery,
    results: filtered,
  } = useSearch(items, (i) => i.itemName);

  // Local-only for now; swap for your API/store call later.
  const handleAdjust = (target: InventoryItem, deltaBase: number) => {
    const stamp = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    setItems((prev) =>
      prev.map((i) =>
        i.id === target.id
          ? { ...i, stocks: i.stocks + deltaBase, lastStockUpdate: stamp }
          : i,
      ),
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
          renderItem={({ item }) => (
            <InventoryRow
              item={item}
              lowStockThreshold={LOW_STOCK_THRESHOLD}
              onPressAdjust={setAdjusting}
            />
          )}
          ListEmptyComponent={
            <Text className="text-center text-secondary/60 mt-8">
              No items found
            </Text>
          }
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
