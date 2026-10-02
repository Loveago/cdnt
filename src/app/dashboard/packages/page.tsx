import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PriceMask } from "@/components/price-mask";
import { NetworkPackageGrid, type PackageGroup } from "@/components/packages/network-package-grid";
import { BadgeCheck, Layers, Package, ShieldCheck } from "lucide-react";
import { formatGHS } from "@/lib/types";
import { getEffectivePricingProfileForUser } from "@/lib/orders";

export default async function PackagesPage() {
  const user = await getCurrentUser();

  const profile = user ? await getEffectivePricingProfileForUser(user) : null;
  const profileId = profile?.id ?? null;
  const tiers = profileId
    ? await prisma.priceTier.findMany({ where: { profileId }, orderBy: { gbAmount: "asc" } })
    : [];
  const profileName = profile?.name ?? "Standard";

  // Available packages grouped by network, with the user's profile price attached
  const packages = await prisma.dataPackage.findMany({
    where: { active: true },
    orderBy: [{ network: "asc" }, { gbAmount: "asc" }],
  });
  const priceMap = new Map(tiers.map((t) => [t.gbAmount, t.priceGHS]));
  const { getSetting } = await import("@/lib/orders");
  const showPricesSetting = await getSetting("show_package_prices_to_users", "true");
  const showPrices = showPricesSetting !== "false";

  const isCustomProfile = profile && !profile.isDefault;

  // Check if custom profile has distinct per-network rates
  let profileNetworkRates: Record<string, Array<{ gbAmount: number; priceGHS: number }>> | null = null;
  if (isCustomProfile && profileId) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: `pricing_profile_network_rates:${profileId}` },
    });
    if (setting?.value) {
      try {
        profileNetworkRates = JSON.parse(setting.value);
      } catch {
        // ignore
      }
    }
  }

  const groups: PackageGroup[] = (["MTN", "TELECEL", "AIRTELTIGO", "AIRTELTIGO_BIGTIME"] as const)
    .map((network) => ({
      network,
      packages: packages
        .filter((p) => p.network === network)
        .map((p) => {
          let distinctPrice: number | null = null;
          if (profileNetworkRates && Array.isArray(profileNetworkRates[network])) {
            const match = profileNetworkRates[network].find((t) => t.gbAmount === p.gbAmount);
            if (match && typeof match.priceGHS === "number" && match.priceGHS > 0) {
              distinctPrice = match.priceGHS;
            }
          }
          if (distinctPrice == null && isCustomProfile && priceMap.has(p.gbAmount)) {
            distinctPrice = priceMap.get(p.gbAmount)!;
          }
          if (distinctPrice == null) {
            distinctPrice = p.retailPriceGHS ?? (priceMap.has(p.gbAmount) ? priceMap.get(p.gbAmount)! : null);
          }

          return {
            id: p.id,
            name: p.name,
            gbAmount: p.gbAmount,
            price: showPrices ? distinctPrice : null,
          };
        }),
    }))
    .filter((g) => g.packages.length > 0);

  return (
    <div className="space-y-6">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Data Bundles &amp; Pricing Tiers
              </span>
              <span className="text-[10px] font-bold text-slate-400">· Multi-Carrier Catalog</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Packages &amp; Rates
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Explore your active wholesale pricing tier and package availability across MTN, Telecel, and AT networks.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2 text-xs dark:border-white/5 dark:bg-white/[0.04]">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Your Tier Profile</p>
              <p className="font-black text-slate-900 dark:text-white">{profileName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned pricing profile */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Assigned Pricing Profile
            </p>
            <h2 className="mt-1 truncate text-lg font-black text-slate-900 dark:text-white tracking-tight">{profileName} Tier</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active Tier
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                <Layers className="h-3 w-3" /> Tiered Wholesale
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                All Networks (MTN · Telecel · AT)
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                {packages.length} Active Bundles
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Available packages by network */}
      <NetworkPackageGrid groups={groups} />

      {/* Pricing structure by network */}
      <div className="rounded-3xl border border-slate-200/90 bg-white/90 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <BadgeCheck className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pricing Structure by Network</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Each network has distinct bundle allocations and wholesale rates:
            </p>
          </div>
        </div>

        {groups.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No packages available yet — please contact support.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {groups.map((g) => (
              <div key={g.network} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {g.network === "MTN" ? "MTN" : g.network === "TELECEL" ? "Telecel" : g.network === "AIRTELTIGO_BIGTIME" ? "AT Big Time" : "AT iShare"}
                    </span>
                    <span className="text-xs text-slate-400">({g.packages.length} bundles)</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {profileName} Profile
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {g.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 text-xs dark:border-white/5 dark:bg-white/[0.02]"
                    >
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{pkg.name}</p>
                        <p className="text-[10px] text-slate-400">{pkg.gbAmount} GB allocation</p>
                      </div>
                      <div>
                        {pkg.price != null ? (
                          <p className="font-mono font-bold text-slate-900 dark:text-white text-right">
                            {formatGHS(pkg.price)}
                          </p>
                        ) : (
                          <PriceMask className="text-right" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

