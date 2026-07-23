import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const poSessionId = searchParams.get("poSessionId");
  const mitraId = searchParams.get("mitraId");
  const status = searchParams.get("status");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (poSessionId) where.poSessionId = poSessionId;
  if (mitraId) where.mitraId = mitraId;
  if (status) where.paymentStatus = status;

  // Mitra hanya bisa lihat pesanan sendiri
  if (session.user.role === "MITRA") {
    where.mitraId = session.user.id;
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      mitra: { select: { id: true, name: true, phone: true } },
      poSession: { select: { id: true, name: true } },
      items: { include: { product: { select: { name: true, unit: true } } } },
    },
  });

  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { poSessionId, customerName, customerPhone, customerAddress, paymentStatus, isLateOrder, notes, items } = body;

  if (!poSessionId || !customerName || !items?.length) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  // Validasi: pastikan PO session ada dan status OPEN
  const poSession = await prisma.pOSession.findUnique({
    where: { id: poSessionId },
    include: { products: true },
  });

  if (!poSession) {
    return NextResponse.json({ error: "Sesi PO tidak ditemukan" }, { status: 400 });
  }

  // Validasi: semua produk harus ada di sesi PO ini
  const validProductIds = new Set(poSession.products.map((psp) => psp.productId));
  const invalidItems = items.filter((item: { productId: string }) => !validProductIds.has(item.productId));
  if (invalidItems.length > 0) {
    return NextResponse.json({ error: "Ada produk yang tidak terdaftar di sesi PO ini" }, { status: 400 });
  }

  // Hitung total
  const totalPrice = items.reduce(
    (sum: number, item: { unitPrice: number; quantity: number }) => sum + item.unitPrice * item.quantity,
    0
  );

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      poSessionId,
      mitraId: session.user.id,
      customerName,
      customerPhone,
      customerAddress,
      totalPrice,
      paymentStatus: paymentStatus || "PIUTANG",
      isLateOrder: isLateOrder || false,
      notes,
      items: {
        create: items.map(
          (item: {
            productId: string;
            poSessionProductId?: string;
            quantity: number;
            unitPrice: number;
            costPrice: number;
            margin: number;
          }) => ({
            productId: item.productId,
            poSessionProductId: item.poSessionProductId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice,
            margin: item.margin,
            subtotal: item.unitPrice * item.quantity,
          })
        ),
      },
    },
    include: {
      items: { include: { product: true } },
      mitra: { select: { name: true } },
    },
  });

  // Jika langsung lunas, buat jurnal keuangan otomatis
  if (paymentStatus === "LUNAS") {
    await createFinancialEntries(order.id, totalPrice);
  }

  return NextResponse.json(order, { status: 201 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createFinancialEntries(orderId: string, totalPrice: number) {
  const modal = totalPrice * 0.7; // 70% untuk modal
  const operasional = totalPrice * 0.05; // 5% kas operasional
  const margin = totalPrice * 0.25; // 25% margin keuntungan

  await prisma.financialLedger.createMany({
    data: [
      { type: "MODAL", amount: modal, description: `Alokasi modal dari pesanan`, orderId },
      { type: "OPERASIONAL", amount: operasional, description: `Alokasi kas operasional`, orderId },
      { type: "MARGIN", amount: margin, description: `Alokasi margin keuntungan`, orderId },
    ],
  });
}
