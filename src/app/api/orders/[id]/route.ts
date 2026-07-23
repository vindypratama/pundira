import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: orderId } = await params;
  const body = await request.json();
  const { action, paymentStatus, distributionStatus } = body;

  if (!orderId || !action) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  }

  // Mitra hanya bisa update pesanan sendiri
  if (session.user.role === "MITRA" && order.mitraId !== session.user.id) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  if (action === "update_payment") {
    // Mitra bisa update PIUTANG -> LUNAS
    if (paymentStatus === "LUNAS" && order.paymentStatus === "PIUTANG") {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "LUNAS",
          paymentDate: new Date(),
        },
      });

      // Buat jurnal keuangan otomatis
      const totalPrice = Number(order.totalPrice);
      const modal = totalPrice * 0.7;
      const operasional = totalPrice * 0.05;
      const margin = totalPrice * 0.25;

      await prisma.financialLedger.createMany({
        data: [
          { type: "MODAL", amount: modal, description: `Alokasi modal dari pesanan #${order.orderNumber}`, orderId },
          { type: "OPERASIONAL", amount: operasional, description: `Alokasi kas operasional dari #${order.orderNumber}`, orderId },
          { type: "MARGIN", amount: margin, description: `Alokasi margin keuntungan dari #${order.orderNumber}`, orderId },
        ],
      });

      return NextResponse.json(updated);
    }
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  if (action === "update_distribution") {
    // Hanya Admin yang bisa update distribusi
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        distributionStatus: distributionStatus || "DISTRIBUTED",
        distributionDate: distributionStatus === "DISTRIBUTED" ? new Date() : null,
      },
    });

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
}
