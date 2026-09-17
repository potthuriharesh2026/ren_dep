"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { Badge, getStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { FarmVisit } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import {
  CalendarClock,
  Plus,
  Bell,
  CheckCircle2,
  FileText,
  Clock,
  Loader2,
  Sprout,
  Send,
} from "lucide-react";

export default function ManagerVisitsPage() {
  const [visits, setVisits] = useState<FarmVisit[]>([]);
  const [activeCrops, setActiveCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<FarmVisit | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingNotifs, setSendingNotifs] = useState(false);
  const { success, error } = useToast();

  const [scheduleForm, setScheduleForm] = useState({
    crop_id: 1,
    farmer_id: 1,
    scheduled_date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    visit_month: "October 2026",
  });

  const [updateForm, setUpdateForm] = useState({
    status: "completed",
    notes: "Crop stand is healthy. Recommended micronutrient spray (Zinc + Boron).",
    recommendations: "Maintain 2-3 cm standing water. Inspect for stem borer in 10 days.",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [visitsData, cropsData] = await Promise.allSettled([
        api.manager.getVisits(),
        api.manager.getActiveCrops(),
      ]);

      if (visitsData.status === "fulfilled") setVisits(visitsData.value || []);
      if (cropsData.status === "fulfilled") {
        setActiveCrops(cropsData.value || []);
        if (cropsData.value?.length > 0) {
          setScheduleForm((prev) => ({
            ...prev,
            crop_id: cropsData.value[0].id,
            farmer_id: cropsData.value[0].farmer_id,
          }));
        }
      }
    } catch (err: any) {
      error(err.message || "Failed to load field visits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.manager.scheduleVisit({
        crop_id: Number(scheduleForm.crop_id),
        farmer_id: Number(scheduleForm.farmer_id),
        scheduled_date: scheduleForm.scheduled_date,
        visit_month: scheduleForm.visit_month,
      });

      success("Field visit scheduled successfully!");
      setScheduleModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.message || "Failed to schedule visit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenUpdate = (visit: FarmVisit) => {
    setSelectedVisit(visit);
    setUpdateForm({
      status: visit.status || "completed",
      notes: visit.notes || "Crop stand verified in field.",
      recommendations: visit.recommendations || "Apply balanced fertilizer dose.",
    });
    setUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;

    try {
      setSubmitting(true);
      await api.manager.updateVisit(selectedVisit.id, {
        status: updateForm.status,
        notes: updateForm.notes,
        recommendations: updateForm.recommendations,
      });

      success("Visit notes and recommendations saved!");
      setUpdateModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.message || "Failed to update visit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerNotifications = async () => {
    try {
      setSendingNotifs(true);
      const res = await api.manager.triggerVisitNotifications();
      success(res.message || "Visit notifications sent to farmers!");
    } catch (err: any) {
      error(err.message || "Failed to dispatch reminders");
    } finally {
      setSendingNotifs(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={["manager", "admin", "super_admin"]}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <CalendarClock className="w-6 h-6 text-amber-600" />
              Agronomist Farm Visit Scheduler
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Organize field inspections, submit crop advisory notes, and dispatch automated farmer reminders
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerNotifications}
              disabled={sendingNotifs}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-all disabled:opacity-50"
            >
              {sendingNotifs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Dispatch Reminders
            </button>
            <button
              onClick={() => setScheduleModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Schedule Visit
            </button>
          </div>
        </div>

        {/* Visits Register */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Scheduled Field Inspections</h3>
              <p className="text-xs text-slate-400">All planned and completed field visits</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {visits.length} Total Visits
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="py-3 px-4">Visit ID</th>
                  <th className="py-3 px-4">Farmer</th>
                  <th className="py-3 px-4">Crop ID / Type</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Advisory & Notes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Loading visits...
                    </td>
                  </tr>
                ) : visits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No farm visits logged yet. Click &quot;Schedule Visit&quot; to plan one.
                    </td>
                  </tr>
                ) : (
                  visits.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{v.id}</td>
                      <td className="py-3 px-4 font-bold text-white">{v.farmer_name || `Farmer #${v.farmer_id}`}</td>
                      <td className="py-3 px-4 text-slate-200">
                        Crop #{v.crop_id} {v.crop_type ? `(${v.crop_type})` : ""}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">{v.scheduled_date}</td>
                      <td className="py-3 px-4 max-w-xs truncate">
                        {v.recommendations || v.notes || <span className="text-slate-500 italic">No notes</span>}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(v.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenUpdate(v)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 font-semibold transition-colors"
                        >
                          Update Notes
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

      {/* Schedule Visit Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule Agronomist Field Inspection"
        subtitle="Assign a visit date to inspect crop health and soil status"
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Active Crop & Farmer *
            </label>
            <select
              value={`${scheduleForm.crop_id}-${scheduleForm.farmer_id}`}
              onChange={(e) => {
                const [cId, fId] = e.target.value.split("-");
                setScheduleForm({ ...scheduleForm, crop_id: Number(cId), farmer_id: Number(fId) });
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {activeCrops.length === 0 ? (
                <option value="1-1">Crop #1 - Farmer #1 (Paddy)</option>
              ) : (
                activeCrops.map((c, idx) => (
                  <option key={`crop-option-${c.id ?? idx}-${c.farmer_id ?? idx}-${idx}`} value={`${c.id}-${c.farmer_id}`}>
                    Crop #{c.id}: {c.crop_type} ({c.acres} Acres) - Farmer #{c.farmer_id}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Inspection Date *
              </label>
              <input
                type="date"
                required
                value={scheduleForm.scheduled_date}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Visit Month / Cycle
              </label>
              <input
                type="text"
                value={scheduleForm.visit_month}
                onChange={(e) => setScheduleForm({ ...scheduleForm, visit_month: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setScheduleModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Schedule Visit"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Visit Modal */}
      {selectedVisit && (
        <Modal
          isOpen={updateModalOpen}
          onClose={() => setUpdateModalOpen(false)}
          title={`Visit Inspection Notes: #${selectedVisit.id}`}
          subtitle={`Farmer #${selectedVisit.farmer_id} • Date: ${selectedVisit.scheduled_date}`}
        >
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Visit Status
              </label>
              <select
                value={updateForm.status}
                onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="completed">Completed & Verified</option>
                <option value="in_progress">In Progress</option>
                <option value="scheduled">Scheduled (Pending)</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Agronomist Recommendations & Advice *
              </label>
              <textarea
                required
                rows={3}
                value={updateForm.recommendations}
                onChange={(e) => setUpdateForm({ ...updateForm, recommendations: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Field Observations / Soil Notes
              </label>
              <textarea
                rows={2}
                value={updateForm.notes}
                onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setUpdateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Advisory"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
