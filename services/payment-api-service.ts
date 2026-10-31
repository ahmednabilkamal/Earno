/**
 * Payment API Service
 *
 * IMPORTANT SECURITY NOTE:
 * - DO NOT call Moyasar API directly from the client with secret key
 * - Secret keys should ONLY be used on your backend/server
 * - Use this service through your backend API endpoint
 *
 * This file shows the correct format for Moyasar API requests
 * and provides a helper function for backend implementation.
 */

import { API_CONFIG } from "@/constants/api";
import apiClient from "@/utils/api";

/**
 * Corrected payment request format for Moyasar API
 *
 * Issues in your original request:
 * 1. save_card and manual should be booleans, not strings
 * 2. year should be 2 digits (27 instead of 2027)
 * 3. Missing Authorization header with secret key
 * 4. Should go through your backend, not directly from client
 */
export interface MoyasarPaymentRequest {
  amount: number; // in smallest unit (halalas for SAR)
  currency: string; // "SAR", "AED", etc.
  description: string;
  metadata?: Record<string, any>;
  source: {
    type: "creditcard" | "applepay" | "stcpay" | "samsungpay";
    company?: "mada" | "visa" | "mastercard" | "amex";
    name?: string;
    number?: string;
    cvc?: string;
    month?: string; // "01" to "12"
    year?: string; // "27" (2 digits), not "2027"
    save_card?: boolean; // boolean, NOT string
    manual?: boolean; // boolean, NOT string
  };
  callback_url?: string;
  apply_coupon?: boolean;
}

/**
 * Transaction record to send to backend after payment success (Moyasar response).
 */
export interface CreateTransactionRequest {
  project_id: number;
  transaction_id: string;
  type: string;
  amount: number;
  fee: number;
  net_amount?: number;
  currency: string;
  status: string;
  payment_method: string;
  payment_gateway: string;
  notes: string;
  coupon_id?: number | null;
  discount_amount?: number | null;
}

/**
 * Create transaction record after successful payment.
 * Called with data from the payment API response.
 */
export const createTransaction = async (
  data: CreateTransactionRequest
): Promise<any> => {
  const response = await apiClient.post(
    API_CONFIG.ENDPOINTS.TRANSACTIONS,
    data
  );
  return response.data;
};

/**
 * Create payment through your backend API
 * Your backend should handle the Moyasar API call with the secret key
 */
export const createPayment = async (
  paymentData: MoyasarPaymentRequest
): Promise<any> => {
  try {
    // Call your backend API endpoint (NOT Moyasar directly)
    // Your backend will handle the Moyasar API call with secret key
    const response = await apiClient.post("/payments", paymentData);
    return response.data;
  } catch (error: any) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

/**
 * Example of correct request format
 * Use this as a reference for your backend implementation
 */
export const getCorrectPaymentRequestFormat = (): MoyasarPaymentRequest => {
  return {
    amount: 123, // 1234.00 SAR in halalas
    currency: "SAR",
    description: "Project Publication Fee",
    metadata: {
      project_id: "18",
      type: "investment",
    },
    source: {
      type: "creditcard",
      company: "mada",
      name: "Ahmed Nabil",
      number: "4201320111111010",
      cvc: "123",
      month: "02", // Always 2 digits with leading zero if needed
      year: "27", // 2 digits (27), NOT 2027
      save_card: false, // boolean, NOT "false" string
      manual: false, // boolean, NOT "false" string
    },
    callback_url: "https://sdk.moyasar.com/return",
    apply_coupon: true, // boolean
  };
};

/**
 * Example: How to make the request correctly (for backend implementation)
 *
 * Correct curl example:
 * curl -X POST https://api.moyasar.com/v1/payments \
 *   -H "Authorization: Basic <base64(secret_key:)>" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "amount": 123400,
 *     "currency": "SAR",
 *     "description": "Project Publication Fee",
 *     "metadata": {
 *       "project_id": "18",
 *       "type": "project_publication"
 *     },
 *     "source": {
 *       "type": "creditcard",
 *       "company": "mada",
 *       "name": "Ahmed Nabil",
 *       "number": "4201320111111010",
 *       "cvc": "123",
 *       "month": "02",
 *       "year": "27",
 *       "save_card": false,
 *       "manual": false
 *     },
 *     "callback_url": "https://sdk.moyasar.com/return",
 *     "apply_coupon": true
 *   }'
 *
 * Headers required:
 * - Authorization: Basic <base64(secret_key:)>
 * - Content-Type: application/json
 */
