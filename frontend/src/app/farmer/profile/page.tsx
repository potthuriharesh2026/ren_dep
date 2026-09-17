"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Trees,
  CreditCard,
  CheckCircle2,
  Loader2,
  Edit,
  ShieldCheck,
} from "lucide-react";

export default function FarmerProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [submittingBank, setSubmittingBank] = useState(false);
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    acres_of_land: "5.0",
    crop_address: "",
  });

  const [bankForm, setBankForm] = useState({
    bank_name: "State Bank of India",
    account_number: "30894726190",
    ifsc_code: "SBIN0001234",
    upi_id: "farmer@okhdfcbank",
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await api.farmer.getProfile();
      setProfile(data);
      if (data) {
        setFormData({
          name: data.user?.name || user?.name || "",
          email: data.user?.email || user?.email || "",
          address: data.profile?.address || "",
          acres_of_land: String(data.profile?.acres_of_land || "5.0"),
          crop_address: data.profile?.crop_address || "",
        });
        if (data.profile) {
          setBankForm({
            bank_name: data.profile.bank_name || "State Bank of India",
            account_number: data.profile.account_number || "30894726190",
            ifsc_code: data.profile.ifsc_code || "SBIN0001234",
            upi_id: data.profile.upi_id || "farmer@okhdfcbank",
          });
        }
      }
    } catch (err: any) {
      error(err.message || "Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await api.farmer.updateProfile({
        address: formData.address,
        acres_of_land: parseFloat(formData.acres_of_land) || 0,
        crop_address: formData.crop_address,
      });
      await api.auth.updateProfile(formData.name, formData.email);
      success("Profile and land records updated successfully!");
      refreshUser();
      fetchProfile();
    } catch (err: any) {
      error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleBankChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingBank(true);
      const res = await api.farmer.requestBankChange({
        bank_name: bankForm.bank_name,
        account_number: bankForm.account_number,
        ifsc_code: bankForm.ifsc_code,
        upi_id: bankForm.upi_id,
      });
      success(res.message || "Bank details change request submitted for review!");
      setIsBankModalOpen(false);
    } catch (err: any) {
      error(err.message || "Failed to submit bank change request");
    } finally {
      setSubmittingBank(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={["farmer"]}>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-emerald-600" />
            Farm & Banking Profile
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage your personal details, land acreage, and verified bank account for MSP direct payouts
          </p>
        </div>

        {/* Section 1: Farmer & Land Details */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Farmer Identification & Land Records</h3>
              <p className="text-xs text-slate-400">Personal info and farm plot survey details</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Farmer Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Registered Mobile Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled
                    value={user?.phone || ""}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cultivable Land (Acres)
                </label>
                <div className="relative">
                  <Trees className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.acres_of_land}
                    onChange={(e) => setFormData({ ...formData, acres_of_land: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Village / Residential Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Farm Plot Survey / Location
                </label>
                <input
                  type="text"
                  value={formData.crop_address}
                  onChange={(e) => setFormData({ ...formData, crop_address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile Details"}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Bank & Payout Information */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Verified Bank & Payout Account
              </h3>
              <p className="text-xs text-slate-400">MSP and grain procurement payouts are sent to this account</p>
            </div>
            <button
              onClick={() => setIsBankModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition-all self-start sm:self-auto"
            >
              <Edit className="w-3.5 h-3.5" />
              Request Bank Update
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-4 rounded-2xl">
              <span className="text-[11px] text-slate-400">Bank Name</span>
              <div className="text-sm font-bold text-white mt-0.5">
                {profile?.profile?.bank_name || "State Bank of India"}
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl">
              <span className="text-[11px] text-slate-400">Account Number</span>
              <div className="text-sm font-bold text-white font-mono mt-0.5">
                {profile?.profile?.account_number || "•••• •••• 6190"}
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl">
              <span className="text-[11px] text-slate-400">IFSC Code</span>
              <div className="text-sm font-bold text-white font-mono mt-0.5">
                {profile?.profile?.ifsc_code || "SBIN0001234"}
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl">
              <span className="text-[11px] text-slate-400">UPI ID (VPA)</span>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {profile?.profile?.upi_id || "farmer@okhdfcbank"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Change Request Modal */}
      <Modal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        title="Request Bank Details Update"
        subtitle="Submit new account details. Changes will take effect upon manager approval."
      >
        <form onSubmit={handleBankChangeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Bank Name *
            </label>
            <input
              type="text"
              required
              value={bankForm.bank_name}
              onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Account Number *
            </label>
            <input
              type="text"
              required
              value={bankForm.account_number}
              onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                IFSC Code *
              </label>
              <input
                type="text"
                required
                value={bankForm.ifsc_code}
                onChange={(e) => setBankForm({ ...bankForm, ifsc_code: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                UPI ID (Optional)
              </label>
              <input
                type="text"
                value={bankForm.upi_id}
                onChange={(e) => setBankForm({ ...bankForm, upi_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsBankModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingBank}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {submittingBank ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
