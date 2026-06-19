import { formatBaht } from "./money";
import type { Order, PaymentNotification, Shop, Table } from "./types";

type LinePushResponse = {
  ok: boolean;
  requestId?: string;
  error?: string;
};

export async function sendLinePaymentNotification({
  order,
  shop,
  table
}: {
  order: Order;
  shop: Shop;
  table: Table;
}): Promise<PaymentNotification> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const recipientId = shop.lineRecipientId;
  const now = new Date().toISOString();

  if (!token || !recipientId) {
    return {
      id: crypto.randomUUID(),
      channel: "line",
      status: "mocked",
      recipientId,
      createdAt: now,
      error: "LINE_CHANNEL_ACCESS_TOKEN or shop.lineRecipientId is not configured"
    };
  }

  const result = await pushPaymentMessage({ token, recipientId, order, shop, table });

  return {
    id: crypto.randomUUID(),
    channel: "line",
    status: result.ok ? "sent" : "failed",
    recipientId,
    requestId: result.requestId,
    error: result.error,
    createdAt: now
  };
}

async function pushPaymentMessage({
  token,
  recipientId,
  order,
  shop,
  table
}: {
  token: string;
  recipientId: string;
  order: Order;
  shop: Shop;
  table: Table;
}): Promise<LinePushResponse> {
  const baseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "");
  const paymentUrl = baseUrl ? `${baseUrl}/payment/${order.id}` : undefined;
  const qrUrl = baseUrl ? `${baseUrl}/api/orders/${order.id}/qr` : undefined;

  const summary = order.items
    .map((item) => `- ${item.name} x${item.quantity} = ${formatBaht(item.price * item.quantity)}`)
    .join("\n");

  const messages: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: [
        "แจ้งชำระเงิน",
        `ร้าน: ${shop.name} (${shop.branch})`,
        `โต๊ะ: ${table.name}`,
        `ยอดรวม: ${formatBaht(order.total)}`,
        "",
        summary,
        paymentUrl ? `\nเปิดหน้าชำระเงิน: ${paymentUrl}` : "\nตั้งค่า APP_BASE_URL เพื่อแนบลิงก์ชำระเงิน"
      ].join("\n")
    }
  ];

  if (qrUrl) {
    messages.push({
      type: "image",
      originalContentUrl: qrUrl,
      previewImageUrl: qrUrl
    });
  }

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      to: recipientId,
      messages
    })
  });

  const requestId = response.headers.get("x-line-request-id") ?? undefined;

  if (response.ok) {
    return { ok: true, requestId };
  }

  return {
    ok: false,
    requestId,
    error: await response.text()
  };
}
