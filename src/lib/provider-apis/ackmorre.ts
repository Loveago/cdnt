import crypto from "crypto";
import type { AckmorreBundle, AckmorreConfig } from "./types";
import { normalizeGhanaPhoneNumber } from "@/lib/phone-utils";

export const DEFAULT_ACKMORRE_BASE_URL = "https://console.ackmorre.com/api/v2";

export interface AckmorreOrderData {
  reference: string;
  client_reference?: string | null;
  type?: string;
  status: "accepted" | "placed" | "processing" | "delivered" | "failed" | "refunded" | "skipped" | string;
  recipient: string;
  network?: {
    code: string;
    name: string;
  };
  bundle?: {
    id: number;
    label: string;
    capacity_gb: number;
  };
  price?: number;
  currency?: string;
  source?: string;
  webhook_url?: string | null;
  failure_reason?: string | null;
  created_at?: string;
  timeline?: {
    accepted_at?: string | null;
    placed_at?: string | null;
    processing_at?: string | null;
    delivered_at?: string | null;
    failed_at?: string | null;
    refunded_at?: string | null;
  };
}

export interface AckmorreSubmitOrderResult {
  ok: boolean;
  order?: AckmorreOrderData;
  balance?: number;
  currency?: string;
  error?: {
    code: string;
    message: string;
    fields?: Record<string, string>;
    required?: number;
    available?: number;
  };
  meta?: {
    request_id: string;
    api_version: string;
    idempotent_replay?: boolean;
  };
  raw: unknown;
}

// In-memory bundle cache with 10-minute TTL
let cachedAckmorreBundles: { timestamp: number; data: AckmorreBundle[] } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

export class AckmorreClient {
  private apiKey: string;
  private baseUrl: string;
  private webhookSecret: string;

  constructor(config?: Partial<AckmorreConfig>) {
    this.apiKey = (config?.apiKey || process.env.ACKMORRE_API_KEY || "").trim();
    this.baseUrl = (config?.baseUrl || process.env.ACKMORRE_BASE_URL || DEFAULT_ACKMORRE_BASE_URL).replace(/\/+$/, "");
    this.webhookSecret = (config?.webhookSecret || process.env.ACKMORRE_WEBHOOK_SECRET || "").trim();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      "X-API-Key": this.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        const parseErr = new Error(
          `Ackmorre HTTP ${res.status}: Invalid JSON response: ${text.slice(0, 150)}`
        ) as Error & { status?: number; rawText?: string; endpoint?: string; url?: string };
        parseErr.status = res.status;
        parseErr.rawText = text;
        parseErr.endpoint = cleanEndpoint;
        parseErr.url = url;
        throw parseErr;
      }

      if (!res.ok || (json && json.ok === false)) {
        const errorDetail = json?.error;
        const errorMsg =
          errorDetail?.message ||
          (errorDetail?.code ? `Ackmorre error: ${errorDetail.code}` : null) ||
          json?.message ||
          `Ackmorre request failed with HTTP ${res.status}`;

        const err = new Error(errorMsg) as Error & {
          status?: number;
          code?: string;
          fields?: Record<string, string>;
          rawResponse?: any;
          rawText?: string;
          endpoint?: string;
          url?: string;
        };
        err.status = res.status;
        err.code = errorDetail?.code;
        err.fields = errorDetail?.fields;
        err.rawResponse = json;
        err.rawText = text;
        err.endpoint = cleanEndpoint;
        err.url = url;
        throw err;
      }

