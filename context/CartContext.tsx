import {
  createOrder,
  type Order,
  type OrderInput,
  type OrderItemInput,
} from "@/services/ordersApi";
import type { Product } from "@/services/productsApi";
import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  getLineTotal,
  getOrderTotals,
  ORDER_TYPE_TO_API,
  PROMO_CODE_BY_PERCENT,
  SENIOR_PWD_CODE,
  type OrderOptions,
} from "../constants/pricing";

export interface CartItem {
  key: string;
  product: Product;
  quantity: number;
  options?: OrderOptions;
  discountPercent?: number; // promo (40 or 100), covers ONE unit of this line only
}

export type OrderType = "Dine In" | "Take out";
export type PaymentMode = "Cash" | "Cashless";

interface CartState {
  items: Record<string, CartItem>;
  orderType: OrderType;
  seniorPwd: boolean;
}

type CartAction =
  | { type: "ADD"; product: Product; options?: OrderOptions }
  | {
      type: "ADD_CUSTOMIZED";
      product: Product;
      options: OrderOptions;
      quantity: number;
      discountPercent?: number;
    }
  | { type: "INCREMENT_KEY"; key: string }
  | { type: "DECREASE"; key: string }
  | { type: "REMOVE_KEY"; key: string }
  | { type: "CLEAR" }
  | {
      type: "EDIT_OPTIONS";
      oldKey: string;
      product: Product;
      quantity: number;
      newOptions: OrderOptions;
    }
  | { type: "SET_ORDER_TYPE"; orderType: OrderType }
  | { type: "SET_SENIOR_PWD"; enabled: boolean };

// Simple products (no options) key on their plain id so repeated taps merge.
// Customized products get a unique key per add so each stays its own line.
export function makeCartKey(productId: number, options?: OrderOptions) {
  if (!options) return String(productId);
  const addOns = [...options.addOnIds].sort((a, b) => a - b).join(",");
  return `${productId}::s${options.sizeId ?? "-"}|a${addOns}`;
}

function uniqueSuffix() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const key = action.options
        ? `${makeCartKey(action.product.product_id, action.options)}::${uniqueSuffix()}`
        : makeCartKey(action.product.product_id);
      const existing = state.items[key];
      return {
        ...state,
        items: {
          ...state.items,
          [key]: {
            key,
            product: action.product,
            quantity: (existing?.quantity || 0) + 1,
            options: action.options,
          },
        },
      };
    }
    case "ADD_CUSTOMIZED": {
      // With a promo, the promo'd unit gets its own line (qty 1) and the rest share
      // a plain line, so the discount can only land on a single unit.
      const count = Math.max(1, Math.floor(action.quantity));
      const base = makeCartKey(action.product.product_id, action.options);
      const items = { ...state.items };
      const plainCount = action.discountPercent ? count - 1 : count;
      if (action.discountPercent) {
        const key = `${base}::${uniqueSuffix()}-promo`;
        items[key] = {
          key,
          product: action.product,
          quantity: 1,
          options: action.options,
          discountPercent: action.discountPercent,
        };
      }
      if (plainCount > 0) {
        const key = `${base}::${uniqueSuffix()}`;
        items[key] = {
          key,
          product: action.product,
          quantity: plainCount,
          options: action.options,
        };
      }
      return { ...state, items };
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
      const newKey = makeCartKey(action.product.product_id, action.newOptions);
      const mergedQuantity = (rest[newKey]?.quantity || 0) + action.quantity;
      return {
        ...state,
        items: {
          ...rest,
          [newKey]: {
            key: newKey,
            product: action.product,
            quantity: mergedQuantity,
            options: action.newOptions,
            discountPercent: state.items[action.oldKey]?.discountPercent,
          },
        },
      };
    }
    case "SET_ORDER_TYPE":
      return { ...state, orderType: action.orderType };
    case "SET_SENIOR_PWD":
      return { ...state, seniorPwd: action.enabled };
    case "CLEAR":
      return { items: {}, orderType: "Dine In", seniorPwd: false };
    default:
      return state;
  }
}

/** Cart -> POST /orders body. Ids only; the server recomputes every price. */
export function buildOrderInput(
  list: CartItem[],
  orderType: OrderType,
  seniorPwd: boolean,
): OrderInput {
  const items: OrderItemInput[] = list.map((line) => {
    const discounts: NonNullable<OrderItemInput["discounts"]> = [];

    if (line.discountPercent) {
      discounts.push({
        discount_code: PROMO_CODE_BY_PERCENT[line.discountPercent],
        units: 1,
      });
    }
    // Senior/PWD covers the units that don't already carry a promo, so the two
    // never stack on the same unit.
    const seniorUnits = line.quantity - (line.discountPercent ? 1 : 0);
    if (seniorPwd && seniorUnits > 0) {
      discounts.push({ discount_code: SENIOR_PWD_CODE, units: seniorUnits });
    }

    return {
      product_id: line.product.product_id,
      size_id: line.options?.sizeId ?? null,
      quantity: line.quantity,
      add_on_ids: line.options?.addOnIds ?? [],
      ...(discounts.length ? { discounts } : {}),
    };
  });

  return { order_type: ORDER_TYPE_TO_API[orderType], items };
}

function newIdempotencyKey() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface CartContextValue {
  items: Record<string, CartItem>;
  list: CartItem[];
  subtotal: number; // client-side estimate; the server total is the source of truth
  seniorPwdDiscount: number;
  isSeniorPwd: boolean;
  total: number;
  orderType: OrderType;
  placing: boolean;
  dispatch: Dispatch<CartAction>;
  /** Creates a Pending order on the server and clears the cart. Throws on failure; the cart is kept. */
  placeOrder: () => Promise<Order>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: {},
    orderType: "Dine In",
    seniorPwd: false,
  });
  const [placing, setPlacing] = useState(false);
  // Same payload retried => same key, so a dropped response can't create a duplicate order.
  const attemptRef = useRef<{ payload: string; key: string } | null>(null);

  const list = Object.values(state.items);
  const { subtotal, seniorPwdDiscount, total } = getOrderTotals(
    list.reduce(
      (sum, i) =>
        sum + getLineTotal(i.product, i.options, i.quantity, i.discountPercent),
      0,
    ),
    state.seniorPwd,
  );

  const placeOrder = async (): Promise<Order> => {
    if (list.length === 0) throw new Error("The cart is empty");

    const input = buildOrderInput(list, state.orderType, state.seniorPwd);
    const payload = JSON.stringify(input);
    if (attemptRef.current?.payload !== payload) {
      attemptRef.current = { payload, key: newIdempotencyKey() };
    }

    setPlacing(true);
    try {
      const res = await createOrder(input, attemptRef.current.key);
      attemptRef.current = null;
      dispatch({ type: "CLEAR" });
      return res.data;
    } finally {
      setPlacing(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        list,
        subtotal,
        seniorPwdDiscount,
        isSeniorPwd: state.seniorPwd,
        total,
        orderType: state.orderType,
        placing,
        dispatch,
        placeOrder,
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
