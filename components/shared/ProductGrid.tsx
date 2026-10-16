import { useMemo, useState, type ReactNode } from "react";
import { FlatList, View, type FlatListProps } from "react-native";

export const PRODUCT_CARD_WIDTH = 160; // keep in sync with the card's w-40
export const PRODUCT_GRID_GAP = 12;

interface ProductGridProps<T> extends Omit<
  FlatListProps<T>,
  "renderItem" | "numColumns" | "data" | "keyExtractor"
> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  cardWidth?: number;
  gap?: number;
}

export default function ProductGrid<T>({
  data,
  keyExtractor,
  renderCard,
  cardWidth = PRODUCT_CARD_WIDTH,
  gap = PRODUCT_GRID_GAP,
  ...listProps
}: ProductGridProps<T>) {
  const [containerWidth, setContainerWidth] = useState(0);

  const numColumns = useMemo(() => {
    if (containerWidth <= 0) return 1;
    return Math.max(1, Math.floor((containerWidth + gap) / (cardWidth + gap)));
  }, [containerWidth, cardWidth, gap]);

  return (
    <View
      className="flex-1"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && (
        <FlatList
          key={numColumns} // re-mount when column count changes
          data={data}
          numColumns={numColumns}
          keyExtractor={keyExtractor}
          renderItem={({ item, index }) => (
            <View
              style={{
                marginRight: (index + 1) % numColumns === 0 ? 0 : gap,
                marginBottom: gap,
              }}
            >
              {renderCard(item)}
            </View>
          )}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...listProps}
        />
      )}
    </View>
  );
}
