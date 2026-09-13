import { getUnitPrice, type Product } from "@/constants/mockData";
import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useReducer,
} from "react";

export interface CartItem {
  key: string;
  product: Product;
  quantity: number;
  options?: Record<string, string>;
}

interface CartState {
  items: Record<string, CartItem>;
}

type CartAction =
  | { type: "ADD"; product: Product; options?: Record<string, string> }
  | { type: "DECREASE"; key: string }
  | { type: "CLEAR" };

// Simple (non-customized) products get a key equal to their plain id, exactly
// like before this feature existed. Customized products get a key that also
// encodes their selected options, so "Matcha, Small, Cold" and "Matcha,
// Large, Hot" are tracked as separate cart lines instead of merging.
export function makeCartKey(
  productId: string,
  options?: Record<string, string>,
) {
  if (!options) return productId;
  const sorted = Object.keys(options)
    .sort()
    .map((k) => `${k}:${options[k]}`)
    .join("|");
  return `${productId}::${sorted}`;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const key = makeCartKey(action.product.id, action.options);
      const existing = state.items[key];
      const quantity = (existing?.quantity || 0) + 1;
      return {
        ...state,
        items: {
          ...state.items,
          [key]: {
            key,
            product: action.product,
            quantity,
            options: action.options,
          },
        },
      };
    }
    case "DECREASE": {
      const existing = state.items[action.key];
      if (!existing) return state;
      if (existing.quantity <= 1) {
        const { [action.key]: _removed, ...rest } = state.items;
        return { ...state, items: rest };
      }
      return {
        ...state,
        items: {
          ...state.items,
          [action.key]: { ...existing, quantity: existing.quantity - 1 },
        },
      };
    }
    case "CLEAR":
      return { ...state, items: {} };
    default:
      return state;
  }
}

interface CartContextValue {
  items: Record<string, CartItem>;
  list: CartItem[];
  total: number;
  dispatch: Dispatch<CartAction>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: {} });
  const list = Object.values(state.items);
  const total = list.reduce(
    (sum, i) => sum + getUnitPrice(i.product, i.options) * i.quantity,
    0,
  );
  return (
    <CartContext.Provider value={{ items: state.items, list, total, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
