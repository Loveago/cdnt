"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  ShieldCheck,
  Zap,
  Sparkles,
  Store,
  Terminal,
  Activity,
  Cpu,
} from "lucide-react";

const LIVE_DISPATCHES = [
  { time: "Just now", network: "MTN", bundle: "5GB Non-Expiry", phone: "024***8921", latency: "1.2s", status: "DELIVERED" },
  { time: "18s ago", network: "Telecel", bundle: "10GB Non-Expiry", phone: "050***3419", latency: "1.6s", status: "DELIVERED" },
  { time: "42s ago", network: "AT", bundle: "2.5GB High-Speed", phone: "027***5104", latency: "0.9s", status: "DELIVERED" },
  { time: "1m ago", network: "MTN", bundle: "20GB Big-Pack", phone: "054***9012", latency: "1.4s", status: "DELIVERED" },
];

const POPULAR_HANDLES = ["alpha-data", "ghana-bundles", "swift-telecom", "prime-data"];

export default function StorefrontIndexPage() {
  const router = useRouter();
  const [slugInput, setSlugInput] = useState("");
  const [displayHost, setDisplayHost] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.host.replace(/^www\./, "");
      if (
        !host ||
        host.includes("localhost") ||
        host.includes("127.0.0.1") ||
        host.toLowerCase().includes("mycedinet")
      ) {
        setDisplayHost("mycedishop.com");
      } else {
        setDisplayHost(host);
      }
    }
  }, []);

  function handleGoToStore(e: React.FormEvent, customSlug?: string) {
    if (e) e.preventDefault();
    const targetSlug = customSlug || slugInput;
    const clean = targetSlug.trim().toLowerCase().replace(/^@/, "");
    if (clean) {
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/store")) {
        router.push(`/store/${clean}`);
      } else {
        router.push(`/${clean}`);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#060b13] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white overflow-hidden">
      {/* Dynamic Ambient Background Lights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[750px] h-[550px] bg-gradient-to-tr from-emerald-600/20 via-teal-600/15 to-transparent blur-3xl opacity-80" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[500px] bg-gradient-to-bl from-cyan-600/15 via-emerald-900/10 to-transparent blur-3xl opacity-60" />
        <div className="absolute -bottom-32 left-10 w-[500px] h-[450px] bg-gradient-to-tr from-emerald-900/20 via-teal-900/10 to-transparent blur-3xl opacity-50" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 border-b border-white/[0.08] px-4 sm:px-8 py-4 backdrop-blur-xl bg-slate-950/60 sticky top-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 ring-1 ring-emerald-500/20 text-emerald-400 group-hover:ring-emerald-500/40 transition-all">
              <Store className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="flex items-baseline leading-none">
              <span className="font-black tracking-tight text-lg text-white group-hover:text-emerald-400 transition-colors">
                cedi<span className="text-emerald-400">shop</span>
              </span>
              <span className="text-xs text-slate-500 ml-1">.com</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Telecom Switching Live
            </div>
          </div>
        </div>
      </header>

      {/* Hero Showcase Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-12 lg:py-16 my-auto w-full">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Direct Access & Headline */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 shadow-sm shadow-emerald-500/10">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              Ghana&apos;s Decentralized Reseller Telecom Network
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
              Connect to Any <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Merchant Storefront
              </span>{" "}
              Instantly.
            </h1>

            <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
              Every verified merchant operates an automated digital shop with direct telecom switch integration.
              Select packages, pay with Mobile Money, and receive non-expiry SIM data in under 2 seconds.
            </p>

            {/* Quick Search Command Form */}
            <div className="pt-2 max-w-xl">
              <form
                onSubmit={(e) => handleGoToStore(e)}
                className="flex flex-col sm:flex-row items-stretch gap-2.5 bg-slate-900/90 border border-white/15 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
              >
                <div className="flex items-center flex-1 px-3 text-slate-400 text-sm">
                  <span className="font-semibold text-emerald-500 select-none mr-2 flex items-center gap-1.5 shrink-0">
                    <Store className="h-4 w-4" />
                    {displayHost ? `${displayHost}/` : "store/"}
                  </span>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) => setSlugInput(e.target.value)}
                    placeholder="reseller-handle"
                    className="w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-sm font-semibold"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] transition px-6 py-3 font-extrabold text-sm text-slate-950 shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  Visit Store
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* Sample / Quick handles */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="text-slate-500">Popular Stores:</span>
                {POPULAR_HANDLES.map((handle) => (
                  <button
                    key={handle}
                    type="button"
                    onClick={(e) => {
                      setSlugInput(handle);
                      handleGoToStore(e, handle);
                    }}
                    className="rounded-lg bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-300 border border-white/10 px-2.5 py-1 text-slate-300 transition cursor-pointer font-mono"
                  >
                    @{handle}
                  </button>
                ))}
              </div>
            </div>

            {/* Carrier Status Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">Carrier Nodes:</span>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                MTN 4G/5G (Active)
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/20 bg-teal-500/5 px-3 py-1 text-xs font-bold text-teal-300">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                Telecel (Active)
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-xs font-bold text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                AT Ghana (Active)
              </div>
            </div>
          </div>

          {/* Right Column: Live Simulated Dispatch Terminal */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-white/15 bg-slate-900/80 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
              <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-500/20 blur-2xl" />

              {/* Terminal Title Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-300 ml-2 flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                    telecom-dispatch.live
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  <Activity className="h-3 w-3 animate-spin" />
                  99.98% Latency ~1.2s
                </span>
              </div>

              {/* Terminal Content: Live Feed */}
              <div className="mt-4 space-y-3">
                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pb-1">
                  <span>REAL-TIME SIM FULFILLMENT STREAM</span>
                  <span className="text-emerald-400">PULSE: OK</span>
                </div>

                {LIVE_DISPATCHES.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/[0.07] bg-slate-950/60 p-3 space-y-1.5 hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white">{item.network}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{item.bundle}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        {item.status} ({item.latency})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>Dest: {item.phone}</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Terminal Summary Card */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-teal-400" />
                  Direct Multi-SIM Daemon
                </span>
                <span className="font-mono text-emerald-400 font-semibold">Zero Queue Backlog</span>
              </div>
            </div>
          </div>
        </div>

        {/* Asymmetrical Bento Platform Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Bento Card 1: Direct Carrier Pipeline */}
          <div className="md:col-span-2 rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl space-y-4 hover:border-emerald-500/30 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                Carrier USSD Switched
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                Instant Automated Dispatch Engine
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-xl">
                Unlike legacy manual resellers, stores on this network trigger immediate automated packet dispatches directly upon payment confirmation. Bundles land on recipient SIM cards without delay.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5">
                <div className="font-extrabold text-white text-base">MTN</div>
                <div className="text-[10px] text-slate-500">4G/5G Non-Expiry</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5">
                <div className="font-extrabold text-white text-base">Telecel</div>
                <div className="text-[10px] text-slate-500">Official Bundles</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-950/40 p-2.5">
                <div className="font-extrabold text-white text-base">AT</div>
                <div className="text-[10px] text-slate-500">Fast Data Delivery</div>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Track Orders Directly */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl space-y-4 hover:border-cyan-500/30 transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                Track Existing Purchases
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Have an ongoing order? Track carrier delivery status anytime with your phone number or Paystack payment reference.
              </p>
            </div>
            <div className="pt-4">
              <div className="text-xs text-cyan-400/90 font-mono bg-cyan-500/10 border border-cyan-500/20 p-2.5 rounded-xl text-center">
                Format: /[store-name]/track
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] px-4 sm:px-8 py-6 backdrop-blur-md bg-slate-950/60 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-slate-400">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400">
              <Store className="h-3 w-3" />
            </div>
            <span className="font-semibold text-slate-300">Reseller Telecom Network © {new Date().getFullYear()}</span>
            <span>·</span>
            <a
              href="https://wa.me/233507904981"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors group"
            >
              <span>Powered by</span>
              <span className="font-bold text-emerald-400 group-hover:underline">
                Crazy Tech Enterprise
              </span>
            </a>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Direct Telecom Switch</span>
            <span>·</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Direct Carrier Switched
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
