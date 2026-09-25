import { getCurrentUser } from "@/lib/auth";
import { canAccessDeveloperApi } from "@/lib/types";
import { Lock, ShieldOff } from "lucide-react";
import Link from "next/link";

export default async function ApiDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || !canAccessDeveloperApi(user.role)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#0d1627]">
          {/* Icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
            <Lock className="h-8 w-8" />
          </div>

          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
            <ShieldOff className="h-3.5 w-3.5" />
            Feature Restricted
          </span>

          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Developer API Access
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            The Developer API portal is available to{" "}
            <span className="font-bold text-slate-700 dark:text-slate-300">Agent</span> and{" "}
            <span className="font-bold text-slate-700 dark:text-slate-300">Reseller</span> accounts
            only. Your current account type does not have access to this feature.
          </p>

          <div className="mt-6 space-y-3">
            <Link
              href="/dashboard/buy-now"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-500"
            >
              Back to Dashboard
            </Link>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Contact your administrator to upgrade your account to a Reseller or Agent plan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
