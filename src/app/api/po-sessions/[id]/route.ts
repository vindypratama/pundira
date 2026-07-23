import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { POStatus } from "@prisma/client";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const poSession = await prisma.pOSession.findUnique({
    where: { id },
    include: {
      products: { include: { product: true } },
      orders: {
        include: {
          mitra: { select: { id: true, name: true, phone: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      },
      _count: { select: { orders: true } },
    },
  });

  if (!poSession) {
    return NextResponse.json({ error: "Sesi PO tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(poSession);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body as { status: POStatus };

  const poSession = await prisma.pOSession.update({
    where: { id },
    data: {
      status,
      closedAt: status === "CLOSED" ? new Date() : undefined,
    },
  });

  return NextResponse.json(poSession);
}
