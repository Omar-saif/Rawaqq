import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const variantSchema = z.object({
  sku: z.string().min(1),
  size: z.string().optional(),
  color: z.string().optional(),
  price: z.number().nullable().optional(),
  stock: z.number().min(0).default(0),
  lowStockAt: z.number().min(0).default(3),
});

const schema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  categoryId: z.string().nullable().optional(),
  basePrice: z.number().min(0),
  compareAt: z.number().nullable().optional(),
  images: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  variants: z.array(variantSchema).min(1),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const products = await prisma.product.findMany({
    include: { variants: true, category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid product data." }, { status: 400 });
  }
  const data = parsed.data;

  let slug = slugify(data.name);
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      categoryId: data.categoryId || null,
      basePrice: data.basePrice,
      compareAt: data.compareAt,
      images: data.images,
      active: data.active,
      variants: { create: data.variants },
    },
    include: { variants: true },
  });

  return NextResponse.json(product);
}
