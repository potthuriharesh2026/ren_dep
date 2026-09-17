"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { Badge, getStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { GrainSale, DeliveryBooking, Warehouse } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import {
  PackageCheck,
  Calendar,
  Warehouse as WarehouseIcon,
  Plus,
  Loader2,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  Scale,
  MapPin,
} from "lucide-react";

export default function FarmerSalesPage() {
  const [sales, setSales] = useState<GrainSale[]>([]);
  const [bookings, setBookings] = useState<DeliveryBooking[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { success, error } = useToast();

  const [slotForm, setSlotForm] = useState({
    grain_type: "Paddy (Basmati)",
    quantity_kg: "500",
    warehouse_id: 1,
    booking_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    delivery_address: "Plot 4B, North Canal Farm",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesData, bookingsData, warehousesData] = await Promise.all([
        api.farmer.getGrainSales(),
        api.farmer.getBookings(),
        api.farmer.getWarehouses(),
      ]);
      setSales(salesData || []);
      setBookings(bookingsData || []);
      setWarehouses(warehousesData || []);
      if (warehousesData?.length > 0) {
        setSlotForm((prev) => ({ ...prev, warehouse_id: warehousesData[0].id }));
      }
    } catch (err: any) {
      error(err.message || "Failed to load grain sales and bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(slotForm.quantity_kg) || 0;
    if (qty <= 0) {
      error("Please enter a valid grain quantity");
      return;
    }

    try {
      setSubmitting(true);
      await api.farmer.bookDeliverySlot({
        grain_type: slotForm.grain_type,
        quantity_kg: qty,
        warehouse_id: Number(slotForm.warehouse_id),
        booking_date: slotForm.booking_date,
        delivery_address: slotForm.delivery_address,
      });

      success("Delivery slot booked successfully! Warehouse manager will confirm slot.");
      setIsSlotModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.message || "Failed to book delivery slot");
    } finally {
      setSubmitting(false);
    }
  };

  const grainTypes = [
    "Paddy (Basmati)",
    "Paddy (PR-126)",
    "Wheat (Sharbati)",
    "Wheat (Lokwan)",
    "Mustard / Rapeseed",
    "Maize / Yellow Corn",
    "Soybean (Grade A)",
    "Cotton (Medium Staple)",
    "Chickpea / Chana",
  ];

  return (
    <DashboardLayout allowedRoles={["farmer"]}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <PackageCheck className="w-6 h-6 text-emerald-600" />
              Grain Sales & Warehouse Slots
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Book guaranteed delivery slots, view moisture & quality inspection reports, and track MSP payouts
            </p>
          </div>
          <button
            onClick={() => setIsSlotModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Book Delivery Slot
          </button>
        </div>

        {/* Section 1: Booked Delivery Slots */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" />
                Warehouse Delivery Slots
              </h3>
              <p className="text-xs text-slate-400">Scheduled grain deliveries and on-site inspection outcomes</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Grain Type</th>
                  <th className="py-3 px-4">Quantity (kg)</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4">Delivery Date</th>
                  <th className="py-3 px-4">Inspection Report</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No delivery slots booked yet. Click &quot;Book Delivery Slot&quot; to bring your harvest to warehouse.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{b.id}</td>
                      <td className="py-3 px-4 font-medium text-white">{b.grain_type}</td>
                      <td className="py-3 px-4">{b.quantity_kg} kg</td>
                      <td className="py-3 px-4 text-slate-300">Warehouse #{b.warehouse_id}</td>
                      <td className="py-3 px-4 text-slate-300">{b.booking_date}</td>
                      <td className="py-3 px-4">
                        {b.good_qty !== undefined && b.good_qty !== null ? (
                          <div className="text-[11px] leading-tight">
                            <span className="text-emerald-400 font-bold">{b.good_qty} kg accepted</span>
                            {b.bad_qty ? <span className="text-rose-400 ml-1">({b.bad_qty} kg waste)</span> : null}
                            {b.moisture_pct ? (
                              <div className="text-slate-400">Moisture: {b.moisture_pct}%</div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Pending inspection</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(b.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Grain Sales & Payout Records */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Grain Procurement & Payout Records
              </h3>
              <p className="text-xs text-slate-400">Direct MSP procurement settlements and payments</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="py-3 px-4">Sale ID</th>
                  <th className="py-3 px-4">Grain</th>
                  <th className="py-3 px-4">Procured Qty</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Rate / kg</th>
                  <th className="py-3 px-4">Settled Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No grain sales finalized yet. Completed warehouse deliveries will appear here.
                    </td>
                  </tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{s.id}</td>
                      <td className="py-3 px-4 font-medium text-white">{s.grain_type}</td>
                      <td className="py-3 px-4">{s.good_material_kg || s.quantity_kg} kg</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {s.grade || "Grade A"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {s.rate_per_kg ? `₹${s.rate_per_kg}/kg` : "MSP Rate"}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        ₹{Number(s.final_amount || s.total_amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(s.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Book Slot Modal */}
      <Modal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        title="Book Warehouse Delivery Slot"
        subtitle="Reserve a delivery date at your nearby warehouse for quality inspection"
      >
        <form onSubmit={handleBookSlot} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Grain Commodity Type *
            </label>
            <select
              value={slotForm.grain_type}
              onChange={(e) => setSlotForm({ ...slotForm, grain_type: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {grainTypes.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Estimated Quantity (kg) *
              </label>
              <input
                type="number"
                min="10"
                required
                value={slotForm.quantity_kg}
                onChange={(e) => setSlotForm({ ...slotForm, quantity_kg: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Delivery Date *
              </label>
              <input
                type="date"
                required
                value={slotForm.booking_date}
                onChange={(e) => setSlotForm({ ...slotForm, booking_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Destination Warehouse *
            </label>
            <select
              value={slotForm.warehouse_id}
              onChange={(e) => setSlotForm({ ...slotForm, warehouse_id: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {warehouses.map((w, idx) => (
                <option key={`wh-sale-opt-${w.id ?? idx}-${idx}`} value={w.id}>
                  {w.name} ({w.address || "Hub"} - Cap: {w.total_capacity_kg} kg)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Farm Dispatch Location / Address
            </label>
            <input
              type="text"
              value={slotForm.delivery_address}
              onChange={(e) => setSlotForm({ ...slotForm, delivery_address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 text-xs text-teal-200">
            Grain will be inspected for moisture percentage and good material weight at warehouse scale. Payment is credited directly into your passbook upon approval.
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsSlotModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Slot Booking"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
