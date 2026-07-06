import { prisma } from "./prisma";
import { Coupon } from "@prisma/client";

export type CartLine = {
  sku: string;
  categoryId: string | null;
  unitPrice: number; // halalas
  quantity: number;
};

export type CouponCheckResult =
  | { ok: true; coupon: Coupon; discount: number; freeShipping: boolean }
  | { ok: false; reason: string };

/**
 * Validates a coupon code against the current cart + customer, and computes
 * the discount amount in halalas. Does NOT mutate usage counters — call
 * redeemCoupon() only after the order is actually placed.
 */
export async function checkCoupon(
  code: string,
  lines: CartLine[],
  customerEmail: string | null
): Promise<CouponCheckResult> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!coupon) return { ok: false, reason: "This code doesn't exist." };
  if (!coupon.active) return { ok: false, reason: "This code is no longer active." };

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) return { ok: false, reason: "This code isn't active yet." };
  if (coupon.endsAt && now > coupon.endsAt) return { ok: false, reason: "This code has expired." };

  if (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit) {
    return { ok: false, reason: "This code has reached its usage limit." };
  }

  if (coupon.usageLimitPerUser !== null && customerEmail) {
    const used = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, userEmail: customerEmail.toLowerCase() },
    });
    if (used >= coupon.usageLimitPerUser) {
      return { ok: false, reason: "You've already used this code the maximum number of times." };
    }
  }

  // Filter to eligible lines if the coupon is restricted to specific SKUs/categories
  const restrictedToSkus = coupon.applicableSkus.length > 0;
  const restrictedToCats = coupon.applicableCats.length > 0;

  const eligibleLines = lines.filter((l) => {
    if (restrictedToSkus && !coupon.applicableSkus.includes(l.sku)) return false;
    if (restrictedToCats && (!l.categoryId || !coupon.applicableCats.includes(l.categoryId))) return false;
    return true;
  });

  if ((restrictedToSkus || restrictedToCats) && eligibleLines.length === 0) {
    return { ok: false, reason: "This code doesn't apply to the items in your cart." };
  }

  const cartSubtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const eligibleSubtotal = eligibleLines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  if (coupon.minSubtotal !== null && cartSubtotal < coupon.minSubtotal) {
    return {
      ok: false,
      reason: `Add ${(coupon.minSubtotal / 100).toFixed(2)} SAR more to use this code.`,
    };
  }

  if (coupon.type === "FREE_SHIPPING") {
    return { ok: true, coupon, discount: 0, freeShipping: true };
  }

  let discount = 0;
  if (coupon.type === "PERCENT") {
    discount = Math.round(eligibleSubtotal * (coupon.value / 100));
    if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon.type === "FIXED") {
    discount = Math.min(coupon.value, eligibleSubtotal);
  }

  return { ok: true, coupon, discount, freeShipping: false };
}

/** Call once, inside the same transaction as order creation, to record usage. */
export async function redeemCoupon(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  couponId: string,
  orderId: string,
  customerEmail: string
) {
  await tx.coupon.update({ where: { id: couponId }, data: { timesUsed: { increment: 1 } } });
  await tx.couponRedemption.create({
    data: { couponId, orderId, userEmail: customerEmail.toLowerCase() },
  });
}
