export type ReceiptSectionId =
  | "logo"
  | "storeInfo"
  | "header"
  | "orderInfo"
  | "customerInfo"
  | "items"
  | "totals"
  | "payment"
  | "footer";

export interface ReceiptSection {
  id: ReceiptSectionId;
  label: string;
  description: string;
  enabled: boolean;
  /** Locked sections can be reordered but not turned off. */
  locked?: boolean;
}

export type PaperWidth = 58 | 80;

export interface PrinterConfig {
  /** Order in this array is the print order, top to bottom. */
  sections: ReceiptSection[];
  headerText: string;
  footerText: string;
  showItemComments: boolean;
  autoPrint: boolean;
  copies: number;
  paperWidth: PaperWidth;
  openDrawerOnCash: boolean;
}

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  sections: [
    {
      id: "logo",
      label: "Logo",
      description: "Business logo (black & white)",
      enabled: true,
    },
    {
      id: "storeInfo",
      label: "Store name & address",
      description: "Taken from store details",
      enabled: true,
    },
    {
      id: "header",
      label: "Header text",
      description: "Custom message below the store info",
      enabled: true,
    },
    {
      id: "orderInfo",
      label: "Order details",
      description: "Receipt no., date/time, cashier",
      enabled: true,
    },
    {
      id: "customerInfo",
      label: "Customer info",
      description: "Name, phone, address (if attached)",
      enabled: false,
    },
    {
      id: "items",
      label: "Items",
      description: "Products, quantities, prices",
      enabled: true,
      locked: true,
    },
    {
      id: "totals",
      label: "Totals & tax",
      description: "Subtotal, VAT, discounts, total",
      enabled: true,
      locked: true,
    },
    {
      id: "payment",
      label: "Payment",
      description: "Payment type, amount tendered, change",
      enabled: true,
    },
    {
      id: "footer",
      label: "Footer text",
      description: "Custom message at the bottom",
      enabled: true,
    },
  ],
  headerText: "",
  footerText: "Thank you! Please come again.",
  showItemComments: true,
  autoPrint: true,
  copies: 1,
  paperWidth: 80,
  openDrawerOnCash: true,
};
