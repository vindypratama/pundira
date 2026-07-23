import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, Wallet, Users, Package, TrendingUp, AlertCircle } from "lucide-react";

async function getDashboardStats(userId: string, role: string) {
  if (role === "ADMIN") {
    const [
      totalOrders,
      pendingPayments,
      totalMitra,
      totalProducts,
      ledgerSummary,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { paymentStatus: "PIUTANG" } }),
      prisma.user.count({ where: { role: "MITRA", isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.financialLedger.groupBy({
        by: ["type"],
        _sum: { amount: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { mitra: { select: { name: true } }, poSession: { select: { name: true } } },
      }),
    ]);

    const totalPiutang = await prisma.order.aggregate({
      where: { paymentStatus: "PIUTANG" },
      _sum: { totalPrice: true },
    });

    return {
      totalOrders,
      pendingPayments,
      totalMitra,
      totalProducts,
      ledgerSummary,
      recentOrders,
      totalPiutang: totalPiutang._sum.totalPrice || 0,
    };
  } else {
    // Mitra stats
    const [myOrders, myPiutang, activePOs] = await Promise.all([
      prisma.order.count({ where: { mitraId: userId } }),
      prisma.order.count({ where: { mitraId: userId, paymentStatus: "PIUTANG" } }),
      prisma.pOSession.count({ where: { status: "OPEN" } }),
    ]);

    const myRevenue = await prisma.order.aggregate({
      where: { mitraId: userId, paymentStatus: "LUNAS" },
      _sum: { totalPrice: true },
    });

    return {
      myOrders,
      myPiutang,
      activePOs,
      myRevenue: myRevenue._sum.totalPrice || 0,
    };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const stats = await getDashboardStats(session.user.id, session.user.role);

  if (session.user.role === "ADMIN") {
    const adminStats = stats as {
      totalOrders: number;
      pendingPayments: number;
      totalMitra: number;
      totalProducts: number;
      ledgerSummary: { type: string; _sum: { amount: unknown } }[];
      recentOrders: {
        id: string;
        orderNumber: string;
        customerName: string;
        totalPrice: unknown;
        paymentStatus: string;
        createdAt: Date;
        mitra: { name: string };
        poSession: { name: string };
      }[];
      totalPiutang: unknown;
    };

    const summaryCards = [
      { title: "Total Pesanan", value: adminStats.totalOrders, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" },
      { title: "Piutang Pending", value: adminStats.pendingPayments, icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-50" },
      { title: "Total Mitra Aktif", value: adminStats.totalMitra, icon: Users, color: "text-green-600", bg: "bg-green-50" },
      { title: "Produk Aktif", value: adminStats.totalProducts, icon: Package, color: "text-purple-600", bg: "bg-purple-50" },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Selamat datang, {session.user.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <Card key={card.title}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className={`p-3 rounded-lg ${card.bg}`}>
                  <card.icon size={24} className={card.color} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet size={20} />
                Ringkasan Keuangan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Piutang</span>
                  <span className="font-bold text-red-600">{formatCurrency(adminStats.totalPiutang as number)}</span>
                </div>
                {adminStats.ledgerSummary.map((item) => (
                  <div key={item.type} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">{item.type}</span>
                    <span className="font-bold text-gray-900">{formatCurrency((item._sum.amount as number) || 0)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={20} />
                Pesanan Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {adminStats.recentOrders.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Belum ada pesanan</p>
                ) : (
                  adminStats.recentOrders.map((order) => (
                    <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{order.customerName}</p>
                        <p className="text-xs text-gray-500">oleh {order.mitra.name} • {order.poSession.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(order.totalPrice as number)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${order.paymentStatus === "LUNAS" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Mitra Dashboard
  const mitraStats = stats as {
    myOrders: number;
    myPiutang: number;
    activePOs: number;
    myRevenue: unknown;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Mitra</h1>
        <p className="text-gray-500">Selamat datang, {session.user.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <ShoppingCart size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pesanan</p>
              <p className="text-2xl font-bold text-gray-900">{mitraStats.myOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-lg bg-yellow-50">
              <AlertCircle size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Piutang Pending</p>
              <p className="text-2xl font-bold text-gray-900">{mitraStats.myPiutang}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-lg bg-green-50">
              <Package size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">PO Aktif</p>
              <p className="text-2xl font-bold text-gray-900">{mitraStats.activePOs}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-lg bg-purple-50">
              <Wallet size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(mitraStats.myRevenue as number)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
