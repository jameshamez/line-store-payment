# Omise / Opn PromptPay Setup

ระบบนี้รองรับ Omise PromptPay แบบใช้งานจริงเมื่อกำหนด environment variables แล้ว

## Environment Variables

```env
APP_BASE_URL=https://your-domain.com
OMISE_SECRET_KEY=skey_test_xxx
OMISE_WEBHOOK_SECRET=base64_webhook_secret_from_omise_dashboard
```

หมายเหตุ:

- `OMISE_SECRET_KEY` ใช้ฝั่ง server เท่านั้น ห้าม expose ไป client
- ถ้าไม่ใส่ `OMISE_SECRET_KEY` ระบบจะ fallback ไปใช้ PromptPay QR demo เดิม
- `OMISE_WEBHOOK_SECRET` ใช้ตรวจ HMAC signature ของ webhook

## Webhook URL

นำ URL นี้ไปตั้งใน Omise Dashboard

```text
https://your-domain.com/api/payments/omise/webhook
```

Test mode และ Live mode ต้องตั้ง webhook แยกกันใน Omise Dashboard

## Payment Flow

1. ลูกค้าสั่งอาหาร
2. ระบบสร้าง order
3. ระบบเรียก Omise `/charges` ด้วย `source[type]=promptpay`
4. Omise ส่ง QR image กลับมา
5. ลูกค้าสแกน QR ด้วย mobile banking
6. Omise ส่ง `charge.complete` webhook
7. ระบบ retrieve charge กลับไปตรวจสอบสถานะ
8. ถ้า charge `successful` หรือ `paid=true` ระบบ mark order เป็น `paid`

## Local Test

ตรวจว่า server เห็น Omise key หรือยัง:

```text
GET /api/payments/omise/status
```

ถ้า configured เป็น `true` แล้ว การสร้าง order ใหม่จะใช้ Omise PromptPay แทน QR demo
