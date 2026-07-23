"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

export default function FinancePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "ledger" | "deposits">("overview");
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [depositForm, setDepositForm] = useState({ amount: 0, description: "" });
  const [expenseForm, setExpenseForm] = useState({ amount: 0, description: "" });
  const [withdrawForm, setWithdrawForm] = useState({ amount: 0, description: "" });

  const { data: summary } = useQuery({
    queryKey: ["finance-summary"],
    queryFn: async () => {
      const res = await fetch("/api/finance?type=summary");
      if (!res.ok) throw new Error("Gagal memuat ringkasan");
      return res.json();
    },
  });

  const { data: ledgers } = useQuery({
    queryKey: ["finance-ledger"],
    queryFn: async () => {
      const res = await fetch("/api/finance?type=ledger");
      if (!res.ok) throw new Error("Gagal memuat jurnal");
      return res.json();
    },
    enabled: activeTab === "ledger",
  });

  const { data: deposits } = useQuery({
    queryKey: ["finance-deposits"],
    queryFn: async () => {
      const res = await fetch("/api/finance?type=deposits");
      if (!res.ok) throw new Error("Gagal memuat setoran");
      return res.json();
    },
    enabled: activeTab === "deposits",
  });

  const financeMutation = useMutation({
    mutationFn: async ({ action, amount, description }: { action: string; amount: number; description: string }) => {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, amount, description }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["finance-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["finance-deposits"] });
      setShowDepositForm(false);
      setShowExpenseForm(false);
      setShowWithdrawForm(false);
      setDepositForm({ amount: 0, description: "" });
      setExpenseForm({ amount: 0, description: "" });
      setWithdrawForm({ amount: 0, description: "" });
    },
  });

  const ledgerTypeLabels: Record<string, string> = {
    MODAL: "Modal",
    OPERASIONAL: "Kas Operasional",
    MARGIN: "Margin Keuntungan",
    PENARIKAN: "Penarikan Margin",
    PENGELUARAN: "Pengeluaran",
    SETORAN_MODAL: "Setoran Modal",
  };

  const ledgerTypeColors: Record<string, "info" | "success" | "warning" | "danger" | "default"> = {
    MODAL: "info",
    OPERASIONAL: "warning",
    MARGIN: "success",
    PENARIKAN: "danger",
    PENGELUARAN: "danger",
    SETORAN_MODAL: "info",
  };

  // Hitung saldo per kategori
  const getSaldo = (type: string) => {
    const item = summary?.ledgerSummary?.find((s: { type: string; _sum: { amount: number } }) => s.type === type);
    return item?._sum?.amount || 0;
  };

  const totalModal = Number(getSaldo("MODAL")) + Number(getSaldo("SETORAN_MODAL"));
  const totalOperasional = Number(getSaldo("OPERASIONAL")) - Number(getSaldo("PENGELUARAN"));
  const totalMargin = Number(getSaldo("MARGIN")) - Number(getSaldo("PENARIKAN"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Keuangan</h1>
        <p className="text-gray-500">Kelola arus kas dan piutang</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["overview", "ledger", "deposits"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {tab === "overview" ? "Ringkasan" : tab === "ledger" ? "Jurnal" : "Setoran Modal"}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="p-3 rounded-lg bg-blue-50"><PiggyBank size={24} className="text-blue-600" /></div>
                <div>
                  <p className="text-sm text-gray-500">Total Modal</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(totalModal)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="p-3 rounded-lg bg-yellow-50"><Wallet size={24} className="text-yellow-600" /></div>
                <div>
                  <p className="text-sm text-gray-500">Kas Operasional</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(totalOperasional)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="p-3 rounded-lg bg-green-50"><TrendingUp size={24} className="text-green-600" /></div>
                <div>
                  <p className="text-sm text-gray-500">Margin Keuntungan</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(totalMargin)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="p-3 rounded-lg bg-purple-50"><ArrowDownCircle size={24} className="text-purple-600" /></div>
                <div>
                  <p className="text-sm text-gray-500">Total Setoran Modal</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(summary?.totalDeposits || 0)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ArrowDownCircle size={18} /> Setoran Modal</CardTitle></CardHeader>
              <CardContent>
                {showDepositForm ? (
                  <form onSubmit={(e) => { e.preventDefault(); financeMutation.mutate({ action: "deposit", ...depositForm }); }} className="space-y-3">
                    <Input label="Nominal (Rp)" type="number" value={depositForm.amount || ""} onChange={(e) => setDepositForm({ ...depositForm, amount: Number(e.target.value) })} />
                    <Input label="Keterangan" value={depositForm.description} onChange={(e) => setDepositForm({ ...depositForm, description: e.target.value })} />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" isLoading={financeMutation.isPending}>Simpan</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setShowDepositForm(false)}>Batal</Button>
                    </div>
                  </form>
                ) : (
                  <Button onClick={() => setShowDepositForm(true)} variant="outline" className="w-full">+ Tambah Setoran</Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingDown size={18} /> Pengeluaran</CardTitle></CardHeader>
              <CardContent>
                {showExpenseForm ? (
                  <form onSubmit={(e) => { e.preventDefault(); financeMutation.mutate({ action: "expense", ...expenseForm }); }} className="space-y-3">
                    <Input label="Nominal (Rp)" type="number" value={expenseForm.amount || ""} onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })} />
                    <Input label="Keterangan" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" isLoading={financeMutation.isPending}>Simpan</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setShowExpenseForm(false)}>Batal</Button>
                    </div>
                  </form>
                ) : (
                  <Button onClick={() => setShowExpenseForm(true)} variant="outline" className="w-full">+ Tambah Pengeluaran</Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ArrowUpCircle size={18} /> Tarik Margin</CardTitle></CardHeader>
              <CardContent>
                {showWithdrawForm ? (
                  <form onSubmit={(e) => { e.preventDefault(); financeMutation.mutate({ action: "withdraw", ...withdrawForm }); }} className="space-y-3">
                    <Input label="Nominal (Rp)" type="number" value={withdrawForm.amount || ""} onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: Number(e.target.value) })} />
                    <Input label="Keterangan" value={withdrawForm.description} onChange={(e) => setWithdrawForm({ ...withdrawForm, description: e.target.value })} />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" isLoading={financeMutation.isPending}>Simpan</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setShowWithdrawForm(false)}>Batal</Button>
                    </div>
                  </form>
                ) : (
                  <Button onClick={() => setShowWithdrawForm(true)} variant="outline" className="w-full">+ Tarik Margin</Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "ledger" && (
        <Card>
          <CardHeader><CardTitle>Jurnal Keuangan</CardTitle></CardHeader>
          <CardContent className="p-0">
            {!ledgers ? (
              <p className="text-center py-8 text-gray-500">Memuat...</p>
            ) : ledgers.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Belum ada transaksi</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ledgers.map((ledger: { id: string; createdAt: string; type: string; description: string; amount: number }) => (
                      <tr key={ledger.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(ledger.createdAt)}</td>
                        <td className="px-4 py-3"><Badge variant={ledgerTypeColors[ledger.type]}>{ledgerTypeLabels[ledger.type]}</Badge></td>
                        <td className="px-4 py-3 text-sm text-gray-600">{ledger.description}</td>
                        <td className="px-4 py-3 text-sm font-medium">{formatCurrency(ledger.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "deposits" && (
        <Card>
          <CardHeader><CardTitle>Riwayat Setoran Modal</CardTitle></CardHeader>
          <CardContent className="p-0">
            {!deposits ? (
              <p className="text-center py-8 text-gray-500">Memuat...</p>
            ) : deposits.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Belum ada setoran</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nominal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dicatat Oleh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deposits.map((dep: { id: string; depositDate: string; amount: number; description: string; recordedBy: { name: string } }) => (
                      <tr key={dep.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(dep.depositDate)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600">{formatCurrency(dep.amount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{dep.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{dep.recordedBy.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
