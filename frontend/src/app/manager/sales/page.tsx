"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { Badge, getStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { GrainSale } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Coins,
  Loader2,
  Search,
} from "lucide-react";

export default function ManagerSalesPage() {
  const [sales, setSales] = useState<GrainSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<GrainSale | null>(null);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [finalAmount, setFinalAmount] = useState("12500");
  const [payoutDesc, setPayoutDesc] = useState("MSP Payout credited to registered bank account");
  const [submitting, setSubmitting] = useState(false);
  const { success, error } = useToast();

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await api.manager.getGrainSales();
      setSales(data || []);
    } catch (err: any) {
      error(err.message || "Failed to load grain sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleOpenPayout = (sale: GrainSale) => {
    setSelectedSale(sale);
    const amt = sale.final_amount || sale.total_amount || (sale.quantity_kg * 22);
    setFinalAmount(String(amt));
    setPayoutDesc(`Procurement MSP payout for ${sale.quantity_kg} kg ${sale.grain_type}`);
    setPayoutModalOpen(true);
  };

  const handleProcessPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;

    try {
      setSubmitting(true);
      // Review & approve final amount first
      await api.manager.reviewGrainSale(selectedSale.id, "approved", parseFloat(finalAmount) || undefined);
      // Pay sale directly to farmer passbook
      await api.manager.payGrainSale(selectedSale.id, payoutDesc);

      success(`Payout of ₹${Number(finalAmount).toLocaleString("en-IN")} credited to Farmer #${selectedSale.farmer_id}!`);
      setPayoutModalOpen(false);
      fetchSales();
    } catch (err: any) {
      error(err.message || "Failed to process farmer payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={["manager", "admin", "super_admin"]}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            Grain Sales & Farmer Payout Settlement
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Review procured grain lots, verify MSP pricing calculations, and release payment disbursements
          </p>
        </div>

        {/* Sales Table */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Procurement Lots & Payment Status</h3>
              <p className="text-xs text-slate-400">All grain transactions requiring settlement</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {sales.length} Total Lots
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="py-3 px-4">Sale ID</th>
                  <th className="py-3 px-4">Farmer</th>
                  <th className="py-3 px-4">Grain Type</th>
                  <th className="py-3 px-4">Quantity (kg)</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Total Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Settlement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Loading sales...
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No grain sales found in queue.
                    </td>
                  </tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{s.id}</td>
                      <td className="py-3 px-4 font-bold text-white">{s.farmer_name || `Farmer #${s.farmer_id}`}</td>
                      <td className="py-3 px-4 font-medium text-slate-200">{s.grain_type}</td>
                      <td className="py-3 px-4">{s.good_material_kg || s.quantity_kg} kg</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {s.grade || "Grade A"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        ₹{Number(s.final_amount || s.total_amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(s.status)}</td>
                      <td className="py-3 px-4 text-right">
                        {s.status === "paid" ? (
                          <span className="text-xs text-emerald-400 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenPayout(s)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 font-semibold transition-colors"
                          >
                            Release Payout
                          </button>
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

      {/* Payout Release Modal */}
      {selectedSale && (
        <Modal
          isOpen={payoutModalOpen}
          onClose={() => setPayoutModalOpen(false)}
          title={`Disburse Payout: Sale #${selectedSale.id}`}
          subtitle={`Farmer: ${selectedSale.farmer_name || selectedSale.farmer_id} • Quantity: ${selectedSale.quantity_kg} kg ${selectedSale.grain_type}`}
        >
          <form onSubmit={handleProcessPayout} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Calculated MSP Settlement Amount (₹) *
              </label>
              <input
                type="number"
                step="1"
                required
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Passbook Transaction Description
              </label>
              <input
                type="text"
                value={payoutDesc}
                onChange={(e) => setPayoutDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200">
              Disbursing will create an immediate credit ledger transaction and notify the farmer.
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPayoutModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Disburse Payment"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
