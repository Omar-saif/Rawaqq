import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Real gateways (Moyasar/HyperPay/Tap) POST a signed event here when a
 * payment succeeds or fails. Verify the signature per your provider's docs
 * before trusting the payload — the code below is intentionally generic.
 */
export async function POST(req: Request) {
  const payload = await req.json();

  // TODO: verify webhook signature using your gateway's secret, e.g.:
  // const signature = req.headers.get("x-webhook-signature");
  // if (!verifySignature(payload, signature)) return NextResponse.json({}, { status: 401 });

  const providerRef: string | undefined = payload.id ?? payload.providerRef;
  const status: string | undefined = payload.status;

  if (!providerRef) return NextResponse.json({ error: "Missing reference" }, { status: 400 });

  const order = await prisma.order.findFirst({ where: { paymentRef: providerRef } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (status === "paid" || status === "captured" || status === "succeeded") {
    await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });
  } else if (status === "failed") {
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
  }

  return NextResponse.json({ received: true });
}
