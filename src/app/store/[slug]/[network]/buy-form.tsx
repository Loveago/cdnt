"use client";

import * as React from "react";
import {
  Loader2,
  X,
  ShoppingBag,
  Smartphone,
  Mail,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Flame,
  Check,
} from "lucide-react";
import { NetworkLogo } from "@/components/store/network-logo";
import { NETWORK_BRANDS, ghs } from "@/components/store/brands";
import type { NetworkProvider } from "@/lib/types";

export interface Product {
  packageId: string;
  gbAmount: number;
  name: string;
  price: number; // GHS
}

interface NetworkBuyFormProps {
  slug: string;
  products: Product[];
  network?: NetworkProvider;
  storeName?: string;
}

export function NetworkBuyForm({ slug, products, network, storeName }: NetworkBuyFormProps) {
  // Modal & selected bundle state
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Product | null>(null);

  // Active filter tab
  const [filterTab, setFilterTab] = React.useState<"all" | "popular" | "light" | "heavy">("all");

  // Customer input state
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const phoneInputRef = React.useRef<HTMLInputElement>(null);

  // Restore saved email/phone from previous checkout on mount
  React.useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("storefront_customer_email");
      if (savedEmail) setEmail(savedEmail);
      const savedPhone = localStorage.getItem("storefront_customer_phone");
      if (savedPhone) setPhone(savedPhone);
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  // Handle escape key & body scroll lock when modal is open
  React.useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        setModalOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 150);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      clearTimeout(timer);
    };
  }, [modalOpen, busy]);

  const phoneValid = /^0\d{9}$/.test(phone.trim());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const openCheckout = (product: Product) => {
    setSelected(product);
    setError("");
    setModalOpen(true);
  };

  const closeCheckout = () => {
    if (busy) return;
    setModalOpen(false);
  };

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    if (!phoneValid) {
      setError("Enter a valid 10-digit number starting with 0, e.g. 0241234567");
      phoneInputRef.current?.focus();
      return;
    }
    if (!emailValid) {
      setError("Enter a valid email address so Paystack can send your payment receipt.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      try {
        localStorage.setItem("storefront_customer_email", email.trim().toLowerCase());
        localStorage.setItem("storefront_customer_phone", phone.trim());
      } catch {}

      const res = await fetch(`/api/store/${slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selected.packageId,
          customerPhone: phone.trim(),
          customerEmail: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start payment");

      window.location.href = data.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment");
      setBusy(false);
    }
  }

  // Filter products based on selected tab
  const filteredProducts = React.useMemo(() => {
    if (filterTab === "popular") {
      // Pick 5GB, 10GB, 20GB, or middle tiers
      return products.filter((p) => [5, 10, 15, 20].includes(p.gbAmount) || products.length <= 4);
    }
    if (filterTab === "light") {
      return products.filter((p) => p.gbAmount < 5);
    }
    if (filterTab === "heavy") {
      return products.filter((p) => p.gbAmount >= 10);
    }
    return products;
  }, [products, filterTab]);

  const brand = network ? NETWORK_BRANDS[network] : null;
  const fee = selected ? Math.round(selected.price * 0.02 * 100) / 100 : 0;
  const total = selected ? Math.round((selected.price + fee) * 100) / 100 : 0;

  return (
    <div className="space-y-6">
      {/* Tier Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-white/5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterTab === "all"
                ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            }`}
          >
            All Packages ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("popular")}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterTab === "popular"
                ? "bg-emerald-600 text-white shadow-sm dark:bg-emerald-500"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-amber-300" />
            Popular Deals
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("light")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterTab === "light"
                ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            }`}
          >
            Starter Packs (&lt; 5GB)
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("heavy")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterTab === "heavy"
                ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            }`}
          >
            Mega Packs (10GB+)
          </button>
        </div>

        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-emerald-500" /> Instant USSD SIM Activation
        </span>
      </div>

      {/* Redesigned Bundle Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filteredProducts.map((p) => {
          const isPopular = [5, 10, 20].includes(p.gbAmount);

          return (
            <div
              key={p.packageId}
              onClick={() => openCheckout(p)}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] dark:bg-[#0d1627] cursor-pointer ${
                isPopular
                  ? "border-emerald-500/40 ring-1 ring-emerald-500/20 hover:border-emerald-500 dark:border-emerald-500/30 dark:hover:border-emerald-400"
                  : "border-slate-200/90 hover:border-slate-400 dark:border-white/10 dark:hover:border-white/25"
              }`}
            >
              {/* Badge Row */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  <Check className="h-2.5 w-2.5 text-emerald-500" /> Non-Expiry
                </span>
                {isPopular && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="h-2.5 w-2.5" /> Popular
                  </span>
                )}
              </div>

              {/* Data Size Display */}
              <div className="my-3 text-center sm:text-left">
                <div className="flex items-baseline justify-center sm:justify-start gap-1">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 group-hover:text-emerald-500 transition-colors dark:text-white">
                    {p.gbAmount}
                  </span>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">GB</span>
                </div>
              </div>

              {/* Price & Action Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block leading-tight">Price</span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    ₵{p.price.toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white transition-all group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:to-teal-600 group-hover:text-slate-950 dark:bg-white/10 dark:group-hover:bg-gradient-to-r dark:group-hover:from-emerald-500 dark:group-hover:to-teal-600"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 dark:border-white/10">
          No bundles match the selected filter.
        </div>
      )}

      {/* Modern Checkout Modal */}
      {modalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
            onClick={closeCheckout}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0d1627] animate-in zoom-in-95 duration-200"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl dark:bg-emerald-500/10" />

            {/* Modal Header */}
            <div className="relative flex items-center justify-between border-b border-slate-100 p-5 sm:p-6 dark:border-white/5">
              <div className="flex items-center gap-3">
                {network && (
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${brand?.tile ?? "bg-emerald-500 text-white"} shadow-sm`}>
                    <NetworkLogo network={network} className="h-full w-full object-contain" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Checkout &amp; SIM Dispatch
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {storeName ? `${storeName} · ` : ""}Instant Mobile Money fulfillment
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCheckout}
                disabled={busy}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleBuy} className="p-5 sm:p-6 space-y-4">
              {/* Selected Bundle Summary Banner */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/60 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Selected Data Package
                    </span>
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      {brand?.label ? `${brand.label} ` : ""}{selected.gbAmount}GB Non-Expiry
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Subtotal</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      ₵{selected.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Phone Input */}
              <div className="space-y-1.5">
                <label htmlFor="customerPhone" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5 text-emerald-500" /> Recipient SIM Number
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Ghana SIM (10 digits)</span>
                </label>
                <input
                  ref={phoneInputRef}
                  id="customerPhone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\s+/g, ""))}
                  placeholder="024 XXX XXXX"
                  maxLength={10}
                  required
                  disabled={busy}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base font-bold font-mono text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/15 dark:bg-[#0c1424] dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-[#0d182b] dark:focus:border-emerald-400 caret-emerald-500 dark:caret-emerald-400 transition-colors"
                />
              </div>

              {/* Customer Email Input */}
              <div className="space-y-1.5">
                <label htmlFor="customerEmail" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-cyan-500" /> Paystack Receipt Email
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">For payment receipt</span>
                </label>
                <input
                  id="customerEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={busy}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/15 dark:bg-[#0c1424] dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-[#0d182b] dark:focus:border-emerald-400 caret-emerald-500 dark:caret-emerald-400 transition-colors"
                />
              </div>

              {/* Price Breakdown */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs space-y-1.5 dark:border-white/5 dark:bg-white/[0.03]">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Bundle Price</span>
                  <span>₵{selected.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>MoMo Gateway Processing (2%)</span>
                  <span>₵{fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200/80 dark:border-white/5 text-sm">
                  <span>Total Due</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₵{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={busy || !phoneValid || !emailValid}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-400 hover:to-teal-500 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting to Paystack MoMo...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Pay ₵{total.toFixed(2)} with Mobile Money
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Secured by Paystack · Direct SIM crediting
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
