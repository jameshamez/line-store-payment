import { promises as fs } from "node:fs";
import path from "node:path";
import { seedDatabase } from "./seed";
import type { Database, Order } from "./types";

const dbPath = process.env.VERCEL
  ? path.join("/tmp", "line-store-payment-db.json")
  : path.join(process.cwd(), "data", "db.json");

async function ensureDbFile() {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });

  try {
    await fs.access(dbPath);
  } catch {
    await fs.writeFile(dbPath, JSON.stringify(seedDatabase, null, 2));
  }
}

export async function readDb(): Promise<Database> {
  await ensureDbFile();
  const raw = await fs.readFile(dbPath, "utf8");
  return JSON.parse(raw) as Database;
}

export async function writeDb(db: Database) {
  await ensureDbFile();
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
}

export async function getOrder(orderId: string) {
  const db = await readDb();
  return db.orders.find((order) => order.id === orderId) ?? null;
}

export async function updateOrder(orderId: string, updater: (order: Order) => Order) {
  const db = await readDb();
  const orderIndex = db.orders.findIndex((order) => order.id === orderId);

  if (orderIndex === -1) {
    return null;
  }

  const nextOrder = updater(db.orders[orderIndex]);
  db.orders[orderIndex] = nextOrder;
  await writeDb(db);
  return nextOrder;
}

export function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
