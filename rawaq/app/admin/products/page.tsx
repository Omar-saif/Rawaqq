"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/utils";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

type Product = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  active: boolean;
  images: string[];
  variants: { stock: number }[];
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/products");
    setProducts(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Product deleted");
      load();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display text-3xl mb-2">Products</h1>
          <p className="text-muted text-sm">{products.length} total</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">Add Product</Link>
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading...</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-line">
              <th className="py-2 font-normal">Product</th>
              <th className="py-2 font-normal">Price</th>
              <th className="py-2 font-normal">Stock</th>
              <th className="py-2 font-normal">Status</th>
              <th className="py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = p.variants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={p.id} className="border-b border-line/60">
                  <td className="py-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <div className="relative w-10 h-12 bg-line/30 flex-shrink-0">
                        {p.images[0] && <Image src={p.images[0]} alt={p.name} fill className="object-cover" />}
                      </div>
                      <span className="hover:text-sand">{p.name}</span>
                    </Link>
                  </td>
                  <td className="py-3">{formatMoney(p.basePrice)}</td>
                  <td className="py-3">
                    <span className={stock <= 3 ? "text-danger" : ""}>{stock}</span>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs uppercase tracking-wide px-2 py-1 ${p.active ? "bg-success/10 text-success" : "bg-line text-muted"}`}>
                      {p.active ? "Live" : "Hidden"}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button onClick={() => remove(p.id)} className="text-muted hover:text-danger">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-muted">No products yet.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
