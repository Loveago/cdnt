"use client";

import * as React from "react";
import { Spinner, StatCard } from "@/components/shared";
import { Input, Label } from "@/components/ui/input";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { formatGHS } from "@/lib/types";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
} from "lucide-react";

interface ReportData {
  statusCounts: Record<string, number>;
  totalOrders: number;
  totalSpend: number;
  daily: { day: string; count: number; amount: number }[];
  byPackage: { network: string; gbAmount: number; count: number; amount: number }[];
}

export default function ReportsPage() {
  const [data, setData] = React.useState<ReportData | null>(null);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/reports?${params}`);
      const json = await res.json();
      if (res.ok) {
        setData({
          statusCounts: json.statusCounts ?? {},
          totalOrders: json.totalOrders ?? 0,
          totalSpend: json.totalSpend ?? 0,
          daily: json.daily ?? [],
          byPackage: json.byPackage ?? [],
        });
      } else {
        setError(json.error ?? "Failed to load report data");
        setData({
          statusCounts: {},
          totalOrders: 0,
          totalSpend: 0,
          daily: [],
          byPackage: [],
        });
      }
    } catch {
      setError("Failed to load report data");
      setData({
        statusCounts: {},
        totalOrders: 0,
        totalSpend: 0,
        daily: [],
        byPackage: [],
      });
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  React.useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const [activePreset, setActivePreset] = React.useState<number | null | "custom">(null);

  const formatLocalDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const setPreset = (days: number | null) => {
    setActivePreset(days);
    if (days === null) {
      setFrom("");
      setTo("");
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setTo(formatLocalDate(end));
    setFrom(formatLocalDate(start));
  };

  const success = data?.statusCounts?.SUCCESS ?? 0;
  const failed = data?.statusCounts?.FAILED ?? 0;
  const total = data?.totalOrders ?? 0;
  const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Analytics
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Spending &amp; Order Reports
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Analyze your order fulfillment rate, package volume, and total expenditure trends.
            </p>
          </div>
          <button
            onClick={() => load()}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-100 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-500" : ""}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Date Filter Card with Presets */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xs backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Filter className="h-3.5 w-3.5 text-emerald-500" />
              Date Range:
            </span>
            {[
              { label: "Today", days: 0 },
              { label: "Last 7 Days", days: 7 },
              { label: "Last 30 Days", days: 30 },
              { label: "All Time", days: null },
            ].map((p) => {
              const active = activePreset === p.days;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPreset(p.days)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    active
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "border border-slate-200/70 bg-white text-slate-700 shadow-2xs hover:border-emerald-500/40 hover:text-emerald-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:text-emerald-400"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold text-slate-500 dark:text-slate-400">From</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setActivePreset("custom");
                  }}
                  className="h-9 rounded-xl border-slate-200/80 bg-white text-xs font-medium dark:border-white/10 dark:bg-white/5 focus-visible:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold text-slate-500 dark:text-slate-400">To</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setActivePreset("custom");
                  }}
                  className="h-9 rounded-xl border-slate-200/80 bg-white text-xs font-medium dark:border-white/10 dark:bg-white/5 focus-visible:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:border-red-500/30 dark:text-red-400">
          {error}
        </div>
      )}

      {loading || !data ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/70 bg-white/50 py-16 dark:border-white/5 dark:bg-[#0b1322]/50">
          <Spinner className="h-8 w-8 text-emerald-500" />
          <p className="mt-3 text-xs font-bold text-slate-400">Compiling financial &amp; order statistics...</p>
        </div>
      ) : (
        <>
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Orders"
              value={total.toLocaleString()}
              hint={`${data.daily.length} active days recorded`}
              icon={ClipboardList}
            />
            <StatCard
              title="Successful"
              value={success.toLocaleString()}
              hint={`${successRate}% fulfillment rate`}
              icon={CheckCircle2}
            />
            <StatCard
              title="Failed Orders"
              value={failed.toLocaleString()}
              hint="Unfulfilled or refunded"
              icon={XCircle}
            />
            <StatCard
              title="Total Spend"
              value={formatGHS(data.totalSpend)}
              hint="Valid orders volume"
              icon={TrendingUp}
            />
          </div>

          {/* Orders per day chart */}
          <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Orders Over Time</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daily transaction count throughout the selected timeframe
                </p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <BarChart3 className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-6 h-64 w-full">
              {data.daily.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No order activity in this date range.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                    <XAxis
                      dataKey="day"
                      fontSize={11}
                      tickLine={false}
                      stroke="#88888880"
                      tickFormatter={(d: string) => d.slice(5)}
                    />
                    <YAxis fontSize={11} tickLine={false} stroke="#88888880" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0b1322",
                        borderColor: "rgba(16, 185, 129, 0.3)",
                        borderRadius: "0.75rem",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Orders"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ fill: "#10b981", r: 3 }}
                      activeDot={{ r: 5, fill: "#059669" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Grid: Spend per package + Status breakdown */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Spend per Package */}
            <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Spend per Package</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cumulative GHS spent across top bundle tiers
                  </p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>

              <div className="mt-6 h-60 w-full">
                {data.byPackage.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No package data recorded for this period.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.byPackage.map((b) => ({
                        name: `${b.network} ${b.gbAmount}GB`,
                        amount: b.amount,
                      }))}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                      <XAxis dataKey="name" fontSize={10} tickLine={false} stroke="#88888880" />
                      <YAxis fontSize={11} tickLine={false} stroke="#88888880" />
                      <Tooltip
                        formatter={(val: any) => [formatGHS(Number(val) || 0), "Spend"]}
                        contentStyle={{
                          backgroundColor: "#0b1322",
                          borderColor: "rgba(20, 184, 166, 0.3)",
                          borderRadius: "0.75rem",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Status breakdown */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Status Breakdown</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Distribution across delivery stages
                    </p>
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <PieChartIcon className="h-4 w-4" />
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {Object.entries(data.statusCounts ?? {}).map(([s, c]) => {
                    const pct = total > 0 ? Math.round((c / total) * 100) : 0;
                    const isSuccess = s === "SUCCESS";
                    const isFailed = s === "FAILED";
                    const isPending = s === "PENDING";

                    const badgeColor = isSuccess
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : isFailed
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      : isPending
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";

                    const barColor = isSuccess
                      ? "bg-emerald-500"
                      : isFailed
                      ? "bg-rose-500"
                      : isPending
                      ? "bg-amber-500"
                      : "bg-sky-500";

                    return (
                      <div
                        key={s}
                        className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 dark:border-white/5 dark:bg-white/[0.02]"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${badgeColor}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${barColor}`} />
                            {s}
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {c} <span className="text-slate-400 font-normal">({pct}%)</span>
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                          <div
                            className={`h-full rounded-full ${barColor} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {Object.keys(data.statusCounts ?? {}).length === 0 && (
                    <p className="py-8 text-center text-xs text-slate-400">
                      No status records available for this period.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
