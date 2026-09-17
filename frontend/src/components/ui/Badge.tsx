import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "orange" | "purple" | "white";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({ children, variant = "neutral", size = "sm", dot = false }: BadgeProps) {
  const variantStyles = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    info: "bg-teal-500/10 text-teal-300 border-teal-500/30",
    neutral: "bg-white/[0.06] text-slate-300 border-white/10",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    purple: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    white: "bg-white text-slate-950 font-bold border-white shadow-sm",
  }[variant];

  const dotColors = {
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-rose-400",
    info: "bg-teal-400",
    neutral: "bg-slate-300",
    orange: "bg-orange-400",
    purple: "bg-amber-400",
    white: "bg-emerald-500",
  }[variant];

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-xs font-medium",
    md: "px-3 py-1 text-xs font-semibold",
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles} ${sizeStyles}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors} animate-pulse`} />}
      {children}
    </span>
  );
}

export function getStatusBadge(status?: string) {
  if (!status) return <Badge variant="neutral">Unknown</Badge>;
  const lower = status.toLowerCase();

  if (["active", "approved", "completed", "paid", "ready", "procured"].includes(lower)) {
    return <Badge variant="success" dot>{status.toUpperCase()}</Badge>;
  }
  if (["pending", "in_progress", "submitted", "growing", "scheduled", "ready_for_pickup"].includes(lower)) {
    return <Badge variant="warning" dot>{status.replace(/_/g, " ").toUpperCase()}</Badge>;
  }
  if (["rejected", "cancelled", "failed", "inactive"].includes(lower)) {
    return <Badge variant="danger">{status.toUpperCase()}</Badge>;
  }
  if (["confirmed", "inspected"].includes(lower)) {
    return <Badge variant="info">{status.toUpperCase()}</Badge>;
  }
  return <Badge variant="warning">{status.toUpperCase()}</Badge>;
}
