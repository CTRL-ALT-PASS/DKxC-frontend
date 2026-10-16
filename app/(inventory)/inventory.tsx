import searchIcon from "@/assets/icons/search.png";
import { useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import Button from "../../components/Button";
import InventoryRow, {
  COLUMN_WIDTHS,
  InventoryItem,
} from "../../components/inventory/inventory/InventoryRow";
import StockAdjustSheet from "../../components/inventory/inventory/StockAdjustSheet";
import TextField from "../../components/TextField";
import { INVENTORY, LOW_STOCK_THRESHOLD } from "../../constants/mockData";

export default function InventoryScreen() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<InventoryItem[]>(
    INVENTORY as InventoryItem[],
  );
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);

  const filtered = useMemo(
    () =>
      items.filter((i) =>
        i.itemName.toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search],
  );

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
    <View className="flex-1 bg-[#F4F6F4]">
      {/* Top bar */}
      <View className="h-20 px-8 flex-row items-center justify-between bg-white border-b border-[#DDE3E0]">
        <Text className="text-[26px] font-bold text-[#1B2421]">Inventory</Text>
        <Button label="Inventory Logs" variant="outline" />
      </View>

      <View className="flex-1 p-8">
        <View className="flex-row mb-4">
          <TextField
            icon={searchIcon}
            placeholder="Search Item"
            value={search}
            onChangeText={setSearch}
            className="flex-1 mr-3"
          />
          <Button label="Search" variant="outline" />
        </View>

        {/* Column labels (plain text, no filled header bar) */}
        <View className="flex-row px-5 mb-3">
          <Text className="flex-1 text-[13px] font-semibold text-[#5B6762]">
            Item Name
          </Text>
          <Text
            className={`${COLUMN_WIDTHS.lastUpdate} text-[13px] font-semibold text-[#5B6762]`}
          >
            Last Stock Update
          </Text>
          <Text
            className={`${COLUMN_WIDTHS.stocks} text-[13px] font-semibold text-[#5B6762]`}
          >
            In Stock
          </Text>
          <Text
            className={`${COLUMN_WIDTHS.status} text-[13px] font-semibold text-[#5B6762]`}
          >
            Status
          </Text>
          <Text
            className={`${COLUMN_WIDTHS.baseCost} text-[13px] font-semibold text-[#5B6762]`}
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
            <Text className="text-center text-[#5B6762] mt-8">
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
