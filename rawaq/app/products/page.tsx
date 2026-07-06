import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category;

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(category ? { category: { slug: category } } : {}),
    },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <h1 className="font-display text-3xl mb-2">
        {category ? categories.find((c) => c.slug === category)?.name ?? "Products" : "All Products"}
      </h1>
      <p className="text-muted text-sm mb-8">{products.length} items</p>

      <div className="flex gap-6">
        <aside className="hidden md:block w-48 flex-shrink-0">
          <h4 className="label-eyebrow mb-4">Categories</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/products" className={!category ? "text-sand" : "hover:text-sand"}>
                All
              </a>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <a href={`/products?category=${c.slug}`} className={category === c.slug ? "text-sand" : "hover:text-sand"}>
                  {c.name}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 flex-1">
          {products.map((p) => {
            const stock = p.variants.reduce((s, v) => s + v.stock, 0);
            return (
              <ProductCard
                key={p.id}
                slug={p.slug}
                name={p.name}
                image={p.images[0] ?? ""}
                price={p.basePrice}
                compareAt={p.compareAt}
                outOfStock={stock === 0}
              />
            );
          })}
          {products.length === 0 && <p className="text-muted text-sm">No products found.</p>}
        </div>
      </div>
    </div>
  );
}
