"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { Badge, getStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { BankChangeRequest, User } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import {
  UserCheck,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Users,
  Search,
  Filter,
} from "lucide-react";

export default function ManagerFarmersPage() {
  const [bankRequests, setBankRequests] = useState<BankChangeRequest[]>([]);
  const [farmers, setFarmers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<BankChangeRequest | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">("approved");
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { success, error } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bankData, farmersData] = await Promise.allSettled([
        api.manager.getBankRequests(),
        api.admin.getFarmers(),
      ]);

      if (bankData.status === "fulfilled") setBankRequests(bankData.value || []);
      if (farmersData.status === "fulfilled") setFarmers(farmersData.value || []);
    } catch (err: any) {
      error(err.message || "Failed to load farmer requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenReview = (req: BankChangeRequest, status: "approved" | "rejected") => {
    setSelectedRequest(req);
    setReviewStatus(status);
    setReviewNotes(status === "approved" ? "Bank account verified with passbook copy" : "Invalid account number or IFSC");
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      setSubmitting(true);
      await api.manager.reviewBankRequest(selectedRequest.id, reviewStatus, reviewNotes);
      success(`Bank request #${selectedRequest.id} marked as ${reviewStatus}!`);
      setReviewModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.message || "Failed to submit bank review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveFarmer = async (farmerId: number, status: string) => {
    try {
      await api.manager.approveFarmer(farmerId, status, "Verified by manager");
      success(`Farmer #${farmerId} updated to ${status}`);
      fetchData();
    } catch (err: any) {
      error(err.message || "Failed to update farmer status");
    }
  };

  return (
    <DashboardLayout allowedRoles={["manager", "admin", "super_admin"]}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            Farmer Verification & Bank Approvals
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Approve onboarding farmer accounts and review bank account/UPI update requests
          </p>
        </div>

        {/* Bank Change Review Queue */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                Bank Account & UPI Change Requests
              </h3>
              <p className="text-xs text-slate-400">Review pending bank account submissions from farmers</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {bankRequests.filter((b) => b.status === "pending").length} Pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="py-3 px-4">Req ID</th>
                  <th className="py-3 px-4">Farmer ID</th>
                  <th className="py-3 px-4">Bank Name</th>
                  <th className="py-3 px-4">Account Number</th>
                  <th className="py-3 px-4">IFSC Code</th>
                  <th className="py-3 px-4">UPI VPA</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {bankRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No bank change requests found.
                    </td>
                  </tr>
                ) : (
                  bankRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{req.id}</td>
                      <td className="py-3 px-4 font-bold text-white">Farmer #{req.farmer_id}</td>
                      <td className="py-3 px-4">{req.bank_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-200">{req.account_number}</td>
                      <td className="py-3 px-4 font-mono uppercase text-slate-300">{req.ifsc_code}</td>
                      <td className="py-3 px-4 text-emerald-400">{req.upi_id || "N/A"}</td>
                      <td className="py-3 px-4">{getStatusBadge(req.status)}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {req.status === "pending" ? (
                          <>
                            <button
                              onClick={() => handleOpenReview(req, "approved")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenReview(req, "rejected")}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 font-semibold"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Registered Farmers Status Queue */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Farmer Accounts Directory
              </h3>
              <p className="text-xs text-slate-400">Active and pending onboarding farmer profiles</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="py-3 px-4">Farmer ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Account Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {farmers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No farmers registered yet.
                    </td>
                  </tr>
                ) : (
                  farmers.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{f.id}</td>
                      <td className="py-3 px-4 font-bold text-white">{f.name}</td>
                      <td className="py-3 px-4 font-mono">{f.phone}</td>
                      <td className="py-3 px-4 text-slate-400">{f.email || "N/A"}</td>
                      <td className="py-3 px-4">{getStatusBadge(f.status)}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {f.status === "pending" && (
                          <button
                            onClick={() => handleApproveFarmer(f.id, "active")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold hover:bg-emerald-500/30"
                          >
                            Approve Account
                          </button>
                        )}
                        {f.status === "active" && (
                          <span className="text-xs text-emerald-400 font-medium">Verified Active</span>
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

      {/* Review Request Modal */}
      {selectedRequest && (
        <Modal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title={`${reviewStatus === "approved" ? "Approve" : "Reject"} Bank Request #${selectedRequest.id}`}
          subtitle={`Farmer #${selectedRequest.farmer_id} • ${selectedRequest.bank_name}`}
        >
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Account Number:</span>
                <span className="text-white font-mono font-bold">{selectedRequest.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IFSC Code:</span>
                <span className="text-white font-mono font-bold uppercase">{selectedRequest.ifsc_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">UPI ID:</span>
                <span className="text-emerald-400 font-bold">{selectedRequest.upi_id || "None"}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Verification / Review Remarks *
              </label>
              <textarea
                required
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 shadow-md disabled:opacity-50 flex items-center gap-2 ${
                  reviewStatus === "approved"
                    ? "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20"
                    : "bg-rose-500 hover:bg-rose-400 shadow-rose-500/20"
                }`}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  `Confirm ${reviewStatus === "approved" ? "Approval" : "Rejection"}`
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
