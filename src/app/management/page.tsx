import { ManagementDemo } from "@/components/ManagementDemo";
import { readDb } from "@/lib/db";

export default async function ManagementPage() {
  const db = await readDb();
  const shop = db.shops[0];

  return <ManagementDemo initialShop={shop} />;
}
