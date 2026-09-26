"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/toast";
import {
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  ShieldCheck,
  Send,
  FileSpreadsheet,
  Globe,
  Sliders,
  Check,
  Activity,
  Layers,
  Timer,
  Gauge,
  Clock,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { ClickyfiedBillingChecker } from "@/components/admin/clickyfied-billing-checker";
import {
  DEFAULT_CLICKYFIED_API_KEY,
  DEFAULT_CLICKYFIED_CLIENT_ID,
  DEFAULT_CLICKYFIED_SANDBOX_URL,
  DEFAULT_CLICKYFIED_PROD_URL,
} from "@/lib/provider-apis/clickyfied";
import { SUPPORTED_ROUTING_NETWORKS } from "@/lib/provider-apis/router";

interface Props {
  settings: Record<string, string>;
  setSettings: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSave?: () => Promise<void>;
  saving?: boolean;
}

export function ProviderApisSettings({ settings, setSettings, onSave, saving }: Props) {
  const { toast } = useToast();

  const [showClickyfiedKey, setShowClickyfiedKey] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [testingClickyfied, setTestingClickyfied] = React.useState(false);
  const [batchStatus, setBatchStatus] = React.useState<{
    batchEnabled: boolean;
    pendingCount: number;
    totalGb: number;
    gbThreshold: number;
    timerMinutes: number;
    minutesElapsed: number;
    minutesRemaining: number;
    secondsRemaining?: number;
    firstOrderAt?: string | null;
    currentBatchCount: number;
    currentBatchGb: number;
    nextBatchCount: number;
    nextBatchGb: number;
    thresholdMet: boolean;
    timerExpired: boolean;
    group1Count?: number;
    group1Gb?: number;
    group2Count?: number;
    group2Gb?: number;
  } | null>(null);
  const [loadingBatchStatus, setLoadingBatchStatus] = React.useState(false);
  const [dispatchingBatch, setDispatchingBatch] = React.useState(false);
  const [batchCountdownSec, setBatchCountdownSec] = React.useState<number | null>(null);

  const fetchBatchStatus = React.useCallback(async () => {
    try {
      setLoadingBatchStatus(true);
      const res = await fetch("/api/admin/provider-apis/clickyfied-batch");
      if (res.ok) {
        const data = await res.json();
        setBatchStatus(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingBatchStatus(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBatchStatus();
    const interval = setInterval(fetchBatchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchBatchStatus]);

  React.useEffect(() => {
    if (!batchStatus || batchStatus.pendingCount === 0) {
      setBatchCountdownSec(null);
    } else {
      setBatchCountdownSec(batchStatus.secondsRemaining ?? null);
    }
  }, [batchStatus]);

  React.useEffect(() => {
    if (batchCountdownSec === null || batchCountdownSec <= 0) return;
    const interval = setInterval(() => {
      setBatchCountdownSec((prev) => {
        if (prev === null || prev <= 1) {
          fetchBatchStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [batchCountdownSec, fetchBatchStatus]);

  const formatBatchCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleManualBatchDispatch = async () => {
    if (
      !window.confirm(
        `⚠️ WARNING: Immediate Provider Dispatch\n\nAre you sure you want to dispatch all ${batchStatus?.pendingCount ?? 0} pending MTN orders (${batchStatus?.totalGb ?? 0} GB) to Clickyfied right now?\n\nThis will submit orders for live fulfillment and debit your Clickyfied account balance.`
      )
    ) {
      return;
    }

    try {
      setDispatchingBatch(true);
      const res = await fetch("/api/admin/provider-apis/clickyfied-batch", { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast(data.error || "Failed to dispatch batch", "error");
        return;
      }
      toast(
        data.message ||
          `Successfully dispatched ${data.dispatchedCount} orders (${data.totalGb} GB) to Clickyfied`,
        "success"
      );
      fetchBatchStatus();
    } catch (err: any) {
      toast(err?.message || "Network error", "error");
    } finally {
      setDispatchingBatch(false);
    }
  };

  const [testResult, setTestResult] = React.useState<{
    provider: string;
    message: string;
    success: boolean;
  } | null>(null);

  const isRoutingEnabled = settings.provider_routing_enabled === "true";
  const appBaseUrl =
    settings.app_base_url || (typeof window !== "undefined" ? window.location.origin : "");
  const clickyfiedWebhookUrl = `${appBaseUrl}/api/webhooks/providers/clickyfied`;
  const clickyfiedCallbackUrl = clickyfiedWebhookUrl;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast(`${label} copied to clipboard!`, "success");
  };

  const applyClickyfiedAllPreset = () => {
    setSettings((s) => ({
      ...s,
      provider_routing_enabled: "true",
      provider_routing_default: "CLICKYFIED",
      provider_route_MTN: "CLICKYFIED",
      provider_route_MTN_XPRESS: "CLICKYFIED",
      provider_route_TELECEL: "CLICKYFIED",
      provider_route_AIRTELTIGO_ISHARE: "CLICKYFIED",
      provider_route_AIRTELTIGO_BIGTIME: "CLICKYFIED",
      clickyfied_enabled: "true",
      clickyfied_client_id: s.clickyfied_client_id || DEFAULT_CLICKYFIED_CLIENT_ID,
      clickyfied_mtn_verification_enabled: "true",
      clickyfied_not_received_enabled: "true",
      clickyfied_batch_enabled: "true",
      clickyfied_batch_gb_threshold: s.clickyfied_batch_gb_threshold || "100",
      clickyfied_batch_timer_minutes: s.clickyfied_batch_timer_minutes || "15",
    }));
    toast("Preset applied: All Networks → Clickyfied (MTN, Telecel, AirtelTigo)", "success");
  };

  const applyManualAllPreset = () => {
    setSettings((s) => ({
      ...s,
      provider_routing_enabled: "true",
      provider_routing_default: "MANUAL",
      provider_route_MTN: "MANUAL",
      provider_route_MTN_XPRESS: "MANUAL",
      provider_route_TELECEL: "MANUAL",
      provider_route_AIRTELTIGO_ISHARE: "MANUAL",
      provider_route_AIRTELTIGO_BIGTIME: "MANUAL",
    }));
    toast("Preset applied: All Networks → Manual File Export", "success");
  };

  const syncInFlight = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/provider-apis/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sync failed");
      toast(`Sync complete: ${json.checked} checked, ${json.updated} updated.`, "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSyncing(false);
    }
  };

  const testClickyfied = async () => {
    setTestingClickyfied(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/provider-apis/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_clickyfied_billing" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Clickyfied check failed");
      setTestResult({
        provider: "Clickyfied",
        success: true,
        message: `Connected successfully! Status HTTP 200 from ${settings.clickyfied_base_url || DEFAULT_CLICKYFIED_SANDBOX_URL}`,
      });
      toast("Clickyfied connection verified!", "success");
    } catch (err: any) {
      setTestResult({
        provider: "Clickyfied",
        success: false,
        message: err.message,
      });
      toast(`Clickyfied error: ${err.message}`, "error");
    } finally {
      setTestingClickyfied(false);
    }
  };

  const testSingleOrder = async (_provider = "CLICKYFIED") => {
    const msg = "Place a SANDBOX test 1GB MTN order to 0257467983 on Clickyfied sandbox?";
    if (!confirm(msg)) return;

    try {
      const res = await fetch("/api/admin/provider-apis/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_order",
          provider: "CLICKYFIED",
          network: "MTN",
          recipient: "0257467983",
          gbAmount: 1,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Test order failed");
      setTestResult({
        provider: "Clickyfied",
        success: true,
        message: `Test order submitted successfully! Ref: ${json.order?.orderId || json.order?.externalReference}`,
      });
      toast("Test order submitted to Clickyfied!", "success");
    } catch (err: any) {
      setTestResult({
        provider: "Clickyfied",
        success: false,
        message: err.message,
      });
      toast(`Test order error: ${err.message}`, "error");
    }
  };

  const networkRows = [
    { key: "MTN", label: "MTN Data (Regular)" },
    { key: "MTN_XPRESS", label: "MTN Xpress (Special)" },
    { key: "TELECEL", label: "Telecel / Vodafone" },
    { key: "AIRTELTIGO_ISHARE", label: "AirtelTigo iShare" },
    { key: "AIRTELTIGO_BIGTIME", label: "AirtelTigo Big Time" },
  ];
  return (
    <div className="space-y-6">
{/* 1. Master Switch Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-2.5 w-2.5 rounded-full ${
                  isRoutingEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                }`}
              />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Automated Order Processing (Provider APIs)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              When <strong>ON</strong>, orders placed for assigned networks are immediately dispatched
              to Clickyfied and status updates are tracked automatically.
              When <strong>OFF</strong>, orders remain in PENDING status for manual file export.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isRoutingEnabled}
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  provider_routing_enabled: isRoutingEnabled ? "false" : "true",
                }))
              }
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                isRoutingEnabled ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  isRoutingEnabled ? "left-[25px]" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <Label>Public App Base URL (for Webhooks & Callbacks)</Label>
            <Input
              type="url"
              placeholder="https://mycedinet.com"
              value={settings.app_base_url ?? ""}
              onChange={(e) => setSettings((s) => ({ ...s, app_base_url: e.target.value }))}
            />
            <p className="text-[11px] text-slate-400">
              Used as the base domain when notifying provider APIs where to deliver status webhooks.
            </p>
          </div>

          <div className="flex flex-col justify-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyClickyfiedAllPreset}
                className="text-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 font-semibold"
              >
                <Zap className="h-3.5 w-3.5 mr-1 text-indigo-600" /> Route All → Clickyfied
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyManualAllPreset}
                className="text-xs text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Manual Export All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={syncInFlight}
                disabled={syncing}
                className="text-xs"
                title="Sync Clickyfied in-flight orders"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncing ? "animate-spin" : ""}`} /> Sync Clickyfied Orders
              </Button></div>
            <p className="text-[11px] text-slate-400">
              Presets: <strong>Route All</strong> (All networks → Clickyfied API), or <strong>Manual Export All</strong> (All orders stay in pending for manual excel export).
            </p>
          </div>
        </div>

        {/* Background Status Poller Setting */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw
                  className={`h-4 w-4 ${
                    settings.provider_sync_poller_enabled !== "false"
                      ? "text-brand-600"
                      : "text-slate-400"
                  }`}
                />
                Automated Clickyfied Status Poller (MTN)
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    settings.provider_sync_poller_enabled !== "false"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {settings.provider_sync_poller_enabled !== "false"
                    ? `Active (Every ${parseInt(settings.provider_sync_poller_interval_seconds || "30", 10) || 30}s)`
                    : "Paused"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                When <strong>ON</strong>, the server automatically queries Clickyfied every {parseInt(settings.provider_sync_poller_interval_seconds || "30", 10) || 30} seconds for in-flight MTN orders and syncs their status. If using the Clickyfied webhook, this poller can remain off.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.provider_sync_poller_enabled !== "false"}
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  provider_sync_poller_enabled:
                    s.provider_sync_poller_enabled === "false" ? "true" : "false",
                }))
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                settings.provider_sync_poller_enabled !== "false"
                  ? "bg-brand-600"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  settings.provider_sync_poller_enabled !== "false"
                    ? "left-[22px]"
                    : "left-0.5"
                }`}
              />
            </button>
          </div>

          {settings.provider_sync_poller_enabled !== "false" && (
            <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">Polling Interval:</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Timer frequency for checking in-flight batches (Clickyfied recommends 30s minimum).
                </p>
              </div>
              <div className="flex items-center gap-2">
                {[30, 60, 120].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        provider_sync_poller_interval_seconds: String(sec),
                      }))
                    }
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                      (parseInt(settings.provider_sync_poller_interval_seconds || "30", 10) || 30) === sec
                        ? "bg-brand-600 text-white shadow-sm"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {sec}s {sec === 30 ? "(Default)" : ""}
                  </button>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="15"
                    max="600"
                    value={parseInt(settings.provider_sync_poller_interval_seconds || "30", 10) || 30}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSettings((s) => ({
                        ...s,
                        provider_sync_poller_interval_seconds: val,
                      }));
                    }}
                    className="w-16 px-2 py-1 text-xs text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="text-[11px] text-slate-500">sec</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Quick Link to Order API Logs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-indigo-200/80 bg-indigo-50/60 p-4 shadow-sm dark:border-indigo-900/40 dark:bg-indigo-950/20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Order API Logs & Diagnostics
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Inspect provider API request/response payloads, HTTP error codes, and why order dispatches failed.
            </p>
          </div>
        </div>
        <Link
          href="/admin/order-api-logs"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
        >
          View Order API Logs →
        </Link>
      </div>

      {/* Test Feedback Banner */}
      {testResult && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
            testResult.success
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
              : "bg-rose-50/80 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200"
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 overflow-hidden break-all">
            <strong>{testResult.provider}:</strong> {testResult.message}
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Network Routing Matrix */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Network-to-Provider Routing Matrix
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Assign which provider delivers each network. Currently serving all networks via Clickyfied.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
            {networkRows.length} Networks Configured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3 font-medium">Network / Bundle Type</th>
                <th className="py-2.5 px-3 font-medium text-center">Clickyfied API</th>
                <th className="py-2.5 px-3 font-medium text-center">Manual File Export</th>
                <th className="py-2.5 px-3 font-medium text-right">Active Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {networkRows.map((row) => {
                const settingKey = `provider_route_${row.key}`;
                const rawVal = settings[settingKey];
                const currentVal = (rawVal === "BIGWINDATA" || rawVal === "GHCONNECT" || rawVal === "BIGWIN_TELECEL" || !rawVal)
                  ? "CLICKYFIED"
                  : rawVal;

                return (
                  <tr key={row.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{row.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({row.key})</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={settingKey}
                          value="CLICKYFIED"
                          checked={currentVal === "CLICKYFIED"}
                          onChange={() =>
                            setSettings((s) => ({ ...s, [settingKey]: "CLICKYFIED" }))
                          }
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-indigo-700 dark:text-indigo-400 font-medium text-xs">
                          Clickyfied
                        </span>
                      </label>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={settingKey}
                          value="MANUAL"
                          checked={currentVal === "MANUAL"}
                          onChange={() => setSettings((s) => ({ ...s, [settingKey]: "MANUAL" }))}
                          className="text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-slate-600 dark:text-slate-400 text-xs">Manual</span>
                      </label>
                    </td>

                    <td className="py-3 px-3 text-right">
                      {!isRoutingEnabled ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Export Manual (Routing Off)
                        </span>
                      ) : currentVal === "MANUAL" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          📁 Manual Export
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                          🚀 Clickyfied
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Serving all active networks (MTN, Telecel, AirtelTigo) through <strong>Clickyfied</strong>.</span>
          </div>
          <span className="text-[11px] text-slate-400 italic">Extensible for future provider APIs</span>
        </div>
      </div>


{/* 3. Clickyfied Configuration */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
              🚀
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Clickyfied API Configuration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Supports automated orders, MTN number verification, and Not Received reporting flow.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={testClickyfied}
              disabled={testingClickyfied}
              className="text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${testingClickyfied ? "animate-spin" : ""}`} />
              Check Status
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                document.getElementById("clickyfied-billing-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300 hover:bg-amber-50"
            >
              <Receipt className="h-3.5 w-3.5 mr-1" />
              Check Daily Bill
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => testSingleOrder("CLICKYFIED")}
              className="text-xs border-indigo-300 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300 hover:bg-indigo-50"
            >
              Test Sandbox Order
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <Label>Environment / Base URL</Label>
            <div className="space-y-2">
              <Input
                type="text"
                value={settings.clickyfied_base_url ?? DEFAULT_CLICKYFIED_SANDBOX_URL}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, clickyfied_base_url: e.target.value }))
                }
              />
              <div className="flex items-center gap-4 text-xs">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="clickyfied_env"
                    checked={
                      (settings.clickyfied_base_url || DEFAULT_CLICKYFIED_SANDBOX_URL) ===
                      DEFAULT_CLICKYFIED_SANDBOX_URL
                    }
                    onChange={() =>
                      setSettings((s) => ({
                        ...s,
                        clickyfied_base_url: DEFAULT_CLICKYFIED_SANDBOX_URL,
                      }))
                    }
                  />
                  <span className="text-emerald-600 font-medium">Sandbox (Testing)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="clickyfied_env"
                    checked={settings.clickyfied_base_url === DEFAULT_CLICKYFIED_PROD_URL}
                    onChange={() =>
                      setSettings((s) => ({
                        ...s,
                        clickyfied_base_url: DEFAULT_CLICKYFIED_PROD_URL,
                      }))
                    }
                  />
                  <span className="text-slate-600 font-medium">Production (Live)</span>
                </label>
              </div>

              {(settings.clickyfied_base_url || DEFAULT_CLICKYFIED_SANDBOX_URL).toLowerCase().includes("sandbox") ? (
                <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30 p-2.5 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 mt-1 shrink-0 animate-pulse" />
                  <span>
                    <strong>Sandbox Mode Active:</strong> All orders placed on Dashboard (Send Orders), Storefront, and Developer API automatically route to Clickyfied Sandbox for testing without touching live funds.
                  </span>
                </div>
              ) : (
                <div className="rounded-lg border border-blue-200/80 bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/30 p-2.5 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                  <span>
                    <strong>Production Mode Active:</strong> Orders will route through Clickyfied Live API using your live production credentials.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>API Secret / Key (Authorization: Bearer)</Label>
            <div className="relative">
              <Input
                type={showClickyfiedKey ? "text" : "password"}
                value={settings.clickyfied_api_key ?? DEFAULT_CLICKYFIED_API_KEY}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, clickyfied_api_key: e.target.value }))
                }
                className="pr-10 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowClickyfiedKey(!showClickyfiedKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showClickyfiedKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Client ID (X-Client-Id header)</Label>
            <Input
              type="text"
              placeholder={DEFAULT_CLICKYFIED_CLIENT_ID}
              value={settings.clickyfied_client_id ?? DEFAULT_CLICKYFIED_CLIENT_ID}
              onChange={(e) =>
                setSettings((s) => ({ ...s, clickyfied_client_id: e.target.value }))
              }
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Inbound Callback URL (Give to Clickyfied)</Label>
            <div className="flex items-center gap-1.5">
              <Input
                readOnly
                value={clickyfiedCallbackUrl}
                className="bg-slate-50 dark:bg-slate-800 text-xs font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(clickyfiedCallbackUrl, "Clickyfied Callback URL")}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                Callback Signing Secret
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                  Provided by Clickyfied
                </span>
              </Label>
            </div>
            <Input
              type="text"
              placeholder="Paste the signing secret provided by Clickyfied"
              value={settings.clickyfied_callback_signing_secret ?? ""}
              onChange={(e) =>
                setSettings((s) => ({ ...s, clickyfied_callback_signing_secret: e.target.value }))
              }
              className="font-mono text-xs"
            />
            {settings.clickyfied_callback_signing_secret ? (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Signing secret is set. Webhook payloads from Clickyfied will be verified using this secret.
              </p>
            ) : (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Signing secret is required. Clickyfied will not send callbacks or callbacks cannot be verified without it.
              </p>
            )}
          </div>
        </div>

        {/* Feature Switches specific to Clickyfied Context */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                MTN Number Verification via Clickyfied Endpoint
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                When enabled, unverified MTN numbers are checked directly against Clickyfied&apos;s
                <code className="mx-1 px-1 bg-slate-200 dark:bg-slate-700 rounded">POST /api/public/v1/numbers/verify</code>
                endpoint.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.clickyfied_mtn_verification_enabled === "true"}
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  clickyfied_mtn_verification_enabled:
                    s.clickyfied_mtn_verification_enabled === "true" ? "false" : "true",
                }))
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                settings.clickyfied_mtn_verification_enabled === "true"
                  ? "bg-brand-600"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  settings.clickyfied_mtn_verification_enabled === "true"
                    ? "left-[22px]"
                    : "left-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Send className="h-4 w-4 text-brand-600" />
                Forward &quot;Not Received&quot; Reports to Clickyfied
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                When a user reports an order as not received, automatically notify Clickyfied&apos;s
                <code className="mx-1 px-1 bg-slate-200 dark:bg-slate-700 rounded">POST /api/public/v1/orders/&#123;orderId&#125;/not-received</code>
                endpoint.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.clickyfied_not_received_enabled !== "false"}
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  clickyfied_not_received_enabled:
                    s.clickyfied_not_received_enabled === "false" ? "true" : "false",
                }))
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                settings.clickyfied_not_received_enabled !== "false"
                  ? "bg-brand-600"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  settings.clickyfied_not_received_enabled !== "false"
                    ? "left-[22px]"
                    : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* MTN Batch Order Accumulation Settings */}
          <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-brand-600" />
                  MTN Batch Order Accumulation
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Accumulate MTN orders and dispatch in bulk batches rather than singles. Automatically dispatches when accumulated volume reaches the GB threshold OR when the timer expires.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.clickyfied_batch_enabled !== "false"}
                onClick={() =>
                  setSettings((s) => ({
                    ...s,
                    clickyfied_batch_enabled:
                      s.clickyfied_batch_enabled === "false" ? "true" : "false",
                  }))
                }
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  settings.clickyfied_batch_enabled !== "false"
                    ? "bg-brand-600"
                    : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    settings.clickyfied_batch_enabled !== "false"
                      ? "left-[22px]"
                      : "left-0.5"
                  }`}
                />
              </button>
            </div>

            {settings.clickyfied_batch_enabled !== "false" && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-white/5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* GB Threshold */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Gauge className="h-3.5 w-3.5 text-brand-600" />
                      Batch Volume Threshold (GB)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="100"
                      value={settings.clickyfied_batch_gb_threshold ?? "100"}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          clickyfied_batch_gb_threshold: e.target.value,
                        }))
                      }
                      className="font-mono text-sm"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {["50", "100", "200", "500"].map((gb) => (
                        <button
                          key={gb}
                          type="button"
                          onClick={() =>
                            setSettings((s) => ({ ...s, clickyfied_batch_gb_threshold: gb }))
                          }
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
                            (settings.clickyfied_batch_gb_threshold ?? "100") === gb
                              ? "bg-brand-50 text-brand-700 border-brand-300 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-700"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-white/10"
                          }`}
                        >
                          {gb} GB {gb === "100" && "(Default)"}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Dispatches automatically whenever pending MTN volume reaches this amount.
                    </p>
                  </div>

                  {/* Timer Interval */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Timer className="h-3.5 w-3.5 text-brand-600" />
                      Batch Interval Timer (Minutes)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="15"
                      value={settings.clickyfied_batch_timer_minutes ?? "15"}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          clickyfied_batch_timer_minutes: e.target.value,
                        }))
                      }
                      className="font-mono text-sm"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {["5", "10", "15", "30", "60"].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() =>
                            setSettings((s) => ({ ...s, clickyfied_batch_timer_minutes: mins }))
                          }
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
                            (settings.clickyfied_batch_timer_minutes ?? "15") === mins
                              ? "bg-brand-50 text-brand-700 border-brand-300 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-700"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-white/10"
                          }`}
                        >
                          {mins}m {mins === "15" && "(Default)"}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Dispatches all accumulated MTN orders when this timer window expires.
                    </p>
                  </div>
                </div>

                {/* Live Queue Monitor Widget */}
                <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3.5 bg-white dark:bg-slate-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-brand-600" />
                      Live MTN Batch Queue Status
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fetchBatchStatus}
                      disabled={loadingBatchStatus}
                      className="h-7 text-[11px] gap-1 px-2"
                    >
                      <RefreshCw className={`h-3 w-3 ${loadingBatchStatus ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="text-[10px] text-slate-500">Pending Orders</div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {batchStatus?.pendingCount ?? 0}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="text-[10px] text-slate-500">Accumulated GB</div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {batchStatus?.totalGb ?? 0}{" "}
                        <span className="text-[10px] font-normal text-slate-500">
                          / {batchStatus?.gbThreshold ?? settings.clickyfied_batch_gb_threshold ?? 100} GB
                        </span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="text-[10px] text-slate-500">Timer Countdown</div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {batchStatus ? (
                          batchStatus.pendingCount === 0 ? (
                            <span className="text-slate-400 font-normal text-xs">Waiting for orders</span>
                          ) : batchCountdownSec !== null && batchCountdownSec > 0 ? (
                            <span className="font-mono text-brand-600 dark:text-brand-400">
                              {formatBatchCountdown(batchCountdownSec)} left
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold">Dispatching...</span>
                          )
                        ) : (
                          "..."
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Two-Group Size Breakdown Preview */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">Group 1 (1–5 GB)</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-blue-200/60 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 font-medium">Small</span>
                      </div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {batchStatus?.group1Count ?? 0} order(s) • {batchStatus?.group1Gb ?? 0} GB
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">Group 2 (6+ GB)</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-200/60 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 font-medium">Large</span>
                      </div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {batchStatus?.group2Count ?? 0} order(s) • {batchStatus?.group2Gb ?? 0} GB
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      Dispatched as 2 separate batches (1–5 GB & 6+ GB) to Clickyfied.
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleManualBatchDispatch}
                      disabled={(batchStatus?.pendingCount ?? 0) === 0 || dispatchingBatch}
                      className="h-7 text-xs gap-1 bg-amber-600 hover:bg-amber-700 text-white font-medium"
                    >
                      {dispatchingBatch ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3" />
                          <span>Dispatch Queue Now</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Action 8: Daily Billing Checker */}
            <div id="clickyfied-billing-section" className="pt-4 border-t border-slate-200 dark:border-white/5">
              <ClickyfiedBillingChecker />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
