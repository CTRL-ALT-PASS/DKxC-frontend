import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import BestSelling from "@/components/inventory/dashboard/BestSelling";
import ChartModal from "@/components/inventory/dashboard/ChartModal";
import DateRangeSelector from "@/components/inventory/dashboard/DateRangeSelector";
import StatsCards from "@/components/inventory/dashboard/StatsCards";
import StockNotification from "@/components/inventory/dashboard/StockNotification";
import {
  buildSeries,
  quickRange,
  type DateRange,
  type Metric,
} from "@/components/inventory/dashboard/chartData";

export default function Dashboard() {
  const [range, setRange] = useState<DateRange>(() => quickRange("30d"));
  const [expandedMetric, setExpandedMetric] = useState<Metric | null>(null);

  // Totals shown on the stat cards track whichever range is selected above —
  // buildSeries already returns summed buckets for longer spans, so a plain
  // sum works whether the range is daily or bucketed.
  const grossSales = useMemo(
    () => buildSeries("sales", range).reduce((sum, p) => sum + p.value, 0),
    [range]
  );
  const grossProfit = useMemo(
    () => buildSeries("profit", range).reduce((sum, p) => sum + p.value, 0),
    [range]
  );

  return (
    <ScrollView className="flex-1 bg-[#FAF8F3]" contentContainerClassName="p-6">
      {/* Placeholder for the header component you'll add later */}
      <Text className="mb-6 text-3xl font-bold text-[#141813]">Dashboard</Text>

      <View className="flex-row gap-4">
        {/* Left column: date range, stat cards, reserved space */}
        <View className="flex-[2] gap-4">
          <DateRangeSelector range={range} onRangeChange={setRange} />

          <StatsCards
            grossSales={grossSales}
            grossProfit={grossProfit}
            range={range}
            onExpand={setExpandedMetric}
          />

          {/* Reserved for the next widget — left empty for now */}
          <View />
        </View>

        {/* Right column: notification + best selling */}
        <View className="flex-1 gap-4">
          <StockNotification />
          <BestSelling />
        </View>
      </View>

      <ChartModal
        metric={expandedMetric}
        range={range}
        onClose={() => setExpandedMetric(null)}
      />
    </ScrollView>
  );
}
