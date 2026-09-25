"use client";

import React, { useCallback, useEffect, useState, useTransition } from "react";
import {
  ShoppingCart,
  Zap,
  ChevronRight,
  ChevronLeft,
  Phone,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  X,
  AlertCircle,
  Wifi,
  WifiOff,
  BadgeCheck,
  CreditCard,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

type Network = "MTN" | "TELECEL" | "AIRTELTIGO" | "AIRTELTIGO_BIGTIME";

interface DataPackage {
  id: string;
  network: Network;
  name: string;
  gbAmount: number;
  description: string | null;
  price: number | null;
  retailPriceGHS: number | null;
}

interface CartItem {
  /** unique key = packageId + ":" + phone */
  key: string;
  packageId: string;
  network: Network;
  name: string;
  gbAmount: number;
  phoneNumber: string;
  price: number;
}

// ─── Network Metadata ────────────────────────────────────────────────────────

const NETWORK_META: Record<
  Network,
  { label: string; color: string; bg: string; border: string; dot: string; ring: string }
> = {
  MTN: {
    label: "MTN",
    color: "text-yellow-900",
    bg: "bg-[#FFCB05]",
    border: "border-yellow-300",
    dot: "bg-yellow-400",
    ring: "ring-yellow-400/40",
  },
  TELECEL: {
    label: "Telecel",
    color: "text-white",
    bg: "bg-[#E4002B]",
    border: "border-red-400",
    dot: "bg-red-400",
    ring: "ring-red-400/40",
  },
  AIRTELTIGO: {
    label: "AT iShare",
    color: "text-slate-900 dark:text-slate-100",
    bg: "bg-white dark:bg-slate-800",
    border: "border-slate-200 dark:border-slate-600",
    dot: "bg-slate-400",
    ring: "ring-slate-400/40",
  },
  AIRTELTIGO_BIGTIME: {
    label: "AT Big Time",
    color: "text-white",
    bg: "bg-[#00A3E0]",
    border: "border-sky-400",
    dot: "bg-sky-400",
    ring: "ring-sky-400/40",
  },
};

function formatGHS(amount: number) {
  return `₵${amount.toFixed(2)}`;
}

function formatGb(gb: number) {
  if (gb >= 1) return `${gb}GB`;
  return `${Math.round(gb * 1024)}MB`;
}

function normalizePhone(raw: string) {
  return raw.replace(/\s+/g, "").replace(/^(\+?233)/, "0");
}

function isValidGhanaPhone(p: string) {
  return /^0[2345]\d{8}$/.test(normalizePhone(p));
}

// ─── Network Logo SVG Placeholders ───────────────────────────────────────────

function NetworkIcon({ network, className }: { network: Network; className?: string }) {
  const meta = NETWORK_META[network];
  const initials =
    network === "MTN"
      ? "MTN"
      : network === "TELECEL"
      ? "TC"
      : network === "AIRTELTIGO"
      ? "AT"
      : "AT+";
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl font-black text-lg tracking-tight",
        meta.bg,
        meta.color,
        className
      )}
    >
      {initials}
    </div>
  );
}

// ─── Cart Context ────────────────────────────────────────────────────────────

