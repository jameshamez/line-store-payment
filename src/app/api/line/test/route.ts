import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { sendLineTestMessage } from "@/lib/line";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { shopId?: string; recipientId?: string };
  const db = await readDb();
  const shop = db.shops.find((candidate) => candidate.id === body.shopId) ?? db.shops[0];

  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const recipientId = body.recipientId || shop.lineRecipientId || db.lineRecipients[0]?.id || process.env.LINE_RECIPIENT_ID || "";

  const result = await sendLineTestMessage({
    recipientId,
    shopName: shop.name
  });

  return NextResponse.json({
    ok: result.ok,
    requestId: result.requestId,
    error: result.error
  }, { status: result.ok ? 200 : 400 });
}
