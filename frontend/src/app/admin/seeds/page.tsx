"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { Badge, getStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { Seed, SeedPurchase, Warehouse } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import {
  Sprout,
  Plus,
  PackageCheck,
  Trash2,
  Edit,
  Loader2,
  Store,
  Warehouse as WarehouseIcon,
  Search,
} from "lucide-react";

export default function AdminSeedsPage() {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [purchases, setPurchases] = useState<SeedPurchase[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"catalog" | "orders">("catalog");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    name: "Pusa Basmati 1121",
    variety: "Hybrid Extra Long Grain",
    price_per_kg: "85",
    stock_kg: "2500",
    description: "Certified disease-resistant high-yield variety with premium elongation ratio.",
    image_url: "",
    is_active: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [seedsRes, purchasesRes, warehousesRes] = await Promise.allSettled([
        api.admin.getSeeds(),
        api.admin.getSeedPurchases(),
        api.admin.getWarehouses(),
      ]);

      if (seedsRes.status === "fulfilled") setSeeds(seedsRes.value || []);
      if (purchasesRes.status === "fulfilled") setPurchases(purchasesRes.value || []);
      if (warehousesRes.status === "fulfilled") setWarehouses(warehousesRes.value || []);
    } catch (err: any) {
      error(err.message || "Failed to load seeds catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingSeed(null);
    setFormData({
      name: "",
      variety: "Certified High Yield",
      price_per_kg: "75",
      stock_kg: "1000",
      description: "Government-approved certified seeds suitable for irrigated land.",
      image_url: "",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (seed: Seed) => {
    setEditingSeed(seed);
    setFormData({
      name: seed.name,
      variety: seed.variety || "",
      price_per_kg: String(seed.price_per_kg),
      stock_kg: String(seed.stock_kg),
      description: seed.description || "",
      image_url: seed.image_url || "",
      is_active: seed.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmitSeed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        variety: formData.variety,
        price_per_kg: parseFloat(formData.price_per_kg) || 0,
        stock_kg: parseFloat(formData.stock_kg) || 0,
        description: formData.description,
        image_url: formData.image_url || undefined,
        is_active: formData.is_active,
      };

      if (editingSeed) {
        await api.admin.updateSeed(editingSeed.id, payload);
        success(`Seed variety "${formData.name}" updated!`);
      } else {
        await api.admin.createSeed(payload);
        success(`Seed variety "${formData.name}" added to catalog!`);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.message || "Failed to save seed variety");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSeed = async (seedId: number) => {
    if (!confirm("Are you sure you want to delete this seed variety?")) return;
    try {
      await api.admin.deleteSeed(seedId);
      success("Seed variety removed from catalog");
      fetchData();
    } catch (err: any) {
      error(err.message || "Failed to delete seed");
    }
  };

  return (
    <DashboardLayout allowedRoles={["admin", "super_admin"]}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Sprout className="w-6 h-6 text-emerald-600" />
              Seed Varieties Catalog & Orders
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Manage certified seed stocks, pricing per kg, warehouse assignments, and farmer orders
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add New Seed Variety
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "catalog"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Store className="w-4 h-4" />
            Seed Catalog ({seeds.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "orders"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-stone-400 hover:text-white"
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            All Farmer Orders ({purchases.length})
          </button>
        </div>

        {/* Catalog Tab */}
        {activeTab === "catalog" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Seed Name</th>
                    <th className="py-3 px-4">Variety</th>
                    <th className="py-3 px-4">Price / kg</th>
                    <th className="py-3 px-4">Stock Available</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Loading seeds...
                      </td>
                    </tr>
                  ) : seeds.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No seed varieties configured yet.
                      </td>
                    </tr>
                  ) : (
                    seeds.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{s.id}</td>
                        <td className="py-3 px-4 font-bold text-white">{s.name}</td>
                        <td className="py-3 px-4 text-slate-300">{s.variety || "Standard"}</td>
                        <td className="py-3 px-4 font-bold text-emerald-400">₹{s.price_per_kg}</td>
                        <td className="py-3 px-4 font-semibold">{s.stock_kg} kg</td>
                        <td className="py-3 px-4">{getStatusBadge(s.is_active ? "active" : "inactive")}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Seed"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSeed(s.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                            title="Delete Seed"
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
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Farmer</th>
                    <th className="py-3 px-4">Variety</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Order Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{p.id}</td>
                        <td className="py-3 px-4 font-bold text-white">{p.farmer_name || `Farmer #${p.farmer_id}`}</td>
                        <td className="py-3 px-4 font-medium text-slate-200">{p.seed_name || `Seed #${p.seed_id}`}</td>
                        <td className="py-3 px-4">{p.quantity_kg} kg</td>
                        <td className="py-3 px-4 font-bold text-emerald-400">
                          ₹{Number(p.total_price).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(p.payment_status || "paid")}</td>
                        <td className="py-3 px-4">{getStatusBadge(p.order_status || "ready_for_pickup")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Seed Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSeed ? `Edit Seed: ${editingSeed.name}` : "Add New Seed Variety"}
        subtitle="Configure variety specifications, stock volume and retail rate"
      >
        <form onSubmit={handleSubmitSeed} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Seed Variety Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Pusa Basmati 1121"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Sub-variety / Classification
              </label>
              <input
                type="text"
                value={formData.variety}
                onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                placeholder="Hybrid / Long Grain"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Price per kg (₹) *
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.price_per_kg}
                onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Initial Stock (kg) *
              </label>
              <input
                type="number"
                step="10"
                required
                value={formData.stock_kg}
                onChange={(e) => setFormData({ ...formData, stock_kg: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description & Agronomic Traits
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
            />
            <label htmlFor="is_active" className="text-xs text-slate-300 font-medium cursor-pointer">
              Active in farmer store for online booking
            </label>
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
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingSeed ? "Update Seed" : "Add to Catalog"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
