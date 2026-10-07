"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Receipt,
  Banknote,
  RotateCcw,
  Sliders,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { formatGHS, formatDateTime } from "@/lib/types";
import { Spinner } from "@/components/shared";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference: string | null;
  note: string | null;
  createdAt: string;
  balanceBefore: number;
  balanceAfter: number;
}

interface Summary {
  totalCredits: number;
  totalDebits: number;
  netFlow?: number;
  transactionCount: number;
}

type FilterType = "ALL" | "CREDIT" | "DEBIT";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTypeConfig(
  type: string,
  amount: number,
  note?: string | null,
  reference?: string | null
) {
  switch (type) {
    case "TOPUP":
      return {
        label: "Top-up",
        icon: ArrowUpRight,
        colorClass: "text-emerald-600 dark:text-emerald-400",
        bgClass: "bg-emerald-50 dark:bg-emerald-500/10",
        isCredit: true,
      };
    case "REFUND":
      return {
        label: "Refund",
        icon: RotateCcw,
        colorClass: "text-sky-600 dark:text-sky-400",
        bgClass: "bg-sky-50 dark:bg-sky-500/10",
        isCredit: true,
      };
    case "DEBIT":
      return {
        label: "Order Debit",
        icon: ArrowDownLeft,
        colorClass: "text-rose-600 dark:text-rose-400",
        bgClass: "bg-rose-50 dark:bg-rose-500/10",
        isCredit: false,
      };
    case "SIGNUP_FEE":
      return {
        label: "Signup Fee (Paid via Gateway)",
        icon: Receipt,
        colorClass: "text-slate-600 dark:text-slate-400",
        bgClass: "bg-slate-50 dark:bg-slate-500/10",
        isCredit: false,
        isNeutral: true,
      };
    case "ADJUSTMENT": {
      const isOpening =
        reference === "INITIAL-BALANCE" ||
        note?.toLowerCase().includes("opening") ||
        note?.toLowerCase().includes("initial");
      if (isOpening) {
        return {
          label: "Opening Balance",
          icon: Wallet,
          colorClass: "text-emerald-600 dark:text-emerald-400",
          bgClass: "bg-emerald-50 dark:bg-emerald-500/10",
          isCredit: true,
          isNeutral: false,
        };
      }
      return amount >= 0
        ? {
            label: "Credit Adjustment",
            icon: TrendingUp,
            colorClass: "text-violet-600 dark:text-violet-400",
            bgClass: "bg-violet-50 dark:bg-violet-500/10",
            isCredit: true,
            isNeutral: false,
          }
        : {
            label: "Debit Adjustment",
            icon: TrendingDown,
            colorClass: "text-orange-600 dark:text-orange-400",
            bgClass: "bg-orange-50 dark:bg-orange-500/10",
            isCredit: false,
            isNeutral: false,
          };
    }
    default:
      return {
        label: type,
        icon: Banknote,
        colorClass: "text-slate-600 dark:text-slate-400",
        bgClass: "bg-slate-50 dark:bg-slate-500/10",
        isCredit: false,
        isNeutral: false,
      };
  }
}

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
        <CheckCircle2 className="h-2.5 w-2.5" />
        Approved
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
        <Clock className="h-2.5 w-2.5" />
        Pending
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:bg-red-500/10 dark:text-red-400">
        <XCircle className="h-2.5 w-2.5" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-500/10 dark:text-slate-400">
      <AlertCircle className="h-2.5 w-2.5" />
      {status}
    </span>
  );
}

// ─── Transaction Card ─────────────────────────────────────────────────────────

