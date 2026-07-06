"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  ctaLabel: string | null;
};

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setActive((a) => (a + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) {
    return (
      <div className="arch-frame bg-navy h-[70vh] flex items-center justify-center text-paper text-center px-6">
        <div>
          <p className="label-eyebrow mb-3">RAWAQ</p>
          <h1 className="font-display text-4xl sm:text-5xl italic">Tailored to the moment.</h1>
        </div>
      </div>
    );
  }

  const banner = banners[active];

  return (
    <div className="arch-frame relative h-[70vh] w-full">
      {banners.map((b, i) => (
        <div
          key={b.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}
        >
          <Image src={b.imageUrl} alt={b.title} fill priority={i === 0} className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        </div>
      ))}

      <div className="absolute bottom-12 left-0 right-0 text-center text-paper px-6">
        <p className="label-eyebrow mb-3">{banner.subtitle ?? "RAWAQ"}</p>
        <h1 className="font-display text-4xl sm:text-5xl italic mb-6">{banner.title}</h1>
        {banner.linkUrl && (
          <Link href={banner.linkUrl} className="btn-gold inline-block">
            {banner.ctaLabel ?? "Shop now"}
          </Link>
        )}
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-sand" : "w-1.5 bg-paper/50"}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
