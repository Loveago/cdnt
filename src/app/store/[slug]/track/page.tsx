import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TrackForm } from "./track-form";
import { ArrowLeft, Clock, ShieldCheck, Zap, HelpCircle } from "lucide-react";
import { storeHref } from "@/components/store/brands";

export const dynamic = "force-dynamic";

export default async function TrackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const storefront = await prisma.storefront.findUnique({
    where: { slug },
    select: { name: true, status: true },
  });
  const enabled = storefront?.status === "ENABLED";

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      {/* Breadcrumb Navigation */}
      <div className="py-4 text-xs">
        <Link
          href={storeHref(slug)}
          className="inline-flex items-center gap-1.5 font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {storefront?.name || "Store"}
        </Link>
      </div>

      {/* Hero Tracking Terminal Header */}
      <div className="text-center pt-4 pb-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <Clock className="h-3.5 w-3.5 text-emerald-500" />
          Carrier Dispatch Verification Console
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
          Track Your Bundle Delivery
        </h1>
        <p className="mx-auto max-w-lg text-sm text-slate-600 dark:text-slate-300">
          Check real-time SIM crediting status using your recipient phone number, order ID, or Paystack payment reference.
        </p>
      </div>

      {/* Main Terminal Frame */}
      {enabled ? (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-10 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#0d1627]/95">
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />
          <TrackForm slug={slug} />
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 dark:border-white/10">
          This store is not accepting orders at this time.
        </div>
      )}

      {/* USSD Network Verification Guidelines */}
      <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-xs backdrop-blur-md dark:border-white/5 dark:bg-[#0d1627]/60">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            How to verify non-expiry data on your handset
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/[0.03]">
            <span className="font-extrabold text-amber-600 dark:text-amber-400 block mb-0.5">MTN Ghana</span>
            <span className="text-slate-600 dark:text-slate-300">Dial <code className="font-mono font-bold text-slate-900 dark:text-white">*138#</code> to check non-expiry bundle balance.</span>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/[0.03]">
            <span className="font-extrabold text-red-600 dark:text-red-400 block mb-0.5">Telecel Ghana</span>
            <span className="text-slate-600 dark:text-slate-300">Dial <code className="font-mono font-bold text-slate-900 dark:text-white">*110#</code> or check the Telecel Play app.</span>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/[0.03]">
            <span className="font-extrabold text-blue-600 dark:text-blue-400 block mb-0.5">AT Ghana</span>
            <span className="text-slate-600 dark:text-slate-300">Dial <code className="font-mono font-bold text-slate-900 dark:text-white">*124#</code> or <code className="font-mono font-bold text-slate-900 dark:text-white">*125#</code>.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
