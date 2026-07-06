import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  secret: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function GET() {
  // Lets the setup page know whether it should show the form or a "done" state.
  const adminExists = (await prisma.user.count({ where: { role: "ADMIN" } })) > 0;
  return NextResponse.json({ adminExists });
}

export async function POST(req: Request) {
  const configuredSecret = process.env.SETUP_SECRET;
  if (!configuredSecret) {
    return NextResponse.json(
      { error: "SETUP_SECRET is not set in your environment variables. Add it in Vercel, redeploy, then retry." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }
  const { secret, name, email, password } = parsed.data;

  if (secret !== configuredSecret) {
    return NextResponse.json({ error: "Incorrect setup key." }, { status: 401 });
  }

  const adminExists = (await prisma.user.count({ where: { role: "ADMIN" } })) > 0;
  if (adminExists) {
    return NextResponse.json({ error: "Setup has already been completed. Sign in at /login instead." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, role: "ADMIN" },
    create: { email: email.toLowerCase(), name, passwordHash, role: "ADMIN" },
  });

  // A little starter content so the store isn't empty on first login.
  const category = await prisma.category.upsert({
    where: { slug: "shirts" },
    update: {},
    create: { name: "Shirts", slug: "shirts" },
  });

  const existingProduct = await prisma.product.findUnique({ where: { slug: "oxford-slim-fit-shirt" } });
  if (!existingProduct) {
    await prisma.product.create({
      data: {
        name: "Oxford Slim-Fit Shirt",
        slug: "oxford-slim-fit-shirt",
        description: "100% cotton Oxford weave, tailored slim fit, mother-of-pearl buttons.",
        categoryId: category.id,
        basePrice: 19900,
        compareAt: 24900,
        images: [],
        variants: {
          create: [
            { sku: "OXF-NVY-S", size: "S", color: "Navy", stock: 12 },
            { sku: "OXF-NVY-M", size: "M", color: "Navy", stock: 8 },
            { sku: "OXF-WHT-M", size: "M", color: "White", stock: 10 },
          ],
        },
      },
    });
  }

  const existingCoupon = await prisma.coupon.findUnique({ where: { code: "WELCOME10" } });
  if (!existingCoupon) {
    await prisma.coupon.create({ data: { code: "WELCOME10", type: "PERCENT", value: 10, minSubtotal: 10000 } });
  }

  return NextResponse.json({ ok: true });
}
