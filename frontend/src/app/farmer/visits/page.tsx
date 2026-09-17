"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge, getStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { FarmVisit } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import {
  CalendarCheck,
  Sprout,
  Clock,
  FileText,
  UserCheck,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function FarmerVisitsPage() {
  const [visits, setVisits] = useState<FarmVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        setLoading(true);
        const data = await api.farmer.getVisits();
        setVisits(data || []);
      } catch (err: any) {
        error(err.message || "Failed to load scheduled farm visits");
      } finally {
        setLoading(false);
      }
    };
    fetchVisits();
  }, [error]);

  return (
    <DashboardLayout allowedRoles={["farmer"]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-emerald-600" />
            Agronomist Field Visits Log
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Review scheduled farm inspections, pest management advice, and crop health recommendations
          </p>
        </div>

        {/* Visits List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading scheduled visits...</p>
          </div>
        ) : visits.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No field visits scheduled yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Our regional warehouse agronomists periodically inspect registered crops and provide expert advisory.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visits.map((visit) => (
              <div
                key={visit.id}
                className="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-emerald-400" />
                      Visit Scheduled: {visit.scheduled_date}
                    </span>
                    {getStatusBadge(visit.status)}
                  </div>

                  <div className="space-y-2 mb-4 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Crop ID & Type:</span>
                      <span className="text-white font-semibold">
                        Crop #{visit.crop_id} ({visit.crop_type || "Registered Plot"})
                      </span>
                    </div>
                    {visit.visit_month && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Visit Month:</span>
                        <span className="text-white font-medium">{visit.visit_month}</span>
                      </div>
                    )}
                  </div>

                  {visit.recommendations && (
                    <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200 space-y-1 mb-3">
                      <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Agronomist Advisory:
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">{visit.recommendations}</p>
                    </div>
                  )}

                  {visit.notes && (
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                      <span className="font-medium text-slate-400">Field Notes:</span> {visit.notes}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Visit ID: #{visit.id}</span>
                  <span>Assigned Field Officer</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
