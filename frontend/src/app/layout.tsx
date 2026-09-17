import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgriFlow | Enterprise Agricultural Supply Chain & MSP Procurement Platform",
  description: "Proprietary digital agro-logistics platform featuring automated weighbridge integration, certified seed distribution, real-time MSP procurement pipelines, and double-entry farmer ledger passbooks.",
  keywords: [
    "AgriFlow",
    "agricultural ERP",
    "farmer procurement",
    "MSP direct disbursement",
    "digital weighbridge",
    "certified seeds catalog",
    "grain warehouse logistics",
  ],
  authors: [{ name: "AgriFlow Technologies" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#f8fafc] text-slate-900 selection:bg-emerald-500 selection:text-white">
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
