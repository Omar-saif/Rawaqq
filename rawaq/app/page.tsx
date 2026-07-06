import { prisma } from "@/lib/prisma";
import BannerCarousel from "@/components/BannerCarousel";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const now = new Date();

  const banners = await prisma.banner.findMany({
    where: {
      active: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { position: "asc" },
  });

  const products = await prisma.product.findMany({
    where: { active: true },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <div>
      <BannerCarousel banners={banners} />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="label-eyebrow mb-2">New in</p>
            <h2 className="font-display text-3xl">Latest Arrivals</h2>
          </div>
          <Link href="/products" className="text-sm uppercase tracking-wide hover:text-sand">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
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
          {products.length === 0 && (
            <p className="col-span-full text-muted text-sm">
              No products yet — add some from the admin dashboard.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
