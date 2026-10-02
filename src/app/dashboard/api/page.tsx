"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Key,
  BookOpen,
  Play,
  ClipboardList,
  Webhook,
  FileText,
  BarChart2,
  Settings,
  ShieldCheck,
  Activity,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { PageHeader, StatCard, Spinner } from "@/components/shared";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { ScrollableTabs } from "@/components/ui/scrollable-tabs";
import { formatDateTime } from "@/lib/types";

// Sub-components
import { DeveloperApplicationCard } from "@/components/api/developer-application-card";
import { DeveloperCredentials } from "@/components/api/developer-credentials";
import { DeveloperDocs } from "@/components/api/developer-docs";
import { DeveloperPlayground } from "@/components/api/developer-playground";
import { DeveloperOrdersPanel } from "@/components/api/developer-orders-panel";
import { DeveloperWebhooksPanel } from "@/components/api/developer-webhooks-panel";
import { DeveloperLogsPanel } from "@/components/api/developer-logs-panel";
import { DeveloperStatusPanel } from "@/components/api/developer-status-panel";
import { DeveloperSettingsPanel } from "@/components/api/developer-settings-panel";

type TabKey =
  | "overview"
  | "access"
  | "credentials"
  | "docs"
  | "playground"
  | "orders"
  | "webhooks"
  | "logs"
  | "usage"
  | "settings"
  | "status";

