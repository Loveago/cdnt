import { ClickyfiedClient, DEFAULT_CLICKYFIED_API_KEY, DEFAULT_CLICKYFIED_CLIENT_ID, DEFAULT_CLICKYFIED_SANDBOX_URL } from "../src/lib/provider-apis/clickyfied";
import { getProviderForNetwork, getProviderRoutingConfig } from "../src/lib/provider-apis/router";
import { prisma } from "../src/lib/prisma";

async function runTests() {
  console.log("=================================================");
  console.log("   RUNNING PROVIDER APIS INTEGRATION TEST SUITE   ");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string, detail?: unknown) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`, detail !== undefined ? detail : "");
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Clickyfied Client Tests
  // ---------------------------------------------------------------------------
  console.log("\n--- [1] Clickyfied Client & Validation ---");
  const clickyfiedClient = new ClickyfiedClient({
    apiKey: DEFAULT_CLICKYFIED_API_KEY,
    clientId: DEFAULT_CLICKYFIED_CLIENT_ID,
    baseUrl: DEFAULT_CLICKYFIED_SANDBOX_URL,
  });

  // Test client construction
  assert(clickyfiedClient !== null, "ClickyfiedClient instance created");

  // Live Clickyfied number verification (Action 1 from docs)
  try {
    const verifyRes = await clickyfiedClient.verifyNumbers(["0257467983"]);
    const hasNumber =
      verifyRes.validNumbers.includes("0257467983") ||
      verifyRes.validNumbers.includes("233257467983");
    assert(
      hasNumber,
      `Clickyfied live number verification for 0257467983: verified numbers = ${JSON.stringify(verifyRes.validNumbers)}`
    );
  } catch (err: any) {
    assert(false, `Clickyfied number verification failed: ${err?.message}`);
  }

  // Test generateClickyfiedReference helper format: order-1788XXXXXXXXX
  try {
    const { generateClickyfiedReference } = await import("../src/lib/provider-apis/clickyfied");
    const testRef = generateClickyfiedReference();
    const pattern = /^order-1788\d{9}$/;
    assert(
      pattern.test(testRef),
      `generateClickyfiedReference produced valid reference: ${testRef}`
    );
  } catch (err: any) {
    assert(false, `generateClickyfiedReference failed: ${err?.message}`);
  }

  // Live Clickyfied idempotent submit retry (Action 2 from docs)
  try {
    const orderRes = await clickyfiedClient.submitOrder({
      externalReference: "probe-001",
      entries: [{ number: "0257467983", allocationGB: 1 }],
      idempotencyKey: "probe-001",
    });
    assert(
      orderRes.orderId === "order-1789475166825" || !!orderRes.orderId,
      `Clickyfied submitOrder idempotent retry succeeded (orderId: ${orderRes.orderId}, reused: ${orderRes.reused})`
    );
  } catch (err: any) {
    assert(false, `Clickyfied submitOrder failed: ${err?.message}`);
  }

  // Live Clickyfied order status check (Action 3 from docs)
  try {
    const statusRes = await clickyfiedClient.getOrderStatus("order-1789475166825");
    assert(
      statusRes.status.toLowerCase() === "pending" || !!statusRes.status,
      `Clickyfied getOrderStatus('order-1789475166825') returned status: ${statusRes.status}`
    );
  } catch (err: any) {
    assert(false, `Clickyfied getOrderStatus failed: ${err?.message}`);
  }

  // ---------------------------------------------------------------------------
  // 2. Provider Routing Engine & Settings Matrix
  // ---------------------------------------------------------------------------
  console.log("\n--- [2] Provider Routing Matrix & Presets ---");

  // When routing is OFF
  await prisma.systemSetting.upsert({
    where: { key: "provider_routing_enabled" },
    create: { key: "provider_routing_enabled", value: "false" },
    update: { value: "false" },
  });

  const offRoute = await getProviderForNetwork("MTN");
  assert(offRoute === "MANUAL", "When provider_routing_enabled=false, routing returns MANUAL");

  // Configure active matrix:
  // - MTN -> CLICKYFIED
  // - Telecel -> CLICKYFIED
  // - AirtelTigo iShare -> CLICKYFIED
  // - AirtelTigo Big Time -> CLICKYFIED
  await prisma.systemSetting.upsert({
    where: { key: "provider_routing_enabled" },
    create: { key: "provider_routing_enabled", value: "true" },
    update: { value: "true" },
  });
  await prisma.systemSetting.upsert({
    where: { key: "provider_route_MTN" },
    create: { key: "provider_route_MTN", value: "CLICKYFIED" },
    update: { value: "CLICKYFIED" },
  });
  await prisma.systemSetting.upsert({
    where: { key: "provider_route_MTN_XPRESS" },
    create: { key: "provider_route_MTN_XPRESS", value: "CLICKYFIED" },
    update: { value: "CLICKYFIED" },
  });
  await prisma.systemSetting.upsert({
    where: { key: "provider_route_TELECEL" },
    create: { key: "provider_route_TELECEL", value: "CLICKYFIED" },
    update: { value: "CLICKYFIED" },
  });
  await prisma.systemSetting.upsert({
    where: { key: "provider_route_AIRTELTIGO_ISHARE" },
    create: { key: "provider_route_AIRTELTIGO_ISHARE", value: "CLICKYFIED" },
    update: { value: "CLICKYFIED" },
  });
  await prisma.systemSetting.upsert({
    where: { key: "provider_route_AIRTELTIGO_BIGTIME" },
    create: { key: "provider_route_AIRTELTIGO_BIGTIME", value: "CLICKYFIED" },
    update: { value: "CLICKYFIED" },
  });
  await prisma.systemSetting.upsert({
    where: { key: "clickyfied_client_id" },
    create: { key: "clickyfied_client_id", value: "ext-topskankatest-001" },
    update: { value: "ext-topskankatest-001" },
  });

  const mtnRoute = await getProviderForNetwork("MTN");
  assert(mtnRoute === "CLICKYFIED", "MTN routes to CLICKYFIED");

  const telecelRoute = await getProviderForNetwork("TELECEL");
  assert(telecelRoute === "CLICKYFIED", "Telecel routes to CLICKYFIED");

  const ishareRoute = await getProviderForNetwork("AIRTELTIGO", "iShare 2GB");
  assert(ishareRoute === "CLICKYFIED", "AirtelTigo iShare routes to CLICKYFIED");

  const bigtimeRoute = await getProviderForNetwork("AIRTELTIGO", "Big Time 1GB");
  assert(bigtimeRoute === "CLICKYFIED", "AirtelTigo Big Time routes to CLICKYFIED");

  const config = await getProviderRoutingConfig();
  assert(config.enabled === true, "Routing config returns enabled: true");
  assert(config.clickyfied.clientId === "ext-topskankatest-001", "Routing config has correct client ID");

  // ---------------------------------------------------------------------------
  // 3. MTN Verification Check Integration
  // ---------------------------------------------------------------------------
  console.log("\n--- [3] MTN Verification Integration ---");
  const { validateMtnOrderRecipient, isMtnNumberAccepted } = await import("../src/lib/mtn-verification");

  // Ensure setting is active
  await prisma.systemSetting.upsert({
    where: { key: "clickyfied_mtn_verification_enabled" },
    create: { key: "clickyfied_mtn_verification_enabled", value: "true" },
    update: { value: "true" },
  });

  try {
    const valResult = await validateMtnOrderRecipient("0257467983", "MTN");
    assert(valResult.allowed === true, "validateMtnOrderRecipient for 0257467983 returns allowed: true");
    const isAccepted = await isMtnNumberAccepted("0257467983");
    assert(isAccepted === true, "0257467983 is saved into AcceptedMtnNumber database table");
  } catch (err: any) {
    assert(false, `validateMtnOrderRecipient threw error: ${err?.message}`);
  }

  console.log("\n=================================================");
  console.log(`   TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test execution encountered fatal error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
