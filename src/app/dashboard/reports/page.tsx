"use client";

import * as React from "react";
import { Spinner, StatCard } from "@/components/shared";
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
  Legend,
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
  X,
  SlidersHorizontal,
} from "lucide-react";

interface ReportData {
  statusCounts: Record<string, number>;
  totalOrders: number;
  totalSpend: number;
  daily: { day: string; count: number; amount: number }[];
  byPackage: { network: string; gbAmount: number; count: number; amount: number }[];
  filter?: {
    from?: string;
    to?: string;
    isSingleDay?: boolean;
    network?: string;
    status?: string;
    source?: string;
  };
}

type DatePreset = "today" | "yesterday" | "7" | "30" | "90" | "specific_date" | "custom";

function formatDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ReportsPage() {
  const [data, setData] = React.useState<ReportData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filter States
  const [preset, setPreset] = React.useState<DatePreset>("30");
  const [specificDate, setSpecificDate] = React.useState<string>(() => formatDateInput(new Date()));
  const [customFrom, setCustomFrom] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateInput(d);
  });
  const [customTo, setCustomTo] = React.useState<string>(() => formatDateInput(new Date()));
  const [network, setNetwork] = React.useState<string>("ALL");
  const [status, setStatus] = React.useState<string>("ALL");
  const [source, setSource] = React.useState<string>("ALL");

  const buildQuery = React.useCallback(() => {
    const params = new URLSearchParams();

    if (preset === "today") {
      params.set("date", formatDateInput(new Date()));
    } else if (preset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      params.set("date", formatDateInput(y));
    } else if (preset === "specific_date") {
      if (specificDate) params.set("date", specificDate);
    } else if (preset === "custom") {
      if (customFrom) params.set("from", customFrom);
      if (customTo) params.set("to", customTo);
    } else {
      // 7, 30, 90 days presets
      const days = Number(preset) || 30;
      const from = new Date();
      from.setDate(from.getDate() - days);
      params.set("from", from.toISOString());
      params.set("to", new Date().toISOString());
    }

    if (network !== "ALL") params.set("network", network);
    if (status !== "ALL") params.set("status", status);
    if (source !== "ALL") params.set("source", source);

    return params.toString();
  }, [preset, specificDate, customFrom, customTo, network, status, source]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQuery();
      const res = await fetch(`/api/reports?${qs}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load report data");
      setData({
        statusCounts: json.statusCounts ?? {},
        totalOrders: json.totalOrders ?? 0,
        totalSpend: json.totalSpend ?? 0,
        daily: json.daily ?? [],
        byPackage: json.byPackage ?? [],
        filter: json.filter,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const resetFilters = () => {
    setPreset("30");
    setNetwork("ALL");
    setStatus("ALL");
    setSource("ALL");
    setSpecificDate(formatDateInput(new Date()));
  };

  const hasActiveFilters =
    network !== "ALL" ||
    status !== "ALL" ||
    source !== "ALL" ||
    preset === "specific_date" ||
    preset === "custom" ||
    preset === "today" ||
    preset === "yesterday";

  const safeData: ReportData = data ?? {
    statusCounts: {},
    totalOrders: 0,
    totalSpend: 0,
    daily: [],
    byPackage: [],
  };

  const success = safeData.statusCounts?.SUCCESS ?? 0;
  const failed = safeData.statusCounts?.FAILED ?? 0;
  const total = safeData.totalOrders ?? 0;
  const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : "0.0";

  const daily = (safeData.daily ?? []).map((d) => ({ ...d, amount: Number(d.amount) }));
  const isHourly = safeData.filter?.isSingleDay;

  const timelineTitle = isHourly
    ? preset === "today"
      ? "Hourly Orders & Spend (Today)"
      : preset === "yesterday"
      ? "Hourly Orders & Spend (Yesterday)"
      : `Hourly Orders & Spend (${specificDate || "Selected Date"})`
    : preset === "7"
    ? "Daily Orders & Spend (Last 7 Days)"
    : preset === "30"
    ? "Daily Orders & Spend (Last 30 Days)"
    : preset === "90"
    ? "Daily Orders & Spend (Last 90 Days)"
    : "Daily Orders & Spend (Custom Range)";

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
            type="button"
            onClick={() => loadData()}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Date Filter & Control Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-4 sm:p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Date Range &amp; Filters</h2>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition"
            >
              <X className="h-3.5 w-3.5" />
              Reset all filters
            </button>
          )}
        </div>

        {/* Date Preset Selector */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Select Range</p>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7", label: "Last 7 Days" },
              { id: "30", label: "Last 30 Days" },
              { id: "90", label: "Last 90 Days" },
              { id: "specific_date", label: "Specific Date", icon: Calendar },
              { id: "custom", label: "Custom Range", icon: Filter },
            ].map((p) => {
              const active = preset === p.id;
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p.id as DatePreset)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? "bg-emerald-600 text-white shadow-sm dark:bg-emerald-500"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  }`}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Specific Date input */}
        {preset === "specific_date" && (
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-50/40 p-3.5 dark:border-emerald-500/20 dark:bg-emerald-500/5">
            <div className="space-y-1">
              <label htmlFor="user-specific-date" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Choose Specific Day
              </label>
              <input
                id="user-specific-date"
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                max={formatDateInput(new Date())}
                className="block rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => setSpecificDate(formatDateInput(new Date()))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
            >
              Set to Today
            </button>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 self-center">
              Viewing 24-hour hourly timeline for this day.
            </p>
          </div>
        )}

        {/* Custom Range inputs */}
        {preset === "custom" && (
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-50/40 p-3.5 dark:border-emerald-500/20 dark:bg-emerald-500/5">
            <div className="space-y-1">
              <label htmlFor="user-from-date" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                From Date
              </label>
              <input
                id="user-from-date"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                max={customTo || formatDateInput(new Date())}
                className="block rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="user-to-date" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                To Date
              </label>
              <input
                id="user-to-date"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                min={customFrom}
                max={formatDateInput(new Date())}
                className="block rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setCustomFrom(formatDateInput(new Date()));
                setCustomTo(formatDateInput(new Date()));
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
            >
              Today Only
            </button>
          </div>
        )}

        {/* Dropdowns (Network, Status, Source) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Network Filter */}
          <div className="space-y-1">
            <label htmlFor="user-filter-network" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Network
            </label>
            <select
              id="user-filter-network"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
            >
              <option value="ALL">All Networks</option>
              <option value="MTN">MTN</option>
              <option value="TELECEL">Telecel</option>
              <option value="AIRTELTIGO">AirtelTigo</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label htmlFor="user-filter-status" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Order Status
            </label>
            <select
              id="user-filter-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Completed (Success)</option>
              <option value="PROCESSING">Processing</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          {/* Source Filter */}
          <div className="space-y-1">
            <label htmlFor="user-filter-source" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Order Source
            </label>
            <select
              id="user-filter-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
            >
              <option value="ALL">All Sources</option>
              <option value="WEB">Web Dashboard</option>
              <option value="API">Developer API</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-white/5">
            <span className="text-[11px] font-medium text-slate-400">Active filters:</span>
            {network !== "ALL" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                Network: {network}
                <button type="button" onClick={() => setNetwork("ALL")}>
                  <X className="h-3 w-3 hover:text-red-500" />
                </button>
              </span>
            )}
            {status !== "ALL" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                Status: {status}
                <button type="button" onClick={() => setStatus("ALL")}>
                  <X className="h-3 w-3 hover:text-red-500" />
                </button>
              </span>
            )}
            {source !== "ALL" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                Source: {source}
                <button type="button" onClick={() => setSource("ALL")}>
                  <X className="h-3 w-3 hover:text-red-500" />
                </button>
              </span>
            )}
            {preset === "specific_date" && specificDate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                Date: {specificDate}
              </span>
            )}
          </div>
        )}
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
              hint={`${data.daily.length} active periods`}
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

          {/* Orders & Spend Timeline chart */}
          <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{timelineTitle}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isHourly
                    ? "Orders and spending recorded per hour of the selected date"
                    : "Daily order volume and expenditure throughout the selected timeframe"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Orders
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
                  Spend (GHS)
                </span>
              </div>
            </div>

            <div className="mt-6 h-64 w-full">
              {daily.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No order activity matching this filter criteria.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                    <XAxis
                      dataKey="day"
                      fontSize={11}
                      tickLine={false}
                      stroke="#88888880"
                      tickFormatter={(d: string) => (d.length > 5 ? d.slice(5) : d)}
                    />
                    <YAxis yAxisId="left" fontSize={11} tickLine={false} stroke="#88888880" allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} stroke="#88888880" />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        name === "Spend (GHS)" ? formatGHS(Number(val) || 0) : val,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: "#0b1322",
                        borderColor: "rgba(16, 185, 129, 0.3)",
                        borderRadius: "0.75rem",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="count"
                      name="Orders"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="amount"
                      name="Spend (GHS)"
                      stroke="#0284c7"
                      strokeWidth={2}
                      dot={false}
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
                {safeData.byPackage.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No package data recorded for this period.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={safeData.byPackage.map((b) => ({
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
                  {Object.entries(safeData.statusCounts ?? {}).map(([s, c]) => {
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

                  {Object.keys(safeData.statusCounts ?? {}).length === 0 && (
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
