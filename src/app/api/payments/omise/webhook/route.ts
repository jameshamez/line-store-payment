import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { retrieveOmiseCharge, verifyOmiseWebhookSignature } from "@/lib/omise";

export const runtime = "nodejs";

type OmiseWebhookEvent = {
  id?: string;
  key?: string;
  data?: {
    id?: string;
    object?: string;
    status?: string;
    paid?: boolean;
    metadata?: Record<string, string>;
  };
};

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const webhookSecret = process.env.OMISE_WEBHOOK_SECRET;

    if (webhookSecret) {
      const verified = verifyOmiseWebhookSignature({
        rawBody,
        signature: request.headers.get("omise-signature"),
        timestamp: request.headers.get("omise-signature-timestamp"),
        webhookSecret
      });

      if (!verified) {
        return NextResponse.json({ error: "Invalid Omise webhook signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody) as OmiseWebhookEvent;

    if (event.key !== "charge.complete" || event.data?.object !== "charge" || !event.data.id) {
      return NextResponse.json({ received: true, ignored: event.key ?? "unknown" });
    }

    const charge = await retrieveOmiseCharge(event.data.id);
    const orderId = charge.metadata?.order_id;

    if (!orderId) {
      return NextResponse.json({ received: true, error: "Charge does not include metadata.order_id" }, { status: 202 });
    }

    const db = await readDb();
    const orderIndex = db.orders.findIndex((order) => order.id === orderId);

    if (orderIndex === -1) {
      return NextResponse.json({ received: true, error: "Order not found" }, { status: 202 });
    }

    const order = db.orders[orderIndex];
    db.orders[orderIndex] = {
      ...order,
      status: charge.status === "successful" || charge.paid ? "paid" : order.status,
      paymentGateway: {
        provider: "omise_promptpay",
        chargeId: charge.id,
        sourceId: charge.source?.id ?? order.paymentGateway?.sourceId,
        status: charge.status,
        qrImageUrl: charge.source?.scannable_code?.image?.download_uri ?? order.paymentGateway?.qrImageUrl,
        expiresAt: charge.expires_at ?? order.paymentGateway?.expiresAt,
        webhookEventId: event.id,
        lastWebhookAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };

    await writeDb(db);

    return NextResponse.json({ received: true, orderId, chargeId: charge.id, status: charge.status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Omise webhook processing failed" }, { status: 500 });
  }
}
