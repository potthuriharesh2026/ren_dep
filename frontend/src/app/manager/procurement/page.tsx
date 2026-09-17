"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { Badge, getStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { DeliveryBooking } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import {
  PackageCheck,
  Scale,
  Droplets,
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  Search,
  Warehouse,
} from "lucide-react";

function ProcurementContent() {
  const [bookings, setBookings] = useState<DeliveryBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<DeliveryBooking | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const { success, error } = useToast();

  const [inspectForm, setInspectForm] = useState({
    received_qty_kg: "500",
    good_qty: "485",
    bad_qty: "15",
    moisture_pct: "11.5",
    quality: "Grade A",
    remarks: "Verified clean, low foreign matter, acceptable moisture",
    procurement_status: "procured",
  });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await api.manager.getBookings();
      setBookings(data || []);

      const inspectId = searchParams.get("inspect");
      if (inspectId && data) {
        const found = data.find((b: any) => String(b.id) === inspectId);
        if (found) {
          handleOpenInspect(found);
        }
      }
    } catch (err: any) {
      error(err.message || "Failed to load warehouse delivery slots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [searchParams]);

  const handleOpenInspect = (booking: DeliveryBooking) => {
    setSelectedBooking(booking);
    const qty = booking.quantity_kg || 100;
    setInspectForm({
      received_qty_kg: String(qty),
      good_qty: String(booking.good_qty || Math.round(qty * 0.96)),
      bad_qty: String(booking.bad_qty || Math.round(qty * 0.04)),
      moisture_pct: String(booking.moisture_pct || "11.5"),
      quality: booking.quality || "Grade A",
      remarks: "Quality checked on warehouse weighbridge. Moisture within 12% limit.",
      procurement_status: "procured",
    });
    setInspectModalOpen(true);
  };

  const handleInspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    try {
      setSubmitting(true);
      await api.manager.procureGrainBooking({
        slot_id: selectedBooking.id,
        received_qty_kg: parseFloat(inspectForm.received_qty_kg) || 0,
        moisture_pct: parseFloat(inspectForm.moisture_pct) || 0,
        quality: inspectForm.quality,
        remarks: inspectForm.remarks,
        procurement_status: inspectForm.procurement_status,
      });

      await api.manager.inspectCrop(selectedBooking.id, {
        good_qty: parseFloat(inspectForm.good_qty) || 0,
        bad_qty: parseFloat(inspectForm.bad_qty) || 0,
        notes: inspectForm.remarks,
      });

      success(`Slot #${selectedBooking.id} inspected & procured into inventory!`);
      setInspectModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      error(err.message || "Failed to submit inspection");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Scale className="w-6 h-6 text-emerald-600" />
          Delivery Slot Quality Inspection & Procurement
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Perform digital weighbridge entry, measure moisture content %, and record accepted grain inventory
        </p>
      </div>

      {/* Bookings Queue */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Delivery Slots Inspection Register</h3>
            <p className="text-xs text-slate-400">All registered grain shipments arriving at warehouse</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {bookings.length} Total Deliveries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
              <tr>
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Farmer</th>
                <th className="py-3 px-4">Grain Type</th>
                <th className="py-3 px-4">Est. Qty</th>
                <th className="py-3 px-4">Delivery Date</th>
                <th className="py-3 px-4">Inspection Data</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading bookings...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No delivery slots booked yet.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{b.id}</td>
                    <td className="py-3 px-4 font-bold text-white">
                      {b.farmer_name || `Farmer #${b.farmer_id}`}
                      {b.farmer_phone ? (
                        <div className="text-[10px] text-slate-400 font-mono">{b.farmer_phone}</div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">{b.grain_type}</td>
                    <td className="py-3 px-4 font-semibold">{b.quantity_kg} kg</td>
                    <td className="py-3 px-4 text-slate-300">{b.booking_date}</td>
                    <td className="py-3 px-4">
                      {b.good_qty !== undefined && b.good_qty !== null ? (
                        <div className="text-[11px] leading-tight">
                          <span className="text-emerald-400 font-bold">{b.good_qty} kg accepted</span>
                          {b.bad_qty ? <span className="text-rose-400 ml-1">({b.bad_qty} kg waste)</span> : null}
                          {b.moisture_pct ? (
                            <div className="text-slate-400">Moisture: {b.moisture_pct}% • {b.quality}</div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-amber-400 font-medium text-[11px]">Pending Weighbridge</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(b.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenInspect(b)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 font-semibold transition-colors"
                      >
                        {b.status === "procured" || b.status === "inspected" ? "Re-Inspect" : "Inspect & Procure"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection Modal */}
      {selectedBooking && (
        <Modal
          isOpen={inspectModalOpen}
          onClose={() => setInspectModalOpen(false)}
          title={`Grain Inspection & Weighbridge: Slot #${selectedBooking.id}`}
          subtitle={`Farmer: ${selectedBooking.farmer_name || selectedBooking.farmer_id} • Commodity: ${selectedBooking.grain_type}`}
        >
          <form onSubmit={handleInspectSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Actual Received Gross Weight (kg) *
                </label>
                <div className="relative">
                  <Scale className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={inspectForm.received_qty_kg}
                    onChange={(e) => {
                      const total = parseFloat(e.target.value) || 0;
                      const good = Math.round(total * 0.96 * 10) / 10;
                      const bad = Math.round((total - good) * 10) / 10;
                      setInspectForm({
                        ...inspectForm,
                        received_qty_kg: e.target.value,
                        good_qty: String(good),
                        bad_qty: String(bad),
                      });
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Moisture Content (%) *
                </label>
                <div className="relative">
                  <Droplets className="w-4 h-4 text-teal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={inspectForm.moisture_pct}
                    onChange={(e) => setInspectForm({ ...inspectForm, moisture_pct: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Accepted Good Material (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={inspectForm.good_qty}
                  onChange={(e) => setInspectForm({ ...inspectForm, good_qty: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Foreign Matter / Waste (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={inspectForm.bad_qty}
                  onChange={(e) => setInspectForm({ ...inspectForm, bad_qty: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-rose-400 font-bold focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Quality Grade Assigned
                </label>
                <select
                  value={inspectForm.quality}
                  onChange={(e) => setInspectForm({ ...inspectForm, quality: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Grade A">Grade A (Premium / Export)</option>
                  <option value="Grade B">Grade B (Standard MSP)</option>
                  <option value="Grade C">Grade C (Industrial Feed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Procurement Outcome Status
                </label>
                <select
                  value={inspectForm.procurement_status}
                  onChange={(e) => setInspectForm({ ...inspectForm, procurement_status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="procured">Procured & Added to Warehouse Stock</option>
                  <option value="inspected">Inspected (Awaiting Admin Payout)</option>
                  <option value="rejected">Rejected (High Moisture / Infestation)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Inspector Observations & Remarks
              </label>
              <textarea
                rows={2}
                value={inspectForm.remarks}
                onChange={(e) => setInspectForm({ ...inspectForm, remarks: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Inspection & Procure"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function ManagerProcurementPage() {
  return (
    <DashboardLayout allowedRoles={["manager", "admin", "super_admin"]}>
      <Suspense fallback={<Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto my-12" />}>
        <ProcurementContent />
      </Suspense>
    </DashboardLayout>
  );
}
