import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Search,
  Zap,
  Smartphone,
  ShieldCheck,
  Radio,
  Copy,
  ExternalLink,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { fromPesewas, verifyAndSettleStorefrontOrder } from "@/lib/storefront";
import { NETWORK_BRANDS, storeHref } from "@/components/store/brands";
import { NetworkLogo } from "@/components/store/network-logo";
import type { NetworkProvider } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    iconCls: string;
    cardCls: string;
    badgeCls: string;
    label: string;
    message: string;
    step: number;
  }
> = {
  PENDING: {
    icon: Clock,
    iconCls: "text-amber-500",
    cardCls: "bg-amber-500/10 border-amber-500/25 text-amber-900 dark:text-amber-200",
    badgeCls: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
    label: "Order Queued",
    message: "Payment received. Your order is queued on the telecom switch for SIM crediting.",
    step: 1,
  },
  PROCESSING: {
    icon: Clock,
    iconCls: "text-cyan-500",
    cardCls: "bg-cyan-500/10 border-cyan-500/25 text-cyan-900 dark:text-cyan-200",
    badgeCls: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    label: "Dispatching to SIM",
    message: "Packet is actively routing through the telecom USSD pipeline. Crediting takes ~1-3 mins.",
    step: 2,
  },
  COMPLETED: {
    icon: CheckCircle2,
    iconCls: "text-emerald-500",
    cardCls: "bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-200",
    badgeCls: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    label: "Delivered to SIM",
    message: "Your non-expiry data package has been credited to your SIM line. Enjoy!",
    step: 3,
  },
  SUCCESS: {
    icon: CheckCircle2,
    iconCls: "text-emerald-500",
    cardCls: "bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-200",
    badgeCls: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    label: "Delivered to SIM",
    message: "Your non-expiry data package has been credited to your SIM line. Enjoy!",
    step: 3,
  },
  FAILED: {
    icon: XCircle,
    iconCls: "text-red-500",
    cardCls: "bg-red-500/10 border-red-500/25 text-red-900 dark:text-red-200",
    badgeCls: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
    label: "Delivery Failed",
    message: "Delivery could not complete automatically. Please contact the store with your reference number.",
    step: 2,
  },
  CANCELLED: {
    icon: XCircle,
    iconCls: "text-slate-400",
    cardCls: "bg-slate-500/10 border-slate-500/20 text-slate-800 dark:text-slate-300",
    badgeCls: "bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30",
    label: "Order Cancelled",
    message: "This order was cancelled. Please contact the store if you have questions.",
    step: 1,
  },
  REFUNDED: {
    icon: AlertCircle,
    iconCls: "text-violet-500",
    cardCls: "bg-violet-500/10 border-violet-500/25 text-violet-900 dark:text-violet-200",
    badgeCls: "bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30",
    label: "Refunded",
    message: "This order has been refunded. Please contact the store if you have questions.",
    step: 1,
  },
};

