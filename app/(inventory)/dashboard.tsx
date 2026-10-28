import BestSelling from "@/components/inventory/dashboard/BestSelling";
import ChartModal from "@/components/inventory/dashboard/ChartModal";
import DateRangeSelector from "@/components/inventory/dashboard/DateRangeSelector";
import InventoryStatCards from "@/components/inventory/dashboard/InventoryStatCards";
import PrinterConfigModal from "@/components/inventory/dashboard/PrinterConfigModal";
import PrinterNotification from "@/components/inventory/dashboard/PrinterNotification";
import StatsCards from "@/components/inventory/dashboard/StatsCards";
import StockNotification from "@/components/inventory/dashboard/StockNotification";
import {
  quickRange,
  type DateRange,
  type Metric
} from "@/components/inventory/dashboard/chartData";
import {
  DEFAULT_PRINTER_CONFIG,
  type PrinterConfig,
} from "@/components/inventory/dashboard/printerConfig";
import { useDashboard } from "@/hooks/use-dashboard";
import { useState } from "react";
import { ScrollView, View } from "react-native";

export default function Dashboard() {
  const [range, setRange] = useState<DateRange>(() => quickRange("30d"));
  const { data } = useDashboard(range);
  const EMPTY_SERIES: DailySeriesPoint[] = []; // module level, outside the component
  const [expandedMetric, setExpandedMetric] = useState<Metric | null>(null);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>(
    DEFAULT_PRINTER_CONFIG,
  );
  const [printerModalOpen, setPrinterModalOpen] = useState(false);

  // Totals shown on the stat cards track whichever range is selected above —
  // buildSeries already returns summed buckets for longer spans, so a plain
  // sum works whether the range is daily or bucketed.
  const grossSales = data?.sales.gross_sales ?? 0;
  const grossProfit = data?.sales.gross_profit ?? 0;

  return (
    <ScrollView
      className="flex-1 bg-neutral"
      contentContainerClassName="flex-grow p-6"
    >
      <View className="flex-1 gap-4">
        {/* Row 1: date range only. The empty flex-1 sibling keeps the
            selector the same width as the left column below. */}
        <View className="flex-row gap-4">
          <View className="flex-[2]">
            <DateRangeSelector range={range} onRangeChange={setRange} />
          </View>
          <View className="flex-1" />
        </View>

        {/* Row 2: stat cards and notifications share the same top edge */}
        <View className="flex-1 flex-row gap-4">
          {/* Left column: charts grow, inventory cards stay at the bottom */}
          <View className="flex-[2] gap-4">
            <View className="flex-1">
              <StatsCards
                grossSales={grossSales}
                grossProfit={grossProfit}
                range={range}
                onExpand={setExpandedMetric}
                series={data?.series ?? EMPTY_SERIES}
              />
            </View>

            <InventoryStatCards
              totalItems={data?.inventory.total_items ?? 0}
              totalValue={data?.inventory.total_value ?? 0}
            />
          </View>

          {/* Right column: notifications + best selling */}
          <View className="flex-1 gap-4">
            <StockNotification inventory={data?.inventory} />
            <PrinterNotification
              connected={false}
              onSettingsPress={() => setPrinterModalOpen(true)}
            />
            <View className="flex-1">
              <BestSelling
                products={(data?.top_products ?? []).map((p) => ({
                  name: p.product_name,
                  value: p.revenue,
                }))}
                categories={(data?.top_categories ?? []).map((c) => ({
                  name: c.category_name,
                  value: c.revenue,
                }))}
              />
            </View>
          </View>
        </View>
      </View>

      <ChartModal
        metric={expandedMetric}
        range={range}
        onClose={() => setExpandedMetric(null)}
        series={data?.series ?? EMPTY_SERIES}
      />

      <PrinterConfigModal
        visible={printerModalOpen}
        config={printerConfig}
        onClose={() => setPrinterModalOpen(false)}
        onSave={setPrinterConfig}
        // onPrintTest={...}  // wire this up once the printer connection exists
      />
    </ScrollView>
  );
}
