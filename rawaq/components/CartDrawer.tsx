"use client";

import { useCart } from "@/lib/cart-store";
import { formatMoney } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Minus, Plus, Trash2 } from "lucide-react";

export default function CartDrawer() {
  const { items, isOpen, close, updateQty, removeItem, subtotal } = useCart();
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-ink/40 z-50 transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={close}
      />
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-paper z-50 shadow-soft transition-transform flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 h-20 border-b border-line">
          <h2 className="font-display text-lg">Your Bag ({items.reduce((s, i) => s + i.quantity, 0)})</h2>
          <button onClick={close} aria-label="Close cart"><X size={22} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {items.length === 0 && <p className="text-muted text-sm py-10 text-center">Your bag is empty.</p>}
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4">
              <div className="relative w-20 h-24 bg-line/40 flex-shrink-0">
                {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted">{[item.size, item.color].filter(Boolean).join(" / ")}</p>
                  <p className="text-sm mt-1">{formatMoney(item.unitPrice)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-line">
                    <button
                      className="px-2 py-1"
                      onClick={() => updateQty(item.variantId, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-3 text-sm">{item.quantity}</span>
                    <button
                      className="px-2 py-1"
                      disabled={item.quantity >= item.stock}
                      onClick={() => updateQty(item.variantId, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.variantId)} aria-label="Remove item" className="text-muted hover:text-danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line px-6 py-5 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-medium">{formatMoney(subtotal())}</span>
            </div>
            <Link href="/checkout" onClick={close} className="btn-primary w-full flex justify-center">
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
