"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Package, Settings, Wallet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SUBNAV_ITEMS = [
  { href: "/dashboard/storefront", label: "Overview", icon: Store, exact: true },
  { href: "/dashboard/storefront/products", label: "Products & Pricing", icon: Package },
  { href: "/dashboard/storefront/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/storefront/wallet", label: "Wallet & Payouts", icon: Wallet },
];

export function StorefrontSubnav() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  React.useEffect(() => {
    if (!pendingHref) return;
    const timer = setTimeout(() => setPendingHref(null), 8000);
    return () => clearTimeout(timer);
  }, [pendingHref]);

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1 text-xs font-bold dark:border-white/10 dark:bg-white/[0.04]">
      {SUBNAV_ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const isPending = pendingHref === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={(e) => {
              if (active) return;
              if (pendingHref) {
                e.preventDefault();
                return;
              }
              setPendingHref(item.href);
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 transition-all whitespace-nowrap",
              active
                ? "bg-white text-slate-900 shadow-sm dark:bg-[#0b1322] dark:text-white"
                : isPending
                ? "bg-slate-200/80 text-slate-900 opacity-90 animate-pulse dark:bg-white/15 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            )}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
