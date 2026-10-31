/**
 * Payment Test Data
 * 
 * This file contains test data for payment testing scenarios.
 * Use these test cases to verify payment functionality during development.
 */

import { convertToSmallestUnit } from "./payment-service";

export interface PaymentTestData {
  id: string;
  name: string;
  amount: number; // Amount in smallest currency unit (e.g., 20000 = 200.00 SAR)
  currency: string;
  description: string;
  metadata: {
    project_id?: string;
    order_id?: string;
    user_id?: string;
    type?: string;
    [key: string]: any;
  };
  notes?: string;
}

/**
 * Test payment data for various scenarios
 */
export const PAYMENT_TEST_DATA: PaymentTestData[] = [
  // Standard Project Publication Payments
  {
    id: "test-001",
    name: "Small Project Publication",
    amount: convertToSmallestUnit(200.0, "SAR"),
    currency: "SAR",
    description: "Project Publication Fee - Small Project",
    metadata: {
      project_id: "proj_123456",
      user_id: "user_001",
      type: "project_publication",
      project_type: "small",
    },
    notes: "Standard small project publication fee",
  },
  {
    id: "test-002",
    name: "Medium Project Publication",
    amount: convertToSmallestUnit(500.0, "SAR"),
    currency: "SAR",
    description: "Project Publication Fee - Medium Project",
    metadata: {
      project_id: "proj_123457",
      user_id: "user_001",
      type: "project_publication",
      project_type: "medium",
    },
    notes: "Standard medium project publication fee",
  },
  {
    id: "test-003",
    name: "Large Project Publication",
    amount: convertToSmallestUnit(1000.0, "SAR"),
    currency: "SAR",
    description: "Project Publication Fee - Large Project",
    metadata: {
      project_id: "proj_123458",
      user_id: "user_001",
      type: "project_publication",
      project_type: "large",
    },
    notes: "Standard large project publication fee",
  },
  {
    id: "test-004",
    name: "Premium Project Publication",
    amount: convertToSmallestUnit(2000.0, "SAR"),
    currency: "SAR",
    description: "Project Publication Fee - Premium Project",
    metadata: {
      project_id: "proj_123459",
      user_id: "user_002",
      type: "project_publication",
      project_type: "premium",
    },
    notes: "Premium project publication with enhanced features",
  },

  // Different Currency Tests
  {
    id: "test-005",
    name: "Kuwaiti Dinar Payment",
    amount: convertToSmallestUnit(50.0, "KWD"),
    currency: "KWD",
    description: "Project Publication Fee - KWD",
    metadata: {
      project_id: "proj_123460",
      user_id: "user_003",
      type: "project_publication",
      currency: "KWD",
    },
    notes: "Test payment in Kuwaiti Dinar",
  },
  {
    id: "test-006",
    name: "UAE Dirham Payment",
    amount: convertToSmallestUnit(500.0, "AED"),
    currency: "AED",
    description: "Project Publication Fee - AED",
    metadata: {
      project_id: "proj_123461",
      user_id: "user_003",
      type: "project_publication",
      currency: "AED",
    },
    notes: "Test payment in UAE Dirham",
  },
  {
    id: "test-007",
    name: "Bahraini Dinar Payment",
    amount: convertToSmallestUnit(100.0, "BHD"),
    currency: "BHD",
    description: "Project Publication Fee - BHD",
    metadata: {
      project_id: "proj_123462",
      user_id: "user_003",
      type: "project_publication",
      currency: "BHD",
    },
    notes: "Test payment in Bahraini Dinar",
  },

  // Edge Cases
  {
    id: "test-008",
    name: "Minimum Amount Payment",
    amount: convertToSmallestUnit(1.0, "SAR"),
    currency: "SAR",
    description: "Minimum Payment Test",
    metadata: {
      project_id: "proj_123463",
      user_id: "user_004",
      type: "project_publication",
    },
    notes: "Test with minimum payment amount",
  },
  {
    id: "test-009",
    name: "Maximum Amount Payment",
    amount: convertToSmallestUnit(100000.0, "SAR"),
    currency: "SAR",
    description: "Maximum Payment Test",
    metadata: {
      project_id: "proj_123464",
      user_id: "user_004",
      type: "project_publication",
    },
    notes: "Test with maximum payment amount",
  },
  {
    id: "test-010",
    name: "Decimal Amount Payment",
    amount: convertToSmallestUnit(199.99, "SAR"),
    currency: "SAR",
    description: "Decimal Amount Payment Test",
    metadata: {
      project_id: "proj_123465",
      user_id: "user_004",
      type: "project_publication",
    },
    notes: "Test with decimal amount",
  },

  // Order-based Payments
  {
    id: "test-011",
    name: "Order Payment with Order ID",
    amount: convertToSmallestUnit(750.0, "SAR"),
    currency: "SAR",
    description: "Order Payment",
    metadata: {
      order_id: "order_987654",
      user_id: "user_005",
      type: "order_payment",
      items_count: 3,
    },
    notes: "Payment for an order with multiple items",
  },
  {
    id: "test-012",
    name: "Subscription Payment",
    amount: convertToSmallestUnit(299.0, "SAR"),
    currency: "SAR",
    description: "Monthly Subscription Fee",
    metadata: {
      user_id: "user_006",
      type: "subscription",
      subscription_type: "monthly",
      plan: "premium",
    },
    notes: "Monthly subscription payment",
  },
  {
    id: "test-013",
    name: "Annual Subscription Payment",
    amount: convertToSmallestUnit(2999.0, "SAR"),
    currency: "SAR",
    description: "Annual Subscription Fee",
    metadata: {
      user_id: "user_006",
      type: "subscription",
      subscription_type: "annual",
      plan: "premium",
    },
    notes: "Annual subscription payment with discount",
  },

  // Custom Metadata Tests
  {
    id: "test-014",
    name: "Payment with Extended Metadata",
    amount: convertToSmallestUnit(1500.0, "SAR"),
    currency: "SAR",
    description: "Custom Payment with Extended Metadata",
    metadata: {
      project_id: "proj_123466",
      user_id: "user_007",
      type: "project_publication",
      category: "technology",
      priority: "high",
      source: "mobile_app",
      version: "1.0.0",
    },
    notes: "Payment with extended metadata fields",
  },
];

