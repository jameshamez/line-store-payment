import QRCode from "qrcode";
import generatePromptPayPayload from "promptpay-qr";

export async function createPaymentQr(promptPayId: string, amount: number) {
  const paymentPayload = generatePromptPayPayload(promptPayId, { amount });
  const paymentQrDataUrl = await QRCode.toDataURL(paymentPayload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512
  });

  return { paymentPayload, paymentQrDataUrl };
}
