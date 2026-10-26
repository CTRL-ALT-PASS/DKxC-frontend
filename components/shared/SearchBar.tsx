import { Search } from "lucide-react-native";
import { View } from "react-native";
import TextField from "../TextField";

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Extra classes for the outer wrapper (width, margin, etc.). */
  className?: string;
};

/**
 * Shared search input so every page (Products, POS, Inventory, Employees)
 * has the same look. It only renders the field; pair it with `useSearch`
 * for the filtering logic.
 */
export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Search",
  className = "w-80",
}: SearchBarProps) {
  return (
    <View className={className}>
      <TextField
        icon={<Search size={18} color="#BE185D" />}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        className="h-12 bg-white rounded-lg px-3 border border-tertiary-soft"
      />
    </View>
  );
}