function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const add = useCallback((item: Omit<CartItem, "key">) => {
    const key = `${item.packageId}:${normalizePhone(item.phoneNumber)}`;
    setItems((prev) => {
      if (prev.some((i) => i.key === key)) return prev; // duplicate guard
      return [...prev, { ...item, key, phoneNumber: normalizePhone(item.phoneNumber) }];
    });
  }, []);

  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const isDuplicate = useCallback(
    (packageId: string, phone: string) => {
      const key = `${packageId}:${normalizePhone(phone)}`;
      return items.some((i) => i.key === key);
    },
    [items]
  );

  const total = items.reduce((s, i) => s + i.price, 0);
  const count = items.length;

  return { items, add, remove, clear, isDuplicate, total, count, isOpen, setIsOpen };
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function BuyNowPage() {
  const [packages, setPackages] = useState<DataPackage[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [submissionEnabled, setSubmissionEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<DataPackage | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [checkoutState, setCheckoutState] = useState<
    "idle" | "confirming" | "submitting" | "success" | "error"
  >("idle");
  const [checkoutError, setCheckoutError] = useState("");
  const [, startTransition] = useTransition();

  const cart = useCart();

  // Fetch packages on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/packages", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch packages");
        const data = await res.json();
        setPackages(data.packages ?? []);
        setBalance(data.userBalance ?? 0);
        setSubmissionEnabled(data.submissionEnabled ?? true);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Refresh balance after checkout
  const refreshBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/packages", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.userBalance ?? 0);
      }
    } catch {
      //
    }
  }, []);

  const networksInPackages = Array.from(
    new Set(packages.map((p) => p.network))
  ) as Network[];

  const networksOrder: Network[] = ["MTN", "TELECEL", "AIRTELTIGO", "AIRTELTIGO_BIGTIME"];
  const networks = networksOrder.filter((n) => networksInPackages.includes(n));

  const bundlesForNetwork = selectedNetwork
    ? packages
        .filter((p) => p.network === selectedNetwork && (p.price ?? 0) > 0)
        .sort((a, b) => a.gbAmount - b.gbAmount)
    : [];

  function openModal(pkg: DataPackage) {
    setSelectedPackage(pkg);
    setPhoneInput("");
    setPhoneError("");
    setAddedFeedback(false);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedPackage(null);
    setPhoneInput("");
    setPhoneError("");
    setAddedFeedback(false);
  }

  function handleAddToCart() {
    if (!selectedPackage) return;
    const phone = normalizePhone(phoneInput.trim());
    if (!isValidGhanaPhone(phone)) {
      setPhoneError("Enter a valid 10-digit Ghanaian number (e.g. 0241234567)");
      return;
    }
    if (cart.isDuplicate(selectedPackage.id, phone)) {
      setPhoneError(`This bundle is already in your cart for ${phone}`);
      return;
    }
    cart.add({
      packageId: selectedPackage.id,
      network: selectedPackage.network,
      name: selectedPackage.name,
      gbAmount: selectedPackage.gbAmount,
      phoneNumber: phone,
      price: selectedPackage.price!,
    });
    setAddedFeedback(true);
    setPhoneInput("");
    setPhoneError("");
    setTimeout(() => {
      closeModal();
      cart.setIsOpen(true);
    }, 800);
  }

  async function handleCheckout() {
    if (cart.count === 0) return;
    setCheckoutState("submitting");
    setCheckoutError("");
    try {
      const body = {
        orders: cart.items.map((item) => ({
          phoneNumber: item.phoneNumber,
          network: item.network,
          gbAmount: item.gbAmount,
          packageId: item.packageId,
        })),
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutState("error");
        setCheckoutError(data.error ?? "Order failed. Please try again.");
        return;
      }
      cart.clear();
      cart.setIsOpen(false);
      setCheckoutState("success");
      await refreshBalance();
      setTimeout(() => setCheckoutState("idle"), 4000);
    } catch {
      setCheckoutState("error");
      setCheckoutError("Network error. Please check your connection and try again.");
    }
  }

  const insufficientBalance = cart.total > balance;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
          <span className="text-sm font-medium">Loading bundles…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ─── Page ─────────────────────────────────────────────────────── */}
      <div className="relative min-h-screen pb-32">
        {/* Header strip */}
        <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0a1120]/80">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedNetwork && (
                <button
                  onClick={() => setSelectedNetwork(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <div>
                <h1 className="text-base font-black text-slate-900 dark:text-white">
                  {selectedNetwork
                    ? `${NETWORK_META[selectedNetwork].label} Bundles`
                    : "Buy Now"}
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedNetwork
                    ? `${bundlesForNetwork.length} packages available`
                    : "Pick a network to get started"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Balance chip */}
              <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 sm:flex">
                <CreditCard className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                  {formatGHS(balance)}
                </span>
              </div>

              {/* Cart button */}
              <button
                onClick={() => cart.setIsOpen(true)}
                className={cn(
                  "relative flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-all",
                  cart.count > 0
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                )}
              >
                <ShoppingCart className="h-4 w-4" />
                {cart.count > 0 && (
                  <>
                    <span className="font-black">{cart.count}</span>
                    <span className="hidden text-emerald-200 sm:block">|</span>
                    <span className="hidden font-black sm:block">{formatGHS(cart.total)}</span>
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-white dark:ring-[#0a1120]">
                      {cart.count}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="mx-auto max-w-5xl px-4 py-6">
          {/* Global success toast */}
          {checkoutState === "success" && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">Orders placed successfully!</p>
                <p className="text-sm opacity-80">
                  Your bundles are being dispatched to recipients.
                </p>
              </div>
            </div>
          )}

          {!submissionEnabled && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <WifiOff className="h-5 w-5 shrink-0" />
              <p className="text-sm font-semibold">
                Order submission is temporarily disabled by the administrator.
              </p>
            </div>
          )}

          {/* Network cards */}
          {!selectedNetwork && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {networks.map((net) => {
                const meta = NETWORK_META[net];
                const netPackages = packages.filter((p) => p.network === net && (p.price ?? 0) > 0);
                const minPrice = Math.min(...netPackages.map((p) => p.price!));
                return (
                  <button
                    key={net}
                    onClick={() => setSelectedNetwork(net)}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-3xl border-2 p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]",
                      meta.border,
                      "bg-white dark:bg-[#0d1627]",
                      `hover:ring-4 ${meta.ring}`
                    )}
                  >
                    {/* Network colored top accent */}
                    <div className={cn("mb-4 h-14 w-14 rounded-2xl", meta.bg, meta.color)}>
                      <NetworkIcon network={net} className="h-14 w-14" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                          {meta.label}
                        </h3>
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            meta.dot
                          )}
                        />
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {netPackages.length} bundle{netPackages.length !== 1 ? "s" : ""} available
                      </p>
                      {isFinite(minPrice) && (
                        <p className="mt-3 text-base font-black text-emerald-600 dark:text-emerald-400">
                          from {formatGHS(minPrice)}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      <Wifi className="h-3.5 w-3.5" />
                      <span>Non-expiry data</span>
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Bundle grid */}
          {selectedNetwork && (
            <div>
              {bundlesForNetwork.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white/60 p-16 text-center dark:border-slate-700 dark:bg-white/5">
                  <Package className="h-10 w-10 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-500">
                    No bundles available for {NETWORK_META[selectedNetwork].label} right now.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {bundlesForNetwork.map((pkg) => {
                    const meta = NETWORK_META[pkg.network];
                    const cartCount = cart.items.filter((i) => i.packageId === pkg.id).length;
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => openModal(pkg)}
                        disabled={!submissionEnabled}
                        className={cn(
                          "group relative flex flex-col rounded-3xl border bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] dark:bg-[#0d1627]",
                          "border-slate-200 dark:border-white/10",
                          !submissionEnabled && "cursor-not-allowed opacity-50"
                        )}
                      >
                        {/* Top accent bar */}
                        <div
                          className={cn("mb-3 h-1.5 w-full rounded-full", meta.bg)}
                        />

                        {/* GB size */}
                        <div className="flex items-end justify-between">
                          <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            {formatGb(pkg.gbAmount)}
                          </span>
                          {cartCount > 0 && (
                            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-black text-white">
                              {cartCount}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {pkg.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                          Non-expiry · Instant
                        </p>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/5">
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            {pkg.price != null ? formatGHS(pkg.price) : "—"}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-400">
                            <Zap className="h-3 w-3" />
                            Add
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Recipient Modal ─────────────────────────────────────────── */}
      {modalOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl dark:bg-[#0d1627]">
            {/* Close */}
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Package info */}
            <div className="mb-5 flex items-center gap-4">
              <div
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-2xl font-black text-xl",
                  NETWORK_META[selectedPackage.network].bg,
                  NETWORK_META[selectedPackage.network].color
                )}
              >
                {formatGb(selectedPackage.gbAmount)}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {NETWORK_META[selectedPackage.network].label}
                </p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedPackage.name}
                </h3>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedPackage.price != null ? formatGHS(selectedPackage.price) : ""}
                </p>
              </div>
            </div>

            {/* Phone input */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recipient Number
              </span>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="0241234567"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    setPhoneError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleAddToCart()}
                  autoFocus
                  className={cn(
                    "w-full rounded-2xl border bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 dark:bg-white/5 dark:text-white",
                    phoneError
                      ? "border-rose-400 ring-rose-200 dark:ring-rose-900"
                      : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-white/10"
                  )}
                />
              </div>
              {phoneError && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-500">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {phoneError}
                </p>
              )}
            </label>

            {/* Add to cart button */}
            {addedFeedback ? (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 py-3.5 font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
                Added to cart!
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98]"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </button>
            )}

            <p className="mt-3 text-center text-[11px] text-slate-400 dark:text-slate-500">
              You can add more bundles for different numbers after this
            </p>
          </div>
        </div>
      )}

      {/* ─── Cart Drawer ─────────────────────────────────────────────── */}
      {cart.isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => cart.setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="relative z-10 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl dark:bg-[#0a1120]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Your Cart
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {cart.count} item{cart.count !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => cart.setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {cart.count === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <ShoppingCart className="h-12 w-12 text-slate-200 dark:text-slate-700" />
                  <p className="text-sm font-semibold text-slate-400">Your cart is empty</p>
                  <button
                    onClick={() => cart.setIsOpen(false)}
                    className="mt-1 flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Browse bundles
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.items.map((item) => {
                    const meta = NETWORK_META[item.network];
                    return (
                      <div
                        key={item.key}
                        className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-white/5"
                      >
                        {/* Network badge */}
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-black",
                            meta.bg,
                            meta.color
                          )}
                        >
                          {formatGb(item.gbAmount)}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-black text-slate-900 dark:text-white">
                            {item.name}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <Phone className="h-3 w-3" />
                            {item.phoneNumber}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {formatGHS(item.price)}
                          </p>
                          <button
                            onClick={() => cart.remove(item.key)}
                            className="mt-0.5 flex items-center gap-0.5 text-[10px] font-bold text-rose-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-3 w-3" />
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.count > 0 && (
              <div className="border-t border-slate-200 px-5 py-5 dark:border-white/10">
                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Subtotal ({cart.count} item{cart.count !== 1 ? "s" : ""})</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {formatGHS(cart.total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      Wallet Balance
                    </span>
                    <span
                      className={cn(
                        "font-black",
                        insufficientBalance
                          ? "text-rose-500"
                          : "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {formatGHS(balance)}
                    </span>
                  </div>
                  {insufficientBalance && (
                    <div className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      Insufficient balance. Please top up your wallet.
                    </div>
                  )}
                </div>

                {/* Checkout error */}
                {checkoutState === "error" && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {checkoutError}
                  </div>
                )}

                {/* Cart action buttons */}
                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleCheckout}
                    disabled={
                      checkoutState === "submitting" ||
                      insufficientBalance ||
                      !submissionEnabled
                    }
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black transition-all",
                      insufficientBalance || !submissionEnabled
                        ? "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-slate-600"
                        : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98]"
                    )}
                  >
                    {checkoutState === "submitting" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Placing Orders…
                      </>
                    ) : (
                      <>
                        <BadgeCheck className="h-4 w-4" />
                        Place {cart.count} Order{cart.count !== 1 ? "s" : ""} · {formatGHS(cart.total)}
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => cart.setIsOpen(false)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Add More Bundles
                  </button>
                </div>

                {/* Constraint notice */}
                <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-400 dark:text-slate-600">
                  Each unique bundle + recipient combination can only appear once in the cart.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