export default function DeveloperDashboardPage() {
  const [activeTab, setActiveTab] = React.useState<TabKey>("overview");
  const [playgroundEndpoint, setPlaygroundEndpoint] = React.useState<string>("post-verify-numbers");
  const [usageData, setUsageData] = React.useState<any>(null);
  const [appData, setAppData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  // Sync tab from URL hash/query if present
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const tabParam = url.searchParams.get("tab") as TabKey;
      const endpointParam = url.searchParams.get("endpoint");
      if (tabParam) setActiveTab(tabParam);
      if (endpointParam) setPlaygroundEndpoint(endpointParam);
    }
  }, []);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [usageRes, appRes] = await Promise.all([
        fetch("/api/developer/usage"),
        fetch("/api/developer/application"),
      ]);
      const usageJson = await usageRes.json();
      const appJson = await appRes.json();
      setUsageData(usageJson);
      setAppData(appJson.application);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const navItems: { key: TabKey; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "access", label: "API Access", icon: ShieldCheck },
    { key: "credentials", label: "Credentials", icon: Key },
    { key: "docs", label: "Documentation", icon: BookOpen },
    { key: "playground", label: "Playground", icon: Play },
    { key: "orders", label: "Orders", icon: ClipboardList },
    { key: "webhooks", label: "Webhooks", icon: Webhook },
    { key: "logs", label: "Logs", icon: FileText },
    { key: "usage", label: "Usage", icon: BarChart2 },
    { key: "settings", label: "Settings", icon: Settings },
    { key: "status", label: "Status", icon: Activity },
  ];

  const metrics = usageData?.metrics || {};
  const isApproved = appData?.status === "APPROVED";

  return (
    <div className="space-y-6">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Developer Platform &amp; Integrations
              </span>
              <span className="text-[10px] font-bold text-slate-400">· RESTful &amp; Webhook Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Developer API
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Programmatic automated mobile data fulfillment. Generate API keys, test endpoints in the interactive playground, configure webhooks, and inspect real-time logs.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs with Smooth Chevrons & Mobile Quick Select */}
      <div className="space-y-2 border-b border-slate-200/80 pb-3 dark:border-white/10">
        {/* Mobile quick-jump select */}
        <div className="sm:hidden relative flex items-center">
          <div className="pointer-events-none absolute left-3.5 flex items-center text-emerald-600 dark:text-emerald-400">
            {React.createElement(navItems.find((n) => n.key === activeTab)?.icon || LayoutDashboard, {
              className: "h-4 w-4",
            })}
          </div>
          <select
            value={activeTab}
            onChange={(e) => {
              const newTab = e.target.value as TabKey;
              setActiveTab(newTab);
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.set("tab", newTab);
                window.history.replaceState({}, "", url.toString());
              }
            }}
            className="h-10 w-full appearance-none rounded-xl border border-emerald-500/40 bg-white pl-10 pr-10 text-xs font-bold uppercase tracking-wider text-slate-900 shadow-sm focus:outline-none dark:border-emerald-500/30 dark:bg-[#0b1322] dark:text-white [&>option]:bg-white dark:[&>option]:bg-[#0b1322]"
          >
            {navItems.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label} Section
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* Scrollable pill bar with Left/Right chevrons & auto-scroll for all screen sizes */}
        <ScrollableTabs
          tabs={navItems}
          activeTab={activeTab}
          onChange={(newTab) => {
            setActiveTab(newTab);
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              url.searchParams.set("tab", newTab);
              window.history.replaceState({}, "", url.toString());
            }
          }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8 text-emerald-600" />
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Application Status Banner */}
              <DeveloperApplicationCard application={appData} onApplied={loadData} />

              {/* KPI Cards */}
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90 flex flex-col justify-between">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Requests Today</p>
                  <p className="mt-2 font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    {metrics.requestsToday?.toLocaleString() || "0"}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">{metrics.requestsMonth?.toLocaleString() || 0} this month</p>
                </div>
                <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90 flex flex-col justify-between">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Orders Today</p>
                  <p className="mt-2 font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    {metrics.ordersToday?.toLocaleString() || "0"}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">{metrics.ordersTotal?.toLocaleString() || 0} lifetime</p>
                </div>
                <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90 flex flex-col justify-between">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Successful</p>
                  <p className="mt-2 font-mono text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {metrics.successfulRequests?.toLocaleString() || "0"}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-emerald-600/80">Live 200 OK</p>
                </div>
                <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90 flex flex-col justify-between">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Failed Requests</p>
                  <p className="mt-2 font-mono text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
                    {metrics.failedRequests?.toLocaleString() || "0"}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">Client/Server errors</p>
                </div>
                <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90 flex flex-col justify-between">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rate Limit</p>
                  <p className="mt-2 font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    {usageData?.rateLimit || 60}/min
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">Per API Key</p>
                </div>
                <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90 flex flex-col justify-between">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Webhook Success</p>
                  <p className="mt-2 font-mono text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {metrics.webhookSuccessRate || 100}%
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">{metrics.webhookFailures || 0} failures</p>
                </div>
              </div>

              {/* Recent Activity Sections */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Recent Requests */}
                <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-white/5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent API Requests</h3>
                    <button
                      onClick={() => setActiveTab("logs")}
                      className="text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      View all
                    </button>
                  </div>
                  {!usageData?.recentRequests || usageData.recentRequests.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-400">No requests yet.</p>
                  ) : (
                    <div className="mt-3.5 space-y-2.5">
                      {usageData.recentRequests.slice(0, 5).map((r: any) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between text-xs font-mono"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`rounded-lg px-2 py-0.5 text-[10px] font-black ${
                                r.success
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : "bg-red-500/15 text-red-700 dark:text-red-300"
                              }`}
                            >
                              {r.method} {r.status}
                            </span>
                            <span className="truncate text-slate-700 dark:text-slate-300">
                              {r.endpoint}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 shrink-0 font-sans">
                            {formatDateTime(r.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Orders */}
                <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-white/5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent API Orders</h3>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      View all
                    </button>
                  </div>
                  {!usageData?.recentOrders || usageData.recentOrders.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-400">No API orders yet.</p>
                  ) : (
                    <div className="mt-3.5 space-y-2.5">
                      {usageData.recentOrders.slice(0, 5).map((o: any) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-mono font-bold text-slate-900 dark:text-white">
                              {o.orderId}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {o.network} {o.gbAmount}GB • {o.phoneNumber}
                            </p>
                          </div>
                          <StatusBadge status={o.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Webhook Events */}
                <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-white/5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Webhook Events</h3>
                    <button
                      onClick={() => setActiveTab("webhooks")}
                      className="text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      View all
                    </button>
                  </div>
                  {!usageData?.recentWebhooks || usageData.recentWebhooks.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-400">No webhook deliveries yet.</p>
                  ) : (
                    <div className="mt-3.5 space-y-2.5">
                      {usageData.recentWebhooks.slice(0, 5).map((w: any) => (
                        <div
                          key={w.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-mono font-semibold text-slate-900 dark:text-white">
                              {w.event}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {w.orderId || "Test ping"}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              w.status === "SUCCESS"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : "bg-red-500/15 text-red-700 dark:text-red-300"
                            }`}
                          >
                            {w.statusCode ? `HTTP ${w.statusCode}` : w.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: API ACCESS */}
          {activeTab === "access" && (
            <div className="space-y-6">
              <DeveloperApplicationCard application={appData} onApplied={loadData} />
            </div>
          )}

          {/* TAB 3: CREDENTIALS */}
          {activeTab === "credentials" && (
            <DeveloperCredentials
              isApprovedForProduction={isApproved}
              applicationStatus={appData?.status || "NOT_APPLIED"}
            />
          )}

          {/* TAB 4: DOCUMENTATION */}
          {activeTab === "docs" && (
            <DeveloperDocs
              onOpenPlayground={(endpointId) => {
                setPlaygroundEndpoint(endpointId);
                setActiveTab("playground");
                if (typeof window !== "undefined") {
                  const u = new URL(window.location.href);
                  u.searchParams.set("tab", "playground");
                  u.searchParams.set("endpoint", endpointId);
                  window.history.replaceState({}, "", u.toString());
                }
              }}
            />
          )}

          {/* TAB 5: PLAYGROUND */}
          {activeTab === "playground" && (
            <DeveloperPlayground initialEndpointId={playgroundEndpoint} />
          )}

          {/* TAB 6: ORDERS */}
          {activeTab === "orders" && <DeveloperOrdersPanel />}

          {/* TAB 7: WEBHOOKS */}
          {activeTab === "webhooks" && <DeveloperWebhooksPanel />}

          {/* TAB 8: LOGS */}
          {activeTab === "logs" && <DeveloperLogsPanel />}

          {/* TAB 9: USAGE */}
          {activeTab === "usage" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard
                  title="Total API Requests"
                  value={
                    ((metrics.successfulRequests || 0) + (metrics.failedRequests || 0)).toLocaleString()
                  }
                />
                <StatCard
                  title="Requests (Month)"
                  value={metrics.requestsMonth?.toLocaleString() || "0"}
                />
                <StatCard
                  title="Orders Completed"
                  value={metrics.ordersCompleted?.toLocaleString() || "0"}
                />
                <StatCard
                  title="Webhook Reliability"
                  value={`${metrics.webhookSuccessRate || 100}%`}
                />
              </div>
              <DeveloperLogsPanel />
            </div>
          )}

          {/* TAB 10: SETTINGS */}
          {activeTab === "settings" && (
            <DeveloperSettingsPanel
              application={appData}
              onNavigateTab={(tab: string) => {
                setActiveTab(tab as TabKey);
                if (typeof window !== "undefined") {
                  const url = new URL(window.location.href);
                  url.searchParams.set("tab", tab);
                  window.history.replaceState({}, "", url.toString());
                }
              }}
            />
          )}

          {/* TAB 11: STATUS */}
          {activeTab === "status" && <DeveloperStatusPanel />}
        </>
      )}
    </div>
  );
}
