"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { Badge, getStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { Seed, SeedPurchase, Warehouse } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import {
  ShoppingBag,
  Package,
  Store,
  CreditCard,
  MapPin,
  Clock,
  Loader2,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function FarmerSeedsPage() {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [purchases, setPurchases] = useState<SeedPurchase[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { success, error } = useToast();

  const [orderForm, setOrderForm] = useState({
    quantity_kg: "25",
    payment_method: "upi",
    upi_id: "farmer@okhdfcbank",
    transaction_id: "UPI" + Math.floor(10000000 + Math.random() * 90000000),
    warehouse_id: 1,
    pickup_date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [seedsData, purchasesData, warehousesData] = await Promise.all([
        api.farmer.getSeeds(),
        api.farmer.getSeedPurchases(),
        api.farmer.getWarehouses(),
      ]);
      setSeeds(seedsData || []);
      setPurchases(purchasesData || []);
      setWarehouses(warehousesData || []);
      if (warehousesData?.length > 0) {
        setOrderForm((prev) => ({ ...prev, warehouse_id: warehousesData[0].id }));
      }
    } catch (err: any) {
      error(err.message || "Failed to load seed store");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenPurchase = (seed: Seed) => {
    setSelectedSeed(seed);
    setIsPurchaseModalOpen(true);
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeed) return;

    const qty = parseFloat(orderForm.quantity_kg) || 0;
    if (qty <= 0) {
      error("Please enter a valid quantity");
      return;
    }
    if (qty > selectedSeed.stock_kg) {
      error(`Requested quantity exceeds available stock of ${selectedSeed.stock_kg} kg`);
      return;
    }

    try {
      setSubmitting(true);
      await api.farmer.purchaseSeeds({
        seed_id: selectedSeed.id,
        seed_name: selectedSeed.name,
        quantity_kg: qty,
        payment_method: orderForm.payment_method,
        upi_id: orderForm.payment_method === "upi" ? orderForm.upi_id : undefined,
        transaction_id: orderForm.transaction_id,
        warehouse_id: Number(orderForm.warehouse_id),
        pickup_date: orderForm.pickup_date,
      });

      success(`Successfully ordered ${qty} kg of ${selectedSeed.name}!`);
      setIsPurchaseModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.message || "Failed to submit seed purchase order");
    } finally {
      setSubmitting(false);
    }
  };

  const currentPrice = selectedSeed ? selectedSeed.price_per_kg * (parseFloat(orderForm.quantity_kg) || 0) : 0;

  return (
    <DashboardLayout allowedRoles={["farmer"]}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Store className="w-6 h-6 text-emerald-600" />
              Certified Seed Varieties Catalog
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Government-certified high-yield seeds with direct warehouse pickup and passbook billing
            </p>
          </div>
        </div>

        {/* Available Catalog Grid */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Available Seed Varieties
          </h2>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading seed catalog...</p>
            </div>
          ) : seeds.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center text-xs text-slate-400">
              No seeds currently in stock. Please check back later.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seeds.map((seed) => (
                <div
                  key={seed.id}
                  className="glass-card glass-card-hover p-6 rounded-3xl flex flex-col justify-between border border-slate-800"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                        {seed.variety || "High Yield"}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          seed.stock_kg > 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {seed.stock_kg > 0 ? `${seed.stock_kg} kg in stock` : "Out of stock"}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">{seed.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {seed.description || "Certified government approved variety with high disease resistance."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Rate</div>
                      <div className="text-lg font-extrabold text-white">
                        ₹{seed.price_per_kg}
                        <span className="text-xs font-normal text-slate-400">/kg</span>
                      </div>
                    </div>

                    <button
                      disabled={seed.stock_kg <= 0}
                      onClick={() => handleOpenPurchase(seed)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-40 transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Buy Seeds
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Seed Orders Table */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-400" />
                My Seed Purchase Orders
              </h3>
              <p className="text-xs text-slate-400">Order pickup schedule and payment logs</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Seed Variety</th>
                  <th className="py-3 px-4">Quantity (kg)</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Pickup Date</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No seed purchases placed yet.
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{p.id}</td>
                      <td className="py-3 px-4 font-medium text-white">{p.seed_name || `Seed #${p.seed_id}`}</td>
                      <td className="py-3 px-4">{p.quantity_kg} kg</td>
                      <td className="py-3 px-4 font-semibold text-emerald-400">
                        ₹{Number(p.total_price).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">{p.pickup_date || "Immediate"}</td>
                      <td className="py-3 px-4">{getStatusBadge(p.payment_status || "paid")}</td>
                      <td className="py-3 px-4">{getStatusBadge(p.order_status || "ready_for_pickup")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {selectedSeed && (
        <Modal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          title={`Purchase Seeds: ${selectedSeed.name}`}
          subtitle={`Variety: ${selectedSeed.variety || "Standard"} • Price: ₹${selectedSeed.price_per_kg}/kg`}
        >
          <form onSubmit={handlePurchaseSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Quantity Needed (kg) *
              </label>
              <input
                type="number"
                min="1"
                max={selectedSeed.stock_kg}
                required
                value={orderForm.quantity_kg}
                onChange={(e) => setOrderForm({ ...orderForm, quantity_kg: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Available Stock: <strong>{selectedSeed.stock_kg} kg</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pickup Warehouse Location *
              </label>
              <select
                value={orderForm.warehouse_id}
                onChange={(e) => setOrderForm({ ...orderForm, warehouse_id: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {warehouses.map((w, idx) => (
                  <option key={`warehouse-opt-${w.id ?? idx}-${idx}`} value={w.id}>
                    {w.name} ({w.address || "Regional Hub"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Scheduled Pickup Date
                </label>
                <input
                  type="date"
                  value={orderForm.pickup_date}
                  onChange={(e) => setOrderForm({ ...orderForm, pickup_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Payment Method
                </label>
                <select
                  value={orderForm.payment_method}
                  onChange={(e) => setOrderForm({ ...orderForm, payment_method: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="upi">UPI / NetBanking</option>
                  <option value="bank_transfer">Direct Bank Transfer (NEFT/RTGS)</option>
                  <option value="cash_on_pickup">Cash on Warehouse Pickup</option>
                </select>
              </div>
            </div>

            {orderForm.payment_method === "upi" && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Farmer UPI VPA
                </label>
                <input
                  type="text"
                  value={orderForm.upi_id}
                  onChange={(e) => setOrderForm({ ...orderForm, upi_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Total Price Summary Box */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-300 font-medium">Total Bill Amount:</span>
                <div className="text-xl font-extrabold text-emerald-400">
                  ₹{currentPrice.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <div>GST / Subsidies applied</div>
                <div className="text-emerald-400 font-semibold">Immediate passbook credit entry</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPurchaseModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Order & Pay"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
