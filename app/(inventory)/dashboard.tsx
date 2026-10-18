import BestSelling from "@/components/inventory/dashboard/BestSelling";
import ChartModal from "@/components/inventory/dashboard/ChartModal";
import DateRangeSelector from "@/components/inventory/dashboard/DateRangeSelector";
import PrinterConfigModal from "@/components/inventory/dashboard/PrinterConfigModal";
import PrinterNotification from "@/components/inventory/dashboard/PrinterNotification";
import StatsCards from "@/components/inventory/dashboard/StatsCards";
import StockNotification from "@/components/inventory/dashboard/StockNotification";
import {
  buildSeries,
  quickRange,
  type DateRange,
  type Metric,
} from "@/components/inventory/dashboard/chartData";
import {
  DEFAULT_PRINTER_CONFIG,
  type PrinterConfig,
} from "@/components/inventory/dashboard/printerConfig";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";

export default function Dashboard() {
  const [range, setRange] = useState<DateRange>(() => quickRange("30d"));
  const [expandedMetric, setExpandedMetric] = useState<Metric | null>(null);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>(
    DEFAULT_PRINTER_CONFIG,
  );
  const [printerModalOpen, setPrinterModalOpen] = useState(false);

  // Totals shown on the stat cards track whichever range is selected above —
  // buildSeries already returns summed buckets for longer spans, so a plain
  // sum works whether the range is daily or bucketed.
  const grossSales = useMemo(
    () => buildSeries("sales", range).reduce((sum, p) => sum + p.value, 0),
    [range],
  );
  const grossProfit = useMemo(
    () => buildSeries("profit", range).reduce((sum, p) => sum + p.value, 0),
    [range],
  );

  return (
    <ScrollView className="flex-1 bg-[#FAF8F3]" contentContainerClassName="p-6">
      {/* Placeholder for the header component you'll add later */}
      {/* <Text className="mb-6 text-3xl font-bold text-[#141813]">Dashboard</Text> */}

      <View className="gap-4">
        {/* Row 1: date range only. The empty flex-1 sibling keeps the
            selector the same width as the left column below. */}
        <View className="flex-row gap-4">
          <View className="flex-[2]">
            <DateRangeSelector range={range} onRangeChange={setRange} />
          </View>
          <View className="flex-1" />
        </View>

        {/* Row 2: stat cards and notifications share the same top edge */}
        <View className="flex-row gap-4">
          {/* Left column: stat cards, reserved space */}
          <View className="flex-[2] gap-4">
            <StatsCards
              grossSales={grossSales}
              grossProfit={grossProfit}
              range={range}
              onExpand={setExpandedMetric}
            />

            {/* Reserved for the next widget — left empty for now */}
            <View />
          </View>

          {/* Right column: notifications + best selling */}
          <View className="flex-1 gap-4">
            <StockNotification />
            <PrinterNotification
              connected={false}
              onSettingsPress={() => setPrinterModalOpen(true)}
            />
            <BestSelling />
          </View>
        </View>
      </View>

      <ChartModal
        metric={expandedMetric}
        range={range}
        onClose={() => setExpandedMetric(null)}
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
