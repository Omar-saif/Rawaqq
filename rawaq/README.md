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

## Deploying to Vercel (plug and play — no CLI required)

1. **Push this project to GitHub**, then in Vercel click **Add New → Project**
   and import that repo.
2. **Add a database.** In your new Vercel project: **Storage → Marketplace
   Database Storage → Neon (Postgres) → Install**. Follow the prompts (any
   region/free plan is fine) and connect it to this project. Vercel injects
   `DATABASE_URL` automatically — you don't type anything.
3. **Add image storage.** Same tab: **Storage → Create Database → Blob →
   Install**, connect it to this project. This injects
   `BLOB_READ_WRITE_TOKEN` automatically, which is what makes banner/product
   image uploads work from the admin dashboard.
4. **Set two environment variables** (Project → Settings → Environment
   Variables — this is the only manual step):
   - `NEXTAUTH_SECRET` — any long random string (e.g. generate one at
     [randomkeygen.com](https://randomkeygen.com) or run
     `openssl rand -base64 32` if you have a terminal handy).
   - `SETUP_SECRET` — any password you'll remember, used once to create your
     admin account.
5. **Deploy.** The build step runs `prisma db push` automatically, so your
   database tables are created with no migration command to run.
6. **Visit `https://your-project.vercel.app/setup`** once. Enter the
   `SETUP_SECRET` you chose, your name, email, and a password — this creates
   your admin login and drops in one sample product and coupon so the store
   isn't empty. That page permanently disables itself after first use.
7. **Sign in at `/login`** with the account you just created, then go to
   `/admin` to upload your real banner, add products, and set up coupons.

That's the whole path from zero to a working store: two integrations, two
env vars, one setup form.

> **Note on schema changes:** to stay zero-config, the build command runs
> `prisma db push` on every deploy, which syncs your database tables to
> match `prisma/schema.prisma` automatically. This is ideal while you're
> getting started. Once the store is live with real customer data, switch to
> `prisma migrate deploy` in the build command instead (see the
> [Prisma migrate docs](https://www.prisma.io/docs/orm/prisma-migrate)) so
> schema changes are reviewed rather than applied automatically.

## Local development (optional)

Only needed if you want to run this on your own machine instead of just
using the deployed site:

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL at minimum
npx prisma db push        # create tables
npm run dev
```

Then visit `http://localhost:3000/setup` to create your local admin account,
same as step 6 above. (A CLI seed script also exists at `npm run db:seed` if
you prefer that instead of the `/setup` page.)

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
