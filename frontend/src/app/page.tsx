"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PublicStats, Seed } from "@/lib/types";
import {
  Sprout,
  ShieldCheck,
  Warehouse,
  Coins,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Users,
  Building2,
  ShoppingBag,
  Sparkles,
  Scale,
  CalendarCheck,
  CreditCard,
  Droplets,
  Calculator,
  ChevronRight,
  Shield,
  Zap,
  Check,
  BarChart3,
  Layers,
  CloudSun,
  Thermometer,
  Gauge,
  Sliders,
  Compass,
  ArrowUpRight,
  Activity,
  Trees,
} from "lucide-react";

export default function LandingPage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive Agro-Advisory Weather & Soil Moisture Tab State
  const [selectedWeatherCity, setSelectedWeatherCity] = useState("Kurnool (Hub 1)");

  // Interactive 5-Stage Crop Lifecycle State
  const [activeCropStage, setActiveCropStage] = useState<number>(0);

  // Interactive Role Preview Tab
  const [activeRoleTab, setActiveRoleTab] = useState<"farmer" | "manager" | "admin">("farmer");

  // Interactive Seed Filter Category
  const [seedCategory, setSeedCategory] = useState<"all" | "cereals" | "oilseeds" | "cash">("all");

  // Interactive MSP Calculator States
  const [calcCrop, setCalcCrop] = useState("Paddy (Basmati)");
  const [calcQuantity, setCalcQuantity] = useState("50"); // quintals
  const [calcMoisture, setCalcMoisture] = useState("11.5"); // %
  const [calcAcres, setCalcAcres] = useState("5.0"); // acres

  const cropRates: Record<string, { ratePerQtl: number; maxMoisture: number; icon: string; category: string; harvestYieldPerAcre: number }> = {
    "Paddy (Basmati)": { ratePerQtl: 2850, maxMoisture: 14, icon: "🌾", category: "cereals", harvestYieldPerAcre: 22 },
    "Paddy (PR-126)": { ratePerQtl: 2183, maxMoisture: 14, icon: "🌾", category: "cereals", harvestYieldPerAcre: 28 },
    "Wheat (Sharbati)": { ratePerQtl: 2950, maxMoisture: 12, icon: "🌾", category: "cereals", harvestYieldPerAcre: 20 },
    "Wheat (HD-2967)": { ratePerQtl: 2275, maxMoisture: 12, icon: "🌾", category: "cereals", harvestYieldPerAcre: 24 },
    "Mustard (Pusa Bold)": { ratePerQtl: 5650, maxMoisture: 8, icon: "🌻", category: "oilseeds", harvestYieldPerAcre: 9 },
    "Soybean (Grade A)": { ratePerQtl: 4600, maxMoisture: 10, icon: "🫘", category: "oilseeds", harvestYieldPerAcre: 12 },
    "Cotton (Medium Staple)": { ratePerQtl: 6620, maxMoisture: 8, icon: "☁️", category: "cash", harvestYieldPerAcre: 14 },
    "Maize (Hybrid)": { ratePerQtl: 2090, maxMoisture: 14, icon: "🌽", category: "cereals", harvestYieldPerAcre: 30 },
  };

  const weatherData: Record<string, { temp: string; humidity: string; soilMoisture: string; advisory: string; rainChance: string }> = {
    "Kurnool (Hub 1)": { temp: "29.2°C", humidity: "58%", soilMoisture: "64% (Optimal)", advisory: "Ideal timing for micronutrient foliar spray (Zinc + Boron).", rainChance: "10%" },
    "Nandyal (Hub 2)": { temp: "30.1°C", humidity: "52%", soilMoisture: "58% (Moderate)", advisory: "Schedule light furrow irrigation within 48 hours.", rainChance: "5%" },
    "Adoni (Hub 3)": { temp: "28.4°C", humidity: "65%", soilMoisture: "70% (High)", advisory: "Hold irrigation. Inspect lower canopy for fungal blast signs.", rainChance: "35%" },
  };

  const cropStages = [
    {
      id: 0,
      title: "1. Seed & Sowing",
      tag: "Certified Germination",
      color: "sprout",
      icon: Sprout,
      desc: "Order certified seeds from regional hub, verify 98% germination guarantee, and receive customized soil prep guidance.",
      metrics: { label1: "Avg. Germination", val1: "98.4%", label2: "Seed Cost Saved", val2: "₹1,450/Acre" },
    },
    {
      id: 1,
      title: "2. Agronomy Advisory",
      tag: "Field Health Checks",
      color: "emerald",
      icon: CalendarCheck,
      desc: "Regional agronomists conduct scheduled farm visits, monitor leaf color index, and send WhatsApp & SMS pesticide dosage notes.",
      metrics: { label1: "Avg. Visits / Cycle", val1: "3 Inspections", label2: "Pest Loss Reduced", val2: "-35%" },
    },
    {
      id: 2,
      title: "3. Slot Booking",
      tag: "Zero Mandi Lines",
      color: "irrigation",
      icon: Warehouse,
      desc: "Reserve a dedicated warehouse delivery slot in advance. Automated intake slots prevent queue delays and transport demurrage.",
      metrics: { label1: "Avg. Waiting Time", val1: "18 Mins", label2: "Queue Reduction", val2: "85%" },
    },
    {
      id: 3,
      title: "4. Digital Weighbridge",
      tag: "Moisture & Grading",
      color: "harvest",
      icon: Scale,
      desc: "Real-time load cells weigh gross & tare truck weight. Digital moisture sensor automatically categorizes grade with transparent slip.",
      metrics: { label1: "Weighbridge Accuracy", val1: "±0.02%", label2: "Inspection Speed", val2: "3.5 Mins" },
    },
    {
      id: 4,
      title: "5. Instant Passbook",
      tag: "Direct Bank Payout",
      color: "soil",
      icon: CreditCard,
      desc: "Disbursement executed via RBI direct NEFT / RTGS with zero middleman cuts. Real-time double-entry passbook ledger notification.",
      metrics: { label1: "Settlement Time", val1: "< 2 Hours", label2: "Middleman Fee", val2: "₹0 Commission" },
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, seedsData] = await Promise.allSettled([
          api.public.getStats(),
          api.public.getSeeds(),
        ]);

        if (statsData.status === "fulfilled") setStats(statsData.value);
        if (seedsData.status === "fulfilled") setSeeds(seedsData.value || []);
      } catch (err) {
        console.error("Failed to load public data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculator logic
  const selectedCropConfig = cropRates[calcCrop] || { ratePerQtl: 2200, maxMoisture: 12, harvestYieldPerAcre: 20 };
  const quantityNum = parseFloat(calcQuantity) || 0;
  const moistureNum = parseFloat(calcMoisture) || 0;
  const moistureExcess = Math.max(0, moistureNum - selectedCropConfig.maxMoisture);
  const moistureDeduction = (moistureExcess * 0.01) * selectedCropConfig.ratePerQtl * quantityNum;
  const grossAmount = quantityNum * selectedCropConfig.ratePerQtl;
  const netEstimatedPayout = Math.max(0, grossAmount - moistureDeduction);

  const marketTickers = [
    { crop: "Paddy (Basmati)", rate: "₹2,850/qtl", trend: "+3.2%", color: "text-emerald-400" },
    { crop: "Wheat (Sharbati)", rate: "₹2,950/qtl", trend: "+1.8%", color: "text-amber-400" },
    { crop: "Mustard (Pusa Bold)", rate: "₹5,650/qtl", trend: "+4.5%", color: "text-amber-400" },
    { crop: "Soybean (Grade A)", rate: "₹4,600/qtl", trend: "+0.9%", color: "text-teal-400" },
    { crop: "Cotton (Medium)", rate: "₹6,620/qtl", trend: "+2.1%", color: "text-orange-400" },
    { crop: "Maize (Hybrid)", rate: "₹2,090/qtl", trend: "+1.4%", color: "text-lime-400" },
    { crop: "Gram / Chana", rate: "₹5,440/qtl", trend: "+2.6%", color: "text-amber-400" },
  ];

  const filteredSeeds = seeds.filter((s) => {
    if (seedCategory === "all") return true;
    if (seedCategory === "cereals") return s.name.toLowerCase().includes("paddy") || s.name.toLowerCase().includes("rice") || s.name.toLowerCase().includes("wheat") || s.name.toLowerCase().includes("maize");
    if (seedCategory === "oilseeds") return s.name.toLowerCase().includes("mustard") || s.name.toLowerCase().includes("soybean") || s.name.toLowerCase().includes("sunflower") || s.name.toLowerCase().includes("groundnut");
    if (seedCategory === "cash") return s.name.toLowerCase().includes("cotton") || s.name.toLowerCase().includes("chili") || s.name.toLowerCase().includes("sugarcane");
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-emerald-500 selection:text-white flex flex-col relative bg-grid-pattern">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[700px] bg-radial-gradient pointer-events-none" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-emerald-500/[0.05] blur-[140px] pointer-events-none rounded-full" />

      {/* Top Fixed Header */}
      <header className="sticky top-0 z-50 w-full border-b border-emerald-900/20 bg-[#082a1a]/95 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-lime-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
              <Sprout className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
                Agri<span className="text-emerald-400">Flow</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] text-emerald-300 font-mono tracking-wider font-semibold">
                DIGITAL AGRI-SUPPLY CHAIN
              </span>
            </div>
          </div>

          {/* Center Agro-Advisory Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/40 border border-emerald-500/30 text-xs font-semibold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Kurnool Hub: 29.2°C • 64% Moisture (Optimal)</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-emerald-800/40 rounded-xl border border-transparent hover:border-emerald-500/30 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
            >
              <span>Farmer Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Live Market MSP Ticker Bar */}
      <div className="w-full bg-[#0a3320] border-b border-emerald-800/40 py-2.5 overflow-hidden z-20">
        <div className="flex items-center">
          <div className="shrink-0 px-4 flex items-center gap-2 border-r border-emerald-700/40 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Live MSP Rates
          </div>
          <div className="overflow-hidden whitespace-nowrap flex-1">
            <div className="animate-marquee flex items-center gap-8 text-xs">
              {[...marketTickers, ...marketTickers].map((item, idx) => (
                <div key={idx} className="inline-flex items-center gap-2 text-slate-200">
                  <span className="font-semibold text-white">{item.crop}:</span>
                  <span className={`font-mono font-bold ${item.color}`}>{item.rate}</span>
                  <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                    {item.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* Hero Banner Section with Clear Video Background */}
        <section className="relative overflow-hidden min-h-[680px] lg:min-h-[780px] flex flex-col justify-end pt-12 pb-16 lg:pt-16 lg:pb-24 text-white">
          {/* Ambient Background Video with Maximum Clarity */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <video
              src="/AgriFlow_agricultural_ERP_platform_no_audio_gwr_video_mvp%20(1).mp4"
              className="w-full h-full object-cover object-center"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            >
              <source src="/AgriFlow_agricultural_ERP_platform_no_audio_gwr_video_mvp (1).mp4" type="video/mp4" />
            </video>

            {/* Subtle soft gradient fade at the very bottom edge to transition smoothly into the next section */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />
          </div>

          {/* Animated Ambient Glowing Orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[400px] bg-gradient-to-tr from-emerald-500/20 via-amber-500/15 to-teal-500/15 blur-[120px] pointer-events-none rounded-full animate-pulse-glow z-0" />

          {/* Floating UI Badges */}
          <div className="hidden xl:block absolute top-12 left-10 animate-float pointer-events-none z-10">
            <div className="glass-card p-3.5 rounded-2xl flex items-center gap-3 shadow-2xl border-emerald-500/30">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-left pr-2">
                <div className="text-xs font-bold text-white">Instant Passbook Credit</div>
                <div className="text-[10px] text-emerald-300 font-semibold">MSP Direct Disbursed</div>
              </div>
            </div>
          </div>

          <div className="hidden xl:block absolute top-12 right-10 animate-float-reverse pointer-events-none z-10">
            <div className="glass-card-harvest p-3.5 rounded-2xl flex items-center gap-3 shadow-2xl border-amber-500/30">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Scale className="w-5 h-5" />
              </div>
              <div className="text-left pr-2">
                <div className="text-xs font-bold text-white">Digital Weighbridge</div>
                <div className="text-[10px] text-amber-300 font-semibold">Zero Queuing Time</div>
              </div>
            </div>
          </div>

          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center z-10 mt-auto pt-28 sm:pt-40 lg:pt-48">
            {/* Top Pill Announcement */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-[#082a1a]/85 px-5 py-2 text-xs font-bold text-white mb-4 backdrop-blur-2xl shadow-xl">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>Next-Gen Agricultural Supply Chain & Farmer Procurement Platform</span>
            </div>

            {/* Description Card */}
            <div className="glass-panel p-4 sm:p-5 rounded-3xl max-w-2xl mx-auto border border-emerald-500/30 shadow-2xl backdrop-blur-2xl bg-[#082a1a]/85 text-center">
              <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                Empowering farmers with certified seeds, automated weighbridge inspection, real-time MSP procurement & transparent ledger passbooks.
              </p>
            </div>

            {/* CTAs */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-8 py-4 text-sm font-extrabold text-slate-950 shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105"
              >
                <span>Launch AgriFlow Portal</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-black/40 hover:bg-black/60 px-8 py-4 text-sm font-bold text-white transition-all backdrop-blur-md shadow-sm hover:border-emerald-400/40"
              >
                Farmer Registration
              </Link>
            </div>
          </div>
        </section>

        {/* Live System Counter Cards with Distinct Agricultural Themes */}
        <section className="py-12 border-y border-emerald-900/10 bg-[#f0fdf4]/50 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Cultivators - Sprout Green */}
              <div className="glass-card-sprout p-6 rounded-3xl text-center border-lime-500/25 transition-all">
                <div className="inline-flex p-3 rounded-2xl bg-lime-500/20 text-lime-300 mb-3 border border-lime-500/30">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {loading ? "..." : stats?.active_farmers ?? 45}+
                </div>
                <div className="text-xs text-lime-200 mt-1 font-semibold uppercase tracking-wider">
                  Active Cultivators
                </div>
              </div>

              {/* Crop Plots - Canopy Emerald */}
              <div className="glass-card p-6 rounded-3xl text-center border-emerald-500/25 transition-all">
                <div className="inline-flex p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 mb-3 border border-emerald-500/30">
                  <Sprout className="w-6 h-6" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {loading ? "..." : stats?.registered_crops ?? 128}+
                </div>
                <div className="text-xs text-emerald-200 mt-1 font-semibold uppercase tracking-wider">
                  Registered Crop Plots
                </div>
              </div>

              {/* Warehouses - Golden Harvest */}
              <div className="glass-card-harvest p-6 rounded-3xl text-center border-amber-500/25 transition-all">
                <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-amber-300 mb-3 border border-amber-500/30">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {loading ? "..." : stats?.active_warehouses ?? 6}
                </div>
                <div className="text-xs text-amber-200 mt-1 font-semibold uppercase tracking-wider">
                  Regional Warehouses
                </div>
              </div>

              {/* Procurement - Irrigation Teal */}
              <div className="glass-card-irrigation p-6 rounded-3xl text-center border-teal-500/25 transition-all">
                <div className="inline-flex p-3 rounded-2xl bg-teal-500/20 text-teal-300 mb-3 border border-teal-500/30">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {loading ? "..." : stats?.grain_procured_count ?? 94}+
                </div>
                <div className="text-xs text-teal-200 mt-1 font-semibold uppercase tracking-wider">
                  Procurement Lots Settled
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Agro-Advisory Weather & Soil Moisture Sensor Ribbon */}
        <section className="py-10 bg-white border-b border-emerald-900/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-800 text-xs font-bold mb-1.5">
                  <CloudSun className="w-3.5 h-3.5 text-teal-600" /> Real-time Agro-Advisory & Soil Sensors
                </div>
                <h3 className="text-xl font-bold text-slate-900">Regional Climate & Soil Diagnostics</h3>
              </div>

              {/* Interactive Regional Hub Selector */}
              <div className="flex items-center gap-2 flex-wrap">
                {Object.keys(weatherData).map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedWeatherCity(city)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      selectedWeatherCity === city
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-105"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Weather & Soil Sensor Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="glass-card-irrigation p-4 rounded-2xl border border-teal-500/30 flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300">
                  <Thermometer className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-teal-300 uppercase font-bold">Ambient Temp</div>
                  <div className="text-lg font-black text-white">{weatherData[selectedWeatherCity].temp}</div>
                </div>
              </div>

              <div className="glass-card-sprout p-4 rounded-2xl border border-lime-500/30 flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-lime-500/20 text-lime-300">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-lime-300 uppercase font-bold">Soil Moisture</div>
                  <div className="text-lg font-black text-white">{weatherData[selectedWeatherCity].soilMoisture}</div>
                </div>
              </div>

              <div className="glass-card-harvest p-4 rounded-2xl border border-amber-500/30 flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300">
                  <CloudSun className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-amber-300 uppercase font-bold">Rain Forecast</div>
                  <div className="text-lg font-black text-white">{weatherData[selectedWeatherCity].rainChance} Chance</div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 flex items-center gap-3.5 md:col-span-1">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-emerald-300 uppercase font-bold">Agronomist Recommendation</div>
                  <p className="text-xs text-white truncate font-medium">{weatherData[selectedWeatherCity].advisory}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive 5-Stage Crop Lifecycle Visualizer */}
        <section className="py-20 bg-[#f8fafc]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-500/10 border border-lime-600/30 text-lime-800 text-xs font-bold mb-3 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-lime-600" /> Interactive Farm-to-Disbursement Flow
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                5-Stage Guaranteed Agricultural Workflow
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2">
                Click any stage below to inspect the real-time digitized checkpoints for certified seeds, advisory, and direct payouts.
              </p>
            </div>

            {/* Clickable Stages Timeline */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
              {cropStages.map((stage) => {
                const Icon = stage.icon;
                const isActive = activeCropStage === stage.id;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setActiveCropStage(stage.id)}
                    className={`p-4 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between ${
                      isActive
                        ? "bg-[#0a3320] border-emerald-400 text-white shadow-xl shadow-emerald-900/20 scale-105"
                        : "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-xl ${isActive ? "bg-emerald-500/30 text-emerald-300" : "bg-slate-100 text-emerald-700"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-100 text-slate-600"}`}>
                        Step {stage.id + 1}
                      </span>
                    </div>
                    <div>
                      <div className={`text-xs font-extrabold ${isActive ? "text-white" : "text-slate-900"}`}>{stage.title}</div>
                      <div className={`text-[10px] font-medium mt-0.5 ${isActive ? "text-emerald-300" : "text-slate-500"}`}>{stage.tag}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Stage Interactive Showcase Card */}
            <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-emerald-500/30 shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-4 border border-emerald-500/30">
                    <span>Active Workflow Stage {activeCropStage + 1} of 5</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
                    {cropStages[activeCropStage].title}: {cropStages[activeCropStage].tag}
                  </h3>
                  <p className="text-sm text-slate-200 leading-relaxed mb-6 font-normal">
                    {cropStages[activeCropStage].desc}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-800/40">
                    <div className="p-3.5 rounded-2xl bg-black/30 border border-emerald-700/40">
                      <div className="text-[11px] text-slate-300">{cropStages[activeCropStage].metrics.label1}</div>
                      <div className="text-xl font-bold text-emerald-300 mt-0.5">{cropStages[activeCropStage].metrics.val1}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-black/30 border border-emerald-700/40">
                      <div className="text-[11px] text-slate-300">{cropStages[activeCropStage].metrics.label2}</div>
                      <div className="text-xl font-bold text-amber-300 mt-0.5">{cropStages[activeCropStage].metrics.val2}</div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-3">
                  <Link
                    href="/register"
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Register to Experience Step {activeCropStage + 1}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="w-full py-3 rounded-2xl bg-emerald-900/60 hover:bg-emerald-800 text-white text-xs font-bold transition-all border border-emerald-500/30 text-center"
                  >
                    View Farmer Portal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive MSP & Earnings Calculator Section with Visual Moisture Quality Gauge */}
        <section className="py-20 relative bg-white border-t border-emerald-900/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-600/30 text-amber-800 text-xs font-bold mb-3 uppercase tracking-wider shadow-sm">
                <Calculator className="w-3.5 h-3.5 text-amber-600" /> Interactive MSP Earnings & Moisture Gauge
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Simulate Your Guaranteed MSP Settlement
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2">
                Click any crop variety preset, adjust harvest volume and moisture %, and see the instant direct bank settlement.
              </p>
            </div>

            {/* Quick Interactive Crop Preset Chips */}
            <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
              {Object.keys(cropRates).map((crop) => (
                <button
                  key={crop}
                  onClick={() => setCalcCrop(crop)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    calcCrop === crop
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 scale-105"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>{cropRates[crop].icon}</span>
                  <span>{crop}</span>
                  <span className="opacity-80 font-mono text-[10px]">₹{cropRates[crop].ratePerQtl}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
              {/* Inputs Panel with Rich Green Card */}
              <div className="lg:col-span-7 glass-panel p-8 rounded-3xl border border-emerald-500/30 space-y-5 shadow-2xl">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-2 uppercase tracking-wider">
                    Selected Crop Variety & MSP Benchmark
                  </label>
                  <select
                    value={calcCrop}
                    onChange={(e) => setCalcCrop(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-emerald-600/40 text-sm text-white focus:outline-none focus:border-emerald-400 font-semibold"
                  >
                    {Object.keys(cropRates).map((crop) => (
                      <option key={crop} value={crop}>
                        {cropRates[crop].icon} {crop} (MSP: ₹{cropRates[crop].ratePerQtl}/qtl)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Harvest (Quintals)
                      </label>
                      <span className="text-xs font-mono font-bold text-emerald-300">{calcQuantity} Qtl</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="300"
                      step="5"
                      value={calcQuantity}
                      onChange={(e) => setCalcQuantity(e.target.value)}
                      className="w-full accent-emerald-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                      <span>5 Qtl</span>
                      <span>150 Qtl</span>
                      <span>300 Qtl</span>
                    </div>
                    <span className="text-[11px] text-slate-300 mt-1 block font-medium">
                      Equivalent to {(quantityNum * 100).toLocaleString("en-IN")} kg
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Moisture Content (%)
                      </label>
                      <span className={`text-xs font-mono font-bold ${moistureNum > selectedCropConfig.maxMoisture ? "text-rose-400" : "text-emerald-300"}`}>
                        {calcMoisture}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="22"
                      step="0.5"
                      value={calcMoisture}
                      onChange={(e) => setCalcMoisture(e.target.value)}
                      className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                      <span>5% (Dry)</span>
                      <span>Max: {selectedCropConfig.maxMoisture}%</span>
                      <span>22% (Wet)</span>
                    </div>

                    {/* Moisture Quality Visual Zone Gauge */}
                    <div className="mt-2 h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div className="w-[50%] bg-emerald-500" title="Zero Deduction Zone" />
                      <div className="w-[25%] bg-amber-500" title="Tolerance Buffer" />
                      <div className="w-[25%] bg-rose-500" title="Deduction Zone" />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-emerald-700/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Base Government MSP:</span>
                    <span className="text-white font-bold font-mono">₹{selectedCropConfig.ratePerQtl}/quintal</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Gross MSP Lot Value:</span>
                    <span className="text-white font-bold font-mono">₹{grossAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Moisture Quality Adjustment:</span>
                    <span className={`font-bold font-mono ${moistureDeduction > 0 ? "text-rose-400" : "text-emerald-300"}`}>
                      {moistureDeduction > 0 ? `-₹${moistureDeduction.toLocaleString("en-IN")}` : "₹0 (Zero Deduction • Optimal)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Output Result Card - Golden Harvest Theme */}
              <div className="lg:col-span-5 glass-card-harvest p-8 rounded-3xl border-2 border-amber-400/40 relative overflow-hidden flex flex-col justify-between h-full shadow-2xl">
                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Guaranteed Direct Payout
                    </span>
                  </div>

                  <span className="text-xs text-slate-300 font-medium">Net Passbook Settlement</span>
                  <div className="text-3xl sm:text-4xl font-black text-white mt-1 mb-2 tracking-tight font-mono">
                    ₹{Math.round(netEstimatedPayout).toLocaleString("en-IN")}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-6">
                    Settled directly into verified bank account via RBI NEFT / RTGS with automated double-entry passbook SMS.
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-amber-800/40">
                  <div className="flex items-center gap-2 text-xs text-white">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    100% MSP Rate Assurance (₹{selectedCropConfig.ratePerQtl}/qtl)
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    No mandi commission or hidden deductions
                  </div>
                  <Link
                    href="/register"
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
                  >
                    <span>Register to Book Delivery</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Seed Varieties Catalog Grid with Category Tabs */}
        <section className="py-20 border-t border-emerald-900/10 bg-[#f8fafc]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-600/30 text-emerald-800 text-xs font-bold mb-2 uppercase tracking-wider">
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" /> Certified Varieties Catalog
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  High-Yield Seed Store
                </h2>
              </div>

              {/* Interactive Category Filter Tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSeedCategory("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    seedCategory === "all" ? "bg-emerald-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  All Varieties ({seeds.length})
                </button>
                <button
                  onClick={() => setSeedCategory("cereals")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    seedCategory === "cereals" ? "bg-emerald-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  🌾 Cereals & Paddy
                </button>
                <button
                  onClick={() => setSeedCategory("oilseeds")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    seedCategory === "oilseeds" ? "bg-emerald-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  🌻 Oilseeds & Mustard
                </button>
                <button
                  onClick={() => setSeedCategory("cash")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    seedCategory === "cash" ? "bg-emerald-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  ☁️ Cash Crops
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {filteredSeeds.length === 0 ? (
                <div className="col-span-4 glass-card p-12 rounded-3xl text-center">
                  <Sprout className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-300">No seeds match the selected category.</p>
                </div>
              ) : (
                filteredSeeds.map((seed) => (
                  <div
                    key={seed.id}
                    className="glass-card p-6 rounded-3xl flex flex-col justify-between border border-emerald-500/25 transition-all hover:scale-[1.02]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                          {seed.variety || "High Yield"}
                        </span>
                        <span className="text-xs font-semibold text-slate-300">
                          {seed.stock_kg} kg stock
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mb-1">{seed.name}</h4>
                      {seed.description && (
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{seed.description}</p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-emerald-800/40 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Rate</span>
                        <div className="text-base font-bold text-emerald-300 font-mono">₹{seed.price_per_kg}/kg</div>
                      </div>
                      <Link
                        href="/login"
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md"
                      >
                        Order Seed
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="py-20 border-t border-emerald-900/10 relative bg-white">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="glass-panel p-10 sm:p-14 rounded-3xl border-2 border-emerald-500/40 relative overflow-hidden shadow-2xl">
              <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Ready to Experience Modern Agritech?
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-200 max-w-xl mx-auto leading-relaxed font-normal">
                Join our regional digital network today. Get guaranteed MSP pricing, seamless warehouse delivery slots, and transparent instant disbursements.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="px-8 py-4 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105"
                >
                  Create Farmer Account
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 rounded-2xl bg-emerald-800/50 hover:bg-emerald-700/60 text-white font-bold text-sm transition-all border border-emerald-500/30"
                >
                  Access Platform
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modern High-Contrast Footer */}
      <footer className="border-t border-emerald-900/40 bg-[#062013] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-md">
              <Sprout className="w-4 h-4 text-slate-950" />
            </div>
            <span className="text-sm font-bold text-white">AgriFlow Agricultural Platform</span>
          </div>

          <div className="flex items-center gap-6 text-slate-200 font-medium">
            <Link href="/login" className="hover:text-emerald-300 transition-colors">Farmer Login</Link>
            <Link href="/login" className="hover:text-emerald-300 transition-colors">Warehouse Manager</Link>
            <Link href="/login" className="hover:text-emerald-300 transition-colors">Admin Dashboard</Link>
          </div>

          <div className="text-slate-400">
            © {new Date().getFullYear()} AgriFlow Technologies. All rights reserved. Digital Agricultural Logistics & Procurement.
          </div>
        </div>
      </footer>
    </div>
  );
}
