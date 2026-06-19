import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/db";

export const runtime = "nodejs";

type Params = Promise<{ orderId: string }>;

export async function GET(_request: NextRequest, context: { params: Params }) {
  const { orderId } = await context.params;
  const order = await getOrder(orderId);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const base64 = order.paymentQrDataUrl.replace(/^data:image\/png;base64,/, "");
  const image = Buffer.from(base64, "base64");

  return new NextResponse(image, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=60"
    }
  });
}
