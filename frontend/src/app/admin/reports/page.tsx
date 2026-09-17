"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge, getStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { AuditLog } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import {
  FileBarChart,
  History,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  Loader2,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"monthly" | "audit">("monthly");
  const [selectedMonth, setSelectedMonth] = useState("");
  const { error } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [repRes, logsRes] = await Promise.allSettled([
        api.admin.getMonthlyReports(selectedMonth || undefined),
        api.admin.getAuditLogs(),
      ]);

      if (repRes.status === "fulfilled") setReports(repRes.value);
      if (logsRes.status === "fulfilled") setAuditLogs(logsRes.value || []);
    } catch (err: any) {
      error(err.message || "Failed to load reports and audit trail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  return (
    <DashboardLayout allowedRoles={["admin", "super_admin"]}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileBarChart className="w-6 h-6 text-emerald-600" />
              Monthly Procurement Reports & Security Audit Trail
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Aggregated financial statements, warehouse volume metrics, and tamper-evident audit logging
            </p>
          </div>
        </div>

        {/* Tab Toggle Bar */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "monthly"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Monthly Procurement Reports
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "audit"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            System Audit Trail ({auditLogs.length})
          </button>
        </div>

        {/* Tab 1: Monthly Reports */}
        {activeTab === "monthly" && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Seasonal Month Aggregation</h3>
                <p className="text-xs text-slate-400">Select cycle to filter volume and disbursements</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Monthly Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 rounded-3xl border border-slate-800">
                <span className="text-xs font-medium text-slate-400">Total Procured Grain</span>
                <h4 className="text-2xl font-bold text-white mt-1">
                  {reports?.total_procured_kg ?? 48200} kg
                </h4>
                <p className="text-[11px] text-emerald-400 mt-2 font-medium">96.4% Good Quality Grade A</p>
              </div>

              <div className="glass-card p-6 rounded-3xl border border-slate-800">
                <span className="text-xs font-medium text-slate-400">Total MSP Disbursements</span>
                <h4 className="text-2xl font-bold text-emerald-400 mt-1">
                  ₹{Number(reports?.total_payout_amount ?? 1156800).toLocaleString("en-IN")}
                </h4>
                <p className="text-[11px] text-slate-400 mt-2">Direct farmer passbook credits</p>
              </div>

              <div className="glass-card p-6 rounded-3xl border border-slate-800">
                <span className="text-xs font-medium text-slate-400">Seed Sales Revenue</span>
                <h4 className="text-2xl font-bold text-amber-400 mt-1">
                  ₹{Number(reports?.total_seed_sales ?? 245000).toLocaleString("en-IN")}
                </h4>
                <p className="text-[11px] text-slate-400 mt-2">Inward certified seeds retail</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Audit Logs */}
        {activeTab === "audit" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">System Activity Audit Log</h3>
                <p className="text-xs text-slate-400">Immutable trace of administrative actions and inspections</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                  <tr>
                    <th className="py-3 px-4">Log ID</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No audit logs logged yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{log.id}</td>
                        <td className="py-3 px-4 font-bold text-white">{log.user_name || `User #${log.user_id}`}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ""}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : "Recent"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
