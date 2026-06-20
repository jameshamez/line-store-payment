"use client";

import {
  BellRing,
  Check,
  Clock3,
  Download,
  Expand,
  MapPin,
  Minus,
  Plus,
  QrCode,
  ReceiptText,
  Settings2,
  ShoppingBag,
  Sparkles,
  UserRound
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatBaht } from "@/lib/money";
import type { Order, Shop } from "@/lib/types";

type Cart = Record<string, number>;

const dishStyles = ["coral", "green", "amber", "teal", "violet", "lime"];

export function OrderApp() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState("");
  const [tableId, setTableId] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [order, setOrder] = useState<Order | null>(null);
  const [lineName, setLineName] = useState("");
  const [lineUserId, setLineUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [fullScreenQr, setFullScreenQr] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlShopId = params.get("storeId") ?? params.get("shopId") ?? "";
    const urlTableId = params.get("tableId") ?? "";

    fetch("/api/shops")
      .then((response) => response.json())
      .then((data: { shops: Shop[] }) => {
        setShops(data.shops);
        const firstShop = data.shops[0];
        const nextShopId = urlShopId || firstShop?.id || "";
        const nextShop = data.shops.find((shop) => shop.id === nextShopId) ?? firstShop;

        setShopId(nextShop?.id ?? "");
        setTableId(urlTableId || nextShop?.tables[0]?.id || "");
      });
  }, []);

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

    if (!liffId) {
      return;
    }

    import("@line/liff")
      .then(async ({ default: liff }) => {
        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        setLineName(profile.displayName);
        setLineUserId(profile.userId);
      })
      .catch(() => setNotice("LIFF profile unavailable"));
  }, []);

  const activeShop = shops.find((shop) => shop.id === shopId) ?? shops[0];
  const activeTable = activeShop?.tables.find((table) => table.id === tableId) ?? activeShop?.tables[0];

  const categories = useMemo(() => {
    if (!activeShop) {
      return [];
    }

    return Array.from(new Set(activeShop.menu.map((item) => item.category)));
  }, [activeShop]);

  const cartItems = useMemo(() => {
    if (!activeShop) {
      return [];
    }

    return activeShop.menu
      .map((item) => ({ ...item, quantity: cart[item.id] ?? 0 }))
      .filter((item) => item.quantity > 0);
  }, [activeShop, cart]);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  function setQuantity(menuItemId: string, nextQuantity: number) {
    setCart((current) => {
      const next = { ...current };

      if (nextQuantity <= 0) {
        delete next[menuItemId];
      } else {
        next[menuItemId] = nextQuantity;
      }

      return next;
    });
  }

  async function submitOrder() {
    if (!activeShop || !activeTable || cartItems.length === 0) {
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: activeShop.id,
          tableId: activeTable.id,
          customerLineUserId: lineUserId,
          customerName: lineName,
          items: cartItems.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
          notifyLine: true
        })
      });

      const data = (await response.json()) as { order?: Order; notification?: { status: string }; error?: string };

      if (!response.ok || !data.order) {
        throw new Error(data.error ?? "Create order failed");
      }

      setOrder(data.order);
      setCart({});
      setNotice(data.notification?.status === "sent" ? "ส่ง LINE แล้ว" : "บันทึกแจ้งเตือนแล้ว");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell customer-shell">
      <header className="mini-hero">
        <div className="hero-copy">
          <p className="eyebrow">LINE MINI APP</p>
          <h1>{activeShop?.name ?? "สั่งอาหารและชำระเงิน"}</h1>
          <p className="hero-subtitle">สั่งอาหารจากโต๊ะและรับ QR ชำระเงินผ่าน LINE</p>
          <div className="hero-meta">
            <span>
              <MapPin size={15} />
              {activeShop?.branch ?? "Branch"}
            </span>
            <span>
              <Clock3 size={15} />
              เปิดรับออเดอร์
            </span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="plate">
            <span />
            <span />
            <span />
          </div>
          <div className="floating-ticket">
            <ReceiptText size={18} />
            <strong>{formatBaht(total || 0)}</strong>
          </div>
        </div>
      </header>

      <section className="control-strip">
        <div className="select-card">
          <label>
            ร้าน
            <select value={activeShop?.id ?? ""} onChange={(event) => setShopId(event.target.value)}>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name} - {shop.branch}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="select-card">
          <label>
            โต๊ะ
            <select value={activeTable?.id ?? ""} onChange={(event) => setTableId(event.target.value)}>
              {activeShop?.tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <span className="identity">
          <UserRound size={16} />
          {lineName || "LINE Guest"}
        </span>
        <Link className="icon-text-button control-link" href="/demo">
          <Sparkles size={18} />
          Demo
        </Link>
        <Link className="icon-text-button control-link" href="/tables">
          <QrCode size={18} />
          QR โต๊ะ
        </Link>
        <Link className="icon-text-button control-link" href="/management">
          <Settings2 size={18} />
          Management
        </Link>
        <Link className="icon-text-button control-link" href="/dashboard">
          <ReceiptText size={18} />
          Dashboard
        </Link>
      </section>

      <div className="workspace">
        <section className="menu-board">
          <div className="section-head">
            <div>
              <p className="eyebrow">Menu</p>
              <h2>เลือกเมนู</h2>
            </div>
            <div className="category-tabs" aria-label="หมวดหมู่เมนู">
              {categories.map((category) => (
                <a key={category} href={`#${category}`} className="category-tab">
                  {category}
                </a>
              ))}
            </div>
          </div>

          {categories.map((category) => (
            <div key={category} id={category} className="menu-section">
              <h2>{category}</h2>
              <div className="menu-grid">
                {activeShop?.menu
                  .filter((item) => item.category === category)
                  .map((item, index) => {
                    const quantity = cart[item.id] ?? 0;
                    const tone = dishStyles[index % dishStyles.length];

                    return (
                      <article key={item.id} className="menu-card">
                        <div className={`dish-thumb ${tone}`} aria-hidden="true">
                          <span>{item.name.slice(0, 1)}</span>
                        </div>
                        <div>
                          <h3>{item.name}</h3>
                          <p className="menu-price">{formatBaht(item.price)}</p>
                        </div>
                        <div className="stepper" aria-label={`จำนวน ${item.name}`}>
                          <button type="button" onClick={() => setQuantity(item.id, quantity - 1)} aria-label="ลดจำนวน">
                            <Minus size={16} />
                          </button>
                          <span>{quantity}</span>
                          <button type="button" onClick={() => setQuantity(item.id, quantity + 1)} aria-label="เพิ่มจำนวน">
                            <Plus size={16} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
              </div>
            </div>
          ))}
        </section>

        <aside className={`order-panel ${order ? "has-payment" : "checkout-card"}`}>
          <div className="order-card-head">
            <div className="panel-title">
              <ShoppingBag size={20} />
              <div>
                <h2>{activeTable?.name ?? "โต๊ะ"}</h2>
                <p>{itemCount} รายการ</p>
              </div>
            </div>
            <span className="status-chip soft">
              <Sparkles size={14} />
              LINE Ready
            </span>
          </div>

          <div className="line-items">
            {cartItems.length === 0 ? (
              <p className="empty">ยังไม่มีรายการ</p>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="line-item">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{formatBaht(item.price * item.quantity)}</span>
                </div>
              ))
            )}
          </div>

          <div className="total-row">
            <span>ยอดรวม</span>
            <strong>{formatBaht(total)}</strong>
          </div>

          <button className="primary-button" type="button" disabled={busy || cartItems.length === 0} onClick={submitOrder}>
            <BellRing size={18} />
            ส่งยอดชำระเงิน
          </button>

          {notice ? <p className="notice">{notice}</p> : null}

          {order ? (
            <div className="qr-result">
              <div className="status-chip">
                <Check size={14} />
                {order.status === "paid" ? "ชำระแล้ว" : "รอชำระเงิน"}
              </div>
              <div className="promptpay-badge">
                <QrCode size={16} />
                <span>
                  <strong>PromptPay</strong>
                  <small>Thai QR Payment</small>
                </span>
              </div>
              <img src={order.paymentQrDataUrl} alt={`QR ${order.id}`} />
              <p className="qr-helper">สแกนด้วยแอปธนาคารเพื่อชำระเงิน</p>
              <p className="qr-instruction">บนมือถือให้แคปหน้าจอหรือบันทึก QR แล้วเปิดแอปธนาคาร เลือกสแกนจากรูปภาพ</p>
              <div className="qr-actions">
                <button type="button" className="icon-text-button" onClick={() => setFullScreenQr(true)}>
                  <Expand size={18} />
                  เปิด QR เต็มจอ
                </button>
                <a className="icon-text-button" href={order.paymentQrDataUrl} download={`${order.id}-promptpay-qr.png`}>
                  <Download size={18} />
                  บันทึก QR
                </a>
              </div>
              <Link className="text-link" href={`/payment/${order.id}`}>
                เปิดหน้า QR
              </Link>
            </div>
          ) : null}
        </aside>
      </div>

      {order && fullScreenQr ? (
        <div className="qr-modal" role="dialog" aria-modal="true" aria-label="PromptPay QR เต็มจอ">
          <div className="qr-modal-panel">
            <button type="button" className="qr-modal-close" onClick={() => setFullScreenQr(false)}>
              ปิด
            </button>
            <div className="promptpay-badge large">
              <QrCode size={18} />
              <span>
                <strong>PromptPay</strong>
                <small>Thai QR Payment</small>
              </span>
            </div>
            <img src={order.paymentQrDataUrl} alt={`PromptPay QR ${order.id}`} />
            <strong>{formatBaht(order.total)}</strong>
            <p>แคปหน้าจอหรือบันทึก QR แล้วเปิดแอปธนาคารเพื่อสแกนจากรูปภาพ</p>
            <a className="primary-button" href={order.paymentQrDataUrl} download={`${order.id}-promptpay-qr.png`}>
              <Download size={18} />
              บันทึก QR
            </a>
          </div>
        </div>
      ) : null}

      {!order && itemCount > 0 ? (
        <div className="mobile-checkout-bar">
          <div>
            <span>{itemCount} รายการ</span>
            <strong>{formatBaht(total)}</strong>
          </div>
          <button type="button" disabled={busy} onClick={submitOrder}>
            <BellRing size={18} />
            ชำระเงิน
          </button>
        </div>
      ) : null}
    </main>
  );
}