export default async function StorefrontOrderPage({
  params,
}: {
  params: Promise<{ slug: string; reference: string }>;
}) {
  const { slug, reference } = await params;

  // Fetch the storefront order by paymentReference, scoped to this slug
  let order = await prisma.storefrontOrder.findUnique({
    where: { paymentReference: reference },
    include: {
      storefront: { select: { slug: true, name: true, logoUrl: true, whatsapp: true } },
      product: { include: { dataPackage: true } },
      underlyingOrder: {
        select: { id: true, status: true, providerReference: true, updatedAt: true },
      },
    },
  });

  // Guard: must belong to this slug
  if (!order || order.storefront.slug !== slug) notFound();

  // Self-healing fallback: If customer paid on Paystack but callback failed, verify now
  if (!order.underlyingOrderId) {
    const autoSettle = await verifyAndSettleStorefrontOrder(reference);
    if (autoSettle.settled) {
      const refreshed = await prisma.storefrontOrder.findUnique({
        where: { id: order.id },
        include: {
          storefront: { select: { slug: true, name: true, logoUrl: true, whatsapp: true } },
          product: { include: { dataPackage: true } },
          underlyingOrder: {
            select: { id: true, status: true, providerReference: true, updatedAt: true },
          },
        },
      });
      if (refreshed) order = refreshed;
    }
  }

  // On-demand sync for in-flight Clickyfied underlying order
  if (
    order.underlyingOrder &&
    (order.underlyingOrder.status === "PENDING" || order.underlyingOrder.status === "PROCESSING") &&
    order.underlyingOrder.providerReference?.startsWith("CLICKYFIED:") &&
    Date.now() - new Date(order.underlyingOrder.updatedAt).getTime() > 120000
  ) {
    try {
      const { syncClickyfiedOrder } = await import("@/lib/provider-apis/router");
      const syncRes = await syncClickyfiedOrder(order.underlyingOrder, "Storefront Order Page Sync");
      if (syncRes.changed && syncRes.newStatus) {
        order.underlyingOrder.status = syncRes.newStatus;
      }
    } catch (syncErr) {
      console.error("Storefront order sync error:", syncErr);
    }
  }

  let effectiveStatus = order.status;
  if (order.underlyingOrder) {
    effectiveStatus = order.underlyingOrder.status === "SUCCESS" ? "COMPLETED" : order.underlyingOrder.status;
  }

  const cfg = STATUS_CONFIG[effectiveStatus] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = cfg.icon;
  const network = order.product.dataPackage.network as NetworkProvider;
  const brand = NETWORK_BRANDS[network] || NETWORK_BRANDS.MTN;
  const gbAmount = order.product.dataPackage.gbAmount;
  const amountGhs = fromPesewas(order.sellingPrice);
  const paystackFee = Math.round(amountGhs * 0.02 * 100) / 100;
  const totalPaid = Math.round((amountGhs + paystackFee) * 100) / 100;

  const isDelivered = effectiveStatus === "COMPLETED" || effectiveStatus === "SUCCESS";
  const isFailed = effectiveStatus === "FAILED" || effectiveStatus === "CANCELLED";

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      {/* Back link */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={storeHref(slug)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {order.storefront.name}
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Telecom Switch Active
        </span>
      </div>

      {/* Main Elevated Receipt Container */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-xl shadow-slate-200/40 backdrop-blur-2xl dark:border-white/10 dark:bg-[#0d1627]/95 dark:shadow-none">
        {/* Top ambient color glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />

        {/* Hero Status Banner */}
        <div className={`border-b p-6 sm:p-8 ${cfg.cardCls}`}>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md dark:bg-slate-900 border border-current/20">
              <StatusIcon className={`h-6 w-6 ${cfg.iconCls}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider ${cfg.badgeCls}`}>
                  {cfg.label}
                </span>
              </div>
              <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed opacity-90">
                {cfg.message}
              </p>
            </div>
          </div>

          {/* Visual 3-Stage Progress Timeline */}
          <div className="mt-6 pt-5 border-t border-current/15">
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
              {/* Step 1: Payment */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <span className="text-slate-700 dark:text-slate-200">1. Paid MoMo</span>
              </div>

              {/* Step 2: Gateway */}
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full shadow-xs ${
                    isDelivered
                      ? "bg-emerald-500 text-white"
                      : isFailed
                      ? "bg-red-500 text-white"
                      : "bg-cyan-500 text-white animate-pulse"
                  }`}
                >
                  <Radio className="h-3 w-3" />
                </span>
                <span className="text-slate-700 dark:text-slate-200">2. Dispatching</span>
              </div>

              {/* Step 3: Credited */}
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full shadow-xs ${
                    isDelivered
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-slate-500"
                  }`}
                >
                  <Smartphone className="h-3 w-3" />
                </span>
                <span className="text-slate-700 dark:text-slate-200">3. SIM Credited</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Dispatched Package
              </span>
              <div className="mt-1 flex items-center gap-2">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center p-1.5 shadow-xs ${brand.tile}`}>
                  <NetworkLogo network={network} className="h-full w-full object-contain" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    {gbAmount} GB {brand.label}
                  </h2>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Non-Expiry Telecom Data
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Amount Paid
              </span>
              <p className="mt-0.5 text-xl font-black text-slate-900 dark:text-white">
                ₵{totalPaid.toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-400 block">incl. 2% MoMo fee</span>
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-white/[0.03]">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Recipient Phone Line</span>
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                {order.customerPhone}
              </span>
            </div>

            {order.customerEmail && (
              <div className="flex items-center justify-between px-3">
                <span className="font-medium text-slate-500 dark:text-slate-400">Receipt Email</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {order.customerEmail}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between px-3">
              <span className="font-medium text-slate-500 dark:text-slate-400">Bundle Price</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                ₵{amountGhs.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between px-3">
              <span className="font-medium text-slate-500 dark:text-slate-400">Paystack Processing Fee</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                +₵{paystackFee.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-white/[0.03]">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Payment Reference</span>
              <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 select-all">
                {reference}
              </span>
            </div>

            <div className="flex items-center justify-between px-3">
              <span className="font-medium text-slate-500 dark:text-slate-400">Order Placed</span>
              <span className="font-medium text-slate-600 dark:text-slate-400">
                {new Date(order.createdAt).toLocaleString("en-GH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </div>

          {/* Handset USSD Balance Verification Guideline */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/5 dark:bg-white/[0.03]">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                How to verify data balance on your handset
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {network === "MTN" ? (
                <>Dial <code className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">*138#</code> to verify your non-expiry data balance.</>
              ) : network === "TELECEL" ? (
                <>Dial <code className="font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded">*110#</code> or check the Telecel Play application.</>
              ) : (
                <>Dial <code className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">*124#</code> or <code className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">*125#</code>.</>
              )}
            </p>
          </div>

          {/* Action Button Row */}
          <div className="flex flex-col gap-2.5 sm:flex-row pt-2">
            <Link
              href={storeHref(slug, "track")}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-800 shadow-xs transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 text-emerald-500" />
              Track SIM Status
            </Link>
            <Link
              href={storeHref(slug)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-500 cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" />
              Buy Another Bundle
            </Link>
          </div>

          {/* WhatsApp Support Link if store has WhatsApp */}
          {order.storefront.whatsapp && (
            <div className="text-center pt-1">
              <a
                href={`https://wa.me/233${order.storefront.whatsapp.replace(/^0/, "").replace(/\D/g, "")}?text=${encodeURIComponent(`Hello, I have a question about order ${reference} for ${order.customerPhone}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Need help? Chat with {order.storefront.name} on WhatsApp <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
