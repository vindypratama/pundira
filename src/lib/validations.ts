import { z } from "zod";

// ============================================================
// Auth Schemas
// ============================================================

export const loginSchema = z.object({
  phone: z.string().min(10, "Nomor HP minimal 10 digit"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const registerMitraSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  phone: z.string().min(10, "Nomor HP minimal 10 digit"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankHolder: z.string().optional(),
});

// ============================================================
// Product Schemas
// ============================================================

export const productSchema = z.object({
  name: z.string().min(2, "Nama produk minimal 2 karakter"),
  description: z.string().optional(),
  defaultCostPrice: z.coerce.number().min(0, "Harga modal harus positif"),
  hppPerPaket: z.coerce.number().min(0).optional(),
  ongkirJabodetabek: z.coerce.number().min(0).optional(),
  ongkirLuarJabodetabek: z.coerce.number().min(0).optional(),
  hargaTayang: z.coerce.number().min(0).optional(),
  marginPerPaket: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().min(0, "Harga jual harus positif"),
  defaultMargin: z.coerce.number().min(0),
  unit: z.string().default("pcs"),
});

// ============================================================
// PO Session Schemas
// ============================================================

export const poSessionSchema = z.object({
  name: z.string().min(2, "Nama PO minimal 2 karakter"),
  description: z.string().optional(),
  targetQuota: z.coerce.number().min(1, "Target kuota minimal 1"),
  allowLateOrders: z.boolean().default(false),
  startDate: z.string(),
  endDate: z.string().optional(),
  productIds: z.array(z.string()).min(1, "Pilih minimal 1 produk"),
  margins: z.record(z.string(), z.coerce.number()), // productId -> margin
});

// ============================================================
// Order Schemas
// ============================================================

export const orderItemSchema = z.object({
  productId: z.string().min(1, "Pilih produk"),
  poSessionProductId: z.string().optional(),
  quantity: z.coerce.number().min(1, "Qty minimal 1"),
  unitPrice: z.coerce.number().min(0),
  costPrice: z.coerce.number().min(0),
  margin: z.coerce.number().min(0),
});

export const orderSchema = z.object({
  poSessionId: z.string().min(1, "Pilih sesi PO"),
  customerName: z.string().min(2, "Nama pelanggan minimal 2 karakter"),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  paymentStatus: z.enum(["PIUTANG", "LUNAS"]),
  isLateOrder: z.boolean().default(false),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "Minimal 1 item pesanan"),
});

// ============================================================
// Finance Schemas
// ============================================================

export const capitalDepositSchema = z.object({
  amount: z.coerce.number().min(1, "Nominal harus lebih dari 0"),
  description: z.string().min(2, "Keterangan wajib diisi"),
});

export const expenseSchema = z.object({
  amount: z.coerce.number().min(1, "Nominal harus lebih dari 0"),
  description: z.string().min(2, "Keterangan wajib diisi"),
});

export const marginWithdrawalSchema = z.object({
  amount: z.coerce.number().min(1, "Nominal harus lebih dari 0"),
  description: z.string().min(2, "Keterangan wajib diisi"),
});

// ============================================================
// Supplier Schemas
// ============================================================

export const supplierTransactionSchema = z.object({
  supplier: z.string().min(2, "Nama supplier wajib diisi"),
  productName: z.string().min(2, "Nama produk wajib diisi"),
  quantity: z.coerce.number().min(1, "Qty minimal 1"),
  purchasePrice: z.coerce.number().min(0, "Harga beli harus positif"),
  notes: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterMitraInput = z.infer<typeof registerMitraSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type POSessionInput = z.infer<typeof poSessionSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CapitalDepositInput = z.infer<typeof capitalDepositSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type MarginWithdrawalInput = z.infer<typeof marginWithdrawalSchema>;
export type SupplierTransactionInput = z.infer<typeof supplierTransactionSchema>;
