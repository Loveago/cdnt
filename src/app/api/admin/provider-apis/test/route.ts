import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ClickyfiedClient, generateClickyfiedReference } from "@/lib/provider-apis/clickyfied";
import { getProviderRoutingConfig } from "@/lib/provider-apis/router";
import { handleRouteError, apiError } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { action, provider = "CLICKYFIED", recipient = "0257467983", gbAmount = 1 } = body;

    const config = await getProviderRoutingConfig();

    if (action === "test_clickyfied_billing") {
      const client = new ClickyfiedClient(config.clickyfied);
      const billing = await client.getCurrentBilling(body.date);
      return NextResponse.json({ success: true, billing });
    }

    if (action === "test_clickyfied_verify") {
      const client = new ClickyfiedClient(config.clickyfied);
      const res = await client.verifyNumbers([recipient]);
      return NextResponse.json({ success: true, verification: res });
    }

    if (action === "test_order") {
      if (provider === "CLICKYFIED") {
        const client = new ClickyfiedClient(config.clickyfied);
        const externalReference = generateClickyfiedReference();
        const order = await client.submitOrder({
          externalReference,
          entries: [{ number: recipient, allocationGB: gbAmount }],
          idempotencyKey: externalReference,
        });
        return NextResponse.json({ success: true, provider: "CLICKYFIED", order });
      }

      return apiError(400, "Unsupported provider for test order");
    }

    return apiError(400, `Unknown action: ${action}`);
  } catch (err: any) {
    return handleRouteError(err);
  }
}
