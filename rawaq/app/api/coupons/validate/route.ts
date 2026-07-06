import { NextResponse } from "next/server";
import { checkCoupon, CartLine } from "@/lib/coupons";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1),
  email: z.string().email().nullable().optional(),
  lines: z.array(
    z.object({
      sku: z.string(),
      categoryId: z.string().nullable(),
      unitPrice: z.number(),
      quantity: z.number(),
    })
  ),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Invalid request." }, { status: 400 });
  }

  const result = await checkCoupon(parsed.data.code, parsed.data.lines as CartLine[], parsed.data.email ?? null);

  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    discount: result.discount,
    freeShipping: result.freeShipping,
    code: result.coupon.code,
    type: result.coupon.type,
  });
}
