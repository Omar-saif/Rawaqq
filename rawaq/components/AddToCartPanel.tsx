"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart-store";
import { formatMoney } from "@/lib/utils";
import toast from "react-hot-toast";

type Variant = {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number | null;
  stock: number;
};

type Props = {
  productId: string;
  productSlug: string;
  name: string;
  image: string;
  basePrice: number;
  variants: Variant[];
};

export default function AddToCartPanel({ productId, productSlug, name, image, basePrice, variants }: Props) {
  const sizes = useMemo(() => Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[], [variants]);
  const colors = useMemo(() => Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[], [variants]);

  const [size, setSize] = useState<string | undefined>(sizes[0]);
  const [color, setColor] = useState<string | undefined>(colors[0]);
  const addItem = useCart((s) => s.addItem);

  const selected = variants.find(
    (v) => (sizes.length === 0 || v.size === size) && (colors.length === 0 || v.color === color)
  );

  const price = selected?.price ?? basePrice;
  const inStock = (selected?.stock ?? 0) > 0;

  return (
    <div className="space-y-6">
      <p className="text-2xl font-medium">{formatMoney(price)}</p>

      {sizes.length > 0 && (
        <div>
          <p className="label-eyebrow mb-2">Size</p>
          <div className="flex gap-2 flex-wrap">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`px-4 py-2 text-sm border ${size === s ? "border-navy bg-navy text-paper" : "border-line hover:border-navy"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div>
          <p className="label-eyebrow mb-2">Color</p>
          <div className="flex gap-2 flex-wrap">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`px-4 py-2 text-sm border ${color === c ? "border-navy bg-navy text-paper" : "border-line hover:border-navy"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        disabled={!selected || !inStock}
        onClick={() => {
          if (!selected) return;
          addItem(
            {
              variantId: selected.id,
              productId,
              productSlug,
              name,
              sku: selected.sku,
              size: selected.size,
              color: selected.color,
              image,
              unitPrice: price,
              stock: selected.stock,
            },
            1
          );
          toast.success("Added to bag");
        }}
        className="btn-primary w-full"
      >
        {!selected ? "Select options" : inStock ? "Add to Bag" : "Sold Out"}
      </button>

      {selected && selected.stock > 0 && selected.stock <= 3 && (
        <p className="text-xs text-danger">Only {selected.stock} left in stock</p>
      )}
    </div>
  );
}
