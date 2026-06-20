import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Download, Expand, LayoutDashboard, QrCode, ReceiptText, Store, Table2 } from "lucide-react";
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
        <div className="payment-head">
          <span className="payment-icon">
            <QrCode size={28} />
          </span>
          <div>
            <p className="eyebrow">QR Payment</p>
            <h1>{shop?.name ?? "ร้านอาหาร"}</h1>
            <p className="muted">Order #{order.id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        <div className="payment-context">
          <span>
            <Store size={16} />
            {shop?.branch ?? "Branch"}
          </span>
          <span>
            <Table2 size={16} />
            {table?.name ?? order.tableId}
          </span>
          <span>
            <CheckCircle2 size={16} />
            {order.status === "paid" ? "ชำระแล้ว" : "รอชำระเงิน"}
          </span>
        </div>

        <div className="payment-qr-wrap">
          <div className="promptpay-badge large">
            <QrCode size={18} />
            <span>
              <strong>PromptPay</strong>
              <small>Thai QR Payment</small>
            </span>
          </div>
          <img className="payment-qr" src={order.paymentQrDataUrl} alt={`QR payment ${order.id}`} />
          <p className="qr-helper">สแกนด้วยแอปธนาคารเพื่อชำระเงิน</p>
          <p className="qr-instruction">บนมือถือให้แคปหน้าจอหรือบันทึก QR แล้วเปิดแอปธนาคาร เลือกสแกนจากรูปภาพ</p>
          <div className="qr-actions">
            <a className="icon-text-button" href={order.paymentQrDataUrl} target="_blank" rel="noreferrer">
              <Expand size={18} />
              เปิด QR เต็มจอ
            </a>
            <a className="icon-text-button" href={order.paymentQrDataUrl} download={`${order.id}-promptpay-qr.png`}>
              <Download size={18} />
              บันทึก QR
            </a>
          </div>
        </div>

        <div className="payment-total">
          <span>ยอดรวม</span>
          <strong>{formatBaht(order.total)}</strong>
        </div>

        <div className="payment-items">
          <div className="payment-items-head">
            <ReceiptText size={18} />
            <strong>รายการอาหาร</strong>
          </div>
          {order.items.map((item) => (
            <div key={item.menuItemId} className="line-item">
              <span>{item.name} x{item.quantity}</span>
              <span>{formatBaht(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <Link className="payment-dashboard-link" href={`/dashboard?shopId=${order.shopId}`}>
          <LayoutDashboard size={18} />
          Dashboard
        </Link>
      </section>
    </main>
  );
}
