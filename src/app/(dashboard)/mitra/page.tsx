"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { Plus, X, UserCheck, UserX } from "lucide-react";

export default function MitraPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    bankName: "",
    bankAccount: "",
    bankHolder: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: mitras, isLoading } = useQuery({
    queryKey: ["mitras"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Gagal memuat data mitra");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mendaftarkan mitra");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mitras"] });
      setShowForm(false);
      resetForm();
    },
    onError: (error: Error) => {
      setErrors({ phone: error.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      if (!res.ok) throw new Error("Gagal update status");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mitras"] }),
  });

  const resetForm = () => {
    setForm({ name: "", phone: "", password: "", bankName: "", bankAccount: "", bankHolder: "" });
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.name) newErrors.name = "Nama wajib diisi";
    if (!form.phone || form.phone.length < 10) newErrors.phone = "No. HP minimal 10 digit";
    if (!form.password || form.password.length < 6) newErrors.password = "Password minimal 6 karakter";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mitra / Sales</h1>
          <p className="text-gray-500">Kelola jaringan mitra penjualan</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); resetForm(); }}>
          {showForm ? <X size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
          {showForm ? "Tutup" : "Daftarkan Mitra"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Daftarkan Mitra Baru</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nama Lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
              <Input label="No. HP (untuk login)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} placeholder="08xxxxxxxxxx" />
              <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
              <Input label="Nama Bank" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="BCA, BRI, Mandiri, dll" />
              <Input label="No. Rekening" value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} />
              <Input label="Atas Nama Rekening" value={form.bankHolder} onChange={(e) => setForm({ ...form, bankHolder: e.target.value })} />
              <div className="md:col-span-2">
                <Button type="submit" isLoading={createMutation.isPending}>Daftarkan Mitra</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-center py-8 text-gray-500">Memuat...</p>
          ) : mitras?.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Belum ada mitra terdaftar</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. HP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pesanan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Terdaftar</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mitras?.map((mitra: {
                    id: string;
                    name: string;
                    phone: string;
                    bankName?: string;
                    bankAccount?: string;
                    bankHolder?: string;
                    isActive: boolean;
                    createdAt: string;
                    _count: { orders: number };
                  }) => (
                    <tr key={mitra.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{mitra.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{mitra.phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {mitra.bankName ? `${mitra.bankName} - ${mitra.bankAccount}` : "-"}
                        {mitra.bankHolder && <p className="text-xs text-gray-400">a.n. {mitra.bankHolder}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{mitra._count.orders}</td>
                      <td className="px-4 py-3">
                        <Badge variant={mitra.isActive ? "success" : "danger"}>
                          {mitra.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(mitra.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleActiveMutation.mutate({ id: mitra.id, isActive: !mitra.isActive })}
                          title={mitra.isActive ? "Nonaktifkan" : "Aktifkan"}
                        >
                          {mitra.isActive ? <UserX size={16} className="text-red-600" /> : <UserCheck size={16} className="text-green-600" />}
                        </Button>
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
