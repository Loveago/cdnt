import { prisma } from "../prisma";
import { syncAckmorreOrder } from "./router";

let isAckmorrePolling = false;

export async function getAckmorrePollerIntervalSeconds(): Promise<number> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "ackmorre_poller_interval_seconds" },
    });
    if (setting && setting.value) {
      const val = parseInt(setting.value, 10);
      if (!isNaN(val) && val >= 10) return val;
    }
  } catch {}

  const envVal = process.env.ACKMORRE_POLLER_INTERVAL_SECONDS;
  if (envVal) {
    const val = parseInt(envVal, 10);
    if (!isNaN(val) && val >= 10) return val;
  }

  return 60; // Default: 60 seconds
}

/**
 * Polls in-flight Ackmorre orders for a specific network ("MTN" or "TELECEL").
 */
async function pollAckmorreNetworkOrders(
  network: "MTN" | "TELECEL",
  cutoffTime: Date
): Promise<{ checked: number; updated: number; statusChecksDisabled: boolean }> {
  const inFlightOrders = await prisma.order.findMany({
    where: {
      network,
      status: { in: ["PENDING", "PROCESSING"] },
      providerReference: { startsWith: "ACKMORRE:" },
      updatedAt: { lte: cutoffTime },
    },
    take: 100,
    orderBy: { updatedAt: "asc" },
  });

  if (inFlightOrders.length === 0) {
    return { checked: 0, updated: 0, statusChecksDisabled: false };
  }

  console.log(
    `[AckmorreSyncPoller] Syncing ${inFlightOrders.length} in-flight Ackmorre ${network} order(s)...`
  );

  let checked = 0;
  let updated = 0;
  for (const order of inFlightOrders) {
    checked++;
    try {
      const res = await syncAckmorreOrder(order, `Ackmorre ${network} Background Poller`);
      if (res.statusChecksDisabled) {
        console.warn(
          `[AckmorreSyncPoller] Ackmorre status checks are disabled (403 STATUS_CHECKS_DISABLED); stopping ${network} cycle.`
        );
        return { checked, updated, statusChecksDisabled: true };
      }
      if (res.changed) {
        updated++;
      }
    } catch (err: any) {
      console.error(
        `[AckmorreSyncPoller] Error syncing ${network} order #${order.id} (ref=${order.providerReference}):`,
        err?.message || err
      );
    }
  }

  return { checked, updated, statusChecksDisabled: false };
}

/**
 * Self-scheduling background poller for in-flight Ackmorre MTN and Telecel orders.
 * Runs independently from the Clickyfied poller and queries MTN and Telecel orders separately.
 */
export function startAckmorreSyncPoller() {
  if (typeof window !== "undefined") return;

  // In PM2 cluster mode, only instance 0 should run background polling loops
  const instanceId = process.env.pm_id ?? process.env.NODE_APP_INSTANCE;
  if (instanceId !== undefined && instanceId !== "" && instanceId !== "0") {
    console.log(
      `[AckmorreSyncPoller] Skipping poller initialization on PM2 cluster worker #${instanceId}`
    );
    return;
  }

  const g = globalThis as any;
  if (g.__ackmorreSyncPollerStarted) {
    return;
  }
  g.__ackmorreSyncPollerStarted = true;

  console.log(
    "[AckmorreSyncPoller] Automated Ackmorre background status poller initialized (MTN & TELECEL, 60s default interval)."
  );

  const poll = async () => {
    if (isAckmorrePolling) return;
    isAckmorrePolling = true;
    try {
      const pollerSettings = await prisma.systemSetting.findMany({
        where: {
          key: {
            in: [
              "ackmorre_poller_enabled",
              "ackmorre_poller_mtn_enabled",
              "ackmorre_poller_telecel_enabled",
            ],
          },
        },
      });
      const settingsMap = new Map(pollerSettings.map((s) => [s.key, s.value]));

      if (settingsMap.get("ackmorre_poller_enabled") === "false") {
        return;
      }

      const mtnEnabled = settingsMap.get("ackmorre_poller_mtn_enabled") !== "false";
      const telecelEnabled = settingsMap.get("ackmorre_poller_telecel_enabled") !== "false";
      if (!mtnEnabled && !telecelEnabled) {
        return;
      }

      const { getProviderRoutingConfig } = await import("./router");
      const config = await getProviderRoutingConfig();
      if (!config.enabled || !config.ackmorre.enabled || !config.ackmorre.apiKey) {
        return;
      }

      // Distributed DB lock to guarantee only 1 PM2 worker executes this poll cycle across cluster
      const intervalSeconds = await getAckmorrePollerIntervalSeconds();
      const lockKey = "ackmorre_poller_distributed_lock";
      const now = Date.now();
      const lockExpiry = Math.max(20, intervalSeconds - 5) * 1000;

      try {
        const existingLock = await prisma.systemSetting.findUnique({ where: { key: lockKey } });
        if (existingLock && existingLock.value) {
          const lockExpiresAt = parseInt(existingLock.value, 10);
          if (!isNaN(lockExpiresAt) && now < lockExpiresAt) {
            return;
          }
        }
        await prisma.systemSetting.upsert({
          where: { key: lockKey },
          create: { key: lockKey, value: String(now + lockExpiry) },
          update: { value: String(now + lockExpiry) },
        });
      } catch {
        // If DB lock fails transiently, continue cautiously
      }

      const cutoffTime = new Date(Date.now() - intervalSeconds * 1000);

      // 1. Poll Ackmorre MTN orders separately
      if (mtnEnabled) {
        const mtnResult = await pollAckmorreNetworkOrders("MTN", cutoffTime);
        if (mtnResult.statusChecksDisabled) {
          return;
        }
      }

      // 2. Poll Ackmorre Telecel orders separately
      if (telecelEnabled) {
        await pollAckmorreNetworkOrders("TELECEL", cutoffTime);
      }
    } catch {
      // Ignore background transient errors
    } finally {
      isAckmorrePolling = false;
    }
  };

  // Self-scheduling loop respecting the dynamic interval
  const scheduleNext = async (delayMs?: number) => {
    try {
      const intervalSec = await getAckmorrePollerIntervalSeconds();
      const delay = delayMs ?? intervalSec * 1000;
      setTimeout(async () => {
        try {
          await poll();
        } finally {
          scheduleNext();
        }
      }, delay);
    } catch {
      setTimeout(() => scheduleNext(), 30000);
    }
  };

  // Initial poll runs after 8s (staggered from Clickyfied poller), then repeats every intervalSeconds
  scheduleNext(8000);
}
