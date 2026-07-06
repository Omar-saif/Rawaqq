import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { variants: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { variants, ...productFields } = body;

  // Update scalar product fields
  await prisma.product.update({
    where: { id: params.id },
    data: productFields,
  });

  // Upsert variants (existing ones by id, new ones without id get created)
  if (Array.isArray(variants)) {
    for (const v of variants) {
      if (v.id) {
        await prisma.variant.update({
          where: { id: v.id },
          data: {
            sku: v.sku,
            size: v.size || null,
            color: v.color || null,
            price: v.price ?? null,
            stock: v.stock,
            lowStockAt: v.lowStockAt ?? 3,
          },
        });
      } else {
        await prisma.variant.create({
          data: {
            productId: params.id,
            sku: v.sku,
            size: v.size || null,
            color: v.color || null,
            price: v.price ?? null,
            stock: v.stock ?? 0,
            lowStockAt: v.lowStockAt ?? 3,
          },
        });
      }
    }
  }

  const updated = await prisma.product.findUnique({ where: { id: params.id }, include: { variants: true } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
