"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { StatCard } from "@/components/ui/StatCard";
import { Badge, getStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { Transaction } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import {
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  CheckCircle2,
  Loader2,
  Search,
  Filter,
} from "lucide-react";

export default function AdminLedgerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    farmer_id: 1,
    amount: "5000",
    direction: "credit",
    description: "Government Agriculture Technology Subsidy",
    reference_type: "subsidy",
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.ledger.getTransactions();
      setTransactions(data || []);
    } catch (err: any) {
      error(err.message || "Failed to load ledger transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.ledger.createTransaction({
        farmer_id: Number(formData.farmer_id),
        amount: parseFloat(formData.amount) || 0,
        direction: formData.direction,
        description: formData.description,
        reference_type: formData.reference_type,
      });

      success("Ledger transaction entry recorded!");
      setIsModalOpen(false);
      fetchTransactions();
    } catch (err: any) {
      error(err.message || "Failed to create transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessPayment = async (txId: number) => {
    try {
      await api.ledger.processPayment(txId);
      success(`Transaction #${txId} processed and marked completed!`);
      fetchTransactions();
    } catch (err: any) {
      error(err.message || "Failed to process payment");
    }
  };

  const totalCredits = transactions
    .filter((t) => t.direction === "credit")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalDebits = transactions
    .filter((t) => t.direction === "debit")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "credit") return t.direction === "credit";
    if (filter === "debit") return t.direction === "debit";
    return true;
  });

  return (
    <DashboardLayout allowedRoles={["admin", "super_admin"]}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <CreditCard className="w-6 h-6 text-emerald-600" />
              System Financial Ledger & Payout Disbursements
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Audit double-entry ledger transactions, process farmer subsidies, and track payment disbursements
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create Manual Entry
          </button>
        </div>

        {/* Ledger Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            title="Total Disbursed Payouts (Credits)"
            value={`₹${totalCredits.toLocaleString("en-IN")}`}
            icon={ArrowDownLeft}
            color="emerald"
            description="Grain procurement payouts and farmer subsidies"
          />
          <StatCard
            title="Total Inward Receipts (Debits)"
            value={`₹${totalDebits.toLocaleString("en-IN")}`}
            icon={ArrowUpRight}
            color="amber"
            description="Seed sales and warehouse service payments"
          />
          <StatCard
            title="Net Flow Balance"
            value={`₹${(totalCredits - totalDebits).toLocaleString("en-IN")}`}
            icon={Wallet}
            color="teal"
            description="Platform gross turnover"
          />
        </div>

        {/* Transactions Table */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">System Ledger Transactions Log</h3>
              <p className="text-xs text-slate-400">Chronological transaction register</p>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("credit")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === "credit" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-white"
                }`}
              >
                Credits
              </button>
              <button
                onClick={() => setFilter("debit")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === "debit" ? "bg-rose-500/20 text-rose-300" : "text-slate-400 hover:text-white"
                }`}
              >
                Debits
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="py-3 px-4">Tx ID</th>
                  <th className="py-3 px-4">Farmer ID</th>
                  <th className="py-3 px-4">Direction</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Loading ledger...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No ledger entries found.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{tx.id}</td>
                      <td className="py-3 px-4 font-bold text-white">Farmer #{tx.farmer_id}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full ${
                            tx.direction === "credit"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {tx.direction === "credit" ? "+" : "-"} {tx.direction.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-white">{tx.description}</td>
                      <td className="py-3 px-4 text-slate-400 capitalize">
                        {tx.reference_type?.replace(/_/g, " ")} {tx.reference_id ? `#${tx.reference_id}` : ""}
                      </td>
                      <td
                        className={`py-3 px-4 font-bold text-sm ${
                          tx.direction === "credit" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        ₹{Number(tx.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(tx.status || "completed")}</td>
                      <td className="py-3 px-4 text-right">
                        {tx.status === "pending" ? (
                          <button
                            onClick={() => handleProcessPayment(tx.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 font-semibold"
                          >
                            Mark Processed
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 flex items-center justify-end gap-1 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Manual Ledger Adjustment"
        subtitle="Post a verified credit or debit transaction against a farmer account"
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Farmer ID *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.farmer_id}
                onChange={(e) => setFormData({ ...formData, farmer_id: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Direction *
              </label>
              <select
                value={formData.direction}
                onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="credit">Credit (Disbursement / Inward to Farmer)</option>
                <option value="debit">Debit (Deduction / Charge to Farmer)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Reference Type
              </label>
              <select
                value={formData.reference_type}
                onChange={(e) => setFormData({ ...formData, reference_type: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="subsidy">Government / State Subsidy</option>
                <option value="grain_sale">Procurement MSP Payout</option>
                <option value="seed_purchase">Seed Purchase Adjustment</option>
                <option value="other">Manual Correction / Bonus</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Ledger Description & Narration *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Ledger Entry"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
