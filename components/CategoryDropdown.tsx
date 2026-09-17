import { useRef, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";

interface CategoryDropdownProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
  chevronIcon?: ImageSourcePropType;
}

const DROPDOWN_WIDTH = 160;

export default function CategoryDropdown({
  categories,
  selected,
  onSelect,
  chevronIcon,
}: CategoryDropdownProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<any>(null);

  const openMenu = () => {
    triggerRef.current?.measureInWindow(
      (x: number, y: number, _width: number, height: number) => {
        setPosition({ top: y + height + 4, left: x });
        setOpen(true);
      },
    );
  };

  return (
    <View>
      <Pressable
        ref={triggerRef}
        onPress={openMenu}
        style={{ width: DROPDOWN_WIDTH }}
        className="flex-row items-center justify-between bg-white rounded-xl px-4 h-12 border border-slate-200"
      >
        <Text className="text-slate-700" numberOfLines={1}>
          {selected}
        </Text>
        {chevronIcon && (
          <Image
            source={chevronIcon}
            style={{
              width: 12,
              height: 12,
              transform: [{ rotate: open ? "180deg" : "0deg" }],
            }}
            resizeMode="contain"
          />
        )}
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)}>
          <View
            style={{
              position: "absolute",
              top: position.top,
              left: position.left,
              width: DROPDOWN_WIDTH,
            }}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-lg"
          >
            {categories.map((c) => (
              <Pressable
                key={c}
                onPress={() => {
                  onSelect(c);
                  setOpen(false);
                }}
                className={`px-4 py-3 ${c === selected ? "bg-cream" : ""}`}
              >
                <Text className="text-slate-700" numberOfLines={1}>
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
