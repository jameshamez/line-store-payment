import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { LineRecipient } from "@/lib/types";

export const runtime = "nodejs";

type LineWebhookEvent = {
  type: string;
  timestamp?: number;
  source?: {
    type?: string;
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  message?: {
    type?: string;
    text?: string;
  };
};

type LineWebhookBody = {
  events?: LineWebhookEvent[];
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");
  const channelSecret = process.env.LINE_CHANNEL_SECRET;

  if (channelSecret && !isValidLineSignature(rawBody, signature, channelSecret)) {
    return NextResponse.json({ error: "Invalid LINE signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as LineWebhookBody;
  const recipients = extractRecipients(body.events ?? []);

  if (recipients.length > 0) {
    const db = await readDb();

    for (const recipient of recipients) {
      const currentIndex = db.lineRecipients.findIndex((candidate) => candidate.id === recipient.id);

      if (currentIndex >= 0) {
        db.lineRecipients[currentIndex] = {
          ...db.lineRecipients[currentIndex],
          ...recipient
        };
      } else {
        db.lineRecipients.unshift(recipient);
      }
    }

    db.lineRecipients.sort((left, right) => Date.parse(right.lastSeenAt) - Date.parse(left.lastSeenAt));
    db.lineRecipients = db.lineRecipients.slice(0, 30);
    await writeDb(db);
  }

  return NextResponse.json({ ok: true, stored: recipients.length });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "LINE webhook is ready. Use POST from LINE Messaging API."
  });
}

function isValidLineSignature(rawBody: string, signature: string | null, channelSecret: string) {
  if (!signature) {
    return false;
  }

  const expected = createHmac("sha256", channelSecret).update(rawBody).digest("base64");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}

function extractRecipients(events: LineWebhookEvent[]): LineRecipient[] {
  return events.flatMap((event) => {
    const source = event.source;

    if (!source?.type) {
      return [];
    }

    const recipient = getRecipientFromSource(source);

    if (!recipient) {
      return [];
    }

    const lastMessage = event.message?.type === "text" ? event.message.text : event.type;
    const lastSeenAt = event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString();

    return [
      {
        ...recipient,
        lastMessage,
        lastSeenAt
      }
    ];
  });
}

function getRecipientFromSource(source: NonNullable<LineWebhookEvent["source"]>): Pick<LineRecipient, "id" | "type" | "displayName"> | null {
  if (source.type === "user" && source.userId) {
    return {
      id: source.userId,
      type: "user",
      displayName: "LINE user"
    };
  }

  if (source.type === "group" && source.groupId) {
    return {
      id: source.groupId,
      type: "group",
      displayName: "LINE group"
    };
  }

  if (source.type === "room" && source.roomId) {
    return {
      id: source.roomId,
      type: "room",
      displayName: "LINE room"
    };
  }

  return null;
}
