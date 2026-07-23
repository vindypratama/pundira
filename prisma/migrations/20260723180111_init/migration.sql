-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MITRA');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PIUTANG', 'LUNAS');

-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('PENDING', 'DISTRIBUTED');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('MODAL', 'OPERASIONAL', 'MARGIN', 'PENARIKAN', 'PENGELUARAN', 'SETORAN_MODAL');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('BELUM_TRANSFER', 'SUDAH_TRANSFER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankHolder" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultCostPrice" DECIMAL(15,2) NOT NULL,
    "hppPerPaket" DECIMAL(15,2),
    "ongkirJabodetabek" DECIMAL(15,2),
    "ongkirLuarJabodetabek" DECIMAL(15,2),
    "hargaTayang" DECIMAL(15,2),
    "marginPerPaket" DECIMAL(15,2),
    "sellingPrice" DECIMAL(15,2) NOT NULL,
    "defaultMargin" DECIMAL(15,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "po_sessions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetQuota" INTEGER NOT NULL,
    "status" "POStatus" NOT NULL DEFAULT 'DRAFT',
    "allowLateOrders" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "po_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "po_session_products" (
    "id" TEXT NOT NULL,
    "poSessionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "actualMargin" DECIMAL(15,2) NOT NULL,
    "actualCostPrice" DECIMAL(15,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "po_session_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "poSessionId" TEXT NOT NULL,
    "mitraId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerAddress" TEXT,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PIUTANG',
    "paymentDate" TIMESTAMP(3),
    "distributionStatus" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "distributionDate" TIMESTAMP(3),
    "isLateOrder" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "poSessionProductId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "costPrice" DECIMAL(15,2) NOT NULL,
    "margin" DECIMAL(15,2) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_ledgers" (
    "id" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "orderId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capital_deposits" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "depositDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capital_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "po_supplier_transactions" (
    "id" TEXT NOT NULL,
    "poSessionId" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purchasePrice" DECIMAL(15,2) NOT NULL,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "transferStatus" "TransferStatus" NOT NULL DEFAULT 'BELUM_TRANSFER',
    "transferDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "po_supplier_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "po_session_products_poSessionId_productId_key" ON "po_session_products"("poSessionId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_mitraId_idx" ON "orders"("mitraId");

-- CreateIndex
CREATE INDEX "orders_poSessionId_idx" ON "orders"("poSessionId");

-- CreateIndex
CREATE INDEX "orders_paymentStatus_idx" ON "orders"("paymentStatus");

-- CreateIndex
CREATE INDEX "financial_ledgers_type_idx" ON "financial_ledgers"("type");

-- CreateIndex
CREATE INDEX "financial_ledgers_createdAt_idx" ON "financial_ledgers"("createdAt");

-- CreateIndex
CREATE INDEX "po_supplier_transactions_poSessionId_idx" ON "po_supplier_transactions"("poSessionId");

-- AddForeignKey
ALTER TABLE "po_session_products" ADD CONSTRAINT "po_session_products_poSessionId_fkey" FOREIGN KEY ("poSessionId") REFERENCES "po_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_session_products" ADD CONSTRAINT "po_session_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_poSessionId_fkey" FOREIGN KEY ("poSessionId") REFERENCES "po_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_mitraId_fkey" FOREIGN KEY ("mitraId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_poSessionProductId_fkey" FOREIGN KEY ("poSessionProductId") REFERENCES "po_session_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledgers" ADD CONSTRAINT "financial_ledgers_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledgers" ADD CONSTRAINT "financial_ledgers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capital_deposits" ADD CONSTRAINT "capital_deposits_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_supplier_transactions" ADD CONSTRAINT "po_supplier_transactions_poSessionId_fkey" FOREIGN KEY ("poSessionId") REFERENCES "po_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
