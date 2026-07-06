"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/utils";
import toast from "react-hot-toast";

type Order = {
  id: string;
  orderNumber: string;
  guestEmail: string | null;
  user: { email: string } | null;
  total: number;
  paymentMethod: "CARD" | "COD";
  status: string;
  createdAt: string;
  items: { nameSnapshot: string; quantity: number }[];
};

const statuses = ["PENDING_PAYMENT", "PAID", "COD_CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/orders");
    setOrders(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success("Order updated");
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-8">Orders</h1>

      {loading ? (
        <p className="text-muted text-sm">Loading...</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="border border-line p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-mono text-sm">{o.orderNumber}</p>
                  <p className="text-xs text-muted">
                    {o.user?.email ?? o.guestEmail} · {new Date(o.createdAt).toLocaleString()} · {o.paymentMethod}
                  </p>
                </div>
                <p className="text-sm font-medium">{formatMoney(o.total)}</p>
              </div>
              <p className="text-xs text-muted mb-3">{o.items.map((i) => `${i.nameSnapshot} × ${i.quantity}`).join(", ")}</p>
              <select
                value={o.status}
                onChange={(e) => updateStatus(o.id, e.target.value)}
                className="input-field text-xs w-auto"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          ))}
          {orders.length === 0 && <p className="text-sm text-muted">No orders yet.</p>}
        </div>
      )}
    </div>
  );
}