function TransactionCard({ tx }: { tx: Transaction }) {
  const cfg = getTypeConfig(tx.type, tx.amount, tx.note, tx.reference);
  const Icon = cfg.icon;
  const isApproved = tx.status === "APPROVED";
  const displayAmount = Math.abs(tx.amount);

  // Determine the label shown in the note area
  const description =
    tx.note ||
    (tx.reference ? `Ref: ${tx.reference}` : cfg.label);

  return (
    <div className="group relative flex gap-3.5 rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-sm transition-all duration-200 hover:border-emerald-500/40 hover:shadow-md dark:border-white/10 dark:bg-[#0b1322]/90 dark:hover:border-emerald-500/30 sm:gap-4">
      {/* Type icon */}
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${cfg.bgClass} transition-transform duration-200 group-hover:scale-105`}
      >
        <Icon className={`h-5 w-5 ${cfg.colorClass}`} />
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          {/* Left: type label + description */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {cfg.label}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>

          {/* Right: amount */}
          <div className="text-right">
            <p
              className={`font-mono text-base font-black tabular-nums ${
                cfg.isNeutral
                  ? "text-slate-700 dark:text-slate-300"
                  : cfg.isCredit
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {cfg.isNeutral ? "" : cfg.isCredit ? "+" : "−"}
              {formatGHS(displayAmount)}
            </p>
          </div>
        </div>

        {/* Balance before → after strip */}
        {isApproved && !cfg.isNeutral && (
          <div className="mt-2.5 flex items-center gap-1.5 rounded-xl border border-slate-200/60 bg-slate-50/80 px-3 py-1.5 dark:border-white/5 dark:bg-white/[0.03]">
            <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
              {formatGHS(tx.balanceBefore)}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">→</span>
            <span className="font-mono text-[11px] font-bold tabular-nums text-slate-800 dark:text-slate-200">
              {formatGHS(tx.balanceAfter)}
            </span>
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Balance</span>
          </div>
        )}

        {/* Footer: date + status */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <time className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {formatDateTime(tx.createdAt)}
          </time>
          <StatusBadge status={tx.status} />
        </div>
      </div>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-3xl border border-slate-200/90 bg-white/90 p-4 sm:p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${bgClass}`}>
          <Icon className={`h-4 w-4 ${colorClass}`} />
        </div>
      </div>
      <p className="font-mono text-xl font-black tabular-nums text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}

// ─── Main Page Content ────────────────────────────────────────────────────────

function TransactionsContent() {
  const searchParams = useSearchParams();
  const userIdParam = searchParams?.get("userId") || null;

  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [summary, setSummary] = React.useState<Summary>({
    totalCredits: 0,
    totalDebits: 0,
    transactionCount: 0,
  });
  const [balance, setBalance] = React.useState(0);
  const [targetUser, setTargetUser] = React.useState<{ id: string; name: string; email: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<FilterType>("ALL");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const pageSize = 20;

  const fetchData = React.useCallback(
    async (f: FilterType, p: number) => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
      if (f !== "ALL") params.set("type", f);
      if (userIdParam) params.set("userId", userIdParam);
      const res = await fetch(`/api/transactions?${params}`);
      const json = await res.json();
      setTransactions(json.data ?? []);
      setSummary(json.summary ?? { totalCredits: 0, totalDebits: 0, transactionCount: 0 });
      setBalance(json.balance ?? 0);
      setTargetUser(json.user ?? null);
      setTotalPages(json.pages ?? 1);
      setTotal(json.total ?? 0);
      setLoading(false);
    },
    [userIdParam]
  );

  React.useEffect(() => {
    fetchData(filter, page);
  }, [filter, page, fetchData]);

  const handleFilter = (f: FilterType) => {
    setFilter(f);
    setPage(1);
  };

  const netChange = summary.totalCredits - summary.totalDebits;

  return (
    <div className="space-y-6">
      {/* Admin Audit Banner when viewing a specific user */}
      {targetUser && userIdParam && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Admin Audit View: Inspecting financial ledger and accurate balances for{" "}
              <strong>{targetUser.name}</strong> ({targetUser.email})
            </span>
          </div>
          <Link
            href={`/admin/wallets?userId=${targetUser.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-white/80 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-2xs hover:bg-white dark:bg-slate-900/80 dark:text-amber-100 dark:hover:bg-slate-900"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Return to Admin Wallets</span>
          </Link>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Financial Ledger &amp; Audit Trail
              </span>
              <span className="text-[10px] font-bold text-slate-400">· Real-time Settlements</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {targetUser && userIdParam ? `${targetUser.name}'s Transactions` : "Transactions"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Complete chronological audit trail of wallet top-ups, order debits, refunds, and adjustments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData(filter, page)}
              disabled={loading}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
              aria-label="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Balance Hero ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-gradient-to-br dark:from-[#0b1322] dark:via-[#091823] dark:to-[#05131b]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Wallet className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Current Wallet Balance</p>
            </div>
            <p className="mt-2 font-mono text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
              {formatGHS(balance)}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-3.5 py-2 text-xs font-semibold backdrop-blur dark:border-white/5 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 w-fit">
            <ArrowLeftRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {total} total transaction{total !== 1 ? "s" : ""} recorded
            </span>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Total In"
          value={formatGHS(summary.totalCredits)}
          icon={TrendingUp}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgClass="bg-emerald-500/15"
          sub="All deposits, refunds & credits"
        />
        <SummaryCard
          label="Total Out"
          value={formatGHS(summary.totalDebits)}
          icon={TrendingDown}
          colorClass="text-rose-600 dark:text-rose-400"
          bgClass="bg-rose-500/15"
          sub="All order debits & deductions"
        />
        <SummaryCard
          label="Net Flow"
          value={formatGHS(Math.abs(netChange))}
          icon={netChange >= 0 ? TrendingUp : TrendingDown}
          colorClass={
            netChange >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-600 dark:text-amber-400"
          }
          bgClass={
            netChange >= 0
              ? "bg-emerald-500/15"
              : "bg-amber-500/15"
          }
          sub={
            Math.abs(balance - netChange) < 0.01
              ? "Reconciled · Equal to balance"
              : netChange >= 0
              ? "Positive cashflow"
              : "Negative net balance"
          }
        />
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1 text-xs font-bold dark:border-white/10 dark:bg-white/[0.04]">
        <Sliders className="ml-2.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        {(["ALL", "CREDIT", "DEBIT"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => handleFilter(f)}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all duration-200 ${
              filter === f
                ? "bg-white text-slate-900 shadow-sm dark:bg-[#0b1322] dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {f === "ALL" ? "All Activity" : f === "CREDIT" ? "Credits (+)" : "Debits (−)"}
          </button>
        ))}
      </div>

      {/* ── Transaction List ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-8 w-8 text-emerald-600" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center rounded-3xl border border-slate-200/90 bg-white/90 p-8 dark:border-white/10 dark:bg-[#0b1322]/90">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <Receipt className="h-8 w-8" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              No transactions found
            </p>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              {filter !== "ALL"
                ? "There are no transactions matching the selected filter."
                : "Your transaction history will be recorded here automatically when you top-up or place orders."}
            </p>
          </div>
          {filter !== "ALL" && (
            <button
              onClick={() => handleFilter("ALL")}
              className="mt-2 rounded-xl bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300 transition"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {transactions.map((tx) => (
            <TransactionCard key={tx.id} tx={tx} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 rounded-3xl border border-slate-200/90 bg-white/90 p-3.5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="flex items-center gap-1 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>

          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Page{" "}
            <span className="font-bold text-slate-900 dark:text-white">{page}</span> of{" "}
            <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
          </p>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="flex items-center gap-1 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Spinner className="h-8 w-8 text-emerald-600" />
        </div>
      }
    >
      <TransactionsContent />
    </React.Suspense>
  );
}
