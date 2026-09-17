"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { Notification } from "@/lib/types";
import {
  Bell,
  Check,
  ChevronDown,
  LogOut,
  Menu,
  Shield,
  Sprout,
  User,
  Warehouse,
  ExternalLink,
} from "lucide-react";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, logout, demoLogin } = useAuth();
  const { success, error } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch notifications if user is logged in
  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const notifs = await api.notifications.get();
        setNotifications(notifs || []);
      } catch (e) {
        // Silent fail or non-blocking
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      success("All notifications marked as read");
    } catch {
      error("Failed to mark notifications as read");
    }
  };

  const handleMarkOneRead = async (id: number) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const roleColor = {
    admin: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    super_admin: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    manager: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    farmer: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  }[user?.role || "farmer"];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/[0.08] bg-[#0c120e]/90 px-4 sm:px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors lg:hidden"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Sprout className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            Agri<span className="text-emerald-400">Flow</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
              FastAPI
            </span>
          </span>
        </Link>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick Demo Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Switch Role</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleSwitcher && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl z-40 animate-in fade-in zoom-in-95"
              onMouseLeave={() => setShowRoleSwitcher(false)}
            >
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                1-Click Demo Login
              </p>
              <button
                onClick={() => {
                  demoLogin("admin");
                  setShowRoleSwitcher(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg text-slate-200 hover:bg-teal-500/20 hover:text-teal-300 transition-colors text-left"
              >
                <Shield className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <div className="font-medium">Admin Portal</div>
                  <div className="text-[10px] text-slate-400">admin@agriflow.local</div>
                </div>
              </button>
              <button
                onClick={() => {
                  demoLogin("manager");
                  setShowRoleSwitcher(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 transition-colors text-left"
              >
                <Warehouse className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-medium">Manager Portal</div>
                  <div className="text-[10px] text-slate-400">manager@agriflow.local</div>
                </div>
              </button>
              <button
                onClick={() => {
                  demoLogin("farmer");
                  setShowRoleSwitcher(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors text-left"
              >
                <Sprout className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-medium">Farmer Portal</div>
                  <div className="text-[10px] text-slate-400">farmer@agriflow.local</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        {user && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl z-40 overflow-hidden animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/50">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkOneRead(n.id)}
                        className={`p-3.5 hover:bg-slate-800/40 transition-colors cursor-pointer ${
                          !n.is_read ? "bg-slate-800/20" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-semibold text-slate-200">{n.title}</h5>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Profile or Login CTA */}
        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-800/70 border border-transparent hover:border-slate-700/60 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-sm shadow-sm">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-white truncate max-w-[120px]">
                  {user.name}
                </div>
                <div
                  className={`inline-block px-1.5 py-0.2 text-[10px] rounded uppercase font-bold border ${roleColor}`}
                >
                  {user.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl z-40 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <div className="text-xs font-bold text-white truncate">{user.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user.email || user.phone}</div>
                </div>

                {user.role === "farmer" && (
                  <Link
                    href="/farmer/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4 text-emerald-400" />
                    My Farm Profile
                  </Link>
                )}

                <Link
                  href="/"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-teal-400" />
                  Public Landing Page
                </Link>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow-md shadow-emerald-500/20 transition-all"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
