import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, XCircle, Store } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getStorefrontForUser } from "@/lib/storefront";

/** Application status page while a store is PENDING or REJECTED. */
export default async function StorePendingPage() {
  const user = await requireUser();
  const storefront = await getStorefrontForUser(user.id);
  if (!storefront || storefront.status === "NOT_ENABLED") {
    redirect("/dashboard/storefront/apply");
  }
  if (storefront.status === "ENABLED" || storefront.status === "SUSPENDED") {
    redirect("/dashboard/storefront");
  }

  const pending = storefront.status === "PENDING";

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <div
        className={`rounded-3xl border p-6 sm:p-8 text-center backdrop-blur-xl shadow-sm ${
          pending
            ? "border-sky-500/30 bg-sky-50/80 dark:border-sky-500/20 dark:bg-sky-500/[0.08]"
            : "border-red-500/30 bg-red-50/80 dark:border-red-500/20 dark:bg-red-500/[0.08]"
        }`}
      >
        <span
          className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-md ${
            pending
              ? "bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300 shadow-sky-500/10"
              : "bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-300 shadow-red-500/10"
          }`}
        >
          {pending ? <Clock className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
        </span>
        <h1 className="mt-4 text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {pending ? "Application Under Review" : "Application Not Approved"}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
          {pending
            ? `We're currently reviewing “${storefront.name}”. Once verified, your public storefront will be activated instantly.`
            : storefront.rejectionNote
              ? `“${storefront.name}” was not approved. Feedback: ${storefront.rejectionNote}`
              : `“${storefront.name}” was not approved.`}
        </p>
        {pending && (
          <div className="mx-auto mt-6 flex max-w-xs items-center justify-center gap-2 rounded-full border border-sky-500/20 bg-white/80 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
            </span>
            Application Status: PENDING REVIEW
          </div>
        )}
      </div>

      {pending ? (
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Want to change your store name before approval? Contact support.
        </p>
      ) : (
        <Link
          href="/dashboard/storefront/apply"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500"
        >
          <Store className="h-4 w-4" /> Submit a new application
        </Link>
      )}
    </div>
  );
}
