import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Buat Admin default
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { phone: "081234567890" },
    update: {},
    create: {
      name: "Super Admin",
      phone: "081234567890",
      email: "admin@pundira.com",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin created: ${admin.name} (${admin.phone})`);

  // Buat contoh Mitra
  const mitraPassword = await bcrypt.hash("mitra123", 12);
  const mitra = await prisma.user.upsert({
    where: { phone: "081111222333" },
    update: {},
    create: {
      name: "Budi Santoso",
      phone: "081111222333",
      passwordHash: mitraPassword,
      role: "MITRA",
      bankName: "BCA",
      bankAccount: "1234567890",
      bankHolder: "Budi Santoso",
    },
  });
  console.log(`✅ Mitra created: ${mitra.name} (${mitra.phone})`);

  // Buat contoh Produk
  const products = [
    { name: "Kemeja Flanel", defaultCostPrice: 75000, hppPerPaket: 70000, ongkirJabodetabek: 5000, ongkirLuarJabodetabek: 10000, hargaTayang: 130000, marginPerPaket: 55000, sellingPrice: 125000, defaultMargin: 50000, unit: "pcs" },
    { name: "Kaos Polos", defaultCostPrice: 35000, hppPerPaket: 32000, ongkirJabodetabek: 5000, ongkirLuarJabodetabek: 10000, hargaTayang: 70000, marginPerPaket: 33000, sellingPrice: 65000, defaultMargin: 30000, unit: "pcs" },
    { name: "Celana Jeans", defaultCostPrice: 100000, hppPerPaket: 95000, ongkirJabodetabek: 8000, ongkirLuarJabodetabek: 15000, hargaTayang: 185000, marginPerPaket: 82000, sellingPrice: 175000, defaultMargin: 75000, unit: "pcs" },
    { name: "Jaket Hoodie", defaultCostPrice: 85000, hppPerPaket: 80000, ongkirJabodetabek: 8000, ongkirLuarJabodetabek: 15000, hargaTayang: 160000, marginPerPaket: 72000, sellingPrice: 150000, defaultMargin: 65000, unit: "pcs" },
  ];

  for (const product of products) {
    const { name, ...productData } = product;
    await prisma.product.upsert({
      where: { id: name.toLowerCase().replace(/\s/g, "-") },
      update: {},
      create: {
        id: name.toLowerCase().replace(/\s/g, "-"),
        name,
        ...productData,
      },
    });
    console.log(`✅ Product created: ${product.name}`);
  }

  console.log("\n🎉 Seeding completed!");
  console.log("\n📋 Login credentials:");
  console.log("   Admin  → HP: 081234567890 | Password: admin123");
  console.log("   Mitra  → HP: 081111222333 | Password: mitra123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
