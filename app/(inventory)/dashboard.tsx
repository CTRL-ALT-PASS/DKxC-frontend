import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import BestSelling from "@/components/inventory/dashboard/BestSelling";
import GrossChart from "@/components/inventory/dashboard/GrossChart";
import StatsCards, {
  type Metric,
} from "@/components/inventory/dashboard/StatsCards";
import StockNotification from "@/components/inventory/dashboard/StockNotification";

export default function Dashboard() {
  const [selectedMetric, setSelectedMetric] = useState<Metric>("profit");

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-6">
      {/* Placeholder for the header component you'll add later */}
      <Text className="mb-6 text-3xl font-bold text-black">Dashboard</Text>

      <View className="flex-row gap-4">
        {/* Left column: stat cards + chart */}
        <View className="flex-[2] gap-4">
          <StatsCards
            grossSales={17000}
            grossProfit={8300}
            selectedMetric={selectedMetric}
            onSelectMetric={setSelectedMetric}
          />
          <GrossChart metric={selectedMetric} />
        </View>

        {/* Right column: notification + best selling */}
        <View className="flex-1 gap-4">
          <StockNotification />
          <BestSelling />
        </View>
      </View>
    </ScrollView>
  );
}
