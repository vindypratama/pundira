import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { registerMitraSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { role: "MITRA" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      bankName: true,
      bankAccount: true,
      bankHolder: true,
      isActive: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = registerMitraSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, phone, password, bankName, bankAccount, bankHolder } = parsed.data;

  // Cek apakah phone sudah terdaftar
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json({ error: "No. HP sudah terdaftar" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      passwordHash,
      role: "MITRA",
      bankName,
      bankAccount,
      bankHolder,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      bankName: true,
      bankAccount: true,
      bankHolder: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, isActive } = body;

  if (!id) {
    return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: { id: true, name: true, isActive: true },
  });

  return NextResponse.json(user);
}
