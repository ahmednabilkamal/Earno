/**
 * Payment Service
 *
 * Moyasar publishable key is loaded from the backend (`GET /api/payments/moyasar-client`)
 * so it is not committed in the app. Optional `EXPO_PUBLIC_MOYASAR_PUBLISHABLE_KEY`
 * is used only as a dev fallback when the API is unreachable.
 */

import { API_CONFIG } from "@/constants/api";
import apiClient from "@/utils/api";

/** Must start with `/`; combined with axios baseURL `${origin}/api` → `/api/payments/moyasar-client` */
const MOYASAR_CLIENT_PATH = "/payments/moyasar-client";

export const PAYMENT_CONFIG = {
  // Apple Pay Merchant ID (from Apple Developer account)
  APPLE_PAY_MERCHANT_ID:
    process.env.EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID || undefined,

  // Samsung Pay Service ID (from Samsung Pay Merchant dashboard)
  SAMSUNG_PAY_SERVICE_ID:
    process.env.EXPO_PUBLIC_SAMSUNG_PAY_SERVICE_ID || undefined,

  // Merchant country code (default: SA for Saudi Arabia)
  MERCHANT_COUNTRY_CODE: "SA",
};

let cachedPublishableKey: string | null = null;
let inflightPublishableKey: Promise<string> | null = null;

/** Clear cache (e.g. after logout) so the next session refetches from API. */
export function clearMoyasarPublishableKeyCache(): void {
  cachedPublishableKey = null;
}

export interface HostedInvoiceIntentResponse {
  invoice_id: string;
  invoice_url: string;
  success_url: string;
  back_url: string;
  amount?: number;
  currency?: string;
  description?: string;
}

export interface HostedInvoicePayment {
  id: string;
  status: string;
  amount?: number;
  fee?: number;
  currency?: string;
  description?: string | null;
  metadata?: Record<string, any>;
  source?: { type?: string };
}

export interface HostedInvoiceStatusResponse {
  invoice_id: string;
  invoice_status: string | null;
  payment: HostedInvoicePayment | null;
}

/**
 * Resolves Moyasar publishable API key: API first, then optional env fallback.
 */
export async function resolvePublishableApiKey(): Promise<string> {
  if (cachedPublishableKey) {
    return cachedPublishableKey;
  }
  if (inflightPublishableKey) {
    return inflightPublishableKey;
  }

  inflightPublishableKey = (async () => {
    const envFallback =
      process.env.EXPO_PUBLIC_MOYASAR_PUBLISHABLE_KEY?.trim() ?? "";

    try {
      const pathRaw = API_CONFIG.ENDPOINTS.MOYASAR_CLIENT;
      const path =
        typeof pathRaw === "string" && pathRaw.startsWith("/")
          ? pathRaw
          : MOYASAR_CLIENT_PATH;
      const { data } = await apiClient.get<{ publishable_key?: string }>(path);
      const key = (data?.publishable_key ?? "").trim();
      if (key) {
        cachedPublishableKey = key;
        return key;
      }
    } catch {
      /* use env fallback below */
    }

    if (envFallback) {
      cachedPublishableKey = envFallback;
      return envFallback;
    }

    throw new Error("Moyasar publishable key unavailable from server");
  })();

  try {
    return await inflightPublishableKey;
  } finally {
    inflightPublishableKey = null;
  }
}

export async function createHostedPendingIntent(params: {
  amount: number; // major currency amount
  original_amount?: number;
  coupon_id?: number;
  discount_amount?: number;
  currency?: string;
  description: string;
  metadata?: Record<string, any>;
}): Promise<HostedInvoiceIntentResponse> {
  const response = await apiClient.post<HostedInvoiceIntentResponse>(
    API_CONFIG.ENDPOINTS.MOYASAR_HOSTED_PENDING_INTENT,
    {
      amount: params.amount,
      original_amount: params.original_amount,
      coupon_id: params.coupon_id,
      discount_amount: params.discount_amount,
      currency: params.currency ?? "SAR",
      description: params.description,
      metadata: params.metadata ?? {},
    }
  );
  return response.data;
}

export async function createHostedExistingIntent(
  projectId: number,
  params?: {
    amount?: number;
    coupon_id?: number;
    discount_amount?: number;
  },
): Promise<HostedInvoiceIntentResponse> {
  const response = await apiClient.post<HostedInvoiceIntentResponse>(
    `${API_CONFIG.ENDPOINTS.MOYASAR_HOSTED_EXISTING_INTENT}/${projectId}/intent`,
    params ?? {}
  );
  return response.data;
}

export async function completeFreeExistingPayment(params: {
  projectId: number;
  coupon_id?: number | null;
  discount_amount?: number | null;
}): Promise<{ message?: string; project_id?: number; status?: string }> {
  const response = await apiClient.post(
    `${API_CONFIG.ENDPOINTS.MOYASAR_HOSTED_EXISTING_FREE}/${params.projectId}/complete-free`,
    {
      coupon_id: params.coupon_id ?? null,
      discount_amount: params.discount_amount ?? null,
    }
  );
  return response.data;
}

export async function fetchHostedInvoiceStatus(
  invoiceId: string
): Promise<HostedInvoiceStatusResponse> {
  const response = await apiClient.get<HostedInvoiceStatusResponse>(
    `${API_CONFIG.ENDPOINTS.MOYASAR_HOSTED_INVOICE_STATUS}/${invoiceId}`
  );
  return response.data;
}

/**
 * Convert amount from currency unit to smallest currency unit
 * Example: 200.00 SAR = 20000 Halalas
 */
export const convertToSmallestUnit = (
  amount: number,
  currency: string = "SAR",
): number => {
  const currencyMultipliers: Record<string, number> = {
    SAR: 100, // 1 SAR = 100 Halalas
    KWD: 1000, // 1 KWD = 1000 Fils
    AED: 100, // 1 AED = 100 Fils
    BHD: 1000, // 1 BHD = 1000 Fils
    OMR: 1000, // 1 OMR = 1000 Baisa
    // JPY doesn't have fractions, so multiplier is 1
    JPY: 1,
  };

  const multiplier = currencyMultipliers[currency] || 100;
  return Math.round(amount * multiplier);
};

/**
 * Convert amount from smallest currency unit to currency unit
 * Example: 20000 Halalas = 200.00 SAR
 */
export const convertFromSmallestUnit = (
  amount: number,
  currency: string = "SAR",
): number => {
  const currencyMultipliers: Record<string, number> = {
    SAR: 100,
    KWD: 1000,
    AED: 100,
    BHD: 1000,
    OMR: 1000,
    JPY: 1,
  };

  const multiplier = currencyMultipliers[currency] || 100;
  return amount / multiplier;
};

/**
 * Format amount for display
 */
export const formatAmount = (
  amount: number,
  currency: string = "SAR",
  includeCurrency: boolean = true,
): string => {
  const formattedAmount = convertFromSmallestUnit(amount, currency);
  const formatted = formattedAmount.toFixed(2);

  if (includeCurrency) {
    return `${formatted} ${currency}`;
  }
  return formatted;
};
