import { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import type { Product } from "../constants/mockData";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: Record<string, CartItem>;
}

type CartAction =
  | { type: "ADD"; product: Product }
  | { type: "DECREASE"; productId: string }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.items[action.product.id];
      const quantity = (existing?.quantity || 0) + 1;
      return { ...state, items: { ...state.items, [action.product.id]: { product: action.product, quantity } } };
    }
    case "DECREASE": {
      const existing = state.items[action.productId];
      if (!existing) return state;
      if (existing.quantity <= 1) {
        const { [action.productId]: _removed, ...rest } = state.items;
        return { ...state, items: rest };
      }
      return { ...state, items: { ...state.items, [action.productId]: { ...existing, quantity: existing.quantity - 1 } } };
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
  const total = list.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  return <CartContext.Provider value={{ items: state.items, list, total, dispatch }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
