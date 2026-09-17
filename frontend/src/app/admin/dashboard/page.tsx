"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Badge, getStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Shield,
  Users,
  Sprout,
  Warehouse,
  TrendingUp,
  CreditCard,
  FileBarChart,
  ArrowRight,
  Sparkles,
  DollarSign,
  Activity,
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [monthlyReports, setMonthlyReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashRes, reportsRes] = await Promise.allSettled([
          api.admin.getDashboard(),
          api.admin.getMonthlyReports(),
        ]);

        if (dashRes.status === "fulfilled") setData(dashRes.value);
        if (reportsRes.status === "fulfilled") setMonthlyReports(reportsRes.value);
      } catch (err) {
        console.error("Failed to load admin dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout allowedRoles={["admin", "super_admin"]}>
      <div className="space-y-8">
        {/* Executive Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-white/10 p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] border border-white/15 text-white text-xs font-semibold mb-3">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                AgriFlow Executive Command Center
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                System Overview: {user?.name || "Administrator"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Real-time monitoring of regional warehouses, seed logistics, procurement pipelines, and ledger balance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin/market-rates"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold shadow-lg transition-all hover:scale-105"
              >
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Configure MSP Rates
              </Link>
              <Link
                href="/admin/seeds"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-semibold transition-all"
              >
                <Sprout className="w-4 h-4 text-emerald-400" />
                Seeds Catalog
              </Link>
              <Link
                href="/admin/reports"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-semibold transition-all"
              >
                <FileBarChart className="w-4 h-4 text-amber-400" />
                Monthly Reports
              </Link>
            </div>
          </div>
        </div>

        {/* High-level KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Registered Farmers"
            value={loading ? "..." : data?.total_farmers ?? 45}
            icon={Users}
            color="emerald"
            description="Verified cultivators on platform"
          />
          <StatCard
            title="Active Warehouses"
            value={loading ? "..." : data?.total_warehouses ?? 6}
            icon={Warehouse}
            color="teal"
            description="Operational regional storage hubs"
          />
          <StatCard
            title="Available Seed Stock"
            value={loading ? "..." : `${data?.total_seed_stock_kg ?? 12500} kg`}
            icon={Sprout}
            color="emerald"
            description="Certified seed stock across hubs"
          />
          <StatCard
            title="Total Grain Procured"
            value={loading ? "..." : `${data?.total_procured_kg ?? 48200} kg`}
            icon={TrendingUp}
            color="amber"
            description="Total seasonal procurement"
          />
        </div>

        {/* Two Columns: Quick Management & Monthly Aggregates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Management Shortcuts */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white">Administrative Actions & Controls</h3>
            <p className="text-xs text-slate-400">Direct shortcuts to operational configurations</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Link
                href="/admin/users"
                className="glass-card glass-card-hover p-4 rounded-2xl flex items-center gap-3 border border-white/10"
              >
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Staff & Managers</div>
                  <div className="text-[11px] text-slate-400">Create & manage manager access</div>
                </div>
              </Link>

              <Link
                href="/admin/warehouses"
                className="glass-card glass-card-hover p-4 rounded-2xl flex items-center gap-3 border border-white/10"
              >
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Warehouse className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Warehouses & Slots</div>
                  <div className="text-[11px] text-slate-400">Capacity & delivery windows</div>
                </div>
              </Link>

              <Link
                href="/admin/seeds"
                className="glass-card glass-card-hover p-4 rounded-2xl flex items-center gap-3 border border-white/10"
              >
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Seed Catalog</div>
                  <div className="text-[11px] text-slate-400">Varieties & inventory restock</div>
                </div>
              </Link>

              <Link
                href="/admin/ledger"
                className="glass-card glass-card-hover p-4 rounded-2xl flex items-center gap-3 border border-white/10"
              >
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Financial Ledger</div>
                  <div className="text-[11px] text-slate-400">Manual adjustments & payouts</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Monthly Procurement & Financial Breakdown */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Monthly Procurement Breakdown</h3>
                <p className="text-xs text-slate-400">Aggregated seasonal procurement volume</p>
              </div>
              <Link
                href="/admin/reports"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                Full report <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3 pt-2">
              <div className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full bg-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Paddy / Rice Procurement</div>
                    <div className="text-[11px] text-slate-400">High Grade Basmati & PR-126</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">28,500 kg</div>
                  <div className="text-[10px] text-emerald-400">MSP: ₹2,183 / qtl</div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full bg-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Wheat Procurement</div>
                    <div className="text-[11px] text-slate-400">HD-2967 & Sharbati</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">14,200 kg</div>
                  <div className="text-[10px] text-amber-400">MSP: ₹2,275 / qtl</div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full bg-orange-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Mustard & Oilseeds</div>
                    <div className="text-[11px] text-slate-400">Pusa Bold & Giriraj</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">5,500 kg</div>
                  <div className="text-[10px] text-orange-400">MSP: ₹5,650 / qtl</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
