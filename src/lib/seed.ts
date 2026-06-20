import type { Database } from "./types";

export const seedDatabase: Database = {
  shops: [
    {
      id: "sathon-kitchen",
      name: "Sathon Kitchen",
      branch: "Sathon",
      promptPayId: "0615286889",
      lineRecipientId: "",
      tables: [
        { id: "A1", name: "โต๊ะ A1" },
        { id: "A2", name: "โต๊ะ A2" },
        { id: "B1", name: "โต๊ะ B1" },
        { id: "VIP", name: "ห้อง VIP" }
      ],
      menu: [
        { id: "pad-krapao", name: "ข้าวกะเพราหมู", category: "จานหลัก", price: 69, available: true },
        { id: "fried-rice", name: "ข้าวผัดกุ้ง", category: "จานหลัก", price: 89, available: true },
        { id: "tom-yum", name: "ต้มยำกุ้ง", category: "กับข้าว", price: 159, available: true },
        { id: "omelette", name: "ไข่เจียว", category: "กับข้าว", price: 55, available: true },
        { id: "thai-tea", name: "ชาไทย", category: "เครื่องดื่ม", price: 45, available: true },
        { id: "water", name: "น้ำเปล่า", category: "เครื่องดื่ม", price: 15, available: true }
      ]
    }
  ],
  orders: [],
  lineRecipients: []
};
