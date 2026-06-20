import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { Shop } from "@/lib/types";

export const runtime = "nodejs";

type Params = Promise<{ shopId: string }>;

export async function PATCH(request: NextRequest, context: { params: Params }) {
  const { shopId } = await context.params;
  const body = (await request.json()) as Partial<Shop>;
  const db = await readDb();
  const shopIndex = db.shops.findIndex((shop) => shop.id === shopId);

  if (shopIndex === -1) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const currentShop = db.shops[shopIndex];
  const nextShop: Shop = {
    ...currentShop,
    name: body.name ?? currentShop.name,
    branch: body.branch ?? currentShop.branch,
    promptPayId: body.promptPayId ?? currentShop.promptPayId,
    lineRecipientId: body.lineRecipientId ?? currentShop.lineRecipientId,
    tables: body.tables ?? currentShop.tables,
    menu: body.menu ?? currentShop.menu
  };

  db.shops[shopIndex] = nextShop;
  await writeDb(db);

  return NextResponse.json({ shop: nextShop });
}
