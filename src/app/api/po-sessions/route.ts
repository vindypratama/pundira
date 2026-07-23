import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const poSessions = await prisma.pOSession.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      products: {
        include: { product: true },
      },
      _count: { select: { orders: true } },
    },
  });

  return NextResponse.json(poSessions);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, targetQuota, allowLateOrders, startDate, endDate, productIds, margins } = body;

  if (!name || !targetQuota || !startDate || !productIds?.length) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const poSession = await prisma.pOSession.create({
    data: {
      name,
      description,
      targetQuota: parseInt(targetQuota),
      allowLateOrders: allowLateOrders || false,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      products: {
        create: productIds.map((productId: string) => ({
          productId,
          actualMargin: parseFloat(margins?.[productId] || "0"),
        })),
      },
    },
    include: { products: { include: { product: true } } },
  });

  return NextResponse.json(poSession, { status: 201 });
}
