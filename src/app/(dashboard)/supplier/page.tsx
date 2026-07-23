"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Select } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, X, CheckCircle } from "lucide-react";

export default function SupplierPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    poSessionId: "",
    supplier: "",
    productName: "",
    quantity: 0,
    purchasePrice: 0,
    notes: "",
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["supplier-transactions"],
    queryFn: async () => {
      const res = await fetch("/api/supplier");
      if (!res.ok) throw new Error("Gagal memuat data");
      return res.json();
    },
  });

  const { data: poSessions } = useQuery({
    queryKey: ["po-sessions-all"],
    queryFn: async () => {
      const res = await fetch("/api/po-sessions");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-transactions"] });
      setShowForm(false);
      setForm({ poSessionId: "", supplier: "", productName: "", quantity: 0, purchasePrice: 0, notes: "" });
    },
  });

  const updateTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/supplier", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, transferStatus: "SUDAH_TRANSFER" }),
      });
      if (!res.ok) throw new Error("Gagal update");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["supplier-transactions"] }),
  });

  // Hitung total per sesi PO
  const totalByPO = transactions?.reduce(
    (acc: Record<string, { name: string; total: number }>, t: { poSessionId: string; poSession: { name: string }; totalPrice: number }) => {
      if (!acc[t.poSessionId]) {
        acc[t.poSessionId] = { name: t.poSession.name, total: 0 };
      }
      acc[t.poSessionId].total += Number(t.totalPrice);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaksi Supplier</h1>
          <p className="text-gray-500">Catat PO aktual ke supplier</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setForm({ poSessionId: "", supplier: "", productName: "", quantity: 0, purchasePrice: 0, notes: "" }); }}>
          {showForm ? <X size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
          {showForm ? "Tutup" : "Tambah Transaksi"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Catat Transaksi Supplier</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Sesi PO"
                value={form.poSessionId}
                onChange={(e) => setForm({ ...form, poSessionId: e.target.value })}
                options={[
                  { value: "", label: "-- Pilih Sesi PO --" },
                  ...(poSessions?.map((po: { id: string; name: string }) => ({ value: po.id, label: po.name })) || []),
                ]}
              />
              <Input label="Nama Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="PT Supplier Jaya" />
              <Input label="Nama Produk" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
              <Input label="Jumlah (Qty)" type="number" value={form.quantity || ""} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
              <Input label="Harga Beli per Unit (Rp)" type="number" value={form.purchasePrice || ""} onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })} />
              <Input label="Catatan" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <div className="md:col-span-2 flex items-center gap-4">
                <Button type="submit" isLoading={createMutation.isPending}>Simpan</Button>
                {form.quantity > 0 && form.purchasePrice > 0 && (
                  <span className="text-sm text-gray-600">
                    Total: <strong>{formatCurrency(form.quantity * form.purchasePrice)}</strong>
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Summary per PO */}
      {totalByPO && Object.keys(totalByPO).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(totalByPO).map(([poId, data]) => (
            <Card key={poId}>
              <CardContent className="py-4">
                <p className="text-sm text-gray-500">{(data as { name: string }).name}</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency((data as { total: number }).total)}</p>
                <p className="text-xs text-gray-400">Total pengeluaran ke supplier</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-center py-8 text-gray-500">Memuat...</p>
          ) : transactions?.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Belum ada transaksi supplier</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga/unit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transfer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions?.map((tx: {
                    id: string;
                    createdAt: string;
                    poSession: { name: string };
                    supplier: string;
                    productName: string;
                    quantity: number;
                    purchasePrice: number;
                    totalPrice: number;
                    transferStatus: string;
                  }) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(tx.createdAt)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{tx.poSession.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{tx.supplier}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{tx.productName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{tx.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(tx.purchasePrice)}</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatCurrency(tx.totalPrice)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={tx.transferStatus === "SUDAH_TRANSFER" ? "success" : "warning"}>
                          {tx.transferStatus === "SUDAH_TRANSFER" ? "Sudah" : "Belum"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {tx.transferStatus === "BELUM_TRANSFER" && (
                          <Button size="sm" variant="ghost" onClick={() => updateTransferMutation.mutate(tx.id)} title="Tandai Sudah Transfer">
                            <CheckCircle size={16} className="text-green-600" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
