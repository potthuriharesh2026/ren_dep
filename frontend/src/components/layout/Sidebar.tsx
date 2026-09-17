"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Sprout,
  PackageCheck,
  Warehouse,
  TrendingUp,
  CreditCard,
  FileBarChart,
  CalendarCheck,
  Building2,
  CalendarClock,
  ClipboardList,
  Store,
  UserCheck,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const role = user?.role || "farmer";

  // Navigation Links Definition by Role
  const adminLinks = [
    { name: "Executive Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Farmer Management", href: "/admin/users", icon: Users },
    { name: "Seed Varieties Catalog", href: "/admin/seeds", icon: Sprout },
    { name: "Warehouses & Slots", href: "/admin/warehouses", icon: Warehouse },
    { name: "Market MSP Rates", href: "/admin/market-rates", icon: TrendingUp },
    { name: "Financial Ledger", href: "/admin/ledger", icon: CreditCard },
    { name: "Reports & Audits", href: "/admin/reports", icon: FileBarChart },
  ];

  const managerLinks = [
    { name: "Operations Hub", href: "/manager/dashboard", icon: LayoutDashboard },
    { name: "Farmer Approvals", href: "/manager/farmers", icon: UserCheck },
    { name: "Slots & Inspection", href: "/manager/procurement", icon: PackageCheck },
    { name: "Procurement & Payouts", href: "/manager/sales", icon: CreditCard },
    { name: "Field Visits Scheduler", href: "/manager/visits", icon: CalendarClock },
  ];

  const farmerLinks = [
    { name: "Farm Dashboard", href: "/farmer/dashboard", icon: LayoutDashboard },
    { name: "Crop Registry", href: "/farmer/crops", icon: Sprout },
    { name: "Seed Store", href: "/farmer/seeds", icon: Store },
    { name: "Grain Sales & Slots", href: "/farmer/sales", icon: PackageCheck },
    { name: "Agronomist Visits", href: "/farmer/visits", icon: CalendarCheck },
    { name: "Passbook & Ledger", href: "/farmer/ledger", icon: CreditCard },
    { name: "Farm & Bank Profile", href: "/farmer/profile", icon: Building2 },
  ];

  const links =
    role === "admin" || role === "super_admin"
      ? adminLinks
      : role === "manager"
      ? managerLinks
      : farmerLinks;

  const roleTitle =
    role === "admin" || role === "super_admin"
      ? "Admin Control"
      : role === "manager"
      ? "Manager Portal"
      : "Farmer Portal";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 flex-col border-r border-white/[0.08] bg-[#0c120e] px-4 py-6 transition-transform duration-300 ease-in-out lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:overflow-y-auto flex shrink-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header in Sidebar */}
        <div className="flex items-center justify-between px-2 mb-8">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              {roleTitle}
            </span>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              Agri<span className="text-emerald-400">Flow</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 lg:hidden"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/admin/dashboard" && link.href !== "/manager/dashboard" && link.href !== "/farmer/dashboard" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => onClose()}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500/25 to-teal-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold"
                    : "text-slate-300 hover:bg-emerald-950/40 hover:text-white"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? "text-emerald-300" : "text-slate-400 group-hover:text-white"
                  }`}
                />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Fast Switch Pill */}
        <div className="mt-auto pt-4 border-t border-slate-900">
          <div className="glass-card p-3 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-semibold text-emerald-400">Connected System</span>
            </div>
            <p className="text-[11px] text-slate-400">FastAPI backend active on port 8000</p>
          </div>
        </div>
      </aside>
    </>
  );
}
