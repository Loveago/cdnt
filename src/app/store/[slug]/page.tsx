import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShoppingBag,
  Clock,
  ShieldCheck,
  Zap,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Radio,
  Activity,
  Check,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { fromPesewas } from "@/lib/storefront";
import { NetworkLogo } from "@/components/store/network-logo";
import {
  NETWORK_BRANDS,
  NETWORK_ORDER,
  ghs,
  networkHref,
  storeHref,
} from "@/components/store/brands";
import { TrackForm } from "./track/track-form";
import type { NetworkProvider } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PublicStorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ payment?: string; reference?: string }>;
}) {
  const { slug } = await params;
  const { payment, reference } = await searchParams;

  const [storefront, featureSetting] = await Promise.all([
    prisma.storefront.findUnique({ where: { slug } }),
    prisma.systemSetting.findUnique({ where: { key: "storefront_feature_enabled" } }),
  ]);
  if (!storefront || storefront.status !== "ENABLED") notFound();
  if (featureSetting?.value === "false") {
    return (
      <div className="mx-auto mt-20 max-w-md p-8 text-center bg-white/90 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10 dark:bg-slate-900/90 backdrop-blur-xl">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Storefronts Temporarily Paused</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Reseller storefront orders are currently paused by administration for scheduled maintenance. Please check back soon.
        </p>
      </div>
    );
  }

  if (!storefront.isActive) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 sm:p-12 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1627]/90">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="h-8 w-8" />
          </div>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Store Taking a Break
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {storefront.name} is Temporarily Paused
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-300">
            {storefront.description || "The store owner has temporarily paused new orders. Please check back shortly."}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={storeHref(slug, "track")}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 text-sm font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-500"
            >
              <Clock className="h-4 w-4" />
              Track existing order
            </Link>
            {storefront.whatsapp && (
              <a
                href={`https://wa.me/233${storefront.whatsapp.replace(/^0/, "").replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                Chat on WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  const products = await prisma.storefrontProduct.findMany({
    where: { storefrontId: storefront.id, isActive: true, dataPackage: { active: true } },
    include: { dataPackage: true },
  });

  const groups = NETWORK_ORDER.map((network) => {
    const items = products.filter((p) => p.dataPackage.network === network);
    if (items.length === 0) return null;
    return {
      network: network as NetworkProvider,
      count: items.length,
      min: Math.min(...items.map((p) => fromPesewas(p.sellingPrice))),
    };
  }).filter((g): g is NonNullable<typeof g> => g !== null);

  return (
    <div className="pb-12">
      {payment && (
        <div className="mx-auto mt-6 max-w-6xl px-4">
          <div
            className={`rounded-2xl px-5 py-4 text-sm font-bold border ${
              payment === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300"
                : "bg-red-50 border-red-300 text-red-800 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300"
            }`}
          >
            {payment === "success"
              ? `✓ Payment verified! Your bundle is being dispatched to the number you provided.${reference ? ` (Ref: ${reference})` : ""}`
              : "Payment could not be completed. If your MoMo was debited, please contact support with your payment reference."}
          </div>
        </div>
      )}

      {/* Hero Section: Modern Asymmetric Showcase */}
      <section className="relative mx-auto max-w-6xl px-4 pt-8 pb-12 lg:pt-12">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Storefront Brand Identity */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {storefront.name} · Official Telecom Reseller
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-slate-900 dark:text-white">
              Instant Non-Expiry Data,{" "}
              <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                Direct to Your SIM.
              </span>
            </h1>

            <p className="max-w-xl text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
              {storefront.description ||
                "Select your carrier below to browse high-speed data bundles with automated Mobile Money fulfillment and live USSD dispatch."}
            </p>

            {/* Quick Action Button Group */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="#shop"
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-7 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-400 hover:to-teal-500 hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" />
                Browse Packages
              </a>
              <a
                href="#track"
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200/90 bg-white/80 px-6 text-sm font-bold text-slate-800 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md transition-all hover:bg-slate-50 hover:scale-[1.02] active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 cursor-pointer"
              >
                <Clock className="h-4 w-4 text-emerald-500" />
                Track My Order
              </a>
              {storefront.whatsapp && (
                <a
                  href={`https://wa.me/233${storefront.whatsapp.replace(/^0/, "").replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 text-sm font-semibold text-emerald-700 hover:bg-emerald-500/10 transition dark:text-emerald-300"
                >
                  WhatsApp Help
                </a>
              )}
            </div>

            {/* Live Carrier Status Strip */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              {groups.map((g) => (
                <Link
                  key={g.network}
                  href={networkHref(slug, g.network)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1.5 font-semibold text-slate-700 shadow-xs backdrop-blur-sm hover:border-emerald-500/40 hover:bg-emerald-50/50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 transition"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${NETWORK_BRANDS[g.network].tile}`} />
                  <span>{NETWORK_BRANDS[g.network].label}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">from {ghs(g.min)}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Column: Live Carrier Matrix Board (Replaces TSK wheel completely!) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 sm:p-6 shadow-xl shadow-slate-200/40 backdrop-blur-2xl dark:border-white/10 dark:bg-[#0d1627]/90 dark:shadow-none space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Carrier Network Matrix
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <Activity className="h-3 w-3 animate-pulse" /> Live Dispatch
                </span>
              </div>

              {/* Carrier Cards Stack */}
              <div className="space-y-2.5">
                {groups.map((g) => {
                  const brand = NETWORK_BRANDS[g.network];
                  return (
                    <Link
                      key={g.network}
                      href={networkHref(slug, g.network)}
                      className="group flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/60 bg-slate-50/60 hover:bg-white hover:border-emerald-500/40 hover:shadow-md transition-all dark:border-white/5 dark:bg-white/[0.03] dark:hover:bg-white/[0.08]"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center p-2 shadow-xs ${brand.tile}`}>
                          <NetworkLogo network={g.network} className="h-full w-full object-contain" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                              {brand.label}
                            </span>
                            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              4G/5G
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {g.count} package{g.count === 1 ? "" : "s"} · Instant USSD
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block">Starts at</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {ghs(g.min)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 text-center">
                <a
                  href="#shop"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  View full bundle tiers below <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Carrier Selection Grid Section */}
      <section id="shop" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-14 pt-4">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Select Your Data Network
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              High-Speed Telecom Packages
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Direct SIM activation with zero expiry on all purchased data
          </p>
        </div>

        {groups.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-white/5">
            This store has no bundles on sale right now. Please check back shortly.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {groups.map((g) => {
              const brand = NETWORK_BRANDS[g.network];
              return (
                <Link
                  key={g.network}
                  href={networkHref(slug, g.network)}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/10 dark:border-white/10 dark:bg-[#0d1627]/90"
                >
                  <div>
                    {/* Top Row: Carrier Logo Pill & Badge */}
                    <div className="flex items-center justify-between">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center p-2.5 shadow-sm ${brand.tile}`}>
                        <NetworkLogo network={g.network} className="h-full w-full object-contain" />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Zap className="h-3 w-3" />
                        Sub-2s Dispatch
                      </span>
                    </div>

                    <div className="mt-5">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                        {brand.label} Data Bundles
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {g.count} bundle sizes available · Full non-expiry guarantee · Direct USSD balance checking
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-white/5 dark:text-slate-300">
                        <Check className="h-3 w-3 text-emerald-500" /> Non-Expiry
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-white/5 dark:text-slate-300">
                        <Check className="h-3 w-3 text-emerald-500" /> 4G/5G Speeds
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Starting from</span>
                      <p className="text-lg font-black text-slate-900 dark:text-white">{ghs(g.min)}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-all group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:to-teal-600 group-hover:text-slate-950 dark:bg-white/10 dark:group-hover:bg-gradient-to-r dark:group-hover:from-emerald-500 dark:group-hover:to-teal-600">
                      View Bundles <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Dedicated Order Tracking Station */}
      <section id="track" className="mx-auto max-w-4xl scroll-mt-24 px-4 pb-16">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-10 shadow-xl shadow-slate-200/40 backdrop-blur-2xl dark:border-white/10 dark:bg-[#0d1627]/95 dark:shadow-none">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <Clock className="h-3.5 w-3.5 text-emerald-500" />
              Live Telecom Tracking Portal
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Track Your SIM Delivery
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300 font-medium">
              Enter your recipient phone number or payment reference below to verify SIM crediting status in real-time.
            </p>
          </div>

          <div className="relative z-10 mx-auto mt-8 max-w-xl">
            <TrackForm slug={slug} />
          </div>
        </div>
      </section>

      {/* Reseller Infrastructure Trust Bento */}
      <section className="mx-auto max-w-5xl px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-xs backdrop-blur-md dark:border-white/5 dark:bg-[#0d1627]/60 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Sub-2s Direct Dispatch</h3>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Packets route through telecom APIs immediately after MoMo payment confirmation.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-xs backdrop-blur-md dark:border-white/5 dark:bg-[#0d1627]/60 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Wallet className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Automated MoMo Processing</h3>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Pay via MTN Mobile Money, Telecel Cash, or AT Money with zero manual confirmation delays.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-xs backdrop-blur-md dark:border-white/5 dark:bg-[#0d1627]/60 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Verified SIM Fulfillment</h3>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Check delivery receipts with transparent audit tracking and dedicated merchant support.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
