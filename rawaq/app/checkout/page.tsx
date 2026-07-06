"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { formatMoney } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const SHIPPING_FEE = 2500;
const FREE_SHIPPING_THRESHOLD = 30000;

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({
    name: session?.user?.name ?? "",
    phone: "",
    email: session?.user?.email ?? "",
    line1: "",
    line2: "",
    city: "",
    postal: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "COD">("CARD");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number; freeShipping: boolean } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const sub = subtotal();
  const shippingFee = couponApplied?.freeShipping || sub >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const discount = couponApplied?.discount ?? 0;
  const total = Math.max(sub - discount + shippingFee, 0);

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCheckingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          email: form.email || null,
          lines: items.map((i) => ({ sku: i.sku, categoryId: null, unitPrice: i.unitPrice, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setCouponError(data.reason);
        setCouponApplied(null);
      } else {
        setCouponApplied({ code: data.code, discount: data.discount, freeShipping: data.freeShipping });
        toast.success("Coupon applied");
      }
    } finally {
      setCheckingCoupon(false);
    }
  }

  async function submit() {
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          couponCode: couponApplied?.code,
          paymentMethod,
          shipping: form,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }
      clear();
      router.push(data.redirectUrl);
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return <div className="mx-auto max-w-2xl px-4 py-24 text-center text-muted">Your bag is empty.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 grid md:grid-cols-[1.3fr,1fr] gap-12">
      <div>
        <h1 className="font-display text-3xl mb-8">Checkout</h1>

        {!session && (
          <p className="text-sm text-muted mb-6 bg-line/30 px-4 py-3">
            Checking out as a guest. <a href="/login" className="underline text-navy">Sign in</a> to track orders, or continue below.
          </p>
        )}

        <div className="space-y-4">
          <p className="label-eyebrow">Contact & Shipping</p>
          <input className="input-field" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <input className="input-field" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="input-field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <input className="input-field" placeholder="Address line 1" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
          <input className="input-field" placeholder="Address line 2 (optional)" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <input className="input-field" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input className="input-field" placeholder="Postal code (optional)" value={form.postal} onChange={(e) => setForm({ ...form, postal: e.target.value })} />
          </div>
        </div>

        <div className="mt-8">
          <p className="label-eyebrow mb-3">Payment Method</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPaymentMethod("CARD")}
              className={`border p-4 text-left ${paymentMethod === "CARD" ? "border-navy bg-navy text-paper" : "border-line"}`}
            >
              <p className="text-sm font-medium">Pay by Card</p>
              <p className="text-xs opacity-70 mt-1">Secure checkout (SSL)</p>
            </button>
            <button
              onClick={() => setPaymentMethod("COD")}
              className={`border p-4 text-left ${paymentMethod === "COD" ? "border-navy bg-navy text-paper" : "border-line"}`}
            >
              <p className="text-sm font-medium">Cash on Delivery</p>
              <p className="text-xs opacity-70 mt-1">Pay when it arrives</p>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-line/20 p-6 h-fit">
        <p className="label-eyebrow mb-4">Order Summary</p>
        <div className="space-y-3 mb-6">
          {items.map((i) => (
            <div key={i.variantId} className="flex justify-between text-sm">
              <span>{i.name} × {i.quantity}</span>
              <span>{formatMoney(i.unitPrice * i.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <input
            className="input-field flex-1"
            placeholder="Coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
          <button onClick={applyCoupon} disabled={checkingCoupon} className="btn-secondary whitespace-nowrap">
            Apply
          </button>
        </div>
        {couponError && <p className="text-xs text-danger mb-4">{couponError}</p>}
        {couponApplied && <p className="text-xs text-success mb-4">Code "{couponApplied.code}" applied.</p>}

        <div className="space-y-2 text-sm border-t border-line pt-4">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(sub)}</span></div>
          {discount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>-{formatMoney(discount)}</span></div>}
          <div className="flex justify-between"><span>Shipping</span><span>{shippingFee === 0 ? "Free" : formatMoney(shippingFee)}</span></div>
          <div className="flex justify-between text-base font-medium pt-2 border-t border-line"><span>Total</span><span>{formatMoney(total)}</span></div>
        </div>

        <button onClick={submit} disabled={submitting} className="btn-primary w-full mt-6">
          {submitting ? "Placing order..." : paymentMethod === "COD" ? "Place Order" : "Continue to Payment"}
        </button>
      </div>
    </div>
  );
}
