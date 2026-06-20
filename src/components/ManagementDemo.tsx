"use client";

import { ArrowRight, BellRing, Check, Copy, LayoutDashboard, Plus, QrCode, RefreshCw, Save, Store, Trash2, Utensils } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatBaht } from "@/lib/money";
import type { LineRecipient, MenuItem, Shop, Table } from "@/lib/types";

type Props = {
  initialShop: Shop | undefined;
};

export function ManagementDemo({ initialShop }: Props) {
  const fallbackShop: Shop = {
    id: "demo-shop",
    name: "Demo Restaurant",
    branch: "Main Branch",
    promptPayId: "0615286889",
    lineRecipientId: "",
    tables: [{ id: "A1", name: "โต๊ะ A1" }],
    menu: []
  };

  const [shop, setShop] = useState<Shop>(initialShop ?? fallbackShop);
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lineStatus, setLineStatus] = useState<{
    ready: boolean;
    appBaseUrl: string | null;
    webhookUrl: string | null;
    channelAccessTokenConfigured: boolean;
    channelSecretConfigured: boolean;
    recipientConfigured: boolean;
    recipientId: string | null;
    recipientSource: "shop" | "webhook" | "env" | null;
    recipientPreview: string | null;
  } | null>(null);
  const [lineRecipients, setLineRecipients] = useState<LineRecipient[]>([]);
  const [lineTestMessage, setLineTestMessage] = useState("");

  const categories = useMemo(() => {
    return ["ทั้งหมด", ...Array.from(new Set(shop.menu.map((item) => item.category)))];
  }, [shop.menu]);

  const filteredMenu = selectedCategory === "ทั้งหมด" ? shop.menu : shop.menu.filter((item) => item.category === selectedCategory);

  useEffect(() => {
    loadLineStatus();
    loadLineRecipients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop.id]);

  async function loadLineStatus() {
    const response = await fetch(`/api/line/status?shopId=${shop.id}`);
    const data = (await response.json()) as {
      ready: boolean;
      appBaseUrl: string | null;
      webhookUrl: string | null;
      channelAccessTokenConfigured: boolean;
      channelSecretConfigured: boolean;
      recipientConfigured: boolean;
      recipientId: string | null;
      recipientSource: "shop" | "webhook" | "env" | null;
      recipientPreview: string | null;
    };
    setLineStatus(data);
  }

  async function loadLineRecipients() {
    const response = await fetch("/api/line/recipients");
    const data = (await response.json()) as { recipients?: LineRecipient[] };
    setLineRecipients(data.recipients ?? []);
  }

  function updateShopField(field: keyof Pick<Shop, "name" | "branch" | "promptPayId" | "lineRecipientId">, value: string) {
    setSaved(false);
    setShop((current) => ({ ...current, [field]: value }));
  }

  function updateTable(tableId: string, value: string) {
    setSaved(false);
    setShop((current) => ({
      ...current,
      tables: current.tables.map((table) => (table.id === tableId ? { ...table, name: value } : table))
    }));
  }

  function addTable() {
    setSaved(false);
    setShop((current) => {
      const nextNumber = current.tables.length + 1;
      const table: Table = { id: `N${nextNumber}`, name: `โต๊ะใหม่ ${nextNumber}` };
      return { ...current, tables: [...current.tables, table] };
    });
  }

  function updateMenuItem(menuItemId: string, field: keyof Pick<MenuItem, "name" | "category" | "price" | "available">, value: string | number | boolean) {
    setSaved(false);
    setShop((current) => ({
      ...current,
      menu: current.menu.map((item) => (item.id === menuItemId ? { ...item, [field]: value } : item))
    }));
  }

  function addMenuItem() {
    setSaved(false);
    setShop((current) => {
      const nextNumber = current.menu.length + 1;
      const menuItem: MenuItem = {
        id: `new-menu-${nextNumber}`,
        name: `เมนูใหม่ ${nextNumber}`,
        category: "จานหลัก",
        price: 99,
        available: true
      };

      return { ...current, menu: [...current.menu, menuItem] };
    });
  }

  function removeMenuItem(menuItemId: string) {
    setSaved(false);
    setShop((current) => ({
      ...current,
      menu: current.menu.filter((item) => item.id !== menuItemId)
    }));
  }

  async function saveShop(nextShop: Shop, successMessage?: string) {
    setSaving(true);

    try {
      const response = await fetch(`/api/shops/${nextShop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextShop)
      });

      const data = (await response.json()) as { shop?: Shop; error?: string };

      if (!response.ok || !data.shop) {
        throw new Error(data.error ?? "Save shop failed");
      }

      setShop(data.shop);
      setSaved(true);
      if (successMessage) {
        setLineTestMessage(successMessage);
      }
      await loadLineStatus();
      window.setTimeout(() => setSaved(false), 2200);
      return data.shop;
    } catch (error) {
      setLineTestMessage(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function saveDemo() {
    setLineTestMessage("");
    await saveShop(shop);
  }

  async function testLineNotification() {
    setLineTestMessage("กำลังส่งทดสอบ...");

    const response = await fetch("/api/line/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId: shop.id, recipientId: shop.lineRecipientId })
    });
    const data = (await response.json()) as { ok?: boolean; requestId?: string; error?: string };

    setLineTestMessage(data.ok ? `ส่ง LINE สำเร็จ${data.requestId ? ` (${data.requestId})` : ""}` : data.error ?? "ส่ง LINE ไม่สำเร็จ");
    await loadLineStatus();
  }

  async function copyWebhookUrl() {
    if (!lineStatus?.webhookUrl) {
      return;
    }

    await navigator.clipboard.writeText(lineStatus.webhookUrl);
    setLineTestMessage("คัดลอก Webhook URL แล้ว");
  }

  async function applyRecipient(recipientId: string) {
    const nextShop = { ...shop, lineRecipientId: recipientId };
    setSaved(false);
    setShop(nextShop);
    setLineTestMessage("กำลังบันทึก Recipient ID...");
    await saveShop(nextShop, "บันทึก Recipient ID แล้ว กดทดสอบ LINE ได้เลย");
  }

  return (
    <main className="app-shell management-shell">
      <section className="console-hero">
        <div>
          <p className="eyebrow">Demo Management</p>
          <h1>จัดการร้าน โต๊ะ และเมนู</h1>
          <p className="hero-subtitle">หน้า demo สำหรับโชว์ว่าหลังร้านสามารถแก้ข้อมูลร้าน โต๊ะ เมนู ราคา และสถานะพร้อมขายได้</p>
        </div>
        <div className="console-actions">
          <Link className="icon-text-button" href="/demo">
            <ArrowRight size={18} />
            Demo Guide
          </Link>
          <Link className="icon-text-button" href="/tables">
            <QrCode size={18} />
            QR โต๊ะ
          </Link>
          <Link className="icon-text-button" href="/dashboard">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
        </div>
      </section>

      <section className="management-grid">
        <aside className="management-panel">
          <div className="section-head compact">
            <div>
              <p className="eyebrow">Store</p>
              <h2>ข้อมูลร้าน</h2>
            </div>
            <Store size={22} />
          </div>

          <div className="form-grid">
            <label>
              ชื่อร้าน
              <input value={shop.name} onChange={(event) => updateShopField("name", event.target.value)} />
            </label>
            <label>
              สาขา
              <input value={shop.branch} onChange={(event) => updateShopField("branch", event.target.value)} />
            </label>
            <label>
              PromptPay ID
              <input value={shop.promptPayId} onChange={(event) => updateShopField("promptPayId", event.target.value)} />
            </label>
            <label>
              LINE Recipient ID
              <input
                placeholder="U... หรือ C... ห้องที่ร้านต้องการรับแจ้งเตือน"
                value={shop.lineRecipientId}
                onChange={(event) => updateShopField("lineRecipientId", event.target.value)}
              />
            </label>
          </div>

          <div className="line-config-card">
            <div>
              <p className="eyebrow">LINE Notify</p>
              <h3>{lineStatus?.ready ? "พร้อมแจ้งเตือนร้าน" : "ยังตั้งค่าไม่ครบ"}</h3>
              <p>
                Token: {lineStatus?.channelAccessTokenConfigured ? "พร้อม" : "ยังไม่มี"} · Secret: {lineStatus?.channelSecretConfigured ? "พร้อม" : "ยังไม่มี"} ·
                Recipient: {lineStatus?.recipientConfigured ? "พร้อม" : "ยังไม่มี"}
              </p>
            </div>
            <div className="webhook-box">
              <span>Webhook URL สำหรับ LINE</span>
              <code>{lineStatus?.webhookUrl ?? "ตั้งค่า APP_BASE_URL ก่อน"}</code>
              <button className="icon-text-button" type="button" disabled={!lineStatus?.webhookUrl} onClick={copyWebhookUrl}>
                <Copy size={16} />
                Copy
              </button>
            </div>
            <div className="recipient-picker">
              <div className="recipient-picker-head">
                <span>Recipient ล่าสุดจาก Webhook</span>
                <button className="icon-button" type="button" onClick={loadLineRecipients} aria-label="Refresh LINE recipients">
                  <RefreshCw size={16} />
                </button>
              </div>
              {lineRecipients.length > 0 ? (
                <div className="recipient-list">
                  {lineRecipients.map((recipient) => (
                    <button key={recipient.id} className="recipient-row" type="button" onClick={() => applyRecipient(recipient.id)}>
                      <span>
                        {recipient.type.toUpperCase()} · {recipient.displayName}
                      </span>
                      <strong>{recipient.id}</strong>
                      <small>{recipient.lastMessage ?? "event"} · {new Date(recipient.lastSeenAt).toLocaleString("th-TH")}</small>
                    </button>
                  ))}
                </div>
              ) : lineStatus?.recipientId ? (
                <div className="recipient-list">
                  <button className="recipient-row" type="button" onClick={() => applyRecipient(lineStatus.recipientId!)}>
                    <span>{lineStatus.recipientSource === "env" ? "ENV FALLBACK" : "CURRENT"} · พร้อมใช้งาน</span>
                    <strong>{lineStatus.recipientId}</strong>
                    <small>กดเพื่อบันทึก ID นี้เข้า store</small>
                  </button>
                </div>
              ) : (
                <p>ยังไม่มี ID เข้ามา ให้ตั้ง Webhook URL ใน LINE แล้วทัก OA อีกครั้ง</p>
              )}
            </div>
            <button className="icon-text-button" type="button" onClick={testLineNotification}>
              <BellRing size={18} />
              ทดสอบ LINE
            </button>
            {lineTestMessage ? <p className="line-test-message">{lineTestMessage}</p> : null}
          </div>

          <div className="management-divider" />

          <div className="section-head compact">
            <div>
              <p className="eyebrow">Tables</p>
              <h2>โต๊ะในร้าน</h2>
            </div>
            <button className="icon-button success" type="button" onClick={addTable} aria-label="Add table">
              <Plus size={18} />
            </button>
          </div>

          <div className="table-editor-list">
            {shop.tables.map((table) => (
              <label key={table.id} className="table-editor-row">
                <span>{table.id}</span>
                <input value={table.name} onChange={(event) => updateTable(table.id, event.target.value)} />
              </label>
            ))}
          </div>
        </aside>

        <section className="management-panel wide">
          <div className="section-head">
            <div>
              <p className="eyebrow">Menu</p>
              <h2>เมนูและราคา</h2>
            </div>
            <div className="console-actions">
              <button className="icon-text-button" type="button" onClick={addMenuItem}>
                <Plus size={18} />
                เพิ่มเมนู
              </button>
              <button className="icon-text-button save-demo" type="button" disabled={saving} onClick={saveDemo}>
                {saved ? <Check size={18} /> : <Save size={18} />}
                {saving ? "กำลังบันทึก" : saved ? "บันทึกแล้ว" : "บันทึกลง DB"}
              </button>
            </div>
          </div>

          <div className="category-tabs management-tabs" aria-label="หมวดหมู่เมนู">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-tab ${selectedCategory === category ? "active" : ""}`}
                type="button"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="menu-editor-list">
            {filteredMenu.map((item) => (
              <article key={item.id} className="menu-editor-row">
                <div className="menu-editor-icon">
                  <Utensils size={20} />
                </div>
                <label>
                  ชื่อเมนู
                  <input value={item.name} onChange={(event) => updateMenuItem(item.id, "name", event.target.value)} />
                </label>
                <label>
                  หมวด
                  <input value={item.category} onChange={(event) => updateMenuItem(item.id, "category", event.target.value)} />
                </label>
                <label>
                  ราคา
                  <input
                    min="0"
                    type="number"
                    value={item.price}
                    onChange={(event) => updateMenuItem(item.id, "price", Number(event.target.value))}
                  />
                </label>
                <label className="availability-toggle">
                  พร้อมขาย
                  <input
                    checked={item.available}
                    type="checkbox"
                    onChange={(event) => updateMenuItem(item.id, "available", event.target.checked)}
                  />
                </label>
                <strong>{formatBaht(item.price)}</strong>
                <button className="icon-button danger" type="button" onClick={() => removeMenuItem(item.id)} aria-label={`Delete ${item.name}`}>
                  <Trash2 size={18} />
                </button>
              </article>
            ))}
          </div>

          <p className="management-footnote">หน้านี้บันทึกลง JSON DB ของ demo แล้ว ตอนทำ production จะเปลี่ยนเป็น database จริงและเพิ่มสิทธิ์ผู้ใช้งาน</p>
        </section>
      </section>
    </main>
  );
}
