import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@rawaq.sa";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: "Admin", passwordHash, role: "ADMIN" },
  });
  console.log(`Admin user ready: ${adminEmail} / ${adminPassword}`);

  const shirts = await prisma.category.upsert({
    where: { slug: "shirts" },
    update: {},
    create: { name: "Shirts", slug: "shirts" },
  });

  const existing = await prisma.product.findUnique({ where: { slug: "oxford-slim-fit-shirt" } });
  if (!existing) {
    await prisma.product.create({
      data: {
        name: "Oxford Slim-Fit Shirt",
        slug: "oxford-slim-fit-shirt",
        description: "100% cotton Oxford weave, tailored slim fit, mother-of-pearl buttons.",
        categoryId: shirts.id,
        basePrice: 19900,
        compareAt: 24900,
        images: [],
        variants: {
          create: [
            { sku: "OXF-NVY-S", size: "S", color: "Navy", stock: 12 },
            { sku: "OXF-NVY-M", size: "M", color: "Navy", stock: 8 },
            { sku: "OXF-NVY-L", size: "L", color: "Navy", stock: 5 },
            { sku: "OXF-WHT-M", size: "M", color: "White", stock: 10 },
          ],
        },
      },
    });
    console.log("Sample product created.");
  }

  const existingCoupon = await prisma.coupon.findUnique({ where: { code: "WELCOME10" } });
  if (!existingCoupon) {
    await prisma.coupon.create({
      data: { code: "WELCOME10", type: "PERCENT", value: 10, minSubtotal: 10000 },
    });
    console.log("Sample coupon WELCOME10 created.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
