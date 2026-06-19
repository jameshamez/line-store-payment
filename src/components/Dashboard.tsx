"use client";

import { BellRing, Check, ExternalLink, QrCode, RefreshCw, Settings2, Sparkles, Store, Table2, WalletCards } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatBaht } from "@/lib/money";
import type { Order, Shop } from "@/lib/types";

export function Dashboard() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shopId, setShopId] = useState("");
  const [busyOrderId, setBusyOrderId] = useState("");

  async function loadData(nextShopId = shopId) {
    const [shopsResponse, ordersResponse] = await Promise.all([
      fetch("/api/shops"),
      fetch(`/api/orders${nextShopId ? `?shopId=${nextShopId}` : ""}`)
    ]);
    const shopsData = (await shopsResponse.json()) as { shops: Shop[] };
    const ordersData = (await ordersResponse.json()) as { orders: Order[] };

    setShops(shopsData.shops);
    setOrders(ordersData.orders);

    if (!nextShopId && shopsData.shops[0]) {
      setShopId(shopsData.shops[0].id);
    }
  }

  useEffect(() => {
    loadData();
    const timer = window.setInterval(() => loadData(), 10000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (shopId) {
      loadData(shopId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const activeShop = shops.find((shop) => shop.id === shopId) ?? shops[0];
  const tableById = useMemo(() => {
    return new Map(activeShop?.tables.map((table) => [table.id, table.name]) ?? []);
  }, [activeShop]);

  const waitingTotal = orders
    .filter((order) => order.status === "waiting_payment")
    .reduce((sum, order) => sum + order.total, 0);
  const waitingCount = orders.filter((order) => order.status === "waiting_payment").length;
  const notifiedCount = orders.filter((order) => order.notifications.length > 0).length;

  async function notify(orderId: string) {
    setBusyOrderId(orderId);
    await fetch(`/api/orders/${orderId}/notify`, { method: "POST" });
    await loadData(shopId);
    setBusyOrderId("");
  }

  async function markPaid(orderId: string) {
    setBusyOrderId(orderId);
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" })
    });
    await loadData(shopId);
    setBusyOrderId("");
  }

  return (
    <main className="app-shell dashboard-shell">
      <header className="console-hero">
        <div>
          <p className="eyebrow">Restaurant Console</p>
          <h1>ยอดชำระผ่าน LINE</h1>
          <p className="hero-subtitle">เห็นร้าน โต๊ะ ยอด และสถานะการแจ้งเตือนในหน้าจอเดียว</p>
        </div>
        <div className="console-actions">
          <button className="icon-button" type="button" onClick={() => loadData(shopId)} aria-label="Refresh">
            <RefreshCw size={18} />
          </button>
          <Link className="icon-text-button" href="/demo">
            <Sparkles size={18} />
            Demo
          </Link>
          <Link className="icon-text-button" href="/tables">
            <QrCode size={18} />
            QR โต๊ะ
          </Link>
          <Link className="icon-text-button" href="/management">
            <Settings2 size={18} />
            Management
          </Link>
          <Link className="icon-text-button" href={`/?shopId=${activeShop?.id ?? ""}&tableId=${activeShop?.tables[0]?.id ?? ""}`}>
            <ExternalLink size={18} />
            Mini App
          </Link>
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
      </section>

      <section className="metric-grid">
        <div className="metric-card">
          <Store size={20} />
          <span>ร้าน</span>
          <strong>{activeShop?.name ?? "-"}</strong>
        </div>
        <div className="metric-card">
          <WalletCards size={20} />
          <span>ยอดรอชำระ</span>
          <strong>{formatBaht(waitingTotal)}</strong>
        </div>
        <div className="metric-card">
          <Table2 size={20} />
          <span>โต๊ะรอชำระ</span>
          <strong>{waitingCount}</strong>
        </div>
        <div className="metric-card">
          <BellRing size={20} />
          <span>แจ้ง LINE แล้ว</span>
          <strong>{notifiedCount}</strong>
        </div>
      </section>

      <section className="order-list">
        <div className="section-head">
          <div>
            <p className="eyebrow">Live Orders</p>
            <h2>รายการล่าสุด</h2>
          </div>
          <span className="muted">{orders.length} ออเดอร์</span>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <WalletCards size={28} />
            <strong>ยังไม่มีรายการชำระเงิน</strong>
            <p>เมื่อมีการสั่งอาหารจาก Mini App รายการจะแสดงตรงนี้ทันที</p>
          </div>
        ) : null}

        {orders.map((order) => {
          const lastNotification = order.notifications[0];

          return (
            <article key={order.id} className="order-row">
              <div>
                <div className="order-heading">
                  <h2>{tableById.get(order.tableId) ?? order.tableId}</h2>
                  <span className={`status-chip ${order.status}`}>{order.status === "paid" ? "ชำระแล้ว" : "รอชำระ"}</span>
                </div>
                <p className="muted">{activeShop?.name} · {new Date(order.createdAt).toLocaleString("th-TH")}</p>
                <p className="muted">
                  LINE: {lastNotification ? `${lastNotification.status}${lastNotification.requestId ? ` · ${lastNotification.requestId}` : ""}` : "ยังไม่แจ้ง"}
                </p>
              </div>

              <div className="order-items">
                {order.items.map((item) => (
                  <span key={item.menuItemId}>{item.name} x{item.quantity}</span>
                ))}
              </div>

              <strong className="order-total">{formatBaht(order.total)}</strong>

              <div className="row-actions">
                <Link className="icon-button" href={`/payment/${order.id}`} aria-label="Open QR">
                  <ExternalLink size={18} />
                </Link>
                <button className="icon-button" type="button" disabled={busyOrderId === order.id} onClick={() => notify(order.id)} aria-label="Notify LINE">
                  <BellRing size={18} />
                </button>
                <button className="icon-button success" type="button" disabled={busyOrderId === order.id || order.status === "paid"} onClick={() => markPaid(order.id)} aria-label="Mark paid">
                  <Check size={18} />
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
