import * as React from "react";
import { formatGHS } from "@/lib/types";
import { isMtnPrefix } from "@/lib/phone-utils";
import { Check, Copy, Send, ShoppingBag, Trash2, ArrowRight, Zap, AlertCircle } from "lucide-react";

export interface Line {
  phoneNumber: string;
  network: string;
  gbAmount: number;
  price: number | null;
}

export function QueueList({
  lines,
  onRemove,
  onClear,
}: {
  lines: Line[];
  onRemove: (i: number) => void;
  onClear: () => void;
}) {
  const [copied, setCopied] = React.useState(false);

  const copyAll = async () => {
    if (!lines.length) return;
    const text = lines.map((l) => `${l.phoneNumber} ${l.gbAmount}gb`).join("\n");
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1627]/90">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Active Order Queue</h2>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
            {lines.length}
          </span>
        </div>

        {lines.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={copyAll}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copy lines</span>
                </>
              )}
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={onClear}
              type="button"
              className="text-xs font-bold text-red-500 hover:text-red-600 hover:underline cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {lines.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs">
          No orders queued yet. Upload a spreadsheet or paste numbers above.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-[480px] overflow-y-auto no-scrollbar">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 text-xs hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-mono text-[10px] font-bold text-slate-500 dark:bg-white/5 dark:text-slate-400">
                {i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {l.phoneNumber}
                  </span>
                  {l.network === "MTN" && !isMtnPrefix(l.phoneNumber) && (
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-300 border border-amber-500/20">
                      Ported to MTN
                    </span>
                  )}
                </div>
              </div>

              <span
                className={`hidden sm:inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-black uppercase ${
                  l.network === "MTN"
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300"
                    : l.network === "TELECEL"
                    ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
                }`}
              >
                {l.network}
              </span>

              <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                {l.gbAmount} GB
              </span>

              <span className="w-20 text-right font-black text-slate-900 dark:text-white">
                {formatGHS(l.price ?? 0)}
              </span>

              <button
                onClick={() => onRemove(i)}
                className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition cursor-pointer"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SendSummary({
  count,
  total,
  submitting,
  onSubmit,
}: {
  count: number;
  total: number;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 shadow-xl shadow-emerald-600/20">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

      <div className="flex items-center justify-between border-b border-white/15 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
            <Send className="h-5 w-5 text-white" />
          </span>
          <div>
            <h3 className="text-base font-black">Dispatch Console</h3>
            <span className="text-[11px] text-emerald-100 font-medium">Instant Telecom Switch</span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          Live
        </span>
      </div>

      <div className="my-5 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 block">Orders</span>
          <span className="text-2xl font-black">{count}</span>
        </div>
        <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 block">Total Cost</span>
          <span className="text-2xl font-black">{formatGHS(total)}</span>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting || count === 0}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 px-6 font-black text-sm text-emerald-900 shadow-md transition-all hover:bg-emerald-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <Zap className="h-4 w-4 text-emerald-600" />
        <span>{submitting ? "Dispatching Orders…" : `Confirm & Dispatch ${count} Order${count === 1 ? "" : "s"}`}</span>
      </button>
    </div>
  );
}
