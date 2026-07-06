# RAWAQ — Ecommerce Storefront

A Next.js 14 (App Router) ecommerce site for RAWAQ, in navy and white, built on the
brand's collar-and-crown mark. PostgreSQL via Prisma, deployed on Vercel.

## What's included

- **Storefront**: homepage with a managed banner carousel, product listing with
  category filters, product detail pages with size/color variants, a cart drawer,
  and checkout.
- **Accounts are optional**: customers can create an account or check out as a
  guest. Signed-in customers get an order history at `/account`.
- **Checkout**: pay by card (pluggable gateway) or Cash on Delivery, chosen at
  checkout.
- **Coupons**: percentage, fixed-amount, or free-shipping codes, each with any
  combination of: minimum order value, max discount cap, total usage limit,
  per-customer usage limit, start/end dates, and restriction to specific
  products or categories. Create as many as you like from `/admin/coupons`.
- **Inventory**: every size/color combination is its own SKU with its own stock
  count. Stock is decremented atomically at checkout (two customers can't both
  buy the last item), and low-stock items surface on the admin dashboard.
- **Admin dashboard** (`/admin`, requires an admin account):
  - **Banners** — upload an image, add a headline/link, and it's live on the
    homepage immediately. Multiple banners rotate automatically.
  - **Products** — add products with photos, price, category, and any number
    of size/color variants, each with its own stock.
  - **Coupons** — the flexible coupon builder described above.
  - **Orders** — see every order and move it through Processing → Shipped →
    Delivered (or Cancelled/Refunded).

## Tech stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma ORM
- NextAuth (credentials login) for customer + admin accounts
- Vercel Blob for image uploads (banners & product photos)
- Zustand for the client-side cart

## Local setup

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL at minimum
npx prisma db push        # create tables
npm run db:seed           # creates an admin login + one sample product
npm run dev
```

Sign in at `/login` with the seeded admin (`admin@rawaq.sa` / `ChangeMe123!`
by default — override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env`
before seeding, and change the password after first login by seeding again
with a new value or adding a "change password" flow later).

## Deploying to Vercel

1. Push this project to a GitHub repo and import it in Vercel.
2. Add a Postgres database: Vercel dashboard → **Storage → Postgres** (or bring
   your own, e.g. Neon/Supabase) and copy its connection string into
   `DATABASE_URL`.
3. Add a Blob store: **Storage → Blob**, then copy `BLOB_READ_WRITE_TOKEN` into
   your project's environment variables. This is what makes banner/product
   image uploads work in the admin dashboard.
4. Set `NEXTAUTH_SECRET` (`openssl rand -base64 32`), `NEXTAUTH_URL`, and
   `NEXT_PUBLIC_APP_URL` to your production domain.
5. Deploy. Then run the seed once against production (e.g. via `vercel env pull`
   + `npm run db:seed` locally pointed at the prod `DATABASE_URL`, or a one-off
   script) to create your first admin login.

## Payments: "SSL ecommerce" + Cash on Delivery

Cash on Delivery works immediately with no configuration — it's just a payment
method choice at checkout that confirms the order right away.

For card payments, the project ships with a **payment gateway abstraction**
(`lib/payment.ts`) rather than hard-wiring one processor, because "SSL
ecommerce" usually just means *any* processor that runs over HTTPS with a
hosted checkout page — which is how most local Saudi gateways work. Until you
configure one, card checkout runs in a demo mode so you can test the full
flow end-to-end.

To go live, pick one of:

- **[Moyasar](https://moyasar.com/docs)** — mada, Visa, Mastercard, Apple Pay
- **[HyperPay](https://www.hyperpay.com)**
- **[Tap](https://www.tap.company)**

...then fill in `createPaymentSession()` in `lib/payment.ts` (a commented
example for Moyasar is already there) and set `PAYMENT_GATEWAY_SECRET_KEY`.
Verify the webhook signature in `app/api/webhooks/payment/route.ts` per your
provider's docs before trusting a payment confirmation.

## Data model

See `prisma/schema.prisma`. The short version:

- `Product` → has many `Variant` (the actual SKUs with size/color/stock)
- `Order` → has many `OrderItem`, optionally linked to a `User` (or just a
  guest email/name)
- `Coupon` → has many `CouponRedemption`, which is how per-customer usage
  limits are enforced
- `Banner` → simple ordered list with an active flag and optional
  start/end dates for scheduling promos in advance

All money fields are stored as integers in halalas (1/100 SAR) to avoid
floating-point rounding errors — `formatMoney()` in `lib/utils.ts` converts
for display.

## Extending this

- **Search** — add a search bar backed by Postgres full-text search or a
  hosted service (Algolia, Typesense) once the catalog grows.
- **Email receipts** — hook into the checkout API route (`app/api/checkout/route.ts`)
  after order creation, e.g. with Resend or Postmark.
- **Reviews, wishlists, size guides** — new Prisma models + routes following
  the same pattern as `Coupon`/`Banner` above.
- **Multi-currency / Arabic locale** — the schema and UI are structured so a
  `locale`/`currency` layer can be added without restructuring the data model.
