import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const poSessionId = searchParams.get("poSessionId");

  const where = poSessionId ? { poSessionId } : {};

  const transactions = await prisma.pOSupplierTransaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { poSession: { select: { name: true } } },
  });

  return NextResponse.json(transactions);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { poSessionId, supplier, productName, quantity, purchasePrice, notes } = body;

  if (!poSessionId || !supplier || !productName || !quantity || !purchasePrice) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const transaction = await prisma.pOSupplierTransaction.create({
    data: {
      poSessionId,
      supplier,
      productName,
      quantity: parseInt(quantity),
      purchasePrice: parseFloat(purchasePrice),
      totalPrice: parseFloat(purchasePrice) * parseInt(quantity),
      notes,
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, transferStatus } = body;

  if (!id) {
    return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
  }

  const transaction = await prisma.pOSupplierTransaction.update({
    where: { id },
    data: {
      transferStatus: transferStatus || "SUDAH_TRANSFER",
      transferDate: transferStatus === "SUDAH_TRANSFER" ? new Date() : null,
    },
  });

  return NextResponse.json(transaction);
}
