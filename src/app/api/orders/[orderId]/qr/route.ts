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

  const match = order.paymentQrDataUrl.match(/^data:(?<contentType>[^;]+);base64,(?<base64>.+)$/);

  if (!match?.groups) {
    return NextResponse.json({ error: "Order QR is not a valid data URL" }, { status: 500 });
  }

  const { contentType, base64 } = match.groups;
  const image = Buffer.from(base64, "base64");

  return new NextResponse(image, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=60"
    }
  });
}
