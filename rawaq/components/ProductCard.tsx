import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/utils";

type Props = {
  slug: string;
  name: string;
  image: string;
  price: number;
  compareAt?: number | null;
  outOfStock?: boolean;
};

export default function ProductCard({ slug, name, image, price, compareAt, outOfStock }: Props) {
  return (
    <Link href={`/products/${slug}`} className="group block">
      <div className="relative aspect-[3/4] bg-line/30 overflow-hidden">
        {image && (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {outOfStock && (
          <span className="absolute top-3 left-3 bg-ink text-paper text-[10px] uppercase tracking-wide px-2 py-1">
            Sold out
          </span>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-sm">{name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-medium">{formatMoney(price)}</span>
          {compareAt && compareAt > price && (
            <span className="text-xs text-muted line-through">{formatMoney(compareAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
