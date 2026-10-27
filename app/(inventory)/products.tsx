import ProductGrid from "@/components/shared/ProductGrid";
import SearchBar from "@/components/shared/SearchBar";
import { useProducts } from "@/hooks/use-products";
import { useSearch } from "@/hooks/use-search";
import type { Product } from "@/services/productsApi";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Pencil, Plus } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import InventoryProductCard from "../../components/inventory/products/InventoryProductCard";
import { useCategories } from "../../hooks/use-categories";

const PRODUCT_FORM_ROUTE = "/(inventory)/product-form";

// Tailwind palette values (see tailwind.config.js) for props that can't take classNames
const PRIMARY = "#BE185D";
const TERTIARY_SOFT = "#FDA4AF";

export default function ProductsScreen() {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<number | null>(null); // null = All

  const { categories } = useCategories();

  const filters = useMemo(
    () => (categoryId === null ? {} : { category_id: categoryId }),
    [categoryId],
  );
  const { products, loading, error, refetch } = useProducts(filters);

  // Refresh when coming back from the product form, without double-fetching on mount
  // or when the category changes (useProducts already refetches for those).
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refetchRef.current();
    }, []),
  );

  const categoryNames = useMemo(
    () => new Map(categories.map((c) => [c.category_id, c.category_name])),
    [categories],
  );

  // Adapt the API shape to what InventoryProductCard expects.
  const cardProducts = useMemo(
    () =>
      products.map((p: Product) => ({
        id: String(p.product_id),
        name: p.product_name,
        category: categoryNames.get(p.category_id) ?? "",
        price: Number(p.selling_price),
        available: p.is_available,
        status: p.product_status,
      })),
    [products, categoryNames],
  );

  const {
    query,
    setQuery,
    results: filtered,
  } = useSearch(cardProducts, (p) => p.name);

  /* ---------------- Category row: chevron scrolling ---------------- */
  const categoryScrollRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [viewWidth, setViewWidth] = useState(0);

  const canScrollLeft = scrollX > 1;
  const canScrollRight = scrollX + viewWidth < contentWidth - 1;

  const onCategoryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setScrollX(e.nativeEvent.contentOffset.x);

  const scrollCategories = (direction: -1 | 1) => {
    const step = Math.max(viewWidth * 0.6, 120);
    const max = Math.max(0, contentWidth - viewWidth);
    const x = Math.min(max, Math.max(0, scrollX + direction * step));
    categoryScrollRef.current?.scrollTo({ x, animated: true });
  };

  const openAddProduct = () => router.push(PRODUCT_FORM_ROUTE as any);
  const openEditProduct = (id: string) =>
    router.push({ pathname: PRODUCT_FORM_ROUTE as any, params: { id } });
  const openManageAddOns = () => {
    // TODO: navigate to the add-ons management screen once it exists
  };

  const showInitialSpinner = loading && products.length === 0;

  return (
    <View className="flex-1 bg-neutral p-6">
      {/* Search, categories and actions */}
      <View className="flex-row items-center mb-4">
        {/* TODO fix query to only run after an interval so it doesnt query too much on deletes */}
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search for a product"
          className="w-80 mr-4"
        />

        {/* Categories: chevron buttons on each side, scrolls left/right */}
        <View className="flex-1 flex-row items-center">
          <ChevronButton
            direction="left"
            disabled={!canScrollLeft}
            onPress={() => scrollCategories(-1)}
          />

          <ScrollView
            ref={categoryScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={onCategoryScroll}
            onLayout={(e) => setViewWidth(e.nativeEvent.layout.width)}
            onContentSizeChange={(w) => setContentWidth(w)}
            className="flex-1 mx-2"
            contentContainerStyle={{ alignItems: "center" }}
          >
            {[{ category_id: null, category_name: "All" }, ...categories].map(
              (c) => {
                const active = c.category_id === categoryId;
                return (
                  <Pressable
                    key={c.category_id ?? "all"}
                    onPress={() => setCategoryId(c.category_id)}
                    className={`mr-3 px-3 py-1 rounded-full border ${
                      active
                        ? "bg-primary border-primary"
                        : "bg-white border-tertiary-soft"
                    }`}
                  >
                    <Text
                      className={active ? "text-white" : "text-secondary"}
                      numberOfLines={1}
                    >
                      {c.category_name}
                    </Text>
                  </Pressable>
                );
              },
            )}
          </ScrollView>

          <ChevronButton
            direction="right"
            disabled={!canScrollRight}
            onPress={() => scrollCategories(1)}
          />
        </View>

        <View className="flex-row ml-4">
          <Pressable
            onPress={openAddProduct}
            className="flex-row items-center bg-primary rounded-lg px-4 py-2 mr-3"
          >
            <Plus size={18} color="#fff" />
            <Text className="text-white font-medium ml-2">Add product</Text>
          </Pressable>

          <Pressable className="flex-row items-center bg-white border border-primary rounded-lg px-4 py-2 mr-3">
            <Pencil size={18} color={PRIMARY} />
            <Text className="text-primary font-medium ml-2">
              Edit categories
            </Text>
          </Pressable>

          <Pressable
            onPress={openManageAddOns}
            className="flex-row items-center bg-white border border-primary rounded-lg px-4 py-2"
          >
            <Pencil size={18} color={PRIMARY} />
            <Text className="text-primary font-medium ml-2">
              Manage add-ons
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Product grid: fills the remaining height so it can scroll vertically */}
      <View className="flex-1 min-h-0">
        {showInitialSpinner ? (
          <ActivityIndicator className="mt-8" color={PRIMARY} />
        ) : error && products.length === 0 ? (
          <View className="items-center mt-8">
            <Text className="text-secondary mb-3">{error.message}</Text>
            <Pressable
              onPress={() => refetch()}
              className="bg-primary rounded-lg px-4 py-2"
            >
              <Text className="text-white font-medium">Try again</Text>
            </Pressable>
          </View>
        ) : (
          <ProductGrid
            data={filtered}
            keyExtractor={(item) => item.id}
            renderCard={(item) => (
              <InventoryProductCard
                product={item}
                available={item.available}
                onPress={() => openEditProduct(item.id)}
              />
            )}
            ListEmptyComponent={
              <Text className="text-secondary mt-8 text-center">
                No products found
              </Text>
            }
          />
        )}
      </View>
    </View>
  );
}

function ChevronButton({
  direction,
  disabled,
  onPress,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onPress: () => void;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={`Scroll categories ${direction}`}
      className={`w-8 h-8 items-center justify-center rounded-full bg-white border border-tertiary-soft ${
        disabled ? "opacity-40" : ""
      }`}
    >
      <Icon size={18} color={disabled ? TERTIARY_SOFT : PRIMARY} />
    </Pressable>
  );
}
