"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Image as ImageIcon, ShoppingBag, Ticket, Package, ExternalLink } from "lucide-react";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 bg-ink text-paper min-h-screen sticky top-0 flex flex-col">
      <div className="px-6 py-6 border-b border-paper/10">
        <span className="font-display text-lg">RAWAQ</span>
        <p className="text-xs text-paper/50 uppercase tracking-wide">Admin</p>
      </div>
      <nav className="flex-1 py-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                active ? "bg-paper/10 text-sand" : "text-paper/70 hover:text-paper hover:bg-paper/5"
              }`}
            >
              <Icon size={16} /> {label}
            </Link>
          );
        })}
      </nav>
      <Link href="/" className="flex items-center gap-2 px-6 py-4 text-xs text-paper/50 hover:text-paper border-t border-paper/10">
        <ExternalLink size={14} /> View store
      </Link>
    </aside>
  );
}
