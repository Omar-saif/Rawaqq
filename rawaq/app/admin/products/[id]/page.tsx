import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductForm from "@/components/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { variants: true },
  });
  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display text-3xl mb-8">Edit Product</h1>
      <ProductForm
        productId={product.id}
        initial={{
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          basePrice: product.basePrice,
          compareAt: product.compareAt,
          images: product.images,
          active: product.active,
          variants: product.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            size: v.size ?? "",
            color: v.color ?? "",
            price: v.price ? String(v.price / 100) : "",
            stock: v.stock,
            lowStockAt: v.lowStockAt,
          })),
        }}
      />
    </div>
  );
}
