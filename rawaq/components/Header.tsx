"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/lib/cart-store";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, User, Menu, X } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();
  const { items, open } = useCart();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  const count = mounted ? items.reduce((s, i) => s + i.quantity, 0) : 0;

  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          <button className="md:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="RAWAQ" width={44} height={44} priority />
            <span className="hidden sm:block font-display text-xl tracking-wide text-navy">RAWAQ</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm tracking-wide uppercase">
            <Link href="/products" className="hover:text-sand transition-colors">All Products</Link>
            <Link href="/products?category=shirts" className="hover:text-sand transition-colors">Shirts</Link>
            <Link href="/products?category=thobes" className="hover:text-sand transition-colors">Thobes</Link>
            <Link href="/products?category=accessories" className="hover:text-sand transition-colors">Accessories</Link>
          </nav>

          <div className="flex items-center gap-5">
            {session ? (
              <div className="hidden sm:flex items-center gap-4 text-sm">
                {session.user.role === "ADMIN" && (
                  <Link href="/admin" className="uppercase tracking-wide text-sand hover:underline">
                    Admin
                  </Link>
                )}
                <Link href="/account" className="uppercase tracking-wide hover:text-sand">
                  {session.user.name?.split(" ")[0] || "Account"}
                </Link>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="text-muted hover:text-navy">
                  Sign out
                </button>
              </div>
            ) : (
              <Link href="/login" className="hidden sm:flex items-center gap-1 text-sm uppercase tracking-wide hover:text-sand">
                <User size={18} /> Account
              </Link>
            )}

            <button onClick={open} className="relative" aria-label="Open cart">
              <ShoppingBag size={22} />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-sand text-ink text-[10px] font-medium w-4 h-4 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-3 text-sm uppercase tracking-wide">
            <Link href="/products" onClick={() => setMenuOpen(false)}>All Products</Link>
            <Link href="/products?category=shirts" onClick={() => setMenuOpen(false)}>Shirts</Link>
            <Link href="/products?category=thobes" onClick={() => setMenuOpen(false)}>Thobes</Link>
            <Link href="/account" onClick={() => setMenuOpen(false)}>Account</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
