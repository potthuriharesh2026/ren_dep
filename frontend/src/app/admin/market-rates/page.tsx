"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { MarketRate } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import {
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  Loader2,
  Sparkles,
  Calendar,
  Layers,
} from "lucide-react";

export default function AdminMarketRatesPage() {
  const [rates, setRates] = useState<MarketRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<MarketRate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    crop_type: "Paddy (Basmati)",
    grade: "Grade A",
    price_per_kg: "28.50",
    effective_date: new Date().toISOString().split("T")[0],
  });

  const fetchRates = async () => {
    try {
      setLoading(true);
      const data = await api.market.getRates();
      setRates(data || []);
    } catch (err: any) {
      error(err.message || "Failed to load market rates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleOpenCreate = () => {
    setEditingRate(null);
    setFormData({
      crop_type: "Paddy (Basmati)",
      grade: "Grade A",
      price_per_kg: "28.50",
      effective_date: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rate: MarketRate) => {
    setEditingRate(rate);
    setFormData({
      crop_type: rate.crop_type,
      grade: rate.grade,
      price_per_kg: String(rate.price_per_kg),
      effective_date: rate.effective_date || new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        crop_type: formData.crop_type,
        grade: formData.grade,
        price_per_kg: parseFloat(formData.price_per_kg) || 0,
        effective_date: formData.effective_date,
      };

      if (editingRate) {
        await api.market.updateRate(editingRate.id, payload);
        success(`Market rate for ${formData.crop_type} updated!`);
      } else {
        await api.market.setRate(payload);
        success(`New MSP rate for ${formData.crop_type} configured!`);
      }

      setIsModalOpen(false);
      fetchRates();
    } catch (err: any) {
      error(err.message || "Failed to save market rate");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRate = async (rateId: number) => {
    if (!confirm("Are you sure you want to delete this rate configuration?")) return;
    try {
      await api.market.deleteRate(rateId);
      success("Market rate removed");
      fetchRates();
    } catch (err: any) {
      error(err.message || "Failed to delete rate");
    }
  };

  const commodities = [
    "Paddy (Basmati)",
    "Paddy (Common / PR-126)",
    "Wheat (HD-2967)",
    "Wheat (Sharbati Premium)",
    "Mustard (High Oil %)",
    "Maize / Corn",
    "Cotton (Medium Staple)",
    "Soybean (Yellow)",
    "Gram / Chana",
    "Moong Dal",
  ];

  return (
    <DashboardLayout allowedRoles={["admin", "super_admin"]}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              Minimum Support Price (MSP) & Market Rates
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Configure procurement base prices, quality grade premiums, and effective seasonal price matrices
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Set New Rate
          </button>
        </div>

        {/* Rates Table */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Active MSP & Market Pricing Table</h3>
              <p className="text-xs text-slate-400">Used by warehouse managers for automated procurement payouts</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {rates.length} Rates Configured
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="py-3 px-4">Rate ID</th>
                  <th className="py-3 px-4">Crop Commodity</th>
                  <th className="py-3 px-4">Quality Grade</th>
                  <th className="py-3 px-4">MSP Price / kg</th>
                  <th className="py-3 px-4">Quintal Equivalent</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Loading rates...
                    </td>
                  </tr>
                ) : rates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No market rates configured yet. Click &quot;Set New Rate&quot; to define MSP pricing.
                    </td>
                  </tr>
                ) : (
                  rates.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{r.id}</td>
                      <td className="py-3 px-4 font-bold text-white">{r.crop_type}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono">
                          {r.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-emerald-400 text-sm">
                        ₹{Number(r.price_per_kg).toFixed(2)}/kg
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        ₹{(Number(r.price_per_kg) * 100).toLocaleString("en-IN")} / qtl
                      </td>
                      <td className="py-3 px-4 text-slate-300">{r.effective_date}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit Rate"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRate(r.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                          title="Delete Rate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Set Rate Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRate ? `Update Rate: ${editingRate.crop_type}` : "Configure MSP Market Rate"}
        subtitle="Set standard procurement rate per kg for quality inspection payout"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Crop Commodity *
            </label>
            <select
              value={formData.crop_type}
              onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {commodities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Quality Grade *
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Grade A">Grade A (Premium)</option>
                <option value="Grade B">Grade B (Standard MSP)</option>
                <option value="Grade C">Grade C (Industrial / Feed)</option>
                <option value="Fair Average Quality (FAQ)">Fair Average Quality (FAQ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Price per kg (₹) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.price_per_kg}
                onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Effective Season Date *
            </label>
            <input
              type="date"
              required
              value={formData.effective_date}
              onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200">
            Calculated rate: <strong>₹{(parseFloat(formData.price_per_kg || "0") * 100).toLocaleString("en-IN")} per quintal</strong>.
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
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingRate ? "Update Rate" : "Publish Rate"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
