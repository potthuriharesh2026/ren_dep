"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { Badge, getStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { Warehouse, WarehouseSlot } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import {
  Warehouse as WarehouseIcon,
  Plus,
  Calendar,
  Layers,
  MapPin,
  Clock,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function AdminWarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [slots, setSlots] = useState<WarehouseSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"warehouses" | "slots">("warehouses");
  const [createWhOpen, setCreateWhOpen] = useState(false);
  const [createSlotOpen, setCreateSlotOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { success, error } = useToast();

  const [whForm, setWhForm] = useState({
    name: "",
    address: "",
    total_capacity_kg: "100000",
    is_active: true,
  });

  const [slotForm, setSlotForm] = useState({
    warehouse_id: 1,
    slot_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "17:00",
    total_capacity_kg: "50000",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [whRes, slotsRes] = await Promise.allSettled([
        api.warehouses.list(),
        api.warehouses.listAllSlots(),
      ]);

      if (whRes.status === "fulfilled") setWarehouses(whRes.value || []);
      if (slotsRes.status === "fulfilled") setSlots(slotsRes.value || []);
    } catch (err: any) {
      error(err.message || "Failed to load warehouses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.warehouses.create({
        name: whForm.name,
        address: whForm.address,
        total_capacity_kg: parseFloat(whForm.total_capacity_kg) || 50000,
        is_active: whForm.is_active,
      });

      success(`Warehouse "${whForm.name}" created!`);
      setCreateWhOpen(false);
      setWhForm({ name: "", address: "", total_capacity_kg: "100000", is_active: true });
      fetchData();
    } catch (err: any) {
      error(err.message || "Failed to create warehouse");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.warehouses.createSlot({
        warehouse_id: Number(slotForm.warehouse_id),
        slot_date: slotForm.slot_date,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        total_capacity_kg: parseFloat(slotForm.total_capacity_kg) || 50000,
      });

      success("Delivery slot generated successfully!");
      setCreateSlotOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.message || "Failed to create slot");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={["admin", "super_admin"]}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <WarehouseIcon className="w-6 h-6 text-emerald-600" />
              Regional Warehouses & Delivery Slots
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Configure regional grain storage hubs, storage capacities, and daily weighbridge delivery slots
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateSlotOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-all"
            >
              <Calendar className="w-4 h-4" />
              Generate Slot
            </button>
            <button
              onClick={() => setCreateWhOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Warehouse
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("warehouses")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "warehouses"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <WarehouseIcon className="w-4 h-4" />
            Storage Hubs ({warehouses.length})
          </button>
          <button
            onClick={() => setActiveTab("slots")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "slots"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Active Delivery Slots ({slots.length})
          </button>
        </div>

        {/* Tab 1: Warehouses Grid */}
        {activeTab === "warehouses" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouses.map((w) => (
              <div
                key={w.id}
                className="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <WarehouseIcon className="w-5 h-5" />
                    </div>
                    {getStatusBadge(w.is_active ? "active" : "inactive")}
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{w.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {w.address || "Regional Agritech Depot"}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Capacity</span>
                    <div className="text-base font-bold text-white">
                      {(w.total_capacity_kg / 1000).toLocaleString("en-IN")} MT
                    </div>
                  </div>
                  <span className="text-slate-400 font-mono">Hub #{w.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Delivery Slots */}
        {activeTab === "slots" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                  <tr>
                    <th className="py-3 px-4">Slot ID</th>
                    <th className="py-3 px-4">Warehouse ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Time Window</th>
                    <th className="py-3 px-4">Slot Capacity</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {slots.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No delivery slots generated yet.
                      </td>
                    </tr>
                  ) : (
                    slots.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{s.id}</td>
                        <td className="py-3 px-4 font-bold text-white">Warehouse #{s.warehouse_id}</td>
                        <td className="py-3 px-4 text-slate-200">{s.slot_date}</td>
                        <td className="py-3 px-4 font-mono text-amber-400">
                          {s.start_time} - {s.end_time}
                        </td>
                        <td className="py-3 px-4 font-semibold">{s.total_capacity_kg} kg</td>
                        <td className="py-3 px-4">{getStatusBadge(s.status || "active")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Warehouse Modal */}
      <Modal
        isOpen={createWhOpen}
        onClose={() => setCreateWhOpen(false)}
        title="Add Regional Warehouse"
        subtitle="Provision a new agricultural warehouse and weighing station"
      >
        <form onSubmit={handleCreateWarehouse} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Warehouse Facility Name *
            </label>
            <input
              type="text"
              required
              value={whForm.name}
              onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
              placeholder="e.g. AgriFlow Central Mandi Warehouse #3"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Physical Location / Address *
            </label>
            <input
              type="text"
              required
              value={whForm.address}
              onChange={(e) => setWhForm({ ...whForm, address: e.target.value })}
              placeholder="e.g. NH-44 Agri Highway, Plot 12, Karnal"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Total Storage Capacity (kg) *
            </label>
            <input
              type="number"
              step="1000"
              required
              value={whForm.total_capacity_kg}
              onChange={(e) => setWhForm({ ...whForm, total_capacity_kg: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setCreateWhOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Warehouse"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Generate Slot Modal */}
      <Modal
        isOpen={createSlotOpen}
        onClose={() => setCreateSlotOpen(false)}
        title="Generate Warehouse Delivery Slot"
        subtitle="Open a scheduled weighbridge time window for farmer grain intake"
      >
        <form onSubmit={handleCreateSlot} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Warehouse Facility *
            </label>
            <select
              value={slotForm.warehouse_id}
              onChange={(e) => setSlotForm({ ...slotForm, warehouse_id: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {warehouses.map((w, idx) => (
                <option key={`admin-wh-opt-${w.id ?? idx}-${idx}`} value={w.id}>
                  {w.name} (#{w.id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Slot Date *
              </label>
              <input
                type="date"
                required
                value={slotForm.slot_date}
                onChange={(e) => setSlotForm({ ...slotForm, slot_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Intake Capacity (kg) *
              </label>
              <input
                type="number"
                step="1000"
                required
                value={slotForm.total_capacity_kg}
                onChange={(e) => setSlotForm({ ...slotForm, total_capacity_kg: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={slotForm.start_time}
                onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                End Time
              </label>
              <input
                type="time"
                value={slotForm.end_time}
                onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setCreateSlotOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Slot"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
