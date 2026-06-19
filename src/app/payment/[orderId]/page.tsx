import Link from "next/link";
import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";
import { formatBaht } from "@/lib/money";

type Props = {
  params: Promise<{ orderId: string }>;
};

export default async function PaymentPage({ params }: Props) {
  const { orderId } = await params;
  const db = await readDb();
  const order = db.orders.find((candidate) => candidate.id === orderId);

  if (!order) {
    notFound();
  }

  const shop = db.shops.find((candidate) => candidate.id === order.shopId);
  const table = shop?.tables.find((candidate) => candidate.id === order.tableId);

  return (
    <main className="payment-page">
      <section className="payment-shell">
        <div>
          <p className="eyebrow">QR Payment</p>
          <h1>{shop?.name ?? "ร้านอาหาร"}</h1>
          <p className="muted">{table?.name ?? order.tableId}</p>
        </div>

        <img className="payment-qr" src={order.paymentQrDataUrl} alt={`QR payment ${order.id}`} />

        <div className="payment-total">
          <span>ยอดรวม</span>
          <strong>{formatBaht(order.total)}</strong>
        </div>

        <div className="line-items">
          {order.items.map((item) => (
            <div key={item.menuItemId} className="line-item">
              <span>{item.name} x{item.quantity}</span>
              <span>{formatBaht(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <Link className="text-link" href={`/dashboard?shopId=${order.shopId}`}>
          Dashboard
        </Link>
      </section>
    </main>
  );
}
