"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Sprout,
  User,
  Phone,
  Mail,
  Lock,
  MapPin,
  Trees,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    address: "",
    acres_of_land: "5.0",
    crop_address: "",
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.password) return;

    setLoading(true);
    await register({
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      password: formData.password,
      address: formData.address || undefined,
      acres_of_land: parseFloat(formData.acres_of_land) || 0,
      crop_address: formData.crop_address || undefined,
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 relative overflow-hidden py-12 bg-grid-pattern">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

      <div className="w-full max-w-xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6 text-white font-bold" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Agri<span className="text-emerald-600">Flow</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Farmer Registration</h1>
          <p className="text-xs text-slate-600 mt-1">
            Join thousands of farmers growing their agricultural yield with AgriFlow
          </p>
        </div>

        {/* Form Panel */}
        <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-emerald-500/30">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ramesh Kumar"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-emerald-600/40 text-sm text-white placeholder:text-emerald-200/90 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-emerald-600/40 text-sm text-white placeholder:text-emerald-200/90 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="farmer@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-emerald-600/40 text-sm text-white placeholder:text-emerald-200/90 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-emerald-600/40 text-sm text-white placeholder:text-emerald-200/90 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cultivable Land (Acres)
                </label>
                <div className="relative">
                  <Trees className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    name="acres_of_land"
                    value={formData.acres_of_land}
                    onChange={handleChange}
                    placeholder="5.0"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-emerald-600/40 text-sm text-white placeholder:text-emerald-200/90 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Village / Residential Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Sector 4, Green Valley"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-emerald-600/40 text-sm text-white placeholder:text-emerald-200/90 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Farm Plot Location / Survey No.
              </label>
              <input
                type="text"
                name="crop_address"
                value={formData.crop_address}
                onChange={handleChange}
                placeholder="Farm Plot #24, Near North Canal"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-emerald-600/40 text-sm text-white placeholder:text-emerald-200/90 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Farmer Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Sign In to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
