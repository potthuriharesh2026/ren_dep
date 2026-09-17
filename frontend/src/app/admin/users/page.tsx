"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { Badge, getStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { User } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import {
  Users,
  Shield,
  Warehouse,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<"managers" | "farmers">("managers");
  const [managers, setManagers] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateManagerOpen, setIsCreateManagerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { success, error } = useToast();

  const [managerForm, setManagerForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    department: "Operations & Procurement",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mgrRes, farmersRes] = await Promise.allSettled([
        api.admin.getManagers(),
        api.admin.getFarmers(),
      ]);

      if (mgrRes.status === "fulfilled") setManagers(mgrRes.value || []);
      if (farmersRes.status === "fulfilled") setFarmers(farmersRes.value || []);
    } catch (err: any) {
      error(err.message || "Failed to load users list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.admin.createManager({
        name: managerForm.name,
        email: managerForm.email,
        phone: managerForm.phone,
        password: managerForm.password,
        department: managerForm.department,
      });

      success(`Manager account created for ${managerForm.name}!`);
      setIsCreateManagerOpen(false);
      setManagerForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        department: "Operations & Procurement",
      });
      fetchData();
    } catch (err: any) {
      error(err.message || "Failed to create manager account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleManagerStatus = async (managerId: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await api.admin.updateManagerStatus(managerId, newStatus);
      success(`Manager marked as ${newStatus}`);
      fetchData();
    } catch (err: any) {
      error(err.message || "Failed to update manager status");
    }
  };

  const handleDeleteFarmer = async (farmerId: number) => {
    if (!confirm(`Are you sure you want to remove Farmer #${farmerId}?`)) return;
    try {
      await api.admin.deleteFarmer(farmerId);
      success(`Farmer #${farmerId} removed`);
      fetchData();
    } catch (err: any) {
      error(err.message || "Failed to delete farmer");
    }
  };

  const filteredFarmers = farmers.filter(
    (f) =>
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.phone?.includes(search) ||
      f.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout allowedRoles={["admin", "super_admin"]}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-emerald-600" />
              Staff & Farmer User Management
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Create warehouse manager accounts, configure role permissions, and supervise registered farmers
            </p>
          </div>

          {activeTab === "managers" && (
            <button
              onClick={() => setIsCreateManagerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add New Manager
            </button>
          )}
        </div>

        {/* Tab Toggle Bar */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("managers")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "managers"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Warehouse className="w-4 h-4" />
            Warehouse Managers ({managers.length})
          </button>
          <button
            onClick={() => setActiveTab("farmers")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "farmers"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Registered Farmers ({farmers.length})
          </button>
        </div>

        {/* Tab 1: Managers */}
        {activeTab === "managers" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b border-slate-800 bg-slate-900/40">
                  <tr>
                    <th className="py-3 px-4">Manager ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Loading managers...
                      </td>
                    </tr>
                  ) : managers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No manager accounts found. Click &quot;Add New Manager&quot; to provision one.
                      </td>
                    </tr>
                  ) : (
                    managers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{m.id}</td>
                        <td className="py-3 px-4 font-bold text-white">{m.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{m.email}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{m.phone}</td>
                        <td className="py-3 px-4 text-amber-300 font-medium">
                          {m.department || "Warehouse Logistics"}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(m.status)}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleManagerStatus(m.id, m.status)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                              m.status === "active"
                                ? "bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20"
                            }`}
                          >
                            {m.status === "active" ? "Deactivate" : "Activate"}
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

        {/* Tab 2: Farmers */}
        {activeTab === "farmers" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search farmers by name, phone or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-xs text-white placeholder:text-emerald-200/90 focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div className="text-xs text-slate-300 font-medium">
                Found: <strong className="text-emerald-400 font-bold">{filteredFarmers.length}</strong>
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
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredFarmers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No farmers match your query.
                      </td>
                    </tr>
                  ) : (
                    filteredFarmers.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{f.id}</td>
                        <td className="py-3 px-4 font-bold text-white">{f.name}</td>
                        <td className="py-3 px-4 font-mono">{f.phone}</td>
                        <td className="py-3 px-4 text-slate-400">{f.email || "N/A"}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {f.created_at ? new Date(f.created_at).toLocaleDateString() : "Active"}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(f.status)}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteFarmer(f.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                            title="Delete Farmer Record"
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
      </div>

      {/* Create Manager Modal */}
      <Modal
        isOpen={isCreateManagerOpen}
        onClose={() => setIsCreateManagerOpen(false)}
        title="Provision Manager Account"
        subtitle="Provide credentials and department assignment for new warehouse manager"
      >
        <form onSubmit={handleCreateManager} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={managerForm.name}
                onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })}
                placeholder="Anil Verma"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={managerForm.phone}
                onChange={(e) => setManagerForm({ ...managerForm, phone: e.target.value })}
                placeholder="8888888888"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work Email *
              </label>
              <input
                type="email"
                required
                value={managerForm.email}
                onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
                placeholder="manager.verma@agriflow.local"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Temporary Password *
              </label>
              <input
                type="password"
                required
                value={managerForm.password}
                onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Department / Operational Role
            </label>
            <select
              value={managerForm.department}
              onChange={(e) => setManagerForm({ ...managerForm, department: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Operations & Procurement">Operations & Procurement</option>
              <option value="Quality Inspection & Weighbridge">Quality Inspection & Weighbridge</option>
              <option value="Warehouse Logistics & Dispatch">Warehouse Logistics & Dispatch</option>
              <option value="Agronomy & Field Advisory">Agronomy & Field Advisory</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateManagerOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Provision Manager"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
