"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { Badge, getStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { Crop } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import {
  Sprout,
  Plus,
  Calendar,
  Layers,
  MapPin,
  Loader2,
  FileText,
  Search,
} from "lucide-react";

export default function FarmerCropsPage() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    crop_type: "Paddy (Basmati)",
    acres: "2.5",
    sowing_date: new Date().toISOString().split("T")[0],
    harvest_date: "",
    notes: "",
  });

  const fetchCrops = async () => {
    try {
      setLoading(true);
      const data = await api.farmer.getCrops();
      setCrops(data || []);
    } catch (err: any) {
      error(err.message || "Failed to load crops");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const handleRegisterCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.crop_type || !formData.acres) return;

    try {
      setSubmitting(true);
      await api.farmer.registerCrop({
        crop_type: formData.crop_type,
        acres: parseFloat(formData.acres) || 1,
        sowing_date: formData.sowing_date || undefined,
        harvest_date: formData.harvest_date || undefined,
        notes: formData.notes || undefined,
      });
      success("Crop registered successfully!");
      setIsModalOpen(false);
      setFormData({
        crop_type: "Paddy (Basmati)",
        acres: "2.5",
        sowing_date: new Date().toISOString().split("T")[0],
        harvest_date: "",
        notes: "",
      });
      fetchCrops();
    } catch (err: any) {
      error(err.message || "Failed to register crop");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCrops = crops.filter((c) =>
    c.crop_type.toLowerCase().includes(search.toLowerCase())
  );

  const cropOptions = [
    "Paddy (Basmati)",
    "Paddy (PR-126)",
    "Wheat (HD-2967)",
    "Wheat (PBW-502)",
    "Mustard (Pusa Bold)",
    "Mustard (Giriraj)",
    "Maize / Corn (Hybrid)",
    "Cotton (Bt-II)",
    "Soybean (JS-335)",
    "Sugarcane (Co-0238)",
    "Chickpea / Chana",
    "Moong / Green Gram",
  ];

  return (
    <DashboardLayout allowedRoles={["farmer"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Sprout className="w-6 h-6 text-emerald-600" />
              Registered Crops & Acreage
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Manage cultivated farmland, crop types, sowing dates, and harvest estimates
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Register New Crop
          </button>
        </div>

        {/* Search and Filters */}
        <div className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by crop variety or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-xs text-white placeholder:text-emerald-200/90 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />
          </div>
          <div className="text-xs text-slate-300 font-medium">
            Total: <strong className="text-emerald-400 font-bold">{crops.length}</strong> registered
          </div>
        </div>

        {/* Crops Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading your crops...</p>
          </div>
        ) : filteredCrops.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No crops found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              You haven&apos;t registered any crops yet. Register your current season sowing to enable inspections and slot bookings.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" /> Register First Crop
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCrops.map((crop) => (
              <div
                key={crop.id}
                className="glass-card glass-card-hover p-6 rounded-3xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <Sprout className="w-5 h-5" />
                    </div>
                    {getStatusBadge(crop.status || "growing")}
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{crop.crop_type}</h3>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold mb-4">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    {crop.acres} Acres Cultivation
                  </div>

                  <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" /> Sowing Date:
                      </span>
                      <span className="text-white font-medium">{crop.sowing_date || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" /> Expected Harvest:
                      </span>
                      <span className="text-white font-medium">{crop.harvest_date || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {crop.notes && (
                  <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                    <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{crop.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Register Crop Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Crop"
        subtitle="Provide current season crop details and acreage"
      >
        <form onSubmit={handleRegisterCrop} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Crop Variety / Type *
            </label>
            <select
              value={formData.crop_type}
              onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {cropOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cultivated Area (Acres) *
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              value={formData.acres}
              onChange={(e) => setFormData({ ...formData, acres: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Sowing / Planting Date
              </label>
              <input
                type="date"
                value={formData.sowing_date}
                onChange={(e) => setFormData({ ...formData, sowing_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Estimated Harvest Date
              </label>
              <input
                type="date"
                value={formData.harvest_date}
                onChange={(e) => setFormData({ ...formData, harvest_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Plot Notes / Soil Observations
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Certified seeds purchased from warehouse, canal irrigation active"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-emerald-200/90 focus:outline-none focus:border-emerald-500"
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
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Register Crop"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
