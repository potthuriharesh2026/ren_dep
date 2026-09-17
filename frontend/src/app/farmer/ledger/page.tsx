"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge, getStatusBadge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { api } from "@/lib/api";
import { Transaction } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import {
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Wallet,
  Calendar,
  Loader2,
  Filter,
} from "lucide-react";

export default function FarmerLedgerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all");
  const { error } = useToast();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await api.farmer.getTransactions();
        setTransactions(data || []);
      } catch (err: any) {
        error(err.message || "Failed to load passbook ledger");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [error]);

  const totalCredits = transactions
    .filter((t) => t.direction === "credit")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalDebits = transactions
    .filter((t) => t.direction === "debit")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const netBalance = totalCredits - totalDebits;

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "credit") return t.direction === "credit";
    if (filter === "debit") return t.direction === "debit";
    return true;
  });

  return (
    <DashboardLayout allowedRoles={["farmer"]}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            Farmer Financial Passbook & Ledger
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Complete transparent record of grain payouts, seed purchases, subsidies, and bank transfers
          </p>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            title="Total Grain Payouts (Credit)"
            value={`₹${totalCredits.toLocaleString("en-IN")}`}
            icon={ArrowDownLeft}
            color="emerald"
            description="All grain sales and MSP reimbursements"
          />
          <StatCard
            title="Total Purchases / Debits"
            value={`₹${totalDebits.toLocaleString("en-IN")}`}
            icon={ArrowUpRight}
            color="rose"
            description="Seed variety store orders and deductions"
          />
          <StatCard
            title="Net Farmer Passbook Balance"
            value={`₹${netBalance.toLocaleString("en-IN")}`}
            icon={Wallet}
            color="amber"
            description="Disbursed directly into registered bank account"
          />
        </div>

        {/* Ledger Transactions Table */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Passbook Statement</h3>
              <p className="text-xs text-slate-400">All historical ledger entries</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === "all"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All Entries
              </button>
              <button
                onClick={() => setFilter("credit")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === "credit"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Credits (Payouts)
              </button>
              <button
                onClick={() => setFilter("debit")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === "debit"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Debits (Orders)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="py-3 px-4">Tx ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No ledger transactions found for selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{tx.id}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full ${
                            tx.direction === "credit"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {tx.direction === "credit" ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {tx.direction.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-white">{tx.description || "Ledger settlement"}</td>
                      <td className="py-3 px-4 text-slate-400 capitalize">
                        {tx.reference_type?.replace(/_/g, " ") || "N/A"}{" "}
                        {tx.reference_id ? `#${tx.reference_id}` : ""}
                      </td>
                      <td
                        className={`py-3 px-4 font-bold text-sm ${
                          tx.direction === "credit" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {tx.direction === "credit" ? "+" : "-"}₹{Number(tx.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {tx.created_at ? new Date(tx.created_at).toLocaleString() : "N/A"}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(tx.status || "completed")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
