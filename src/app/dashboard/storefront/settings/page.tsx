import { requireUser } from "@/lib/auth";
import { requireActiveStorefront } from "@/lib/storefront";
import { StorefrontSettingsForm } from "./settings-form";
import { StoreStatusToggle } from "@/components/storefront/store-status-toggle";
import { cleanDomain } from "@/lib/storefront-utils";

export default async function StorefrontSettingsPage() {
  const user = await requireUser();
  const storefront = await requireActiveStorefront(user.id);
  const storefrontDomain = cleanDomain(process.env.NEXT_PUBLIC_STOREFRONT_DOMAIN, "mycedinetstore.com");
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Storefront Customization
            </span>
            <span className="text-[10px] font-bold text-slate-400">· Brand &amp; MoMo Payout</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Storefront Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Configure your brand identity, contact information, store operational status, and automated Mobile Money payout settlement account.
          </p>
        </div>
      </div>
      <StoreStatusToggle
        initialActive={storefront.isActive}
        storeStatus={storefront.status}
        variant="card"
      />
      <StorefrontSettingsForm
        storefrontDomain={storefrontDomain}
        initial={{
          slug: storefront.slug,
          name: storefront.name,
          description: storefront.description ?? "",
          whatsapp: storefront.whatsapp ?? "",
          phone: storefront.phone ?? "",
          whatsappGroupLink: storefront.whatsappGroupLink ?? "",
          location: storefront.location ?? "",
          contactText: storefront.contactText ?? "",
          whatsappLabel: storefront.whatsappLabel ?? "",
          notice: storefront.notice ?? "",
          payoutNetwork: storefront.payoutNetwork ?? "MTN",
          payoutNumber: storefront.payoutNumber ?? "",
          payoutAccountName: storefront.payoutAccountName ?? "",
        }}
      />
    </div>
  );
}
