import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { productSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      defaultCostPrice: parsed.data.defaultCostPrice,
      hppPerPaket: parsed.data.hppPerPaket || null,
      ongkirJabodetabek: parsed.data.ongkirJabodetabek || null,
      ongkirLuarJabodetabek: parsed.data.ongkirLuarJabodetabek || null,
      hargaTayang: parsed.data.hargaTayang || null,
      marginPerPaket: parsed.data.marginPerPaket || null,
      sellingPrice: parsed.data.sellingPrice,
      defaultMargin: parsed.data.defaultMargin,
      unit: parsed.data.unit,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
