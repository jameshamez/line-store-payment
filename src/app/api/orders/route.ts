import { NextRequest, NextResponse } from "next/server";
import { makeId, readDb, writeDb } from "@/lib/db";
import { isOmiseConfigured, createOmisePromptPayCharge } from "@/lib/omise";
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
  const now = new Date().toISOString();
  const orderId = makeId("ord");
  const webhookEndpoint = process.env.APP_BASE_URL
    ? `${process.env.APP_BASE_URL.replace(/\/$/, "")}/api/payments/omise/webhook`
    : undefined;
  const useOmise = isOmiseConfigured();
  const omisePayment = useOmise
    ? await createOmisePromptPayCharge({
        orderId,
        amount: total,
        description: `${shop.name} ${table.name}`,
        webhookEndpoint
      })
    : null;
  const demoPayment = useOmise ? null : await createPaymentQr(shop.promptPayId, total);

  const order: Order = {
    id: orderId,
    shopId: shop.id,
    tableId: table.id,
    customerLineUserId: body.customerLineUserId,
    customerName: body.customerName,
    items: orderItems,
    total,
    status: "waiting_payment",
    paymentPayload: omisePayment?.paymentPayload ?? demoPayment!.paymentPayload,
    paymentQrDataUrl: omisePayment?.paymentQrDataUrl ?? demoPayment!.paymentQrDataUrl,
    paymentProvider: useOmise ? "omise_promptpay" : "promptpay_demo",
    paymentGateway: omisePayment
      ? {
          provider: "omise_promptpay",
          chargeId: omisePayment.chargeId,
          sourceId: omisePayment.sourceId,
          status: omisePayment.status,
          qrImageUrl: omisePayment.qrImageUrl,
          expiresAt: omisePayment.expiresAt
        }
      : {
          provider: "promptpay_demo"
        },
    notifications: [],
    createdAt: now,
    updatedAt: now
  };

  db.orders.unshift(order);
  await writeDb(db);

  return NextResponse.json({ order }, { status: 201 });
}
