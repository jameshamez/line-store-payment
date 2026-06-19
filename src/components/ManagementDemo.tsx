"use client";

import { ArrowRight, Check, LayoutDashboard, Plus, QrCode, Save, Store, Trash2, Utensils } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatBaht } from "@/lib/money";
import type { MenuItem, Shop, Table } from "@/lib/types";

type Props = {
  initialShop: Shop | undefined;
};

export function ManagementDemo({ initialShop }: Props) {
  const fallbackShop: Shop = {
    id: "demo-shop",
    name: "Demo Restaurant",
    branch: "Main Branch",
    promptPayId: "0812345678",
    lineRecipientId: "",
    tables: [{ id: "A1", name: "โต๊ะ A1" }],
    menu: []
  };

  const [shop, setShop] = useState<Shop>(initialShop ?? fallbackShop);
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
  const [saved, setSaved] = useState(false);

  const categories = useMemo(() => {
    return ["ทั้งหมด", ...Array.from(new Set(shop.menu.map((item) => item.category)))];
  }, [shop.menu]);

  const filteredMenu = selectedCategory === "ทั้งหมด" ? shop.menu : shop.menu.filter((item) => item.category === selectedCategory);

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

  function saveDemo() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
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
                placeholder="ใส่ userId/groupId ตอนใช้งานจริง"
                value={shop.lineRecipientId}
                onChange={(event) => updateShopField("lineRecipientId", event.target.value)}
              />
            </label>
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
              <button className="icon-text-button save-demo" type="button" onClick={saveDemo}>
                {saved ? <Check size={18} /> : <Save size={18} />}
                {saved ? "บันทึกแล้ว" : "บันทึก Demo"}
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

          <p className="management-footnote">Demo นี้แก้ข้อมูลบนหน้าจอเพื่อโชว์ UX เท่านั้น ตอนทำ production จะบันทึกลง database และมีสิทธิ์ผู้ใช้งานจริง</p>
        </section>
      </section>
    </main>
  );
}
