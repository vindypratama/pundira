"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Plus, Edit, X } from "lucide-react";
import type { ProductInput } from "@/lib/validations";

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductInput>({
    name: "",
    description: "",
    defaultCostPrice: 0,
    hppPerPaket: 0,
    ongkirJabodetabek: 0,
    ongkirLuarJabodetabek: 0,
    hargaTayang: 0,
    marginPerPaket: 0,
    sellingPrice: 0,
    defaultMargin: 0,
    unit: "pcs",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Gagal memuat produk");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductInput) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal membuat produk");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowForm(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setForm({ name: "", description: "", defaultCostPrice: 0, hppPerPaket: 0, ongkirJabodetabek: 0, ongkirLuarJabodetabek: 0, hargaTayang: 0, marginPerPaket: 0, sellingPrice: 0, defaultMargin: 0, unit: "pcs" });
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.name) newErrors.name = "Nama wajib diisi";
    if (form.defaultCostPrice <= 0) newErrors.defaultCostPrice = "Harga modal harus > 0";
    if (form.sellingPrice <= 0) newErrors.sellingPrice = "Harga jual harus > 0";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    createMutation.mutate(form);
  };

  const handleAutoMargin = () => {
    setForm({ ...form, defaultMargin: form.sellingPrice - form.defaultCostPrice });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
          <p className="text-gray-500">Kelola katalog produk</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); resetForm(); }}>
          {showForm ? <X size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
          {showForm ? "Tutup" : "Tambah Produk"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah Produk Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nama Produk" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
              <Input label="Satuan" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              <Input label="HPP (Rp)" type="number" value={form.defaultCostPrice || ""} onChange={(e) => setForm({ ...form, defaultCostPrice: Number(e.target.value) })} error={errors.defaultCostPrice} />
              <Input label="HPP per Paket (Rp)" type="number" value={form.hppPerPaket || ""} onChange={(e) => setForm({ ...form, hppPerPaket: Number(e.target.value) })} />
              <Input label="Ongkir Jabodetabek (Rp)" type="number" value={form.ongkirJabodetabek || ""} onChange={(e) => setForm({ ...form, ongkirJabodetabek: Number(e.target.value) })} />
              <Input label="Ongkir Luar Jabodetabek (Rp)" type="number" value={form.ongkirLuarJabodetabek || ""} onChange={(e) => setForm({ ...form, ongkirLuarJabodetabek: Number(e.target.value) })} />
              <Input label="Harga Tayang (Rp)" type="number" value={form.hargaTayang || ""} onChange={(e) => setForm({ ...form, hargaTayang: Number(e.target.value) })} />
              <Input label="Margin per Paket (Rp)" type="number" value={form.marginPerPaket || ""} onChange={(e) => setForm({ ...form, marginPerPaket: Number(e.target.value) })} />
              <Input label="Harga Jual (Rp)" type="number" value={form.sellingPrice || ""} onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })} error={errors.sellingPrice} />
              <div className="flex gap-2 items-end">
                <Input label="Margin Default (Rp)" type="number" value={form.defaultMargin || ""} onChange={(e) => setForm({ ...form, defaultMargin: Number(e.target.value) })} />
                <Button type="button" variant="outline" onClick={handleAutoMargin}>Hitung Otomatis</Button>
              </div>
              <Input label="Deskripsi" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="md:col-span-2">
                <Button type="submit" isLoading={createMutation.isPending}>Simpan Produk</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-center py-8 text-gray-500">Memuat...</p>
          ) : products?.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Belum ada produk</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HPP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HPP/Paket</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ongkir JBD</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ongkir Luar</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga Tayang</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin/Paket</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga Jual</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Satuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products?.map((product: { id: string; name: string; defaultCostPrice: number; hppPerPaket?: number; ongkirJabodetabek?: number; ongkirLuarJabodetabek?: number; hargaTayang?: number; marginPerPaket?: number; sellingPrice: number; defaultMargin: number; unit: string }) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(product.defaultCostPrice)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.hppPerPaket ? formatCurrency(product.hppPerPaket) : "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.ongkirJabodetabek ? formatCurrency(product.ongkirJabodetabek) : "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.ongkirLuarJabodetabek ? formatCurrency(product.ongkirLuarJabodetabek) : "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.hargaTayang ? formatCurrency(product.hargaTayang) : "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.marginPerPaket ? formatCurrency(product.marginPerPaket) : "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(product.sellingPrice)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="success">{formatCurrency(product.defaultMargin)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.unit}</td>
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
