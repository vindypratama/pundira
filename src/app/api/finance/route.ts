import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: Ambil ringkasan keuangan
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "ledger", "deposits", "summary"

  if (type === "ledger") {
    const ledgers = await prisma.financialLedger.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { order: { select: { orderNumber: true } } },
    });
    return NextResponse.json(ledgers);
  }

  if (type === "deposits") {
    const deposits = await prisma.capitalDeposit.findMany({
      orderBy: { createdAt: "desc" },
      include: { recordedBy: { select: { name: true } } },
    });
    return NextResponse.json(deposits);
  }

  // Summary
  const ledgerSummary = await prisma.financialLedger.groupBy({
    by: ["type"],
    _sum: { amount: true },
  });

  const totalDeposits = await prisma.capitalDeposit.aggregate({
    _sum: { amount: true },
  });

  return NextResponse.json({
    ledgerSummary,
    totalDeposits: totalDeposits._sum.amount || 0,
  });
}

// POST: Tambah setoran modal / pengeluaran / penarikan margin
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, amount, description } = body;

  if (!action || !amount || !description) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const nominalAmount = parseFloat(amount);

  if (action === "deposit") {
    // Setoran modal
    const deposit = await prisma.capitalDeposit.create({
      data: {
        amount: nominalAmount,
        description,
        recordedById: session.user.id,
      },
    });

    await prisma.financialLedger.create({
      data: {
        type: "SETORAN_MODAL",
        amount: nominalAmount,
        description: `Setoran modal: ${description}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(deposit, { status: 201 });
  }

  if (action === "expense") {
    // Pengeluaran operasional
    const ledger = await prisma.financialLedger.create({
      data: {
        type: "PENGELUARAN",
        amount: nominalAmount,
        description: `Pengeluaran: ${description}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(ledger, { status: 201 });
  }

  if (action === "withdraw") {
    // Penarikan margin
    const ledger = await prisma.financialLedger.create({
      data: {
        type: "PENARIKAN",
        amount: nominalAmount,
        description: `Penarikan margin: ${description}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(ledger, { status: 201 });
  }

  return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
}
