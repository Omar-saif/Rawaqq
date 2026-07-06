import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkCoupon, redeemCoupon } from "@/lib/coupons";
import { generateOrderNumber } from "@/lib/utils";
import { createPaymentSession } from "@/lib/payment";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const schema = z.object({
  items: z.array(z.object({ variantId: z.string(), quantity: z.number().min(1) })).min(1),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["CARD", "COD"]),
  shipping: z.object({
    name: z.string().min(1),
    phone: z.string().min(5),
    email: z.string().email(),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    country: z.string().default("SA"),
    postal: z.string().optional(),
  }),
});

const SHIPPING_FEE = 25_00; // 25 SAR flat rate, in halalas
const FREE_SHIPPING_THRESHOLD = 300_00;

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout data." }, { status: 400 });
  }
  const { items, couponCode, paymentMethod, shipping } = parsed.data;

  const session = await getServerSession(authOptions);

  const variants = await prisma.variant.findMany({
    where: { id: { in: items.map((i) => i.variantId) } },
    include: { product: true },
  });

  // Validate stock
  for (const line of items) {
    const v = variants.find((v) => v.id === line.variantId);
    if (!v || !v.product.active) {
      return NextResponse.json({ error: "One of the items is no longer available." }, { status: 400 });
    }
    if (v.stock < line.quantity) {
      return NextResponse.json(
        { error: `Only ${v.stock} left of ${v.product.name}${v.size ? " (" + v.size + ")" : ""}.` },
        { status: 400 }
      );
    }
  }

  const cartLines = items.map((line) => {
    const v = variants.find((v) => v.id === line.variantId)!;
    return {
      sku: v.sku,
      categoryId: v.product.categoryId,
      unitPrice: v.price ?? v.product.basePrice,
      quantity: line.quantity,
    };
  });

  const subtotal = cartLines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  let discount = 0;
  let freeShipping = false;
  let couponRecordId: string | null = null;

  if (couponCode) {
    const result = await checkCoupon(couponCode, cartLines, shipping.email);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    discount = result.discount;
    freeShipping = result.freeShipping;
    couponRecordId = result.coupon.id;
  }

  const shippingFee = freeShipping || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = Math.max(subtotal - discount + shippingFee, 0);

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Re-check + decrement stock atomically
      for (const line of items) {
        const updated = await tx.variant.updateMany({
          where: { id: line.variantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (updated.count === 0) {
          throw new Error("STOCK_CONFLICT");
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: (session?.user as any)?.id ?? null,
          guestEmail: session ? null : shipping.email,
          guestName: session ? null : shipping.name,
          shippingName: shipping.name,
          shippingPhone: shipping.phone,
          shippingLine1: shipping.line1,
          shippingLine2: shipping.line2,
          shippingCity: shipping.city,
          shippingCountry: shipping.country,
          shippingPostal: shipping.postal,
          subtotal,
          discountTotal: discount,
          shippingFee,
          total,
          couponCode: couponCode ?? null,
          paymentMethod,
          status: paymentMethod === "COD" ? "COD_CONFIRMED" : "PENDING_PAYMENT",
          items: {
            create: items.map((line) => {
              const v = variants.find((v) => v.id === line.variantId)!;
              return {
                productId: v.productId,
                variantId: v.id,
                nameSnapshot: v.product.name,
                skuSnapshot: v.sku,
                unitPrice: v.price ?? v.product.basePrice,
                quantity: line.quantity,
              };
            }),
          },
        },
      });

      if (couponRecordId) {
        await redeemCoupon(tx, couponRecordId, created.id, shipping.email);
      }

      return created;
    });

    if (paymentMethod === "COD") {
      return NextResponse.json({ orderNumber: order.orderNumber, redirectUrl: `/checkout/success?order=${order.orderNumber}` });
    }

    const paymentSession = await createPaymentSession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: total,
      customerEmail: shipping.email,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
    });

    await prisma.order.update({ where: { id: order.id }, data: { paymentRef: paymentSession.providerRef } });

    return NextResponse.json({ orderNumber: order.orderNumber, redirectUrl: paymentSession.redirectUrl });
  } catch (err: any) {
    if (err.message === "STOCK_CONFLICT") {
      return NextResponse.json({ error: "Sorry, an item just sold out. Please review your bag." }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Something went wrong placing your order." }, { status: 500 });
  }
}
