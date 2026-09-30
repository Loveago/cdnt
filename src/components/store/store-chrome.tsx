"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  ShoppingBag,
  Clock,
  Menu as MenuIcon,
  X,
  ChevronRight,
  Home,
  RotateCcw,
  ChevronDown,
  UserRound,
  Send,
  ShieldCheck,
  Zap,
  Sparkles,
  Smartphone,
  PhoneCall,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { NetworkLogo } from "./network-logo";
import { NETWORK_BRANDS, networkHref, storeHref } from "./brands";
import type { NetworkProvider } from "@/lib/types";

export interface StoreChromeProps {
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  whatsapp?: string | null;
  whatsappGroupLink?: string | null;
  email?: string | null;
  location?: string | null;
  contactText?: string | null;
  whatsappLabel?: string | null;
  notice?: string | null;
  networks: NetworkProvider[];
  children: React.ReactNode;
}

function whatsappLink(number: string | null | undefined, text?: string): string | null {
  if (!number) return null;
  const digits = number.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `233${digits.slice(1)}` : digits;
  return text ? `https://wa.me/${intl}?text=${encodeURIComponent(text)}` : `https://wa.me/${intl}`;
}

export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function BrandDot({ network }: { network: NetworkProvider }) {
  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-xs ${NETWORK_BRANDS[network].tile}`}
    >
      <NetworkLogo network={network} className="h-full w-full" />
    </span>
  );
}

function AppearanceToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-slate-200 transition-colors dark:bg-slate-700/80 ${className} cursor-pointer`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${dark ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

function StoreMark({
  name,
  logoUrl,
  size = "h-9 w-9",
}: {
  name: string;
  logoUrl?: string | null;
  size?: string;
}) {
  return (
    <span
      className={`relative inline-flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-emerald-950 ring-2 ring-emerald-500/20 shadow-xs`}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs font-black text-white tracking-wider">{name.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  );
}

export function StoreChrome(props: StoreChromeProps) {
  const {
    name,
    slug,
    description,
    logoUrl,
    whatsapp,
    whatsappGroupLink,
    email,
    location,
    whatsappLabel,
    notice,
    networks,
    children,
  } = props;
  const [shopOpen, setShopOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [promoVisible, setPromoVisible] = React.useState(true);
  const [chatBoxOpen, setChatBoxOpen] = React.useState(false);
  const [chatMessage, setChatMessage] = React.useState("");

  const wa = whatsappLink(whatsapp);
  const channelUrl = whatsappGroupLink || wa;
  const bannerText = notice?.trim() || "⚡ Automated Mobile Money checkout — data bundles delivered to any number reliably.";

  return (
    <div className="min-h-screen bg-[#f4f7fb] dark:bg-[#070c14] text-slate-900 dark:text-slate-100 transition-colors pb-16 sm:pb-0">
      {/* Announcement banner */}
      {promoVisible && (
        <div
          className="banner-container relative bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 px-10 py-2 text-center text-xs font-medium text-emerald-200 border-b border-emerald-500/20 overflow-hidden"
          role="region"
          aria-label="Store Announcement"
        >
          <div className="relative flex w-full overflow-hidden justify-center">
            <div className="animate-banner-slide py-0.5 text-xs sm:text-sm font-medium tracking-wide text-white">
              <span className="inline-flex items-center gap-2 px-6">
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] uppercase tracking-wider font-extrabold text-emerald-300">
                  Notice
                </span>
                <span>{bannerText}</span>
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setPromoVisible(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-full p-1 bg-slate-950/80 backdrop-blur-xs text-white/70 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Modern Floating Island Dock Header */}
      <div className="sticky top-0 z-40 px-3 sm:px-6 pt-3">
        <header className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl bg-white/90 px-3.5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/5 backdrop-blur-2xl dark:bg-[#0d1627]/90 dark:ring-white/10 dark:shadow-none">
          <Link href={storeHref(slug)} className="flex items-center gap-2.5 group">
            <StoreMark name={name} logoUrl={logoUrl} />
            <div className="flex flex-col">
              <span className="font-black text-sm sm:text-base tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                {name}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Verified Merchant
              </span>
            </div>
          </Link>

          {/* Desktop Center Segmented Navigation Dock */}
          <div className="relative hidden items-center gap-1 md:flex bg-slate-100/80 dark:bg-white/5 p-1 rounded-xl border border-slate-200/60 dark:border-white/5">
            <button
              type="button"
              onClick={() => setShopOpen((v) => !v)}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all cursor-pointer ${
                shopOpen
                  ? "bg-white text-emerald-700 shadow-sm dark:bg-emerald-500/20 dark:text-emerald-300"
                  : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5 text-emerald-500" />
              Shop Bundles
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${shopOpen ? "rotate-180" : ""}`} />
            </button>

            <Link
              href={storeHref(slug, "track")}
              className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
            >
              <Clock className="h-3.5 w-3.5 text-cyan-500" />
              Track Order
            </Link>

            {shopOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close shop menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setShopOpen(false)}
                />
                <div className="absolute left-0 top-11 z-20 w-80 rounded-2xl bg-white p-3.5 shadow-2xl ring-1 ring-slate-900/10 backdrop-blur-2xl dark:bg-[#0f1a2e] dark:ring-white/10 animate-in fade-in zoom-in-95 duration-150">
                  <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Select Network Carrier
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {networks.map((n) => (
                      <Link
                        key={n}
                        href={networkHref(slug, n)}
                        onClick={() => setShopOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl p-2 text-xs font-bold text-slate-800 hover:bg-slate-100/80 dark:text-slate-100 dark:hover:bg-white/10 transition"
                      >
                        <BrandDot network={n} />
                        <span>{NETWORK_BRANDS[n].label}</span>
                        <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          View Bundles →
                        </span>
                      </Link>
                    ))}
                    {networks.length === 0 && (
                      <p className="px-3 py-2 text-xs text-slate-500">No bundles on sale right now.</p>
                    )}
                  </div>
                  <div className="mt-2.5 border-t border-slate-100 pt-2 dark:border-white/10 flex flex-col gap-1">
                    <Link
                      href={storeHref(slug, "#shop")}
                      onClick={() => setShopOpen(false)}
                      className="block rounded-lg px-2 py-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10 transition"
                    >
                      Browse full package catalog →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <AppearanceToggle className="mx-1 hidden sm:inline-flex" />
            {wa && (
              <button
                type="button"
                onClick={() => setChatBoxOpen((v) => !v)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition cursor-pointer"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Support
              </button>
            )}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 transition cursor-pointer"
            >
              <MenuIcon className="h-4 w-4" />
              Menu
            </button>
          </div>
        </header>
      </div>

      <main>{children}</main>

      {/* Modern Multi-Column Bento Footer */}
      <footer className="mt-20 px-4 pb-12">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white/85 p-8 sm:p-12 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-2xl dark:bg-[#0d1627]/85 dark:ring-white/10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Merchant Bio */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <StoreMark name={name} logoUrl={logoUrl} size="h-10 w-10" />
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">{name}</h3>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    Verified Telecom Reseller Partner
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                {description || "Instant telecom non-expiry data packages delivered directly to SIM cards via automated Mobile Money checkout."}
              </p>
              {location && <p className="text-xs text-slate-400">📍 {location}</p>}
            </div>

            {/* Carriers Directory */}
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Data Networks
              </p>
              <ul className="mt-4 space-y-2">
                {networks.map((n) => (
                  <li key={n}>
                    <Link
                      href={networkHref(slug, n)}
                      className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
                    >
                      <BrandDot network={n} />
                      {NETWORK_BRANDS[n].label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href={storeHref(slug, "#shop")}
                    className="inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
                  >
                    View all packages →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Trust & MoMo Compliance */}
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                MoMo Verification
              </p>
              <div className="mt-4 space-y-2.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>MTN MoMo Accepted</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-teal-500" />
                  <span>Telecel Cash Accepted</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                  <span>AT Money Accepted</span>
                </div>
                <div className="pt-2">
                  <Link
                    href={storeHref(slug, "track")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                  >
                    <Clock className="h-3.5 w-3.5" /> Track Live Order Status
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
            <p className="flex flex-wrap items-center gap-1.5">
              <span>{name} © {new Date().getFullYear()}</span>
              <span>·</span>
              <a
                href="https://wa.me/233507904981"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
              >
                <span>Powered by</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                  Crazy Tech Enterprise
                </span>
              </a>
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                Paystack 256-Bit SSL Encrypted
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Dock (Distinctive Modern App Feel) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200 px-4 py-2 backdrop-blur-xl dark:bg-[#0a1120]/95 dark:border-white/10 sm:hidden">
        <div className="flex items-center justify-around">
          <Link
            href={storeHref(slug)}
            className="flex flex-col items-center gap-1 py-1 text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400"
          >
            <Home className="h-4 w-4" />
            <span className="text-[10px] font-bold">Home</span>
          </Link>
          <a
            href={storeHref(slug, "#shop")}
            className="flex flex-col items-center gap-1 py-1 text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="text-[10px] font-bold">Bundles</span>
          </a>
          <Link
            href={storeHref(slug, "track")}
            className="flex flex-col items-center gap-1 py-1 text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400"
          >
            <Clock className="h-4 w-4" />
            <span className="text-[10px] font-bold">Track</span>
          </Link>
          {wa && (
            <button
              type="button"
              onClick={() => setChatBoxOpen(true)}
              className="flex flex-col items-center gap-1 py-1 text-emerald-600 dark:text-emerald-400"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span className="text-[10px] font-bold">Help</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Action Buttons & Admin Chat Box (Desktop / Tablet) */}
      <div className="fixed bottom-5 right-5 z-40 hidden sm:flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        {chatBoxOpen && (
          <div
            role="dialog"
            aria-label="Chat with Admin"
            className="w-88 md:w-96 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-2xl transition-all duration-200 animate-in fade-in zoom-in-95 dark:border-white/10 dark:bg-[#0d1627]/95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <StoreMark name={name} logoUrl={logoUrl} size="h-8 w-8" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Direct Store Support
                  </h3>
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online for {name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close chat box"
                onClick={() => setChatBoxOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-50/60 p-2.5 text-xs text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Fast Resolution</p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    Enter your order reference or recipient phone number for swift assistance.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = chatMessage.trim();
                const target = trimmed ? whatsappLink(whatsapp, trimmed) : wa;
                if (target) {
                  window.open(target, "_blank", "noopener,noreferrer");
                  setChatBoxOpen(false);
                  setChatMessage("");
                }
              }}
              className="mt-3 space-y-3"
            >
              <textarea
                rows={3}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message or order reference..."
                autoFocus
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Opens WhatsApp
                </span>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-teal-500 hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex flex-col gap-2.5 items-end">
          {wa && (
            <button
              type="button"
              aria-label="Chat with Admin"
              onClick={() => setChatBoxOpen((v) => !v)}
              className="group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-950/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              {chatBoxOpen ? <X className="h-5 w-5" /> : <WhatsAppIcon className="h-6 w-6 text-white" />}
              <span className="pointer-events-none absolute right-full mr-2.5 hidden whitespace-nowrap rounded-lg bg-slate-900/90 px-2.5 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-xs sm:group-hover:inline-block">
                {chatBoxOpen ? "Close chat" : "Chat on WhatsApp"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Slide-out Menu Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs cursor-default"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl dark:bg-[#0d1627] border-l border-slate-200/80 dark:border-white/10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <StoreMark name={name} logoUrl={logoUrl} size="h-7 w-7" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{name}</h2>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-4 border border-emerald-500/20 text-slate-900 dark:text-white">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold">
                  <UserRound className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Customer Portal</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Direct SIM telecom crediting</p>
                </div>
              </div>
            </div>

            <p className="px-5 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </p>
            <nav className="px-3 space-y-1">
              <Link
                href={storeHref(slug)}
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:text-white dark:hover:bg-white/10 transition"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Home className="h-4 w-4" />
                </span>
                Home Store
                <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
              </Link>
              <Link
                href={storeHref(slug, "track")}
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:text-white dark:hover:bg-white/10 transition"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Clock className="h-4 w-4" />
                </span>
                Track Orders
                <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
              </Link>
            </nav>

            <p className="px-5 pb-1 pt-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Carriers & Packages
            </p>
            <nav className="px-3 space-y-1">
              {networks.map((n) => (
                <Link
                  key={n}
                  href={networkHref(slug, n)}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 dark:text-white dark:hover:bg-white/10 transition"
                >
                  <BrandDot network={n} />
                  <span>{NETWORK_BRANDS[n].label}</span>
                  <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                </Link>
              ))}
            </nav>

            <div className="mt-auto space-y-3 px-4 pb-6 pt-6 border-t border-slate-100 dark:border-white/10">
              <div className="flex items-center justify-between rounded-xl px-2 py-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Appearance Mode</span>
                <AppearanceToggle />
              </div>
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-center text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition"
                >
                  {whatsappLabel || "Contact Store Admin"}
                </a>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
