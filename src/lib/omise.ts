import { createHmac, timingSafeEqual } from "node:crypto";

type OmiseCharge = {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "successful" | "failed" | "expired" | string;
  paid: boolean;
  expires_at?: string | null;
  source?: {
    id?: string;
    scannable_code?: {
      image?: {
        download_uri?: string;
      };
    };
  };
  metadata?: Record<string, string>;
};

export type OmisePayment = {
  paymentPayload: string;
  paymentQrDataUrl: string;
  chargeId: string;
  sourceId?: string;
  status: string;
  qrImageUrl?: string;
  expiresAt?: string | null;
};

export function isOmiseConfigured() {
  return Boolean(process.env.OMISE_SECRET_KEY);
}

export async function createOmisePromptPayCharge({
  orderId,
  amount,
  description,
  webhookEndpoint
}: {
  orderId: string;
  amount: number;
  description: string;
  webhookEndpoint?: string;
}): Promise<OmisePayment> {
  const secretKey = process.env.OMISE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("OMISE_SECRET_KEY is not configured");
  }

  const body = new URLSearchParams({
    amount: String(toSatang(amount)),
    currency: "THB",
    "source[type]": "promptpay",
    description,
    "metadata[order_id]": orderId
  });

  if (webhookEndpoint) {
    body.append("webhook_endpoints[]", webhookEndpoint);
  }

  const charge = await omiseRequest<OmiseCharge>("/charges", {
    method: "POST",
    body
  });
  const qrImageUrl = charge.source?.scannable_code?.image?.download_uri;

  if (!qrImageUrl) {
    throw new Error("Omise charge did not return a PromptPay QR image");
  }

  return {
    paymentPayload: charge.id,
    paymentQrDataUrl: await fetchOmiseQrDataUrl(qrImageUrl),
    chargeId: charge.id,
    sourceId: charge.source?.id,
    status: charge.status,
    qrImageUrl,
    expiresAt: charge.expires_at
  };
}

export async function retrieveOmiseCharge(chargeId: string) {
  return omiseRequest<OmiseCharge>(`/charges/${chargeId}`, { method: "GET" });
}

export function verifyOmiseWebhookSignature({
  rawBody,
  signature,
  timestamp,
  webhookSecret
}: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  webhookSecret: string | undefined;
}) {
  if (!webhookSecret || !signature || !timestamp) {
    return false;
  }

  const expected = createHmac("sha256", Buffer.from(webhookSecret, "base64"))
    .update(`${timestamp}.${rawBody}`)
    .digest();

  return signature.split(",").some((candidate) => {
    const signatureBuffer = Buffer.from(candidate.trim(), "hex");
    return signatureBuffer.length === expected.length && timingSafeEqual(signatureBuffer, expected);
  });
}

function toSatang(amount: number) {
  return Math.round(amount * 100);
}

async function fetchOmiseQrDataUrl(downloadUri: string) {
  const secretKey = process.env.OMISE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("OMISE_SECRET_KEY is not configured");
  }

  const response = await fetch(downloadUri, {
    headers: {
      Authorization: authHeader(secretKey)
    }
  });

  if (!response.ok) {
    throw new Error(`Omise QR download failed: ${response.status} ${await response.text()}`);
  }

  const contentType = response.headers.get("content-type") ?? "image/svg+xml";
  const bytes = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${bytes.toString("base64")}`;
}

async function omiseRequest<T>(path: string, init: RequestInit) {
  const secretKey = process.env.OMISE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("OMISE_SECRET_KEY is not configured");
  }

  const response = await fetch(`https://api.omise.co${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(secretKey),
      "Content-Type": "application/x-www-form-urlencoded",
      ...(init.headers ?? {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`Omise API error: ${response.status} ${JSON.stringify(data)}`);
  }

  return data as T;
}

function authHeader(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}
