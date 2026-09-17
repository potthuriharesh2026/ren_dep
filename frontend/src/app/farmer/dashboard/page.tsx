"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Badge, getStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Sprout,
  ShoppingBag,
  PackageCheck,
  CreditCard,
  Plus,
  ArrowRight,
  CalendarCheck,
  Building2,
  AlertCircle,
} from "lucide-react";

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.farmer.getDashboard();
        setData(res);
      } catch (err) {
        console.error("Error loading farmer dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const profile = data?.profile;
  const crops = data?.crops || [];
  const seedPurchases = data?.seed_purchases || [];
  const grainSales = data?.grain_sales || [];
  const visits = data?.visits || [];
  const transactions = data?.transactions || [];

  // Calculate balance
  const totalCredits = transactions
    .filter((t: any) => t.direction === "credit")
    .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
  const totalDebits = transactions
    .filter((t: any) => t.direction === "debit")
    .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
  const netEarnings = totalCredits - totalDebits;

  return (
    <DashboardLayout allowedRoles={["farmer"]}>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="executive-banner relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900/60 via-slate-900 to-slate-900 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Farmer Portal • {profile?.address || "Active Farm"}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.name || "Farmer"}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl font-medium">
                Land area: <strong className="text-emerald-400">{profile?.acres_of_land ?? 5.0} Acres</strong> • Plot:{" "}
                <span className="text-slate-200">{profile?.crop_address || "Registered Plot"}</span>
              </p>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/farmer/crops"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Register Crop
              </Link>
              <Link
                href="/farmer/seeds"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                Seed Store
              </Link>
              <Link
                href="/farmer/sales"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all"
              >
                <PackageCheck className="w-4 h-4 text-teal-400" />
                Sell Grain
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Registered Crops"
            value={loading ? "..." : crops.length}
            icon={Sprout}
            color="emerald"
            description={`${crops.filter((c: any) => c.status === "growing").length} actively growing`}
          />
          <StatCard
            title="Seed Orders"
            value={loading ? "..." : seedPurchases.length}
            icon={ShoppingBag}
            color="orange"
            description={`${seedPurchases.reduce((acc: number, p: any) => acc + (p.quantity_kg || 0), 0)} kg total`}
          />
          <StatCard
            title="Grain Sales"
            value={loading ? "..." : grainSales.length}
            icon={PackageCheck}
            color="teal"
            description={`${grainSales.filter((s: any) => s.status === "paid" || s.status === "procured").length} procured`}
          />
          <StatCard
            title="Passbook Net Payout"
            value={loading ? "..." : `₹${Math.max(0, netEarnings).toLocaleString("en-IN")}`}
            icon={CreditCard}
            color="amber"
            description="Verified account balance"
          />
        </div>

        {/* Two-Column Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Crops Widget */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Registered Crops</h3>
                <p className="text-xs text-slate-400">Current season crops and growth stage</p>
              </div>
              <Link
                href="/farmer/crops"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {crops.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No crops registered yet. Click &quot;Register Crop&quot; to begin.
                </div>
              ) : (
                crops.slice(0, 4).map((crop: any) => (
                  <div
                    key={crop.id}
                    className="glass-card p-3.5 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Sprout className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{crop.crop_type}</h4>
                        <p className="text-[11px] text-slate-400">
                          {crop.acres} Acres • Sown: {crop.sowing_date || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div>{getStatusBadge(crop.status || "growing")}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Grain Sales & Warehouse Slots */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Recent Grain Sales & Slots</h3>
                <p className="text-xs text-slate-400">Delivery status and warehouse inspections</p>
              </div>
              <Link
                href="/farmer/sales"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {grainSales.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No grain sale bookings submitted yet.
                </div>
              ) : (
                grainSales.slice(0, 4).map((sale: any) => (
                  <div
                    key={sale.id}
                    className="glass-card p-3.5 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                        <PackageCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          {sale.grain_type} ({sale.quantity_kg} kg)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Warehouse #{sale.warehouse_id} • Amount: ₹{sale.final_amount || sale.total_amount || 0}
                        </p>
                      </div>
                    </div>
                    <div>{getStatusBadge(sale.status)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Farm Visits & Agronomist Advices */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Agronomist Field Visits</h3>
              <p className="text-xs text-slate-400">Field inspections, expert recommendations and soil health notes</p>
            </div>
            <Link
              href="/farmer/visits"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              All visits <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visits.length === 0 ? (
              <div className="col-span-2 text-center py-6 text-xs text-slate-500">
                No agronomist visits scheduled yet. Field inspections are automatically scheduled by warehouse managers.
              </div>
            ) : (
              visits.slice(0, 2).map((v: any) => (
                <div key={v.id} className="glass-card p-4 rounded-2xl border border-slate-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CalendarCheck className="w-4 h-4 text-emerald-400" />
                      Visit on {v.scheduled_date}
                    </span>
                    {getStatusBadge(v.status)}
                  </div>
                  <p className="text-xs text-slate-300 mt-2">
                    <strong>Recommendations:</strong> {v.recommendations || v.notes || "Inspection scheduled"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
