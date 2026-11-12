import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { changeOrderStatus } from "@/lib/orders";
import { recordAudit } from "@/lib/audit";
import { getProviderRoutingConfig, normalizePhoneLast9 } from "@/lib/provider-apis/router";
import { recordOrderApiLog } from "@/lib/order-api-logs";
import { parseOrderCode } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const rawBody = await request.text();
    const eventHeader = request.headers.get("x-ackmorre-event") || "";
    const signature = request.headers.get("x-ackmorre-signature") || "";

    let payload: any;
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Verify HMAC-SHA256 signature if secret is configured
    try {
      const config = await getProviderRoutingConfig();
      const webhookSecret = (config.ackmorre.webhookSecret || process.env.ACKMORRE_WEBHOOK_SECRET || "").trim();

      if (webhookSecret && signature) {
        const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
        const cleanSig = signature.trim().toLowerCase();
        const expectedBuf = Buffer.from(expected.toLowerCase());
        const sigBuf = Buffer.from(cleanSig);

        const isValid = expectedBuf.length === sigBuf.length && crypto.timingSafeEqual(expectedBuf, sigBuf);
        if (!isValid) {
          console.warn(
            `[AckmorreWebhook] Signature mismatch (received: ${signature.slice(0, 15)}..., computed: ${expected.slice(0, 15)}...)`
          );
          return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
        }
      }
    } catch (sigErr) {
      console.warn("[AckmorreWebhook] Signature verification error:", sigErr);
    }

    // Collect order items from payload: could be orders.finished (array of orders) or single order
    const orderItems: any[] = [];
    if (Array.isArray(payload?.orders)) {
      orderItems.push(...payload.orders);
    } else if (payload?.order) {
      orderItems.push(payload.order);
    } else if (payload?.afa_order) {
      orderItems.push(payload.afa_order);
    }

    if (orderItems.length === 0) {
      return NextResponse.json({ received: true, processed: 0 });
    }

    let processedCount = 0;

    for (const item of orderItems) {
      const ref = item.reference;
      const clientRef = item.client_reference;
      const rawStatus = (item.status || "").toLowerCase().trim();
      const failureReason = item.reason || item.failure_reason || null;
      const recipient = item.recipient || item.phone;

      // Search for corresponding order in DB
      const searchConditions: any[] = [];
      if (ref) {
        searchConditions.push(
          { providerReference: `ACKMORRE:${ref}` },
          { providerReference: { startsWith: `ACKMORRE:${ref}:` } },
          { providerReference: { contains: ref } }
        );
      }
      if (clientRef) {
        searchConditions.push(
          { clientReference: clientRef },
          { externalReference: clientRef },
          { orderNumber: clientRef }
        );
        const parsedId = parseOrderCode(clientRef);
        if (parsedId && parsedId > 0) {
          searchConditions.push({ id: parsedId });
        }
        if (clientRef.startsWith("INV-")) {
          const numId = parseInt(clientRef.replace("INV-", ""), 10);
          if (!isNaN(numId) && numId > 0) {
            searchConditions.push({ id: numId });
          }
        }
      }

      let order = await prisma.order.findFirst({
        where: { OR: searchConditions },
        include: { user: true },
      });

      // Fallback: If not found by reference, try matching by phone and recent creation
      if (!order && recipient) {
        const normPhone = normalizePhoneLast9(recipient);
        const candidate = await prisma.order.findFirst({
          where: {
            phoneNumber: { contains: normPhone },
            status: { in: ["PENDING", "PROCESSING"] },
            providerReference: { startsWith: "ACKMORRE" },
          },
          orderBy: { createdAt: "desc" },
          include: { user: true },
        });
        if (candidate) {
          order = candidate;
        }
      }

      if (!order) {
        console.warn(`[AckmorreWebhook] No matching order found for ref=${ref}, clientRef=${clientRef}`);
        continue;
      }

      processedCount++;

      // Update provider reference if needed
      if (ref && (!order.providerReference || !order.providerReference.startsWith("ACKMORRE:"))) {
        await prisma.order.update({
          where: { id: order.id },
          data: { providerReference: `ACKMORRE:${ref}` },
        });
      }

      // Map status
      let targetStatus: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "REFUNDED" | null = null;
      let statusNote = "";

      if (rawStatus === "delivered") {
        targetStatus = "SUCCESS";
        statusNote = "Delivered successfully";
      } else if (rawStatus === "failed") {
        targetStatus = "FAILED";
        statusNote = failureReason ? `Delivery failed: ${failureReason}` : "Delivery failed";
      } else if (rawStatus === "refunded") {
        targetStatus = "REFUNDED";
        statusNote = "Order refunded by provider";
      } else if (rawStatus === "placed" || rawStatus === "processing" || rawStatus === "accepted") {
        targetStatus = "PROCESSING";
        statusNote = `Provider processing (${rawStatus})`;
      }

      if (targetStatus && targetStatus !== order.status) {
        if (targetStatus === "FAILED" && failureReason) {
          await prisma.order.update({
            where: { id: order.id },
            data: { failureReason },
          });
        }

        await changeOrderStatus(
          order.id,
          targetStatus,
          statusNote,
          { id: "system", label: "Ackmorre Webhook" },
          { force: true }
        );

        // Record Order API log
        await recordOrderApiLog({
          orderId: order.id,
          provider: "ACKMORRE",
          action: "WEBHOOK_STATUS_UPDATE",
          endpoint: "/api/webhooks/providers/ackmorre",
          method: "POST",
          statusCode: 200,
          success: targetStatus === "SUCCESS" || targetStatus === "PROCESSING",
          errorMessage: failureReason || (targetStatus === "FAILED" ? "Delivery failed" : null),
          responsePayload: item,
          providerReference: ref ? `ACKMORRE:${ref}` : order.providerReference,
          durationMs: Date.now() - startTime,
        });
      }
    }

    return NextResponse.json({ received: true, processed: processedCount });
  } catch (err: any) {
    console.error("[AckmorreWebhook] Error processing webhook:", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
