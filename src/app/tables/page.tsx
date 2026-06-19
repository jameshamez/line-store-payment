import { ArrowRight, LayoutDashboard, QrCode, Settings2, Smartphone } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { readDb } from "@/lib/db";

function getBaseUrl() {
  return (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export default async function TablesPage() {
  const db = await readDb();
  const baseUrl = getBaseUrl();
  const shop = db.shops[0];

  const tableCards = await Promise.all(
    (shop?.tables ?? []).map(async (table) => {
      const url = `${baseUrl}/?shopId=${shop.id}&tableId=${table.id}`;
      const qrDataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 360
      });

      return { table, url, qrDataUrl };
    })
  );

  return (
    <main className="app-shell tables-shell">
      <section className="console-hero">
        <div>
          <p className="eyebrow">Table QR</p>
          <h1>QR Code สำหรับแต่ละโต๊ะ</h1>
          <p className="hero-subtitle">ใช้โชว์ลูกค้าว่าแต่ละโต๊ะมีลิงก์ Mini App ของตัวเอง สแกนแล้วระบบรู้ร้านและโต๊ะโดยอัตโนมัติ</p>
        </div>
        <div className="console-actions">
          <Link className="icon-text-button" href="/demo">
            <ArrowRight size={18} />
            Demo Guide
          </Link>
          <Link className="icon-text-button" href="/dashboard">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link className="icon-text-button" href="/management">
            <Settings2 size={18} />
            Management
          </Link>
        </div>
      </section>

      <section className="table-qr-grid">
        {tableCards.map(({ table, url, qrDataUrl }) => (
          <article key={table.id} className="table-qr-card">
            <div className="table-card-head">
              <span className="table-badge">{table.id}</span>
              <div>
                <h2>{table.name}</h2>
                <p>{shop?.name}</p>
              </div>
            </div>

            <img src={qrDataUrl} alt={`QR สำหรับ ${table.name}`} />

            <div className="table-card-actions">
              <Link className="icon-text-button" href={`/?shopId=${shop?.id ?? ""}&tableId=${table.id}`}>
                <Smartphone size={18} />
                เปิด Mini App
              </Link>
              <a className="icon-button" href={qrDataUrl} download={`${shop?.id ?? "shop"}-${table.id}.png`} aria-label={`Download QR ${table.name}`}>
                <QrCode size={18} />
              </a>
            </div>

            <p className="qr-url">{url}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
