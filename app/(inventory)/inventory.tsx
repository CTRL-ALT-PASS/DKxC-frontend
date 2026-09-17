import { useState, useMemo } from "react";
import { View, Text, ScrollView, Image } from "react-native";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import { INVENTORY, LOW_STOCK_THRESHOLD } from "../../constants/mockData";
import searchIcon from "@/assets/icons/search.png";
import warningIcon from "@/assets/icons/warning.png";
import menuIcon from "@/assets/icons/menu.png";

const COLUMNS = ["Last Stock Update", "Item Name", "Category", "Stocks", "Variance", "Unit Cost", ""];

export default function InventoryScreen() {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () => INVENTORY.filter((i) => i.itemName.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  return (
    <View className="flex-1 bg-white p-6">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-semibold text-slate-800">Inventory</Text>
        <Button label="Inventory Logs" variant="outline" />
      </View>

      <View className="flex-row mb-4">
        <TextField icon={searchIcon} placeholder="Search Item" value={search} onChangeText={setSearch} className="flex-1 mr-3" />
        <Button label="Search" variant="outline" />
      </View>

      <View className="flex-row bg-darcy rounded-t-xl py-3 px-2">
        {COLUMNS.map((c) => (
          <Text key={c} className="flex-1 text-white text-xs font-semibold px-2">
            {c}
          </Text>
        ))}
      </View>

      <ScrollView>
        {filtered.map((item) => (
          <View key={item.id} className="flex-row items-center border-2 border-slate-200 py-3 px-2">
            <Text className="flex-1 px-2 text-slate-600">{item.lastStockUpdate}</Text>
            <Text className="flex-1 px-2 text-slate-800">{item.itemName}</Text>
            <Text className="flex-1 px-2 text-slate-600">{item.category}</Text>
            <View className="flex-1 flex-row items-center px-2">
              <Text className="mr-2">{item.stocks}</Text>
              {item.stocks < LOW_STOCK_THRESHOLD && (
                <Image source={warningIcon} style={{ width: 16, height: 16 }} resizeMode="contain" />
              )}
            </View>
            <Text className="flex-1 px-2">{item.variance}</Text>
            <Text className="flex-1 px-2">{item.unitCost}</Text>
            <Image source={menuIcon} style={{ width: 18, height: 18 }} resizeMode="contain" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
