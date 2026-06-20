import { formatBaht } from "./money";
import type { Order, PaymentNotification, Shop, Table } from "./types";

type LinePushResponse = {
  ok: boolean;
  requestId?: string;
  error?: string;
};

export function isLineConfigured(recipientId?: string) {
  return Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN && recipientId);
}

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

  const result = await pushLineMessages({
    token,
    recipientId,
    messages: buildPaymentMessages({ order, shop, table })
  });

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

export async function sendLineTestMessage({ recipientId, shopName }: { recipientId: string; shopName: string }) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!token || !recipientId) {
    return {
      ok: false,
      error: "LINE_CHANNEL_ACCESS_TOKEN or recipientId is not configured"
    };
  }

  return pushLineMessages({
    token,
    recipientId,
    messages: [
      {
        type: "text",
        text: [`ทดสอบแจ้งเตือน LINE`, `ร้าน: ${shopName}`, `ระบบพร้อมส่งยอดชำระเงินเข้าห้องนี้แล้ว`].join("\n")
      }
    ]
  });
}

function buildPaymentMessages({
  order,
  shop,
  table
}: {
  order: Order;
  shop: Shop;
  table: Table;
}) {
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

  return messages;
}

async function pushLineMessages({
  token,
  recipientId,
  messages
}: {
  token: string;
  recipientId: string;
  messages: Array<Record<string, unknown>>;
}): Promise<LinePushResponse> {
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
