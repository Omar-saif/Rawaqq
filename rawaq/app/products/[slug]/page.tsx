import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { notFound } from "next/navigation";
import AddToCartPanel from "@/components/AddToCartPanel";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { variants: true, category: true },
  });

  if (!product || !product.active) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid md:grid-cols-2 gap-10">
      <div className="grid grid-cols-2 gap-3">
        {(product.images.length > 0 ? product.images : [""]).map((img, i) => (
          <div key={i} className={`relative aspect-[3/4] bg-line/30 ${i === 0 ? "col-span-2" : ""}`}>
            {img && <Image src={img} alt={product.name} fill className="object-cover" />}
          </div>
        ))}
      </div>

      <div>
        {product.category && <p className="label-eyebrow mb-2">{product.category.name}</p>}
        <h1 className="font-display text-3xl mb-6">{product.name}</h1>

        <AddToCartPanel
          productId={product.id}
          productSlug={product.slug}
          name={product.name}
          image={product.images[0] ?? ""}
          basePrice={product.basePrice}
          variants={product.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            size: v.size,
            color: v.color,
            price: v.price,
            stock: v.stock,
          }))}
        />

        <div className="mt-10 pt-8 border-t border-line">
          <p className="label-eyebrow mb-2">Details</p>
          <p className="text-sm text-muted whitespace-pre-line">{product.description}</p>
        </div>
      </div>
    </div>
  );
}