/**
 * Get test payment data by ID
 */
export const getPaymentTestData = (id: string): PaymentTestData | undefined => {
  return PAYMENT_TEST_DATA.find((data) => data.id === id);
};

/**
 * Get test payment data by type
 */
export const getPaymentTestDataByType = (
  type: string
): PaymentTestData[] => {
  return PAYMENT_TEST_DATA.filter(
    (data) => data.metadata.type === type
  );
};

/**
 * Get random test payment data
 */
export const getRandomPaymentTestData = (): PaymentTestData => {
  const randomIndex = Math.floor(
    Math.random() * PAYMENT_TEST_DATA.length
  );
  return PAYMENT_TEST_DATA[randomIndex];
};

/**
 * Get test payment data for a specific currency
 */
export const getPaymentTestDataByCurrency = (
  currency: string
): PaymentTestData[] => {
  return PAYMENT_TEST_DATA.filter((data) => data.currency === currency);
};

/**
 * Common test payment scenarios for quick access
 */
export const COMMON_TEST_PAYMENTS = {
  smallProject: PAYMENT_TEST_DATA.find((d) => d.id === "test-001")!,
  mediumProject: PAYMENT_TEST_DATA.find((d) => d.id === "test-002")!,
  largeProject: PAYMENT_TEST_DATA.find((d) => d.id === "test-003")!,
  premiumProject: PAYMENT_TEST_DATA.find((d) => d.id === "test-004")!,
  minimumAmount: PAYMENT_TEST_DATA.find((d) => d.id === "test-008")!,
  maximumAmount: PAYMENT_TEST_DATA.find((d) => d.id === "test-009")!,
  orderPayment: PAYMENT_TEST_DATA.find((d) => d.id === "test-011")!,
  monthlySubscription: PAYMENT_TEST_DATA.find((d) => d.id === "test-012")!,
  annualSubscription: PAYMENT_TEST_DATA.find((d) => d.id === "test-013")!,
};
