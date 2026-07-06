"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="bg-ink text-paper mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <h3 className="font-display text-lg mb-3">RAWAQ</h3>
          <p className="text-sm text-paper/60">Tailored menswear, made to last.</p>
        </div>
        <div>
          <h4 className="label-eyebrow mb-3">Shop</h4>
          <ul className="space-y-2 text-sm text-paper/80">
            <li><Link href="/products">All Products</Link></li>
            <li><Link href="/products?category=shirts">Shirts</Link></li>
            <li><Link href="/products?category=thobes">Thobes</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="label-eyebrow mb-3">Help</h4>
          <ul className="space-y-2 text-sm text-paper/80">
            <li><Link href="/account">My Orders</Link></li>
            <li><Link href="/login">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="label-eyebrow mb-3">Contact</h4>
          <p className="text-sm text-paper/80">support@rawaq.sa</p>
        </div>
      </div>
      <div className="border-t border-paper/10 py-5 text-center text-xs text-paper/50">
        © {new Date().getFullYear()} RAWAQ. All rights reserved.
      </div>
    </footer>
  );
}
