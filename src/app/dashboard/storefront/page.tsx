import Link from "next/link";
import {
  Wallet,
  Package,
  Settings,
  ExternalLink,
  Store,
  Clock,
  TrendingUp,
  Hourglass,
  PauseCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requireActiveStorefront, ensureWallet, fromPesewas, storefrontOrderCode } from "@/lib/storefront";
import { CopyShareButtons } from "@/components/storefront/copy-share-buttons";
import { StoreStatusToggle } from "@/components/storefront/store-status-toggle";
import { RecentOrdersView } from "@/components/storefront/recent-orders-view";
import { cleanDomain, buildStorefrontUrl } from "@/lib/storefront-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StorefrontOverviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ orderPage?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const orderPage = Math.max(1, parseInt(resolvedParams.orderPage || "1", 10));
  const orderPageSize = 10;

  const user = await requireUser();
  const storefront = await requireActiveStorefront(user.id);
  const wallet = await ensureWallet(user.id);

  const [productCount, activeCount, recentOrders, totalStoreOrders, pendingWithdrawal, completedCount] =
    await Promise.all([
      prisma.storefrontProduct.count({ where: { storefrontId: storefront.id } }),
      prisma.storefrontProduct.count({ where: { storefrontId: storefront.id, isActive: true } }),
      prisma.storefrontOrder.findMany({
        where: { storefrontId: storefront.id },
        orderBy: { createdAt: "desc" },
        skip: (orderPage - 1) * orderPageSize,
        take: orderPageSize,
        include: { product: { include: { dataPackage: true } } },
      }),
      prisma.storefrontOrder.count({ where: { storefrontId: storefront.id } }),
      prisma.storefrontWithdrawal.findFirst({ where: { userId: user.id, status: "PENDING" } }),
      prisma.storefrontOrder.count({
        where: { storefrontId: storefront.id, status: "COMPLETED" },
      }),
    ]);

  const storefrontDomain = cleanDomain(process.env.NEXT_PUBLIC_STOREFRONT_DOMAIN, "mycedinetstore.com");
  const storeUrl = buildStorefrontUrl(storefront.slug, storefrontDomain);
  const stats = [
    {
      label: "Available balance",
      value: `GHS ${fromPesewas(wallet.balance).toFixed(2)}`,
      hint: "Withdrawable commissions",
      icon: Wallet,
      accent: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    {
      label: "Pending commissions",
      value: `GHS ${fromPesewas(wallet.pendingBalance).toFixed(2)}`,
      hint: "Awaiting order completion",
      icon: Hourglass,
      accent: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    },
    {
      label: "Active products",
      value: `${activeCount}/${productCount}`,
      hint: "Listed on your public store",
      icon: Package,
      accent: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
    },
    {
      label: "Completed sales",
      value: String(completedCount),
      hint:
        storefront.status !== "ENABLED"
          ? "Sales paused by admin"
          : storefront.isActive
          ? "Store is live and accepting orders"
          : "Store is paused by you",
      icon: TrendingUp,
      accent: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
  ];

  const isLive = storefront.status === "ENABLED" && storefront.isActive;
  const isUserPaused = storefront.status === "ENABLED" && !storefront.isActive;

  return (
    <div className="space-y-6">
      {/* Store Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/25">
              <Store className="h-6 w-6" />
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Merchant Storefront Engine
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    isLive
                      ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30"
                      : isUserPaused
                      ? "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/30"
                      : "bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-500/30"
                  }`}
                >
                  {isLive ? "Live & Accepting Orders" : isUserPaused ? "Store Paused" : storefront.status}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {storefront.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Public storefront:{" "}
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  {storefrontDomain}/{storefront.slug}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              <div className="pt-2">
                <CopyShareButtons url={storeUrl} storeName={storefront.name} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            <StoreStatusToggle
              initialActive={storefront.isActive}
              storeStatus={storefront.status}
              variant="compact"
            />
            <Link
              href="/dashboard/storefront/products"
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition"
            >
              Manage Products
            </Link>
            <Link
              href="/dashboard/storefront/wallet"
              className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08] transition"
            >
              Payout Wallet
            </Link>
          </div>
        </div>
      </div>

      {isUserPaused && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <PauseCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p>
              <strong>Your storefront is currently paused.</strong> Buyers visiting your storefront link will see a maintenance notice until you unpause.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-3xl border border-slate-200/90 bg-white/90 p-4 sm:p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {s.label}
              </p>
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${s.accent}`}>
                <s.icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <p className="font-mono text-xl sm:text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                {s.value}
              </p>
              <p className="mt-1 text-[11px] font-medium text-slate-400">{s.hint}</p>
            </div>
          </div>
        ))}
      </div>

      {pendingWithdrawal && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-semibold text-amber-800 dark:text-amber-200">
          <Clock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p>
            A pending withdrawal of <strong>GHS {fromPesewas(pendingWithdrawal.amount).toFixed(2)}</strong> is currently being reviewed for payout.
          </p>
        </div>
      )}

      {/* Storefront orders */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Storefront Orders ({totalStoreOrders})
          </h2>
        </div>
        <RecentOrdersView
          orders={recentOrders.map((o) => ({
            id: o.id,
            seq: o.seq,
            paymentReference: o.paymentReference,
            customerPhone: o.customerPhone,
            customerEmail: o.customerEmail,
            sellingPrice: o.sellingPrice,
            commission: o.commission,
            status: o.status,
            createdAt: o.createdAt.toISOString(),
            product: {
              dataPackage: {
                network: o.product.dataPackage.network,
                gbAmount: o.product.dataPackage.gbAmount,
              },
            },
          }))}
          totalOrders={totalStoreOrders}
          page={orderPage}
          pageSize={orderPageSize}
          storeUrl={storeUrl}
        />
      </section>

      {/* Quick actions */}
      <section className="space-y-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Merchant Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { href: "/dashboard/storefront/products", label: "Retail Pricing", desc: "Configure bundle markups", icon: Package, external: false },
            { href: "/dashboard/storefront/wallet", label: "Cash Out", desc: "Withdraw earnings via MoMo", icon: Wallet, external: false },
            { href: "/dashboard/storefront/settings", label: "Store Customization", desc: "Branding, contact & payout", icon: Settings, external: false },
            { href: storeUrl, label: "View Public Store", desc: "Live customer storefront view", icon: ExternalLink, external: true },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              {...(a.external ? { target: "_blank" } : {})}
              className="rounded-3xl border border-slate-200/90 bg-white/90 p-4 sm:p-5 transition hover:border-emerald-500/40 hover:shadow-md dark:border-white/10 dark:bg-[#0b1322]/90 dark:hover:border-emerald-500/30 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <a.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{a.label}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{a.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
