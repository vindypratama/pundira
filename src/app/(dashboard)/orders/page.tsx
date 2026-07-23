"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Select } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, X, CheckCircle, Truck } from "lucide-react";

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    poSessionId: "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    paymentStatus: "PIUTANG" as "PIUTANG" | "LUNAS",
    notes: "",
    items: [{ productId: "", poSessionProductId: "", quantity: 1, unitPrice: 0, costPrice: 0, margin: 0 }],
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Gagal memuat pesanan");
      return res.json();
    },
  });

  const { data: poSessions } = useQuery({
    queryKey: ["po-sessions-active"],
    queryFn: async () => {
      const res = await fetch("/api/po-sessions");
      if (!res.ok) return [];
      const data = await res.json();
      return data.filter((po: { status: string }) => po.status === "OPEN");
    },
  });

  // Produk yang bisa dipesan = produk dari sesi PO yang dipilih
  const selectedPO = poSessions?.find((po: { id: string }) => po.id === form.poSessionId);
  const availableProducts = selectedPO?.products?.map((psp: {
    id: string;
    productId: string;
    actualMargin: number;
    actualCostPrice?: number;
    product: { id: string; name: string; sellingPrice: number; defaultCostPrice: number; defaultMargin: number; unit: string };
  }) => ({
    poSessionProductId: psp.id,
    productId: psp.productId,
    name: psp.product.name,
    unit: psp.product.unit,
    sellingPrice: Number(psp.product.sellingPrice),
    costPrice: psp.actualCostPrice ? Number(psp.actualCostPrice) : Number(psp.product.defaultCostPrice),
    margin: Number(psp.actualMargin) || Number(psp.product.defaultMargin),
  })) || [];

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal membuat pesanan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setShowForm(false);
      resetForm();
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_payment", paymentStatus: "LUNAS" }),
      });
      if (!res.ok) throw new Error("Gagal update pembayaran");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const updateDistributionMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_distribution", distributionStatus: "DISTRIBUTED" }),
      });
      if (!res.ok) throw new Error("Gagal update distribusi");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const resetForm = () => {
    setForm({
      poSessionId: "",
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      paymentStatus: "PIUTANG",
      notes: "",
      items: [{ productId: "", poSessionProductId: "", quantity: 1, unitPrice: 0, costPrice: 0, margin: 0 }],
    });
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { productId: "", poSessionProductId: "", quantity: 1, unitPrice: 0, costPrice: 0, margin: 0 }] });
  };

  const removeItem = (index: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...form.items];
    (newItems[index] as Record<string, string | number>)[field] = value;

    // Auto-fill price from PO session product
    if (field === "productId" && availableProducts.length > 0) {
      const poProduct = availableProducts.find((p: { productId: string }) => p.productId === value);
      if (poProduct) {
        newItems[index].poSessionProductId = poProduct.poSessionProductId;
        newItems[index].unitPrice = poProduct.sellingPrice;
        newItems[index].costPrice = poProduct.costPrice;
        newItems[index].margin = poProduct.margin;
      }
    }

    // Reset items when PO session changes
    if (field === "poSessionId") {
      setForm({
        ...form,
        poSessionId: value as string,
        items: [{ productId: "", poSessionProductId: "", quantity: 1, unitPrice: 0, costPrice: 0, margin: 0 }],
      });
      return;
    }

    setForm({ ...form, items: newItems });
  };

  const totalHarga = form.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pesanan</h1>
          <p className="text-gray-500">Kelola pesanan pelanggan</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); resetForm(); }}>
          {showForm ? <X size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
          {showForm ? "Tutup" : "Input Pesanan"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Input Pesanan Baru</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Sesi PO"
                  value={form.poSessionId}
                  onChange={(e) => updateItem(0, "poSessionId", e.target.value)}
                  options={[
                    { value: "", label: "-- Pilih Sesi PO --" },
                    ...(poSessions?.map((po: { id: string; name: string }) => ({ value: po.id, label: po.name })) || []),
                  ]}
                />
                <Input label="Nama Pelanggan" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
                <Input label="No. HP Pelanggan" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
                <Select
                  label="Status Pembayaran"
                  value={form.paymentStatus}
                  onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as "PIUTANG" | "LUNAS" })}
                  options={[
                    { value: "PIUTANG", label: "Piutang (Belum Bayar)" },
                    { value: "LUNAS", label: "Lunas (Sudah Bayar)" },
                  ]}
                />
              </div>
              <Input label="Alamat Pengiriman" value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} />
              <Input label="Catatan" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Item Pesanan</p>
                  <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus size={14} className="mr-1" /> Tambah Item</Button>
                </div>
                {form.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 bg-gray-50 rounded-lg">
                    <Select
                      value={item.productId}
                      onChange={(e) => updateItem(index, "productId", e.target.value)}
                      options={[
                        { value: "", label: form.poSessionId ? "-- Pilih Produk --" : "-- Pilih Sesi PO dulu --" },
                        ...availableProducts.map((p: { productId: string; name: string; unit: string }) => ({
                          value: p.productId,
                          label: `${p.name} (${p.unit})`,
                        })),
                      ]}
                    />
                    <Input type="number" placeholder="Qty" value={item.quantity || ""} onChange={(e) => updateItem(index, "quantity", Number(e.target.value))} />
                    <Input type="number" placeholder="Harga" value={item.unitPrice || ""} onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))} />
                    <div className="flex items-center text-sm text-gray-600">
                      Subtotal: {formatCurrency(item.unitPrice * item.quantity)}
                    </div>
                    {form.items.length > 1 && (
                      <Button type="button" size="sm" variant="danger" onClick={() => removeItem(index)}>Hapus</Button>
                    )}
                  </div>
                ))}
                <div className="text-right font-bold text-lg">
                  Total: {formatCurrency(totalHarga)}
                </div>
              </div>

              <Button type="submit" isLoading={createMutation.isPending}>Simpan Pesanan</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-center py-8 text-gray-500">Memuat...</p>
          ) : orders?.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Belum ada pesanan</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Pesanan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelanggan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mitra</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bayar</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distribusi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders?.map((order: {
                    id: string;
                    orderNumber: string;
                    customerName: string;
                    totalPrice: number;
                    paymentStatus: string;
                    distributionStatus: string;
                    createdAt: string;
                    mitra: { name: string };
                    poSession: { name: string };
                  }) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.customerName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.mitra.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.poSession.name}</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatCurrency(order.totalPrice)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={order.paymentStatus === "LUNAS" ? "success" : "warning"}>
                          {order.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={order.distributionStatus === "DISTRIBUTED" ? "success" : "default"}>
                          {order.distributionStatus === "DISTRIBUTED" ? "Terkirim" : "Pending"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {order.paymentStatus === "PIUTANG" && (
                            <Button size="sm" variant="ghost" onClick={() => updatePaymentMutation.mutate(order.id)} title="Tandai Lunas">
                              <CheckCircle size={16} className="text-green-600" />
                            </Button>
                          )}
                          {isAdmin && order.distributionStatus === "PENDING" && (
                            <Button size="sm" variant="ghost" onClick={() => updateDistributionMutation.mutate(order.id)} title="Tandai Terkirim">
                              <Truck size={16} className="text-blue-600" />
                            </Button>
                          )}
                        </div>
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
