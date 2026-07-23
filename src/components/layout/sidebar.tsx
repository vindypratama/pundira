"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  CalendarRange,
  ShoppingCart,
  Wallet,
  Users,
  Truck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const adminNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Produk", icon: Package },
  { href: "/po-sessions", label: "Sesi PO", icon: CalendarRange },
  { href: "/orders", label: "Pesanan", icon: ShoppingCart },
  { href: "/finance", label: "Keuangan", icon: Wallet },
  { href: "/mitra", label: "Mitra", icon: Users },
  { href: "/supplier", label: "Supplier", icon: Truck },
];

const mitraNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/po-sessions", label: "Sesi PO", icon: CalendarRange },
  { href: "/orders", label: "Pesanan Saya", icon: ShoppingCart },
];

interface SidebarProps {
  userRole: string;
  userName: string;
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navItems = userRole === "ADMIN" ? adminNavItems : mitraNavItems;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-5 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-blue-600">Pundira</h1>
            <p className="text-xs text-gray-500 mt-1">Pundi + Mitra</p>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">
              {userRole === "ADMIN" ? "Super Admin" : "Mitra Sales"}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon size={18} className={isActive ? "text-blue-600" : "text-gray-400"} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-gray-100">
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                Keluar
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
