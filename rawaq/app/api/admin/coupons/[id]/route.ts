import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const coupon = await prisma.coupon.update({
    where: { id: params.id },
    data: {
      ...body,
      code: body.code ? body.code.toUpperCase() : undefined,
      startsAt: body.startsAt ? new Date(body.startsAt) : body.startsAt === null ? null : undefined,
      endsAt: body.endsAt ? new Date(body.endsAt) : body.endsAt === null ? null : undefined,
    },
  });
  return NextResponse.json(coupon);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  await prisma.coupon.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
