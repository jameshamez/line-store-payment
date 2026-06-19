import { NextRequest, NextResponse } from "next/server";
import { makeId, readDb, writeDb } from "@/lib/db";
import { createPaymentQr } from "@/lib/payment";
import type { Order, OrderItem } from "@/lib/types";

export const runtime = "nodejs";

type CreateOrderBody = {
  shopId?: string;
  tableId?: string;
  customerLineUserId?: string;
  customerName?: string;
  items?: Array<{ menuItemId: string; quantity: number }>;
};

export async function GET(request: NextRequest) {
  const db = await readDb();
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");
  const tableId = searchParams.get("tableId");

  const orders = db.orders
    .filter((order) => !shopId || order.shopId === shopId)
    .filter((order) => !tableId || order.tableId === tableId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ orders });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateOrderBody;
  const db = await readDb();
  const shop = db.shops.find((candidate) => candidate.id === body.shopId);

  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const table = shop.tables.find((candidate) => candidate.id === body.tableId);

  if (!table) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  const orderItems: OrderItem[] = [];

  for (const requestedItem of body.items ?? []) {
    const menuItem = shop.menu.find((candidate) => candidate.id === requestedItem.menuItemId);

    if (!menuItem || !menuItem.available) {
      return NextResponse.json({ error: `Menu item ${requestedItem.menuItemId} is not available` }, { status: 400 });
    }

    const quantity = Number(requestedItem.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Quantity must be a positive integer" }, { status: 400 });
    }

    orderItems.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      quantity,
      price: menuItem.price
    });
  }

  if (orderItems.length === 0) {
    return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
  }

  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { paymentPayload, paymentQrDataUrl } = await createPaymentQr(shop.promptPayId, total);
  const now = new Date().toISOString();

  const order: Order = {
    id: makeId("ord"),
    shopId: shop.id,
    tableId: table.id,
    customerLineUserId: body.customerLineUserId,
    customerName: body.customerName,
    items: orderItems,
    total,
    status: "waiting_payment",
    paymentPayload,
    paymentQrDataUrl,
    notifications: [],
    createdAt: now,
    updatedAt: now
  };

  db.orders.unshift(order);
  await writeDb(db);

  return NextResponse.json({ order }, { status: 201 });
}
