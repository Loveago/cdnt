import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fromPesewas } from "@/lib/storefront";
import { NetworkLogo } from "@/components/store/network-logo";
import { NETWORK_BRANDS, NETWORK_ORDER, ghs, networkBySlug, networkHref, storeHref } from "@/components/store/brands";
import { NetworkBuyForm } from "./buy-form";
import { Zap, ShieldCheck, CheckCircle2, ArrowLeft, Radio } from "lucide-react";
import type { NetworkProvider } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NetworkPage({
  params,
}: {
  params: Promise<{ slug: string; network: string }>;
}) {
  const { slug, network: networkSlug } = await params;
  const network = networkBySlug(networkSlug);
  if (!network) notFound();

  const [storefront, featureSetting] = await Promise.all([
    prisma.storefront.findUnique({ where: { slug } }),
    prisma.systemSetting.findUnique({ where: { key: "storefront_feature_enabled" } }),
  ]);
  if (!storefront || storefront.status !== "ENABLED") notFound();
  if (featureSetting?.value === "false") {
    return (
      <div className="mx-auto mt-20 max-w-md p-8 text-center bg-white rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Storefronts Temporarily Paused</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Reseller storefront orders are currently paused by administration for scheduled maintenance. Please check back soon.
        </p>
      </div>
    );
  }

  if (!storefront.isActive) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-[#111a2c]">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Store Temporarily Paused</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {storefront.name} is not accepting new orders at this time.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href={storeHref(slug)}
              className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-teal-500"
            >
              Back to store
            </Link>
            <Link
              href={storeHref(slug, "track")}
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-white/10 dark:text-white"
            >
              Track order
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const allActiveProducts = await prisma.storefrontProduct.findMany({
    where: { storefrontId: storefront.id, isActive: true, dataPackage: { active: true } },
    include: { dataPackage: true },
  });

  const availableNetworks = NETWORK_ORDER.filter((n) =>
    allActiveProducts.some((p) => p.dataPackage.network === n)
  );

  const products = allActiveProducts.filter((p) => p.dataPackage.network === network);
  if (products.length === 0) notFound();

  products.sort(
    (a, b) => a.dataPackage.gbAmount - b.dataPackage.gbAmount || a.sellingPrice - b.sellingPrice
  );
  const prices = products.map((p) => fromPesewas(p.sellingPrice));
  const brand = NETWORK_BRANDS[network];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12">
      {/* Navigation Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-4 text-xs">
        <nav className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Link
            href={storeHref(slug)}
            className="flex items-center gap-1.5 font-bold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {storefront.name}
          </Link>
          <span>/</span>
          <span className="font-extrabold text-slate-900 dark:text-white">{brand.label} Bundles</span>
        </nav>

        {/* Carrier Quick Switcher Tabs */}
        {availableNetworks.length > 1 && (
          <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-white/5 p-1 rounded-xl border border-slate-200/80 dark:border-white/5">
            {availableNetworks.map((net) => {
              const b = NETWORK_BRANDS[net];
              const isCurrent = net === network;
              return (
                <Link
                  key={net}
                  href={networkHref(slug, net)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-white text-slate-950 shadow-xs dark:bg-white/15 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${b.tile}`} />
                  {b.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Modern Carrier Showcase Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-8 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1627]/95">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-2xl flex items-center justify-center p-3 shadow-md ${brand.tile}`}>
              <NetworkLogo network={network} className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  USSD Switch Active
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {products.length} packages
                </span>
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {brand.label} Non-Expiry Bundles
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Direct SIM crediting across Ghana with automated Mobile Money confirmation.
              </p>
            </div>
          </div>

          {/* Pricing Highlight Pill */}
          <div className="sm:text-right shrink-0 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Package Range
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {ghs(Math.min(...prices))} <span className="text-sm font-normal text-slate-400">–</span> {ghs(Math.max(...prices))}
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 sm:justify-end mt-0.5">
              <Zap className="h-3 w-3" /> Sub-2s Delivery
            </span>
          </div>
        </div>
      </div>

      {/* Main Packages & Buy Form */}
      <div className="mt-6">
        <NetworkBuyForm
          slug={slug}
          network={network}
          storeName={storefront.name}
          products={products.map((p) => ({
            packageId: p.packageId,
            gbAmount: p.dataPackage.gbAmount,
            name: p.dataPackage.name,
            price: fromPesewas(p.sellingPrice),
          }))}
        />
      </div>
    </div>
  );
}
