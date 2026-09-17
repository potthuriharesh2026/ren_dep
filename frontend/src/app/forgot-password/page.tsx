"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Sprout, Phone, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword(identifier);
      setSubmitted(true);
      success(res.message || "Password reset instructions sent");
    } catch (err: any) {
      error(err.message || "Failed to submit reset request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 relative overflow-hidden bg-grid-pattern">
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reset Password</h1>
          <p className="text-xs text-slate-600 mt-1">
            Enter your registered phone or email to recover your account
          </p>
        </div>

        {/* Panel */}
        <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-emerald-500/30">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Request Processed</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                If an account exists with <strong>{identifier}</strong>, you will receive password reset instructions via SMS / Email.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phone Number or Email
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="9999999999 or farmer@agriflow.local"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-emerald-600/40 text-sm text-white placeholder:text-emerald-200/90 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
                Remember your password?{" "}
                <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300">
                  Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
