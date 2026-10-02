import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requireActiveStorefront, getMarkupBounds } from "@/lib/storefront";
import { resolveUserWholesalePrice } from "@/lib/orders";
import { PricingEditor } from "./pricing-editor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StorefrontProductsPage() {
  const user = await requireUser();
  const storefront = await requireActiveStorefront(user.id);
  const [packages, products, bounds] = await Promise.all([
    prisma.dataPackage.findMany({
      where: { active: true },
      orderBy: [{ network: "asc" }, { gbAmount: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.storefrontProduct.findMany({
      where: { storefrontId: storefront.id },
      include: { dataPackage: true },
      orderBy: [{ dataPackage: { network: "asc" } }, { dataPackage: { gbAmount: "asc" } }],
    }),
    getMarkupBounds(),
  ]);

  const packagesWithCost = (
    await Promise.all(
      packages.map(async (p) => ({
        id: p.id,
        network: p.network,
        gbAmount: p.gbAmount,
        name: p.name,
        cost: await resolveUserWholesalePrice(user, p),
      }))
    )
  ).sort((a, b) => {
    if (a.network !== b.network) return a.network.localeCompare(b.network);
    return a.gbAmount - b.gbAmount;
  });

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Retail Pricing Engine
            </span>
            <span className="text-[10px] font-bold text-slate-400">· Instant Commission Clearing</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Products &amp; Pricing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Customize the retail price for each bundle listed on your storefront. Your profit margin (Retail Price − Wholesale Cost) is automatically credited to your payout wallet on every buyer checkout.
          </p>
        </div>
      </div>
      <PricingEditor
        packages={packagesWithCost}
        products={products.map((p) => ({
          packageId: p.packageId,
          sellingPrice: p.sellingPrice / 100,
          isActive: p.isActive,
        }))}
        minMarkup={bounds.minMarkupP / 100}
        maxMarkup={bounds.maxMarkupP === Number.MAX_SAFE_INTEGER ? null : bounds.maxMarkupP / 100}
        disabled={storefront.status !== "ENABLED"}
      />
    </div>
  );
}
