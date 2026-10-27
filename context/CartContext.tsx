import type { Product } from "@/constants/mockData";
import { useAuth } from "@/context/AuthContext";
import { recordTransaction } from "@/services/transactionsApi";
import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useReducer,
} from "react";
import { getLineTotal, getOrderTotals } from "../constants/pricing";

export interface CartItem {
  key: string;
  product: Product;
  quantity: number;
  options?: Record<string, string>;
  discountPercent?: number; // promo (e.g. 40 or 100) -- covers ONE drink of this line only
}

export type OrderType = "Dine In" | "Take out";
export type PaymentMode = "Cash" | "Cashless";

export interface Transaction {
  id: string;
  employeeId: string; // the cashier who processed it -- order history only shows a cashier their own orders
  cashierName: string;
  items: CartItem[];
  subtotal: number; // before the PWD / Senior discount
  seniorPwdDiscount: number; // pesos taken off by that discount (0 when it wasn't applied)
  total: number;
  orderType: OrderType;
  paymentMode: PaymentMode;
  completedAt: string;
}

export interface PendingOrder {
  id: string;
  employeeId: string;
  cashierName: string;
  items: CartItem[];
  subtotal: number;
  seniorPwdDiscount: number;
  seniorPwd: boolean;
  total: number;
  orderType: OrderType;
  createdAt: string;
}

interface CartState {
  items: Record<string, CartItem>;
  orderType: OrderType;
  seniorPwd: boolean;
  pendingOrders: PendingOrder[];
  transactions: Transaction[];
}

type CartAction =
  | { type: "ADD"; product: Product; options?: Record<string, string> }
  | {
      type: "ADD_CUSTOMIZED";
      product: Product;
      options: Record<string, string>;
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
      newOptions: Record<string, string>;
    }
  | { type: "SET_ORDER_TYPE"; orderType: OrderType }
  | { type: "SET_SENIOR_PWD"; enabled: boolean }
  | { type: "PLACE_ORDER"; order: PendingOrder }
  | {
      type: "CHANGE_PENDING_ITEM_QUANTITY";
      orderId: string;
      key: string;
      delta: number;
    }
  | { type: "REMOVE_PENDING_ITEM"; orderId: string; key: string }
  | {
      type: "EDIT_PENDING_ITEM";
      orderId: string;
      key: string;
      options: Record<string, string>;
      quantity: number;
      discountPercent?: number;
    }
  | {
      type: "COMPLETE_PENDING_ORDER";
      orderId: string;
      transaction: Transaction;
    };

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

function recalculatePendingOrder(order: PendingOrder): PendingOrder {
  const subtotal = order.items.reduce(
    (sum, item) =>
      sum +
      getLineTotal(
        item.product,
        item.options,
        item.quantity,
        item.discountPercent,
      ),
    0,
  );
  return { ...order, ...getOrderTotals(subtotal, order.seniorPwd) };
}

function updatePendingOrder(
  state: CartState,
  orderId: string,
  update: (order: PendingOrder) => PendingOrder,
): CartState {
  return {
    ...state,
    pendingOrders: state.pendingOrders.map((order) =>
      order.id === orderId ? recalculatePendingOrder(update(order)) : order,
    ),
  };
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
    case "ADD_CUSTOMIZED": {
      // One confirm from the options modal. With a promo, the promo'd drink gets
      // its own line (quantity 1) and the remaining drinks share a plain line, so
      // the discount can only ever land on a single drink.
      const count = Math.max(1, Math.floor(action.quantity));
      const base = makeCartKey(action.product.id, action.options);
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
      const newKey = makeCartKey(action.product.id, action.newOptions);
      const existingAtNewKey = rest[newKey];
      const mergedQuantity =
        (existingAtNewKey?.quantity || 0) + action.quantity;
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
      return { ...state, items: {}, orderType: "Dine In", seniorPwd: false };
    case "PLACE_ORDER":
      return {
        ...state,
        items: {},
        orderType: "Dine In",
        seniorPwd: false,
        pendingOrders: [action.order, ...state.pendingOrders],
      };
    case "CHANGE_PENDING_ITEM_QUANTITY":
      return updatePendingOrder(state, action.orderId, (order) => ({
        ...order,
        items: order.items.map((item) =>
          item.key === action.key
            ? { ...item, quantity: Math.max(1, item.quantity + action.delta) }
            : item,
        ),
      }));
    case "REMOVE_PENDING_ITEM": {
      const updatedState = updatePendingOrder(state, action.orderId, (order) => ({
        ...order,
        items: order.items.filter((item) => item.key !== action.key),
      }));
      return {
        ...updatedState,
        pendingOrders: updatedState.pendingOrders.filter(
          (order) => order.items.length > 0,
        ),
      };
    }
    case "EDIT_PENDING_ITEM":
      return updatePendingOrder(state, action.orderId, (order) => ({
        ...order,
        items: order.items.map((item) =>
          item.key === action.key
            ? {
                ...item,
                options: action.options,
                quantity: Math.max(1, Math.floor(action.quantity)),
                discountPercent: action.discountPercent,
              }
            : item,
        ),
      }));
    case "COMPLETE_PENDING_ORDER":
      return {
        ...state,
        pendingOrders: state.pendingOrders.filter(
          (order) => order.id !== action.orderId,
        ),
        transactions: [action.transaction, ...state.transactions],
      };
    default:
      return state;
  }
}

