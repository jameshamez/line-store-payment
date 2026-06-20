import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { isLineConfigured } from "@/lib/line";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const db = await readDb();
  const shopId = new URL(request.url).searchParams.get("shopId");
  const shop = db.shops.find((candidate) => candidate.id === shopId) ?? db.shops[0];
  const recipientId = shop?.lineRecipientId || db.lineRecipients[0]?.id || process.env.LINE_RECIPIENT_ID || "";
  const baseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "");

  return NextResponse.json({
    appBaseUrl: baseUrl ?? null,
    channelAccessTokenConfigured: Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN),
    channelSecretConfigured: Boolean(process.env.LINE_CHANNEL_SECRET),
    recipientConfigured: Boolean(recipientId),
    ready: isLineConfigured(recipientId),
    shopId: shop?.id ?? null,
    webhookUrl: baseUrl ? `${baseUrl}/api/line/webhook` : null,
    recipientPreview: recipientId ? `${recipientId.slice(0, 4)}...${recipientId.slice(-4)}` : null
  });
}
