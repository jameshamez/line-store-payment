import { NextRequest, NextResponse } from "next/server";
import { readDb, updateOrder } from "@/lib/db";
import { sendLinePaymentNotification } from "@/lib/line";

export const runtime = "nodejs";

type Params = Promise<{ orderId: string }>;

export async function POST(_request: NextRequest, context: { params: Params }) {
  const { orderId } = await context.params;
  const db = await readDb();
  const order = db.orders.find((candidate) => candidate.id === orderId);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const shop = db.shops.find((candidate) => candidate.id === order.shopId);

  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const table = shop.tables.find((candidate) => candidate.id === order.tableId);

  if (!table) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  const notification = await sendLinePaymentNotification({ order, shop, table });
  const nextOrder = await updateOrder(order.id, (currentOrder) => ({
    ...currentOrder,
    notifications: [notification, ...currentOrder.notifications],
    updatedAt: new Date().toISOString()
  }));

  return NextResponse.json({ order: nextOrder, notification });
}
