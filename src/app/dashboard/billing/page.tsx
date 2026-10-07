"use client";

import * as React from "react";
import { PageHeader, EmptyState, Spinner } from "@/components/shared";
import { StatCard } from "@/components/shared";
import { TopupForm } from "@/components/billing/topup-form";
import { SendClaimCard } from "@/components/billing/send-claim-card";
import { ClaimHistory } from "@/components/billing/claim-history";
import { useToast } from "@/components/toast";
import { formatGHS, formatDateTime } from "@/lib/types";
import { Wallet, ArrowDownLeft, ArrowUpRight, Receipt, Smartphone, History } from "lucide-react";

interface Tx {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference: string | null;
  note: string | null;
  createdAt: string;
}

function txBadge(status: string) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    APPROVED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    REJECTED: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}

type Tab = "overview" | "send-claim" | "claim-history";

export default function BillingPage() {
  const { toast } = useToast();
  const [tab, setTab] = React.useState<Tab>("overview");
  const [data, setData] = React.useState<Tx[]>([]);
  const [balance, setBalance] = React.useState(0);
  const [summary, setSummary] = React.useState({ topups: 0, spend: 0 });
  const [sendClaimEnabled, setSendClaimEnabled] = React.useState(true);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/billing?pageSize=25");
    const json = await res.json();
    setData(json.data ?? []);
    setBalance(json.balance ?? 0);
    setSummary(json.summary ?? { topups: 0, spend: 0 });
    if (json.sendClaimEnabled !== undefined) {
      setSendClaimEnabled(json.sendClaimEnabled);
      if (!json.sendClaimEnabled && (tab === "send-claim" || tab === "claim-history")) {
        setTab("overview");
      }
    }
    setLoading(false);
  }, [tab]);

  React.useEffect(() => {
    load();
  }, [load]);

  // URL tab query param synchronization
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "send-claim" && sendClaimEnabled) setTab("send-claim");
    else if ((tabParam === "history" || tabParam === "claims") && sendClaimEnabled) setTab("claim-history");
  }, [sendClaimEnabled]);

  const [verifyingId, setVerifyingId] = React.useState<string | null>(null);

  const verifyPaystackTx = async (reference: string, id: string) => {
    setVerifyingId(id);
    try {
      const res = await fetch("/api/billing/paystack/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, transactionId: id }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "Verification check failed", "error");
        return;
      }
      if (json.settled) {
        toast("Top-up confirmed! Your wallet balance has been credited.", "success");
        load();
      } else {
        toast(json.reason ?? `Status on Paystack: ${json.status}`, "info");
      }
    } catch {
      toast("Failed to check status", "error");
    } finally {
      setVerifyingId(null);
    }
  };

  // Paystack redirect-back result
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paystack = params.get("paystack");
    if (!paystack) return;
    if (paystack === "success") {
      toast("Paystack payment successful — your wallet has been credited", "success");
      load();
    } else if (paystack === "pending") {
      toast("Paystack payment is processing. Your balance will update automatically.", "info");
      load();
    } else {
      toast("Paystack payment was not completed. If you were debited, click Verify on the transaction.", "error");
      load();
    }
    window.history.replaceState(null, "", window.location.pathname);
  }, [toast, load]);

  // If there are pending Paystack transactions, poll briefly to auto-settle once confirmed
  const hasPendingPaystack = React.useMemo(() => {
    return data.some((tx) => tx.status === "PENDING" && tx.reference?.startsWith("PSK-"));
  }, [data]);

  React.useEffect(() => {
    if (!hasPendingPaystack) return;
    const interval = setInterval(() => {
      load();
    }, 4000);
    return () => clearInterval(interval);
  }, [hasPendingPaystack, load]);

  return (
    <div className="space-y-6">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Wallet &amp; Clearing System
              </span>
              <span className="text-[10px] font-bold text-slate-400">· Instant Settlement</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Billing &amp; Wallet
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              {sendClaimEnabled
                ? "Top up your wallet via Mobile Money or debit card, claim direct transfers, and view audit ledger records."
                : "Manage your prepaid wallet balance, review top-ups, and track spending history in real-time."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5 text-xs dark:border-white/5 dark:bg-white/[0.04]">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Available Funds</p>
                <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                  {formatGHS(balance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Stat Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current Balance</p>
            <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatGHS(balance)}
            </p>
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Ready for instant dispatch</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Top-ups</p>
            <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatGHS(summary.topups)}
            </p>
            <p className="text-[11px] font-medium text-slate-400">Lifetime wallet deposits</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Spending</p>
            <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatGHS(summary.spend)}
            </p>
            <p className="text-[11px] font-medium text-slate-400">Total data bundle fulfillment</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <ArrowUpRight className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1 text-xs font-bold dark:border-white/10 dark:bg-white/[0.04] w-fit max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setTab("overview")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all ${
            tab === "overview"
              ? "bg-white text-slate-900 shadow-sm dark:bg-[#0b1322] dark:text-white"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Wallet &amp; Top-up</span>
        </button>
        {sendClaimEnabled && (
          <>
            <button
              type="button"
              onClick={() => setTab("send-claim")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all ${
                tab === "send-claim"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-[#0b1322] dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Send &amp; Claim</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("claim-history")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all ${
                tab === "claim-history"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-[#0b1322] dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <History className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Claim History</span>
            </button>
          </>
        )}
      </div>

      {/* Tab 1: Overview & Instant Top-up */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Instant Top-up</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Automated
              </span>
            </div>
            <div className="mt-4">
              <TopupForm onSuccess={load} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/90 bg-white/90 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90 lg:col-span-2 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Wallet Ledger Activity</h2>
              <span className="text-xs text-slate-400">Latest transactions</span>
            </div>
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner className="h-6 w-6 text-emerald-600" />
              </div>
            ) : data.length === 0 ? (
              <EmptyState icon={Receipt} title="No transactions yet" description="Deposit funds into your wallet to start ordering." />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5 overflow-y-auto max-h-[520px]">
                {data.map((t) => {
                  const isCredit =
                    t.type === "TOPUP" ||
                    t.type === "REFUND" ||
                    (t.type === "ADJUSTMENT" && t.amount > 0);
                  const isDebit =
                    t.type === "DEBIT" ||
                    (t.type === "ADJUSTMENT" && t.amount < 0);
                  const isSignupFee = t.type === "SIGNUP_FEE";
                  const displayAmount = Math.abs(t.amount);

                  const typeLabel =
                    t.type === "TOPUP"
                      ? "Top-up"
                      : t.type === "REFUND"
                      ? "Refund"
                      : t.type === "DEBIT"
                      ? "Order Debit"
                      : t.type === "SIGNUP_FEE"
                      ? "Account Activation Fee"
                      : t.type === "ADJUSTMENT"
                      ? t.amount >= 0 ? "Credit Adjustment" : "Debit Adjustment"
                      : t.type;

                  return (
                    <div key={t.id} className="flex items-start gap-3.5 px-5 py-3.5 text-sm transition hover:bg-slate-50/50 dark:hover:bg-white/[0.02] sm:items-center">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          isCredit
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : isDebit
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="h-4.5 w-4.5" />
                        ) : (
                          <ArrowUpRight className="h-4.5 w-4.5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white">{typeLabel}</p>
                          {txBadge(t.status)}
                        </div>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatDateTime(t.createdAt)}
                          {t.reference ? ` · Ref: ${t.reference}` : ""}
                          {t.note ? ` · ${t.note}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={`font-mono text-sm font-black tabular-nums ${
                            isCredit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : isDebit
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {isCredit ? `+${formatGHS(displayAmount)}` : isDebit ? `−${formatGHS(displayAmount)}` : formatGHS(displayAmount)}
                        </p>
                      {t.status === "PENDING" && t.reference?.startsWith("PSK-") && (
                        <div className="mt-1">
                          <button
                            type="button"
                            disabled={verifyingId === t.id}
                            onClick={() => verifyPaystackTx(t.reference!, t.id)}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-300"
                            title="Check payment status with Paystack"
                          >
                            {verifyingId === t.id ? "Checking…" : "Verify"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Send & Claim */}
      {tab === "send-claim" && (
        <SendClaimCard onSuccess={load} />
      )}

      {/* Tab 3: Claim History */}
      {tab === "claim-history" && (
        <ClaimHistory />
      )}
    </div>
  );
}
