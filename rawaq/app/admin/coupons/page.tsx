"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/utils";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minSubtotal: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  timesUsed: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
};

const emptyForm = {
  code: "",
  type: "PERCENT" as const,
  value: "",
  minSubtotal: "",
  maxDiscount: "",
  usageLimit: "",
  usageLimitPerUser: "",
  startsAt: "",
  endsAt: "",
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/coupons");
    setCoupons(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.code.trim()) {
      toast.error("Enter a coupon code.");
      return;
    }
    if (form.type !== "FREE_SHIPPING" && !form.value) {
      toast.error("Enter a discount value.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: form.type === "PERCENT" ? Number(form.value) : form.type === "FIXED" ? Math.round(parseFloat(form.value) * 100) : 0,
          minSubtotal: form.minSubtotal ? Math.round(parseFloat(form.minSubtotal) * 100) : null,
          maxDiscount: form.maxDiscount ? Math.round(parseFloat(form.maxDiscount) * 100) : null,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
          usageLimitPerUser: form.usageLimitPerUser ? Number(form.usageLimitPerUser) : null,
          startsAt: form.startsAt || null,
          endsAt: form.endsAt || null,
          active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not create coupon.");
        return;
      }
      toast.success("Coupon created");
      setForm(emptyForm);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c: Coupon) {
    await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-2">Coupons</h1>
      <p className="text-muted text-sm mb-8">Create percentage, fixed-amount, or free-shipping codes with any combination of limits.</p>

      <div className="grid md:grid-cols-[1fr,1.3fr] gap-10">
        <div className="space-y-3">
          <input className="input-field uppercase" placeholder="CODE (e.g. WELCOME10)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />

          <div>
            <p className="label-eyebrow mb-2">Discount Type</p>
            <div className="grid grid-cols-3 gap-2">
              {(["PERCENT", "FIXED", "FREE_SHIPPING"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t })}
                  className={`border p-2 text-xs ${form.type === t ? "border-navy bg-navy text-paper" : "border-line"}`}
                >
                  {t === "PERCENT" ? "% Off" : t === "FIXED" ? "Fixed SAR Off" : "Free Shipping"}
                </button>
              ))}
            </div>
          </div>

          {form.type !== "FREE_SHIPPING" && (
            <input
              className="input-field"
              type="number"
              placeholder={form.type === "PERCENT" ? "Percent off (e.g. 10)" : "Amount off in SAR (e.g. 50)"}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
          )}

          {form.type === "PERCENT" && (
            <input className="input-field" type="number" placeholder="Max discount cap in SAR (optional)" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
          )}

          <input className="input-field" type="number" placeholder="Minimum order subtotal in SAR (optional)" value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })} />

          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" type="number" placeholder="Total uses allowed (optional)" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
            <input className="input-field" type="number" placeholder="Uses per customer (optional)" value={form.usageLimitPerUser} onChange={(e) => setForm({ ...form, usageLimitPerUser: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted">Starts (optional)</label>
              <input className="input-field" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted">Ends (optional)</label>
              <input className="input-field" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
            </div>
          </div>

          <button onClick={create} disabled={saving} className="btn-primary w-full">
            {saving ? "Creating..." : "Create Coupon"}
          </button>
        </div>

        <div>
          <p className="label-eyebrow mb-4">Existing coupons</p>
          <div className="space-y-3">
            {coupons.map((c) => (
              <div key={c.id} className="border border-line p-4 flex justify-between items-center">
                <div>
                  <p className="font-mono text-sm">{c.code}</p>
                  <p className="text-xs text-muted mt-1">
                    {c.type === "PERCENT" && `${c.value}% off`}
                    {c.type === "FIXED" && `${formatMoney(c.value)} off`}
                    {c.type === "FREE_SHIPPING" && "Free shipping"}
                    {c.minSubtotal ? ` · min ${formatMoney(c.minSubtotal)}` : ""}
                    {c.usageLimit ? ` · ${c.timesUsed}/${c.usageLimit} used` : ` · ${c.timesUsed} used`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleActive(c)}
                    className={`text-xs uppercase tracking-wide px-2 py-1 ${c.active ? "bg-success/10 text-success" : "bg-line text-muted"}`}
                  >
                    {c.active ? "Active" : "Off"}
                  </button>
                  <button onClick={() => remove(c.id)} className="text-muted hover:text-danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {coupons.length === 0 && <p className="text-sm text-muted">No coupons yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
