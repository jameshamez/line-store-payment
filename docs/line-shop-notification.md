# LINE Restaurant Notification Setup

ระบบนี้แจ้งเตือนร้านผ่าน LINE Messaging API เมื่อมีออเดอร์/ยอดชำระเงินใหม่

## Environment Variables

```env
APP_BASE_URL=https://your-domain.com
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_long_lived_channel_access_token
```

สำหรับ demo นี้ ถ้าใช้ Vercel URL:

```text
APP_BASE_URL=https://demo-line-store-payment.vercel.app
LINE Webhook URL=https://demo-line-store-payment.vercel.app/api/line/webhook
```

## Restaurant Recipient

ตั้งค่าห้องที่ร้านต้องการรับแจ้งเตือนในหน้า:

```text
/management
```

วิธีหา `LINE Recipient ID`:

1. ไปที่ LINE Official Account Manager > Settings > Messaging API
2. ใส่ Webhook URL เป็น `https://demo-line-store-payment.vercel.app/api/line/webhook`
3. กด Save และเปิด Use webhook
4. ทัก LINE OA หรือเพิ่ม OA เข้ากลุ่มร้าน
5. กลับมาที่ `/management` แล้วกด refresh ในช่อง `Recipient ล่าสุดจาก Webhook`
6. กดรายการ ID ที่เข้ามา แล้วกด `บันทึกลง DB`

ชนิดของ `LINE Recipient ID`:

- User ID: ขึ้นต้นด้วย `U...`
- Group ID: ขึ้นต้นด้วย `C...`
- Room ID: ขึ้นต้นด้วย `R...`

เมื่อกดบันทึก ระบบจะเก็บลง DB demo และใช้ค่านี้ตอนส่งแจ้งเตือน

## Flow

1. ลูกค้าสั่งอาหารจาก Mini App
2. ระบบสร้าง order และ QR ชำระเงิน
3. ระบบเรียก `POST /api/orders/{orderId}/notify`
4. ระบบส่ง LINE push message ไปที่ `lineRecipientId` ของร้าน
5. Dashboard แสดงสถานะ `sent`, `mocked`, หรือ `failed`

## Test

ตรวจสถานะ:

```text
GET /api/line/status?shopId=sathon-kitchen
```

ทดสอบส่ง LINE:

```text
POST /api/line/test
body: { "shopId": "sathon-kitchen" }
```

หมายเหตุ: ถ้าไม่มี `LINE_CHANNEL_ACCESS_TOKEN` หรือไม่มี `lineRecipientId` ระบบจะยังไม่ส่ง LINE จริง

ถ้าทดสอบบน `localhost` โดยตรง LINE จะยิง webhook ไม่ถึง ต้องใช้ public HTTPS เช่น Vercel หรือ ngrok
