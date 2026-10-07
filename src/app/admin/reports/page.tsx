"use client";

import * as React from "react";
import { PageHeader, Spinner, StatCard } from "@/components/shared";
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
  FileBarChart,
  TrendingUp,
  ClipboardList,
  Users,
  Calendar,
  Filter,
  RefreshCw,
  X,
  ChevronRight,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Radio,
} from "lucide-react";
import { UserSalesSheet, type UserSalesUser } from "@/components/admin/user-sales-sheet";

interface ReportData {
  statusCounts: Record<string, number>;
  totalOrders: number;
  totalRevenue: number;
  daily: { day: string; count: number; amount: number }[];
  byPackage: { network: string; gbAmount: number; count: number; amount: number }[];
  topUsers: { id: string; name: string; email: string; orders: number; spend: number }[];
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

export default function AdminReportsPage() {
  const [data, setData] = React.useState<ReportData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [salesUser, setSalesUser] = React.useState<UserSalesUser | null>(null);

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
      const res = await fetch(`/api/admin/reports?${qs}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load reports data");
      setData({
        statusCounts: json.statusCounts ?? {},
        totalOrders: json.totalOrders ?? 0,
        totalRevenue: json.totalRevenue ?? 0,
        daily: json.daily ?? [],
        byPackage: json.byPackage ?? [],
        topUsers: json.topUsers ?? [],
        filter: json.filter,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load reports data");
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
    totalRevenue: 0,
    daily: [],
    byPackage: [],
    topUsers: [],
  };

  const daily = (safeData.daily ?? []).map((d) => ({ ...d, amount: Number(d.amount) }));
  const successRate =
    safeData.totalOrders > 0
      ? Math.round(((safeData.statusCounts?.SUCCESS ?? 0) / safeData.totalOrders) * 100)
      : 0;

  const isHourly = safeData.filter?.isSingleDay;

  // Human description for timeline chart
  const timelineTitle = isHourly
    ? preset === "today"
      ? "Hourly Orders & Revenue (Today)"
      : preset === "yesterday"
      ? "Hourly Orders & Revenue (Yesterday)"
      : `Hourly Orders & Revenue (${specificDate || "Selected Date"})`
    : preset === "7"
    ? "Daily Orders & Revenue (Last 7 Days)"
    : preset === "30"
    ? "Daily Orders & Revenue (Last 30 Days)"
    : preset === "90"
    ? "Daily Orders & Revenue (Last 90 Days)"
    : "Daily Orders & Revenue (Custom Range)";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Reports"
        description="Platform-wide order analytics, sales trends, and breakdown filters"
        actions={
          <button
            type="button"
            onClick={() => loadData()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-brand-600 dark:text-brand-400 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Filter Control Center */}
      <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-4 sm:p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#0b1322]/90 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Date &amp; Filter Options</h2>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition"
            >
              <X className="h-3.5 w-3.5" />
              Reset all filters
            </button>
          )}
        </div>

        {/* Date Preset Buttons */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Date Range Preset</p>
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
                      ? "bg-brand-600 text-white shadow-sm dark:bg-brand-500"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Inputs based on preset */}
        {preset === "specific_date" && (
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-brand-200/60 bg-brand-50/40 p-3.5 dark:border-brand-500/20 dark:bg-brand-500/5">
            <div className="space-y-1">
              <label htmlFor="report-specific-date" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pick Exact Date
              </label>
              <input
                id="report-specific-date"
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                max={formatDateInput(new Date())}
                className="block rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => setSpecificDate(formatDateInput(new Date()))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Set to Today
            </button>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 self-center">
              Viewing full 24-hour hourly distribution for this day.
            </p>
          </div>
        )}

        {preset === "custom" && (
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-brand-200/60 bg-brand-50/40 p-3.5 dark:border-brand-500/20 dark:bg-brand-500/5">
            <div className="space-y-1">
              <label htmlFor="report-from-date" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                From Date
              </label>
              <input
                id="report-from-date"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                max={customTo || formatDateInput(new Date())}
                className="block rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="report-to-date" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                To Date
              </label>
              <input
                id="report-to-date"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                min={customFrom}
                max={formatDateInput(new Date())}
                className="block rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setCustomFrom(formatDateInput(new Date()));
                setCustomTo(formatDateInput(new Date()));
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Today Only
            </button>
          </div>
        )}

        {/* Dropdown Filters (Network, Status, Source) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Network Filter */}
          <div className="space-y-1">
            <label htmlFor="filter-network" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Network
            </label>
            <select
              id="filter-network"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-bold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-100"
            >
              <option value="ALL">All Networks</option>
              <option value="MTN">MTN</option>
              <option value="TELECEL">Telecel</option>
              <option value="AIRTELTIGO">AirtelTigo</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label htmlFor="filter-status" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Order Status
            </label>
            <select
              id="filter-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-bold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-100"
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
            <label htmlFor="filter-source" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Order Source
            </label>
            <select
              id="filter-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-bold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-100"
            >
              <option value="ALL">All Sources</option>
              <option value="WEB">Web Dashboard</option>
              <option value="API">Developer API</option>
              <option value="STOREFRONT">Storefront Customer</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[11px] font-medium text-slate-400">Active filters:</span>
            {network !== "ALL" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                Network: {network}
                <button type="button" onClick={() => setNetwork("ALL")}>
                  <X className="h-3 w-3 hover:text-red-500" />
                </button>
              </span>
            )}
            {status !== "ALL" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                Status: {status}
                <button type="button" onClick={() => setStatus("ALL")}>
                  <X className="h-3 w-3 hover:text-red-500" />
                </button>
              </span>
            )}
            {source !== "ALL" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
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

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          <p className="font-semibold">{error}</p>
          <button
            onClick={() => loadData()}
            className="mt-3 inline-flex items-center rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Overlay or Stat Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8 text-brand-600" />
        </div>
      ) : (
        <>
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              title="Orders in Range"
              value={String(safeData.totalOrders)}
              icon={ClipboardList}
              hint={safeData.statusCounts?.SUCCESS ? `${safeData.statusCounts.SUCCESS} fulfilled` : undefined}
            />
            <StatCard
              title="Total Revenue"
              value={formatGHS(safeData.totalRevenue)}
              icon={TrendingUp}
              hint="Completed & in-flight"
            />
            <StatCard
              title="Success Rate"
              value={`${successRate}%`}
              icon={FileBarChart}
              hint={`${safeData.statusCounts?.FAILED ?? 0} failed`}
            />
            <StatCard
              title="Active Spenders"
              value={String(safeData.topUsers.length)}
              icon={Users}
              hint="Top customers in range"
            />
          </div>

          {/* Timeline Chart (Hourly or Daily) */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{timelineTitle}</h3>
                <p className="text-xs text-slate-400">
                  {isHourly ? "Orders and revenue per hour of the selected date" : "Orders and revenue aggregated by day"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Orders
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Revenue
                </span>
              </div>
            </div>

            <div className="h-72">
              {daily.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No orders recorded for this filter criteria
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.15)" />
                    <XAxis dataKey="day" fontSize={11} tickLine={false} />
                    <YAxis yAxisId="left" fontSize={11} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        name === "Revenue (GHS)" ? formatGHS(Number(val)) : val,
                        name,
                      ]}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="count"
                      name="Orders"
                      stroke="#2563EB"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="amount"
                      name="Revenue (GHS)"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Breakdown Section: By Package & Top Users */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Orders by package */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Orders by Package</h3>
              <div className="h-64">
                {safeData.byPackage.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No package volume found in this range
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={safeData.byPackage.map((b) => ({
                        name: `${b.network} ${b.gbAmount}GB`,
                        count: b.count,
                      }))}
                      layout="vertical"
                    >
                      <XAxis type="number" fontSize={11} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={90} fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563EB" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Top users by spend */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Customers by Spend</h3>
                  <p className="text-xs text-slate-400">Click any user to view comprehensive sales analysis</p>
                </div>
              </div>
              {safeData.topUsers.length === 0 ? (
                <div className="flex h-52 items-center justify-center text-xs text-slate-400">
                  No orders matching the active criteria
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
                  {safeData.topUsers.map((u, i) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => setSalesUser({ id: u.id, name: u.name, email: u.email })}
                        className="w-full flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition group cursor-pointer"
                        title={`View sales summary for ${u.name}`}
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                            {u.name}
                          </p>
                          <p className="truncate text-xs text-slate-500">{u.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 dark:text-white">{formatGHS(u.spend)}</p>
                          <p className="text-xs text-slate-500">{u.orders} orders</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-brand-600 transition-colors ml-1 shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {/* User Sales Summary Sheet */}
      <UserSalesSheet
        open={Boolean(salesUser)}
        user={salesUser}
        onClose={() => setSalesUser(null)}
        onSelectUser={(u) => setSalesUser(u)}
      />
    </div>
  );
}