      return json as T;
    } catch (err: any) {
      if (err.name === "AbortError") {
        const timeoutErr = new Error("Ackmorre request timed out after 25 seconds") as Error & {
          status?: number;
          endpoint?: string;
          url?: string;
        };
        timeoutErr.status = 504;
        timeoutErr.endpoint = cleanEndpoint;
        timeoutErr.url = url;
        throw timeoutErr;
      }
      if (!err.endpoint) err.endpoint = cleanEndpoint;
      if (!err.url) err.url = url;
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Check account details, live wallet balance, and webhook status
   * Endpoint: GET /me
   */
  async getMe(): Promise<{
    account: { name: string; email: string; status: string };
    balance: number;
    currency: string;
    apiKey?: { hint: string; last_used_at?: string };
    webhook?: { url: string; active: boolean; secret_set: boolean };
    afaPrice?: number;
    limits?: { bulk_max_orders: number; page_size_max: number; max_body_bytes: number };
    meta?: any;
    raw: unknown;
  }> {
    const res = await this.request<{
      ok: boolean;
      data: {
        account: { name: string; email: string; status: string };
        balance: number;
        currency: string;
        api_key?: { hint: string; last_used_at?: string };
        webhook?: { url: string; active: boolean; secret_set: boolean };
        afa_price?: number;
        limits?: { bulk_max_orders: number; page_size_max: number; max_body_bytes: number };
      };
      meta?: any;
    }>("/me");

    return {
      account: res.data.account,
      balance: res.data.balance,
      currency: res.data.currency,
      apiKey: res.data.api_key,
      webhook: res.data.webhook,
      afaPrice: res.data.afa_price,
      limits: res.data.limits,
      meta: res.meta,
      raw: res,
    };
  }

  /**
   * Fetch active bundles, optionally filtered by network (e.g. "mtn", "telecel", "at")
   * Endpoint: GET /bundles
   */
  async getBundles(networkCode?: string, forceRefresh = false): Promise<AckmorreBundle[]> {
    const now = Date.now();
    if (!forceRefresh && cachedAckmorreBundles && now - cachedAckmorreBundles.timestamp < CACHE_TTL_MS) {
      if (!networkCode) return cachedAckmorreBundles.data;
      return cachedAckmorreBundles.data.filter(
        (b) => b.network?.code?.toLowerCase() === networkCode.toLowerCase()
      );
    }

    const endpoint = networkCode ? `/bundles?network=${encodeURIComponent(networkCode)}` : "/bundles";
    const res = await this.request<{ ok: boolean; data: AckmorreBundle[]; meta?: any }>(endpoint);

    if (Array.isArray(res.data)) {
      if (!networkCode) {
        cachedAckmorreBundles = { timestamp: now, data: res.data };
      }
      return res.data;
    }

    return [];
  }

  /**
   * Match an application package to an Ackmorre bundle ID.
   */
  async findMatchingBundle(params: {
    network: string;
    gbAmount: number;
    packageNameOrType?: string | null;
    providerProductId?: string | null;
  }): Promise<AckmorreBundle | null> {
    const { network, gbAmount, packageNameOrType, providerProductId } = params;

    // 1. If explicit bundle ID is stored in providerProductId (pure digits or "ackmorre:123")
    if (providerProductId) {
      const cleaned = providerProductId.replace(/^ackmorre:/i, "").trim();
      if (/^\d+$/.test(cleaned)) {
        const targetId = parseInt(cleaned, 10);
        const bundles = await this.getBundles().catch(() => []);
        const found = bundles.find((b) => b.id === targetId);
        if (found) return found;
      }
    }

    // 2. Fetch full bundles catalogue
    const allBundles = await this.getBundles().catch(() => []);
    if (!allBundles.length) return null;

    const net = (network || "").trim().toUpperCase();
    const sub = (packageNameOrType || "").trim().toUpperCase();

    // Map network to Ackmorre network code
    let targetCode = "mtn";
    if (net.includes("TELECEL") || net.includes("VODA")) {
      targetCode = "telecel";
    } else if (net.includes("AIRTELTIGO") || net.includes("AT")) {
      targetCode = "at";
    } else {
      targetCode = "mtn";
    }

    // Find candidates matching capacity_gb and network
    const candidates = allBundles.filter((b) => {
      const bNet = (b.network?.code || "").toLowerCase();
      const codeMatches =
        bNet === targetCode ||
        (targetCode === "at" && (bNet.includes("at") || bNet.includes("airtel"))) ||
        (targetCode === "telecel" && (bNet.includes("telecel") || bNet.includes("voda")));

      if (!codeMatches) return false;

      const diff = Math.abs(b.capacity_gb - gbAmount);
      return diff < 0.05;
    });

    if (candidates.length === 0) {
      return null;
    }

    if (candidates.length === 1) {
      return candidates[0];
    }

    // If multiple candidates exist (e.g. MTN Regular vs MTN Xpress, or AT iShare vs AT BigTime)
    if (sub.includes("XPRESS")) {
      const xpressMatch = candidates.find((b) =>
        b.label.toUpperCase().includes("XPRESS") || (b.network?.code || "").toUpperCase().includes("XPRESS")
      );
      if (xpressMatch) return xpressMatch;
    }

    if (sub.includes("BIGTIME") || sub.includes("BIG TIME")) {
      const bigtimeMatch = candidates.find((b) =>
        b.label.toUpperCase().includes("BIGTIME") || (b.network?.code || "").toUpperCase().includes("BIGTIME")
      );
      if (bigtimeMatch) return bigtimeMatch;
    }

    if (sub.includes("ISHARE") || sub.includes("I-SHARE")) {
      const ishareMatch = candidates.find((b) =>
        b.label.toUpperCase().includes("ISHARE") || (b.network?.code || "").toUpperCase().includes("ISHARE")
      );
      if (ishareMatch) return ishareMatch;
    }

    return candidates[0];
  }

  /**
   * Submit a single bundle order
   * Endpoint: POST /orders
   */
  async submitOrder(params: {
    bundleId: number;
    recipient: string;
    clientReference?: string;
    idempotencyKey?: string;
    webhookUrl?: string;
    dryRun?: boolean;
  }): Promise<AckmorreSubmitOrderResult> {
    const rawRecipient = normalizeGhanaPhoneNumber(params.recipient);
    if (!rawRecipient || rawRecipient.length !== 10) {
      throw new Error(`Invalid recipient format for Ackmorre: "${params.recipient}". Expected 10-digit Ghana number.`);
    }

    const payload: Record<string, unknown> = {
      bundle_id: params.bundleId,
      recipient: rawRecipient,
    };

    if (params.clientReference) payload.client_reference = params.clientReference;
    if (params.idempotencyKey) payload.idempotency_key = params.idempotencyKey;
    if (params.webhookUrl) payload.webhook_url = params.webhookUrl;
    if (params.dryRun) payload.dry_run = true;

    const res = await this.request<{
      ok: boolean;
      data: {
        order: AckmorreOrderData;
        balance?: number;
        currency?: string;
      };
      meta?: any;
    }>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      ok: res.ok,
      order: res.data?.order,
      balance: res.data?.balance,
      currency: res.data?.currency,
      meta: res.meta,
      raw: res,
    };
  }

  /**
   * Submit bulk bundle orders (up to 100 per request)
   * Endpoint: POST /orders/bulk
   */
  async submitBulkOrders(params: {
    orders: Array<{
      bundle_id: number;
      recipient: string;
      client_reference?: string;
      webhook_url?: string;
    }>;
    idempotencyKey?: string;
    dryRun?: boolean;
  }): Promise<{
    ok: boolean;
    batchId?: string;
    summary?: {
      total: number;
      placed: number;
      failed: number;
      total_charged: number;
      balance: number;
      currency: string;
    };
    results: Array<{
      index: number;
      ok: boolean;
      order?: AckmorreOrderData;
      recipient?: string;
      error?: { code: string; message: string };
    }>;
    meta?: any;
    raw: unknown;
  }> {
    const sanitizedOrders = params.orders.map((o) => ({
      ...o,
      recipient: normalizeGhanaPhoneNumber(o.recipient),
    }));

    const payload: Record<string, unknown> = {
      orders: sanitizedOrders,
    };
    if (params.idempotencyKey) payload.idempotency_key = params.idempotencyKey;
    if (params.dryRun) payload.dry_run = true;

    const res = await this.request<{
      ok: boolean;
      data: {
        batch_id: string;
        summary: {
          total: number;
          placed: number;
          failed: number;
          total_charged: number;
          balance: number;
          currency: string;
        };
        results: Array<{
          index: number;
          ok: boolean;
          order?: AckmorreOrderData;
          recipient?: string;
          error?: { code: string; message: string };
        }>;
      };
      meta?: any;
    }>("/orders/bulk", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      ok: res.ok,
      batchId: res.data?.batch_id,
      summary: res.data?.summary,
      results: res.data?.results || [],
      meta: res.meta,
      raw: res,
    };
  }

  /**
   * Query status of an individual order by our reference (API_...) or client_reference
   * Endpoint: GET /orders/{ref}
   *
   * Note: May return 403 STATUS_CHECKS_DISABLED if not enabled by Ackmorre support.
   */
  async getOrder(referenceOrClientRef: string): Promise<{
    ok: boolean;
    order: AckmorreOrderData;
    meta?: any;
    raw: unknown;
  }> {
    const cleanRef = referenceOrClientRef.replace(/^ACKMORRE:/i, "").trim();
    if (!cleanRef) {
      throw new Error("Ackmorre order reference is required");
    }

    const res = await this.request<{
      ok: boolean;
      data: AckmorreOrderData;
      meta?: any;
    }>(`/orders/${encodeURIComponent(cleanRef)}`);

    return {
      ok: res.ok,
      order: res.data,
      meta: res.meta,
      raw: res,
    };
  }

  /**
   * Check if a phone number is verified on a network before sending an order.
   * Endpoint: GET /number-check?network=mtn&phone=0241234567
   * Rate limit: 30 requests per minute per account.
   */
  async checkNumber(
    phone: string,
    network: "mtn" | "telecel" | "at_ishare" = "mtn"
  ): Promise<{
    verified: boolean;
    phone: string;
    network: string;
    raw: unknown;
  }> {
    const normalized = normalizeGhanaPhoneNumber(phone);
    const endpoint = `/number-check?network=${encodeURIComponent(network)}&phone=${encodeURIComponent(normalized)}`;
    const res = await this.request<{
      ok?: boolean;
      status?: string;
      data?: {
        phone?: string;
        network?: string;
        network_code?: string;
        verified?: boolean;
      };
      meta?: any;
    }>(endpoint);

    return {
      verified: res?.data?.verified === true,
      phone: res?.data?.phone || normalized,
      network: res?.data?.network || network,
      raw: res,
    };
  }

  /**
   * Verify HMAC-SHA256 signature on incoming Ackmorre webhook payload
   * Header: X-ACKMORRE-Signature (hex-encoded HMAC-SHA256 with webhook secret)
   */
  verifyWebhookSignature(rawBody: string, signature: string, customSecret?: string): boolean {
    const secret = (customSecret || this.webhookSecret).trim();
    if (!secret) {
      // If no webhook secret is configured, reject for security
      return false;
    }
    if (!signature) {
      return false;
    }

    try {
      const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      const expectedBuf = Buffer.from(expected, "hex");
      const sigBuf = Buffer.from(signature.trim(), "hex");

      if (expectedBuf.length !== sigBuf.length) {
        return false;
      }
      return crypto.timingSafeEqual(expectedBuf, sigBuf);
    } catch {
      return false;
    }
  }
}
