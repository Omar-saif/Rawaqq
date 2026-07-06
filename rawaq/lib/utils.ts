export function formatMoney(halalas: number): string {
  return `${(halalas / 100).toFixed(2)} SAR`;
}

export function toHalalas(sar: number): number {
  return Math.round(sar * 100);
}

export function generateOrderNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate()
  ).padStart(2, "0")}`;
  return `RWQ-${ymd}-${rand}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Resolves the app's public base URL. Falls back to Vercel's automatically
 * provided VERCEL_URL if NEXT_PUBLIC_APP_URL wasn't set manually, so the
 * store still works out of the box on a fresh Vercel deploy.
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
