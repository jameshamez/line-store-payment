import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { sendLineTestMessage } from "@/lib/line";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { shopId?: string };
  const db = await readDb();
  const shop = db.shops.find((candidate) => candidate.id === body.shopId) ?? db.shops[0];

  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const result = await sendLineTestMessage({
    recipientId: shop.lineRecipientId,
    shopName: shop.name
  });

  return NextResponse.json({
    ok: result.ok,
    requestId: result.requestId,
    error: result.error
  }, { status: result.ok ? 200 : 400 });
}
