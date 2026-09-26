export type ProviderType = "MANUAL" | "CLICKYFIED" | (string & {});

export interface ClickyfiedConfig {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  clientId: string;
  callbackSigningSecret: string;
  mtnVerificationEnabled: boolean;
  notReceivedEnabled: boolean;
}

export interface ProviderRoutingConfig {
  enabled: boolean; // Master switch: if false, everything is manual export
  defaultProvider: ProviderType;
  autoDispatch: boolean; // Dispatch immediately on order creation
  networkRoutes: Record<string, ProviderType>; // e.g. { "MTN": "CLICKYFIED", "TELECEL": "CLICKYFIED", "AIRTELTIGO_ISHARE": "CLICKYFIED", "AIRTELTIGO_BIGTIME": "CLICKYFIED" }
  clickyfied: ClickyfiedConfig;
  // Future provider integrations can be plugged in here
  customProviders?: Record<string, unknown>;
  [key: string]: any;
}

export interface BigwindataBundle {
  id: number;
  label: string;
  capacity_gb: number;
  network_code: string;
  network_name: string;
  network_key?: string;
  price: string;
  rawPrice: number;
}

export interface ClickyfiedFilteredOutEntry {
  number: string;
  allocationGB: number;
  reason?: string;
  type?: "blocked" | string;
}

export interface ProviderDispatchResult {
  success: boolean;
  provider: ProviderType;
  providerReference?: string;
  status?: string;
  price?: number | string;
  error?: string;
  filteredOutEntries?: ClickyfiedFilteredOutEntry[];
  raw?: unknown;
}

export interface NumberVerificationResult {
  validNumbers: string[];
  invalidNumbers: string[];
  raw?: unknown;
}
