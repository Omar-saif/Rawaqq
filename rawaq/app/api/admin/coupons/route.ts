import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1),
  type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
  value: z.number().min(0).default(0),
  minSubtotal: z.number().nullable().optional(),
  maxDiscount: z.number().nullable().optional(),
  usageLimit: z.number().nullable().optional(),
  usageLimitPerUser: z.number().nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  active: z.boolean().default(true),
  applicableSkus: z.array(z.string()).default([]),
  applicableCats: z.array(z.string()).default([]),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(coupons);
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid coupon data." }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.coupon.findUnique({ where: { code: data.code.toUpperCase() } });
  if (existing) return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 409 });

  const coupon = await prisma.coupon.create({
    data: {
      ...data,
      code: data.code.toUpperCase(),
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
    },
  });
  return NextResponse.json(coupon);
}
