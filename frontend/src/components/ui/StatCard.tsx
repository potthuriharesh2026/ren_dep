import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  isPositive?: boolean;
  color?: "emerald" | "amber" | "teal" | "orange" | "purple" | "rose" | "lime";
  description?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  isPositive = true,
  color = "emerald",
  description,
}: StatCardProps) {
  const colorMap = {
    emerald: {
      bg: "bg-emerald-500/20",
      text: "text-emerald-300",
      border: "border-emerald-500/30",
      glow: "hover:border-emerald-400/50 hover:shadow-emerald-500/20",
      cardClass: "glass-card",
    },
    amber: {
      bg: "bg-amber-500/20",
      text: "text-amber-300",
      border: "border-amber-500/30",
      glow: "hover:border-amber-400/50 hover:shadow-amber-500/20",
      cardClass: "glass-card-harvest",
    },
    teal: {
      bg: "bg-teal-500/20",
      text: "text-teal-300",
      border: "border-teal-500/30",
      glow: "hover:border-teal-400/50 hover:shadow-teal-500/20",
      cardClass: "glass-card-irrigation",
    },
    orange: {
      bg: "bg-orange-500/20",
      text: "text-orange-300",
      border: "border-orange-500/30",
      glow: "hover:border-orange-400/50 hover:shadow-orange-500/20",
      cardClass: "glass-card-soil",
    },
    lime: {
      bg: "bg-lime-500/20",
      text: "text-lime-300",
      border: "border-lime-500/30",
      glow: "hover:border-lime-400/50 hover:shadow-lime-500/20",
      cardClass: "glass-card-sprout",
    },
    purple: {
      bg: "bg-amber-500/20",
      text: "text-amber-300",
      border: "border-amber-500/30",
      glow: "hover:border-amber-400/50 hover:shadow-amber-500/20",
      cardClass: "glass-card-harvest",
    },
    rose: {
      bg: "bg-rose-500/20",
      text: "text-rose-300",
      border: "border-rose-500/30",
      glow: "hover:border-rose-400/50 hover:shadow-rose-500/20",
      cardClass: "glass-card",
    },
  }[color];

  return (
    <div className={`group ${colorMap.cardClass} glass-card-hover p-6 rounded-2xl relative overflow-hidden transition-all duration-300 ${colorMap.glow}`}>
      {/* Decorative gradient blur background */}
      <div
        className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${colorMap.bg} blur-2xl pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-100 mb-1">{title}</p>
          <h3 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl border ${colorMap.bg} ${colorMap.text} ${colorMap.border}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(change || description) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {change && (
            <span
              className={`inline-flex items-center gap-1 font-bold ${
                isPositive ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {change}
            </span>
          )}
          {description && <span className="text-emerald-200/80 font-medium">{description}</span>}
        </div>
      )}
    </div>
  );
}
