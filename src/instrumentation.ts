export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startProviderSyncPoller } = await import("./lib/provider-apis/poller");
    startProviderSyncPoller();

    const { startAckmorreSyncPoller } = await import("./lib/provider-apis/ackmorre-poller");
    startAckmorreSyncPoller();

    const { startClickyfiedBatchRunner } = await import("./lib/provider-apis/clickyfied-batch");
    startClickyfiedBatchRunner();
  }
}
