"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, UserRole } from "@/lib/types";
import { api } from "@/lib/api";
import { useToast } from "./ToastContext";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (phone_or_email: string, password: string) => Promise<boolean>;
  demoLogin: (role: "admin" | "manager" | "farmer") => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
  isFarmer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { success, error } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("agriflow_token");
      const storedUser = localStorage.getItem("agriflow_user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to load auth from storage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (phone_or_email: string, password: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        const res = await api.auth.login(phone_or_email, password);
        const jwtToken = res.token;
        const userData = res.user;

        setToken(jwtToken);
        setUser(userData);
        localStorage.setItem("agriflow_token", jwtToken);
        localStorage.setItem("agriflow_user", JSON.stringify(userData));

        success(`Welcome back, ${userData.name}!`);

        // Navigate based on role
        if (userData.role === "admin" || userData.role === "super_admin") {
          router.push("/admin/dashboard");
        } else if (userData.role === "manager") {
          router.push("/manager/dashboard");
        } else {
          router.push("/farmer/dashboard");
        }
        return true;
      } catch (err: any) {
        error(err.message || "Invalid credentials. Please try again.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [router, success, error]
  );

  const demoLogin = useCallback(
    async (role: "admin" | "manager" | "farmer"): Promise<boolean> => {
      const credentials = {
        admin: { login: "admin@agriflow.local", pass: "AdminPassword123!" },
        manager: { login: "manager@agriflow.local", pass: "ManagerPassword123!" },
        farmer: { login: "farmer@agriflow.local", pass: "FarmerPassword123!" },
      }[role];

      return login(credentials.login, credentials.pass);
    },
    [login]
  );

  const register = useCallback(
    async (data: any): Promise<boolean> => {
      try {
        setIsLoading(true);
        const res = await api.auth.register(data);
        if (res.token && res.user) {
          setToken(res.token);
          setUser(res.user);
          localStorage.setItem("agriflow_token", res.token);
          localStorage.setItem("agriflow_user", JSON.stringify(res.user));
          success(res.message || "Registration successful!");
          router.push("/farmer/dashboard");
        } else {
          success(res.message || "Registration submitted! Waiting for approval.");
          router.push("/login");
        }
        return true;
      } catch (err: any) {
        error(err.message || "Registration failed. Please check your details.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [router, success, error]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("agriflow_token");
    localStorage.removeItem("agriflow_user");
    setUser(null);
    setToken(null);
    success("Logged out successfully");
    router.push("/login");
  }, [router, success]);

  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    try {
      const updated = await api.auth.getUserData(user.id);
      if (updated?.user) {
        setUser(updated.user);
        localStorage.setItem("agriflow_user", JSON.stringify(updated.user));
      }
    } catch (e) {
      console.error("Failed to refresh user data", e);
    }
  }, [user?.id]);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isManager = user?.role === "manager";
  const isFarmer = user?.role === "farmer";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        demoLogin,
        register,
        logout,
        refreshUser,
        isAdmin,
        isManager,
        isFarmer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
