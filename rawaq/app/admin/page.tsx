"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";

type Stats = {
  productCount: number;
  orderCount: number;
  pendingOrders: number;
  revenue: number;
  lowStock: { id: string; sku: string; stock: number; productName: string; size: string | null; color: string | null }[];
};

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl mb-8">Overview</h1>

      {!stats ? (
        <p className="text-muted text-sm">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatCard label="Revenue" value={formatMoney(stats.revenue)} />
            <StatCard label="Orders" value={String(stats.orderCount)} />
            <StatCard label="Open Orders" value={String(stats.pendingOrders)} />
            <StatCard label="Products" value={String(stats.productCount)} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-line p-6">
              <h2 className="font-display text-lg mb-4">Low Stock</h2>
              {stats.lowStock.length === 0 && <p className="text-sm text-muted">All variants are well stocked.</p>}
              <ul className="space-y-2">
                {stats.lowStock.map((v) => (
                  <li key={v.id} className="flex justify-between text-sm">
                    <span>{v.productName} {[v.size, v.color].filter(Boolean).join(" / ")}</span>
                    <span className="text-danger font-medium">{v.stock} left</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-line p-6 space-y-3">
              <h2 className="font-display text-lg mb-2">Quick Actions</h2>
              <Link href="/admin/products" className="btn-secondary block text-center">Add a Product</Link>
              <Link href="/admin/banners" className="btn-secondary block text-center">Update Homepage Banner</Link>
              <Link href="/admin/coupons" className="btn-secondary block text-center">Create a Coupon</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line p-5">
      <p className="label-eyebrow mb-2">{label}</p>
      <p className="text-2xl font-display">{value}</p>
    </div>
  );
}