// Only the orders this employee processed. The order history screen uses this so
// one cashier never sees another cashier's orders.
export function getTransactionsForEmployee(
  transactions: Transaction[],
  employeeId?: string,
) {
  if (!employeeId) return [];
  return transactions.filter((t) => t.employeeId === employeeId);
}

interface CartContextValue {
  items: Record<string, CartItem>;
  list: CartItem[];
  subtotal: number; // sum of the lines, before the PWD / Senior discount
  seniorPwdDiscount: number; // pesos off from that discount (0 when it's off)
  isSeniorPwd: boolean;
  total: number; // what the customer pays
  orderType: OrderType;
  transactions: Transaction[]; // everything processed on this device
  myTransactions: Transaction[]; // only the logged-in cashier's orders
  pendingOrders: PendingOrder[];
  dispatch: Dispatch<CartAction>;
  placeOrder: () => void;
  completePendingOrder: (orderId: string, paymentMode: PaymentMode) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: {},
    orderType: "Dine In",
    seniorPwd: false,
    pendingOrders: [],
    transactions: [],
  });
  const { user } = useAuth();
  const list = Object.values(state.items);
  const { subtotal, seniorPwdDiscount, total } = getOrderTotals(
    list.reduce(
      (sum, i) =>
        sum + getLineTotal(i.product, i.options, i.quantity, i.discountPercent),
      0,
    ),
    state.seniorPwd,
  );
  const myTransactions = getTransactionsForEmployee(
    state.transactions,
    user?.employee_id,
  );

  const placeOrder = () => {
    if (list.length === 0 || !user) return;
    const order: PendingOrder = {
      id: uniqueSuffix(),
      employeeId: user.employee_id,
      cashierName: user.fullname,
      items: list.map((item) => ({ ...item })),
      subtotal,
      seniorPwdDiscount,
      seniorPwd: state.seniorPwd,
      total,
      orderType: state.orderType,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "PLACE_ORDER", order });
  };

  const completePendingOrder = (orderId: string, paymentMode: PaymentMode) => {
    const order = state.pendingOrders.find((pending) => pending.id === orderId);
    if (!order || order.items.length === 0 || !user) return;

    const transaction: Transaction = {
      id: order.id,
      employeeId: user.employee_id,
      cashierName: user.fullname,
      items: order.items,
      subtotal: order.subtotal,
      seniorPwdDiscount: order.seniorPwdDiscount,
      total: order.total,
      orderType: order.orderType,
      paymentMode,
      completedAt: new Date().toISOString(),
    };
    dispatch({ type: "COMPLETE_PENDING_ORDER", orderId, transaction });
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
        subtotal,
        seniorPwdDiscount,
        isSeniorPwd: state.seniorPwd,
        total,
        orderType: state.orderType,
        transactions: state.transactions,
        myTransactions,
        pendingOrders: state.pendingOrders,
        dispatch,
        placeOrder,
        completePendingOrder,
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
