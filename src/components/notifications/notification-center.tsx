"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  ClipboardList,
  ExternalLink,
  X,
  Radio,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatGHS, type AuthUser } from "@/lib/types";
import { useNavBadges } from "@/components/app-nav";

interface NotificationCenterProps {
  user: AuthUser;
  admin?: boolean;
  announcement?: string | null;
  className?: string;
}

interface NotificationItem {
  id: string;
  type: "broadcast" | "warning" | "info" | "success";
  title: string;
  message: string;
  timestamp: string;
  href?: string;
  actionLabel?: string;
  dismissible?: boolean;
}

const STORAGE_KEY = "mycedinet_dismissed_notifications_v1";

export function NotificationCenter({
  user,
  admin,
  announcement,
  className,
}: NotificationCenterProps) {
  const [open, setOpen] = React.useState(false);
  const [dismissedIds, setDismissedIds] = React.useState<string[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const badges = useNavBadges(admin);
  const pendingOrdersCount = admin
    ? badges["/admin/orders"]?.count ?? 0
    : badges["/dashboard/orders"]?.count ?? 0;

  // Load dismissed notifications from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDismissedIds(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  // Save dismissed notifications
  const markAsDismissed = (id: string) => {
    const updated = [...new Set([...dismissedIds, id])];
    setDismissedIds(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const markAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    const updated = [...new Set([...dismissedIds, ...allIds])];
    setDismissedIds(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Close when clicking outside
  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Construct dynamic notifications
  const notifications = React.useMemo(() => {
    const list: NotificationItem[] = [];

    // 1. Platform Announcement
    if (announcement && announcement.trim()) {
      list.push({
        id: `announcement-${announcement.slice(0, 30)}`,
        type: "broadcast",
        title: "Platform Broadcast",
        message: announcement,
        timestamp: "Active Notice",
        dismissible: true,
      });
    }

    // 2. Pending orders notice
    if (pendingOrdersCount > 0) {
      list.push({
        id: `pending-orders-${pendingOrdersCount}`,
        type: "info",
        title: admin ? "Pending Orders in Queue" : "Orders Under Processing",
        message: admin
          ? `There are ${pendingOrdersCount} orders waiting for processing or gateway dispatch.`
          : `You have ${pendingOrdersCount} order(s) currently being processed by the telecom switch.`,
        timestamp: "Live update",
        href: admin ? "/admin/orders" : "/dashboard/orders",
        actionLabel: "View orders",
        dismissible: false,
      });
    }

    // 3. Balance alert for regular users
    if (!admin && typeof user.balance === "number" && user.balance < 10) {
      list.push({
        id: `low-balance-${Math.floor(user.balance)}`,
        type: "warning",
        title: "Low Account Balance",
        message: `Your balance is currently ${formatGHS(user.balance)}. Top up now to avoid dispatch interruptions.`,
        timestamp: "Balance notice",
        href: "/dashboard/billing",
        actionLabel: "Top up wallet",
        dismissible: false,
      });
    }

    // 4. System Telecom Gateways Operational
    list.push({
      id: "system-gateways-operational",
      type: "success",
      title: "Telecom Switch Online",
      message: "Direct API gateways for MTN Ghana, Telecel, and AT are operational with instant dispatch.",
      timestamp: "System status",
      dismissible: true,
    });

    return list;
  }, [announcement, pendingOrdersCount, admin, user.balance]);

  const activeNotifications = notifications.filter(
    (n) => !dismissedIds.includes(n.id)
  );

  const unreadCount = activeNotifications.length;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open notifications"
        aria-expanded={open}
        title={unreadCount > 0 ? `${unreadCount} unread notification(s)` : "Notifications"}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer",
          open
            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20"
            : "border-slate-200/80 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-slate-100/80 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
        )}
      >
        {unreadCount > 0 ? (
          <BellRing className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Bell className="h-4 w-4" />
        )}

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-1 text-[9px] font-black text-slate-950 shadow-sm ring-2 ring-white dark:ring-[#070c14]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Modern Popover Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b1322]/95 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
              </span>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  Notification Hub
                </h3>
                <p className="text-[10px] text-slate-400">Real-time alerts & broadcasts</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="rounded-lg px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="mt-3 max-h-[380px] space-y-2.5 overflow-y-auto no-scrollbar pr-0.5">
            {activeNotifications.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  All caught up!
                </p>
                <p className="text-[11px] text-slate-400">
                  No unread alerts or broadcasts at the moment.
                </p>
              </div>
            ) : (
              activeNotifications.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "group relative rounded-2xl border p-3 text-xs transition-all duration-150",
                    item.type === "broadcast"
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100"
                      : item.type === "warning"
                      ? "border-amber-500/30 bg-amber-500/5 text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100"
                      : item.type === "info"
                      ? "border-blue-500/30 bg-blue-500/5 text-slate-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-slate-100"
                      : "border-slate-200/80 bg-slate-50/70 text-slate-800 dark:border-white/5 dark:bg-white/[0.03] dark:text-slate-200"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg shadow-xs",
                        item.type === "broadcast"
                          ? "bg-emerald-600 text-white"
                          : item.type === "warning"
                          ? "bg-amber-500 text-slate-950"
                          : item.type === "info"
                          ? "bg-blue-600 text-white"
                          : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {item.type === "broadcast" ? (
                        <Megaphone className="h-3.5 w-3.5" />
                      ) : item.type === "warning" ? (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      ) : item.type === "info" ? (
                        <ClipboardList className="h-3.5 w-3.5" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black text-xs">{item.title}</span>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        {item.href ? (
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition"
                          >
                            <span>{item.actionLabel || "View"}</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span />
                        )}

                        {item.dismissible && (
                          <button
                            type="button"
                            onClick={() => markAsDismissed(item.id)}
                            className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Telemetry */}
          <div className="mt-3 border-t border-slate-100 pt-2.5 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Gateway Engine v2.4 Active
            </span>
            <Link
              href="/dashboard/buy-now"
              onClick={() => setOpen(false)}
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              Order Portal
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
