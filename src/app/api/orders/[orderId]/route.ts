import { NextRequest, NextResponse } from "next/server";
import { getOrder, updateOrder } from "@/lib/db";

export const runtime = "nodejs";

type Params = Promise<{ orderId: string }>;

export async function GET(_request: NextRequest, context: { params: Params }) {
  const { orderId } = await context.params;
  const order = await getOrder(orderId);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(request: NextRequest, context: { params: Params }) {
  const { orderId } = await context.params;
  const body = (await request.json()) as { status?: "waiting_payment" | "paid" | "cancelled" };

  if (!body.status || !["waiting_payment", "paid", "cancelled"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await updateOrder(orderId, (currentOrder) => ({
    ...currentOrder,
    status: body.status!,
    updatedAt: new Date().toISOString()
  }));

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
