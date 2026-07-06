import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [productCount, orderCount, pendingOrders, lowStockVariants, revenueAgg] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PENDING_PAYMENT", "PAID", "COD_CONFIRMED", "PROCESSING"] } } }),
    prisma.variant.findMany({ where: { stock: { lte: 3 } }, include: { product: true }, take: 10 }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: ["PAID", "COD_CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] } },
    }),
  ]);

  return NextResponse.json({
    productCount,
    orderCount,
    pendingOrders,
    revenue: revenueAgg._sum.total ?? 0,
    lowStock: lowStockVariants.map((v) => ({
      id: v.id,
      sku: v.sku,
      stock: v.stock,
      productName: v.product.name,
      size: v.size,
      color: v.color,
    })),
  });
}
