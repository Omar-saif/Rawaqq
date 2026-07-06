/**
 * Payment gateway abstraction.
 *
 * This ships with a working "manual/redirect" stub so the store is fully
 * functional out of the box (COD works immediately; card payments land on
 * a placeholder confirmation step). To go live with real card payments,
 * implement `createPaymentSession` against your chosen SSL-secured gateway
 * and verify webhooks in `app/api/webhooks/payment/route.ts`.
 *
 * Recommended options for Saudi Arabia (all support mada + Visa/Mastercard,
 * and are used behind SSL/HTTPS, which is what "SSL ecommerce" typically
 * refers to for local merchants):
 *   - Moyasar   https://moyasar.com/docs
 *   - HyperPay  https://www.hyperpay.com
 *   - Tap       https://www.tap.company
 *
 * All three follow the same shape: create a payment/session server-side,
 * redirect the customer to a hosted page, then receive a webhook + redirect
 * callback confirming success.
 */

export type PaymentSession = {
  redirectUrl: string;
  providerRef: string;
};

export async function createPaymentSession(params: {
  orderId: string;
  orderNumber: string;
  amount: number; // halalas
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<PaymentSession> {
  const apiKey = process.env.PAYMENT_GATEWAY_SECRET_KEY;

  if (!apiKey) {
    // No gateway configured yet — fall back to a local confirmation page so
    // the checkout flow can still be demoed/tested end-to-end.
    return {
      redirectUrl: `${params.successUrl}?order=${params.orderNumber}&demo=1`,
      providerRef: `DEMO-${params.orderNumber}`,
    };
  }

  // --- Example real integration (Moyasar) ---
  // const res = await fetch("https://api.moyasar.com/v1/payments", {
  //   method: "POST",
  //   headers: {
  //     Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     amount: params.amount, // halalas
  //     currency: "SAR",
  //     description: `Order ${params.orderNumber}`,
  //     callback_url: params.successUrl,
  //     source: { type: "creditcard" },
  //   }),
  // });
  // const data = await res.json();
  // return { redirectUrl: data.source.transaction_url, providerRef: data.id };

  throw new Error("Real payment gateway not yet configured — see lib/payment.ts");
}
