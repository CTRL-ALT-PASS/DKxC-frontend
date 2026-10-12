import { getUnitPrice, type Product } from "@/constants/mockData";
import { recordTransaction } from "@/services/transactionsApi";
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

export type OrderType = "Dine In" | "Take out";
export type PaymentMode = "Cash" | "Cashless";

export interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  orderType: OrderType;
  paymentMode: PaymentMode;
  completedAt: string;
}

interface CartState {
  items: Record<string, CartItem>;
  orderType: OrderType;
  transactions: Transaction[];
}

type CartAction =
  | { type: "ADD"; product: Product; options?: Record<string, string> }
  | { type: "INCREMENT_KEY"; key: string }
  | { type: "DECREASE"; key: string }
  | { type: "REMOVE_KEY"; key: string }
  | { type: "CLEAR" }
  | {
      type: "EDIT_OPTIONS";
      oldKey: string;
      product: Product;
      quantity: number;
      newOptions: Record<string, string>;
    }
  | { type: "SET_ORDER_TYPE"; orderType: OrderType }
  | { type: "COMPLETE_TRANSACTION"; transaction: Transaction };

// Simple (non-customized) products get a key equal to their plain id, so
// repeated taps merge into one line with a growing quantity. Customized
// products get a fresh unique key per add (see ADD below), so each one stays
// its own editable line.
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

function uniqueSuffix() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const key = action.options
        ? `${makeCartKey(action.product.id, action.options)}::${uniqueSuffix()}`
        : makeCartKey(action.product.id);
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
    case "INCREMENT_KEY": {
      const existing = state.items[action.key];
      if (!existing) return state;
      return {
        ...state,
        items: {
          ...state.items,
          [action.key]: { ...existing, quantity: existing.quantity + 1 },
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
    case "REMOVE_KEY": {
      const { [action.key]: _removed, ...rest } = state.items;
      return { ...state, items: rest };
    }
    case "EDIT_OPTIONS": {
      const { [action.oldKey]: _removed, ...rest } = state.items;
      const newKey = makeCartKey(action.product.id, action.newOptions);
      const existingAtNewKey = rest[newKey];
      const mergedQuantity = (existingAtNewKey?.quantity || 0) + action.quantity;
      return {
        ...state,
        items: {
          ...rest,
          [newKey]: {
            key: newKey,
            product: action.product,
            quantity: mergedQuantity,
            options: action.newOptions,
          },
        },
      };
    }
    case "SET_ORDER_TYPE":
      return { ...state, orderType: action.orderType };
    case "CLEAR":
      return { ...state, items: {}, orderType: "Dine In" };
    case "COMPLETE_TRANSACTION":
      return {
        ...state,
        items: {},
        orderType: "Dine In",
        transactions: [action.transaction, ...state.transactions],
      };
    default:
      return state;
  }
}

interface CartContextValue {
  items: Record<string, CartItem>;
  list: CartItem[];
  total: number;
  orderType: OrderType;
  transactions: Transaction[];
  dispatch: Dispatch<CartAction>;
  completeTransaction: (paymentMode: PaymentMode) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: {},
    orderType: "Dine In",
    transactions: [],
  });
  const list = Object.values(state.items);
  const total = list.reduce(
    (sum, i) => sum + getUnitPrice(i.product, i.options) * i.quantity,
    0,
  );

  // The one seam where a real backend plugs in. The cart updates immediately
  // (the UI never waits on a network round trip), and recordTransaction() is
  // where "save this sale to the server" lives -- right now it just resolves
  // against mock data. Reducers can't await, which is why the transaction is
  // built here and handed to the reducer ready-made.
  const completeTransaction = (paymentMode: PaymentMode) => {
    if (list.length === 0) return;
    const transaction: Transaction = {
      id: uniqueSuffix(),
      items: list,
      total,
      orderType: state.orderType,
      paymentMode,
      completedAt: new Date().toISOString(),
    };
    dispatch({ type: "COMPLETE_TRANSACTION", transaction });
    recordTransaction(transaction).catch((err) => {
      // Never fails with mock data. With a real backend, this is where you'd
      // queue a retry or show a "couldn't sync" message.
      console.warn("Failed to sync transaction to backend:", err);
    });
  };

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        list,
        total,
        orderType: state.orderType,
        transactions: state.transactions,
        dispatch,
        completeTransaction,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
