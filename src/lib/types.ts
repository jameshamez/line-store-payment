export type Table = {
  id: string;
  name: string;
};

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
};

export type Shop = {
  id: string;
  name: string;
  branch: string;
  promptPayId: string;
  lineRecipientId: string;
  tables: Table[];
  menu: MenuItem[];
};

export type OrderItem = {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
};

export type PaymentNotification = {
  id: string;
  channel: "line";
  status: "sent" | "mocked" | "failed";
  recipientId: string;
  requestId?: string;
  error?: string;
  createdAt: string;
};

export type OrderStatus = "waiting_payment" | "paid" | "cancelled";

export type Order = {
  id: string;
  shopId: string;
  tableId: string;
  customerLineUserId?: string;
  customerName?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentPayload: string;
  paymentQrDataUrl: string;
  notifications: PaymentNotification[];
  createdAt: string;
  updatedAt: string;
};

export type Database = {
  shops: Shop[];
  orders: Order[];
};
