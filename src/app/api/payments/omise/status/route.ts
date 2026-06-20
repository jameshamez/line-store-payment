import { NextResponse } from "next/server";
import { isOmiseConfigured } from "@/lib/omise";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    configured: isOmiseConfigured(),
    webhookUrl: process.env.APP_BASE_URL
      ? `${process.env.APP_BASE_URL.replace(/\/$/, "")}/api/payments/omise/webhook`
      : null,
    mode: process.env.OMISE_SECRET_KEY?.includes("skey_test") ? "test" : process.env.OMISE_SECRET_KEY ? "live_or_custom" : "not_configured"
  });
}
