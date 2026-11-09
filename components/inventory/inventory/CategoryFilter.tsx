import {
    INVENTORY_CATEGORIES,
    type InventoryCategory,
} from "@/types/inventoryCategories";
import { X } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

const PINK = "#BE185D";

type Props = {
  selected: InventoryCategory[];
  onToggle: (category: InventoryCategory) => void;
  onClear: () => void;
  extraActive?: boolean;
};

export default function CategoryFilter({
  selected,
  onToggle,
  onClear,
  extraActive = false,
}: Props) {
  const hasSelection = selected.length > 0;

  return (
    <View className="flex-row items-center">
      {INVENTORY_CATEGORIES.map((c) => {
        const active = selected.includes(c.name);
        const Icon = c.icon;

        return (
          <Pressable
            key={c.name}
            onPress={() => onToggle(c.name)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${c.name}`}
            accessibilityState={{ selected: active }}
            className={`mr-2 h-10 w-10 items-center justify-center rounded-lg border ${
              active
                ? "border-primary bg-primary"
                : "border-tertiary-soft bg-white active:bg-neutral"
            }`}
          >
            <Icon size={20} color={active ? "#FFFFFF" : PINK} strokeWidth={2} />
          </Pressable>
        );
      })}

      <Pressable
        onPress={onClear}
        disabled={!hasSelection}
        accessibilityRole="button"
        accessibilityLabel="Clear category filters"
        accessibilityState={{ disabled: !hasSelection }}
        className={`h-10 flex-row items-center rounded-lg border border-tertiary-soft bg-white px-3 ${
          hasSelection ? "active:bg-neutral" : "opacity-40"
        }`}
      >
        <X size={16} color={PINK} strokeWidth={2} />
        <Text className="ml-1 text-[14px] font-semibold text-primary">
          Clear
        </Text>
      </Pressable>
    </View>
  );
}
