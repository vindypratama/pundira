"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, ProgressBar } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { Plus, X, Play, Square, XCircle } from "lucide-react";

export default function POSessionsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    targetQuota: 0,
    allowLateOrders: false,
    startDate: "",
    endDate: "",
    productIds: [] as string[],
    margins: {} as Record<string, number>,
  });

  const { data: poSessions, isLoading } = useQuery({
    queryKey: ["po-sessions"],
    queryFn: async () => {
      const res = await fetch("/api/po-sessions");
      if (!res.ok) throw new Error("Gagal memuat sesi PO");
      return res.json();
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Gagal memuat produk");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/po-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal membuat sesi PO");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["po-sessions"] });
      setShowForm(false);
      resetForm();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/po-sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Gagal update status");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["po-sessions"] }),
  });

  const resetForm = () => {
    setForm({ name: "", description: "", targetQuota: 0, allowLateOrders: false, startDate: "", endDate: "", productIds: [], margins: {} });
  };

  const toggleProduct = (productId: string) => {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter((id) => id !== productId)
        : [...prev.productIds, productId],
    }));
  };

  const statusColors: Record<string, "default" | "info" | "success" | "warning" | "danger"> = {
    DRAFT: "default",
    OPEN: "info",
    CLOSED: "success",
    CANCELLED: "danger",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sesi Pre-Order</h1>
          <p className="text-gray-500">Kelola sesi PO dan kuota</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); resetForm(); }}>
          {showForm ? <X size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
          {showForm ? "Tutup" : "Buka PO Baru"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Buka Sesi PO Baru</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nama PO" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="PO Juli 2026" />
                <Input label="Target Kuota" type="number" value={form.targetQuota || ""} onChange={(e) => setForm({ ...form, targetQuota: Number(e.target.value) })} />
                <Input label="Tanggal Mulai" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                <Input label="Tanggal Selesai (Opsional)" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <Input label="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.allowLateOrders} onChange={(e) => setForm({ ...form, allowLateOrders: e.target.checked })} className="rounded" />
                <span className="text-sm">Izinkan pesanan setelah PO ditutup</span>
              </label>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Pilih Produk:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {products?.map((product: { id: string; name: string; defaultMargin: number }) => (
                    <label key={product.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${form.productIds.includes(product.id) ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                      <input type="checkbox" checked={form.productIds.includes(product.id)} onChange={() => toggleProduct(product.id)} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{product.name}</p>
                        {form.productIds.includes(product.id) && (
                          <Input label="Margin per pcs" type="number" value={form.margins[product.id] || product.defaultMargin} onChange={(e) => setForm({ ...form, margins: { ...form.margins, [product.id]: Number(e.target.value) } })} className="mt-1" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" isLoading={createMutation.isPending}>Buka Sesi PO</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-center py-8 text-gray-500">Memuat...</p>
      ) : poSessions?.length === 0 ? (
        <Card><CardContent><p className="text-center py-8 text-gray-500">Belum ada sesi PO</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {poSessions?.map((po: {
            id: string;
            name: string;
            status: string;
            targetQuota: number;
            startDate: string;
            endDate?: string;
            allowLateOrders: boolean;
            products: { product: { name: string } }[];
            _count: { orders: number };
          }) => (
            <Card key={po.id} variant="bordered">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{po.name}</CardTitle>
                  <Badge variant={statusColors[po.status] || "default"}>{po.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <ProgressBar value={po._count.orders} max={po.targetQuota} />
                  <div className="text-xs text-gray-500">
                    <p>Mulai: {formatDate(po.startDate)}</p>
                    {po.endDate && <p>Selesai: {formatDate(po.endDate)}</p>}
                    <p>Produk: {po.products.map((p) => p.product.name).join(", ")}</p>
                    {po.allowLateOrders && <p className="text-blue-600">✓ Late orders diizinkan</p>}
                  </div>
                  <div className="flex gap-2">
                    {po.status === "DRAFT" && (
                      <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: po.id, status: "OPEN" })}>
                        <Play size={14} className="mr-1" /> Buka
                      </Button>
                    )}
                    {po.status === "OPEN" && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => updateStatusMutation.mutate({ id: po.id, status: "CLOSED" })}>
                          <Square size={14} className="mr-1" /> Tutup
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => updateStatusMutation.mutate({ id: po.id, status: "CANCELLED" })}>
                          <XCircle size={14} className="mr-1" /> Batal
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
