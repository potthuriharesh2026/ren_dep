"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Badge, getStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Warehouse,
  Users,
  PackageCheck,
  CalendarCheck,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
} from "lucide-react";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bankRequests, setBankRequests] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashData, bookingsData, bankData, visitsData] = await Promise.allSettled([
          api.manager.getDashboard(),
          api.manager.getBookings(),
          api.manager.getBankRequests(),
          api.manager.getVisits(),
        ]);

        if (dashData.status === "fulfilled") setStats(dashData.value);
        if (bookingsData.status === "fulfilled") setBookings(bookingsData.value || []);
        if (bankData.status === "fulfilled") setBankRequests(bankData.value || []);
        if (visitsData.status === "fulfilled") setVisits(visitsData.value || []);
      } catch (err) {
        console.error("Failed to load manager dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pendingBookings = bookings.filter((b) => b.status === "pending" || b.status === "confirmed");
  const pendingBankRequests = bankRequests.filter((b) => b.status === "pending");
  const scheduledVisits = visits.filter((v) => v.status === "scheduled");

  return (
    <DashboardLayout allowedRoles={["manager", "admin", "super_admin"]}>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="executive-banner relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Warehouse & Operations Hub
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Manager Operations: {user?.name || "Manager"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl font-medium">
                Real-time quality inspection, moisture deduction, warehouse inventory, and farmer approvals
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/manager/procurement"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all"
              >
                <Scale className="w-4 h-4" />
                Inspect Delivery Slot
              </Link>
              <Link
                href="/manager/farmers"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all"
              >
                <Users className="w-4 h-4 text-amber-400" />
                Farmer Approvals ({pendingBankRequests.length})
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Pending Slot Inspections"
            value={loading ? "..." : pendingBookings.length}
            icon={PackageCheck}
            color="orange"
            description="Waiting for quality check & scale weighing"
          />
          <StatCard
            title="Bank Requests in Queue"
            value={loading ? "..." : pendingBankRequests.length}
            icon={AlertTriangle}
            color="amber"
            description="Farmer bank details review"
          />
          <StatCard
            title="Scheduled Field Visits"
            value={loading ? "..." : scheduledVisits.length}
            icon={CalendarCheck}
            color="emerald"
            description="Agronomist field inspections"
          />
          <StatCard
            title="Total Registered Farmers"
            value={loading ? "..." : stats?.total_farmers ?? 45}
            icon={Users}
            color="teal"
            description="Active regional cultivators"
          />
        </div>

        {/* Operational Tasks Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Delivery Bookings to Inspect */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Pending Warehouse Inspections</h3>
                <p className="text-xs text-slate-400">Farmers arriving with grain harvest</p>
              </div>
              <Link
                href="/manager/procurement"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                Inspect all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {pendingBookings.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No delivery slots pending inspection today.
                </div>
              ) : (
                pendingBookings.slice(0, 4).map((b) => (
                  <div
                    key={b.id}
                    className="glass-card p-4 rounded-2xl flex items-center justify-between border border-slate-800"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          #{b.id} • {b.grain_type}
                        </span>
                        {getStatusBadge(b.status)}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Est: <strong className="text-white">{b.quantity_kg} kg</strong> • Date: {b.booking_date}
                      </p>
                    </div>

                    <Link
                      href={`/manager/procurement?inspect=${b.id}`}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
                    >
                      Inspect Now
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Bank Change Reviews */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Bank Change Approvals</h3>
                <p className="text-xs text-slate-400">Review updated farmer bank & UPI accounts</p>
              </div>
              <Link
                href="/manager/farmers"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                Review queue <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {bankRequests.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No bank change requests in review.
                </div>
              ) : (
                bankRequests.slice(0, 4).map((req) => (
                  <div
                    key={req.id}
                    className="glass-card p-4 rounded-2xl flex items-center justify-between border border-slate-800"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">
                        Farmer #{req.farmer_id} • {req.bank_name}
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                        A/C: {req.account_number} • IFSC: {req.ifsc_code}
                      </p>
                    </div>
                    <div>{getStatusBadge(req.status)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
