"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Sprout,
  Shield,
  Warehouse,
  Lock,
  Phone,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";

function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "admin") {
      setIdentifier("admin@agriflow.local");
      setPassword("AdminPassword123!");
    } else if (roleParam === "manager") {
      setIdentifier("manager@agriflow.local");
      setPassword("ManagerPassword123!");
    } else if (roleParam === "farmer") {
      setIdentifier("farmer@agriflow.local");
      setPassword("FarmerPassword123!");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setLoading(true);
    await login(identifier, password);
    setLoading(false);
  };

  const handleQuickDemo = async (role: "admin" | "manager" | "farmer") => {
    setLoading(true);
    await demoLogin(role);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md">
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
        <p className="text-xs text-slate-600 mt-1">Sign in to access your portal</p>
      </div>

      {/* 1-Click Fast Demo Login Buttons */}
      <div className="glass-card p-4 rounded-2xl mb-6 border border-emerald-500/30 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-emerald-300" />
          <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
            1-Click Instant Demo Access
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickDemo("admin")}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-teal-400/40 bg-teal-500/20 hover:bg-teal-500/30 text-teal-100 transition-colors"
          >
            <Shield className="w-4 h-4 text-teal-300 mb-1" />
            <span className="text-[11px] font-bold">Admin</span>
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickDemo("manager")}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-amber-400/40 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 transition-colors"
          >
            <Warehouse className="w-4 h-4 text-amber-300 mb-1" />
            <span className="text-[11px] font-bold">Manager</span>
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickDemo("farmer")}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-emerald-400/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 transition-colors"
          >
            <Sprout className="w-4 h-4 text-emerald-300 mb-1" />
            <span className="text-[11px] font-bold">Farmer</span>
          </button>
        </div>
      </div>

      {/* Login Form Box */}
      <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-emerald-500/30">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Phone Number or Email
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 9999999999 or admin@agriflow.local"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-emerald-600/40 text-sm text-white placeholder:text-emerald-200/90 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200 transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-emerald-600/40 text-sm text-white placeholder:text-emerald-200/90 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-emerald-800/40 text-center text-xs text-slate-300">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="font-semibold text-emerald-300 hover:text-emerald-200">
            Register as Farmer
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 relative overflow-hidden bg-grid-pattern">
      {/* Background gradients */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />
      <Suspense fallback={<Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
