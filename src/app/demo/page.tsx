import { ArrowRight, BellRing, Download, Image as ImageIcon, LayoutDashboard, QrCode, Settings2, Smartphone, Store, WalletCards } from "lucide-react";
import Link from "next/link";
import { readDb } from "@/lib/db";
import { formatBaht } from "@/lib/money";

export default async function DemoPage() {
  const db = await readDb();
  const shop = db.shops[0];
  const firstTable = shop?.tables[0];
  const miniAppUrl = shop && firstTable ? `/?shopId=${shop.id}&tableId=${firstTable.id}` : "/";
  const sampleTotal = shop?.menu.slice(0, 3).reduce((sum, item) => sum + item.price, 0) ?? 0;

  return (
    <main className="app-shell demo-shell">
      <section className="demo-hero">
        <div>
          <p className="eyebrow">Client Demo</p>
          <h1>ระบบสั่งอาหารผ่าน LINE MINI APP</h1>
          <p className="hero-subtitle">
            ทดลอง flow ตั้งแต่ลูกค้าสแกน QR ที่โต๊ะ เลือกเมนู สร้าง QR ชำระเงิน และร้านเห็นยอดแยกตามร้านกับโต๊ะบน Dashboard
          </p>
          <div className="hero-meta">
            <span>
              <Store size={15} />
              {shop?.name ?? "Demo Restaurant"}
            </span>
            <span>
              <WalletCards size={15} />
              ตัวอย่างยอด {formatBaht(sampleTotal)}
            </span>
          </div>
        </div>
        <div className="demo-phone" aria-hidden="true">
          <div className="phone-top" />
          <div className="phone-line" />
          <div className="phone-card" />
          <div className="phone-card short" />
          <div className="phone-pay" />
        </div>
      </section>

      <section className="demo-actions" aria-label="Demo links">
        <Link className="demo-action primary" href={miniAppUrl}>
          <Smartphone size={22} />
          <span>
            <strong>ลองสั่งอาหาร</strong>
            <small>Mini App โต๊ะ {firstTable?.id ?? "A1"}</small>
          </span>
          <ArrowRight size={18} />
        </Link>
        <Link className="demo-action" href="/dashboard">
          <LayoutDashboard size={22} />
          <span>
            <strong>ดู Dashboard ร้าน</strong>
            <small>ยอดตามร้าน โต๊ะ และ LINE</small>
          </span>
          <ArrowRight size={18} />
        </Link>
        <Link className="demo-action" href="/tables">
          <QrCode size={22} />
          <span>
            <strong>QR Code รายโต๊ะ</strong>
            <small>สแกนแล้วรู้โต๊ะทันที</small>
          </span>
          <ArrowRight size={18} />
        </Link>
        <Link className="demo-action" href="/management">
          <Settings2 size={22} />
          <span>
            <strong>จัดการร้านและเมนู</strong>
            <small>แก้ร้าน โต๊ะ เมนู ราคา</small>
          </span>
          <ArrowRight size={18} />
        </Link>
        <a className="demo-action" href="/demo-flow-simple.svg" target="_blank" rel="noreferrer">
          <ImageIcon size={22} />
          <span>
            <strong>เปิด Flow Diagram</strong>
            <small>ผังแบบอ่านง่ายสำหรับลูกค้า</small>
          </span>
          <ArrowRight size={18} />
        </a>
        <a className="demo-action" href="/demo-flow-simple.svg" download="line-mini-app-demo-flow-simple.svg">
          <Download size={22} />
          <span>
            <strong>ดาวน์โหลด Diagram</strong>
            <small>ใช้แนบ LINE หรืออีเมล</small>
          </span>
          <ArrowRight size={18} />
        </a>
      </section>

      <section className="demo-pages">
        <div className="section-head">
          <div>
            <p className="eyebrow">Demo Pages</p>
            <h2>หน้าที่ลูกค้าจะได้ดูครบ</h2>
          </div>
        </div>

        <div className="page-check-grid">
          <Link href="/demo" className="page-check-card">
            <span>01</span>
            <strong>Demo Guide</strong>
            <p>หน้าแรกสำหรับผู้บริหาร เข้าใจภาพรวมและเริ่ม demo</p>
          </Link>
          <Link href={miniAppUrl} className="page-check-card">
            <span>02</span>
            <strong>Mini App ฝั่งลูกค้า</strong>
            <p>เลือกเมนูตามร้านและโต๊ะ แล้วสร้าง QR ชำระเงิน</p>
          </Link>
          <div className="page-check-card">
            <span>03</span>
            <strong>QR Payment / Order Summary</strong>
            <p>แสดงหลังสร้างออเดอร์ มี QR ยอดรวม ร้าน โต๊ะ และรายการอาหาร</p>
          </div>
          <Link href="/dashboard" className="page-check-card">
            <span>04</span>
            <strong>Dashboard ฝั่งร้าน</strong>
            <p>ดูยอดแยกร้าน โต๊ะ และสถานะแจ้งเตือน LINE</p>
          </Link>
          <Link href="/tables" className="page-check-card">
            <span>05</span>
            <strong>Table QR Management</strong>
            <p>รวม QR โต๊ะ A1, A2, B1, VIP สำหรับเปิด Mini App</p>
          </Link>
          <Link href="/management" className="page-check-card">
            <span>06</span>
            <strong>Menu / Store Management</strong>
            <p>โชว์การแก้ชื่อร้าน โต๊ะ เมนู ราคา และสถานะพร้อมขาย</p>
          </Link>
        </div>
      </section>

      <section className="demo-flow">
        <div className="section-head">
          <div>
            <p className="eyebrow">Demo Script</p>
            <h2>ลำดับที่ใช้พาลูกค้าดู</h2>
          </div>
        </div>

        <div className="flow-grid">
          <article className="flow-card">
            <span>1</span>
            <QrCode size={24} />
            <h3>สแกน QR โต๊ะ</h3>
            <p>ลูกค้าเปิด Mini App จาก QR ของโต๊ะ ระบบรู้ร้านและโต๊ะทันที</p>
          </article>
          <article className="flow-card">
            <span>2</span>
            <Smartphone size={24} />
            <h3>เลือกเมนู</h3>
            <p>เลือกจำนวนอาหารและเครื่องดื่มจากหน้าจอมือถือ</p>
          </article>
          <article className="flow-card">
            <span>3</span>
            <WalletCards size={24} />
            <h3>สร้าง QR ชำระเงิน</h3>
            <p>ระบบสรุปยอดและสร้าง QR payment สำหรับออเดอร์นั้น</p>
          </article>
          <article className="flow-card">
            <span>4</span>
            <BellRing size={24} />
            <h3>ร้านเห็นยอดใน LINE</h3>
            <p>Dashboard แสดงร้าน โต๊ะ ยอด และสถานะแจ้งเตือน LINE</p>
          </article>
        </div>
      </section>

      <section className="demo-note">
        <strong>หมายเหตุสำหรับ Demo</strong>
        <p>
          เวอร์ชันนี้ใช้สำหรับดูหน้าตาและ flow การใช้งาน ส่วน production จะต่อ LINE Official Account, LIFF, database จริง และ payment verification ตาม provider ที่เลือก
        </p>
      </section>
    </main>
  );
}
