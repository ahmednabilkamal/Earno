/**
 * Payment Card Test Data
 * 
 * This file contains test card details for Moyasar payment testing.
 * Use these cards ONLY in sandbox/testing environments - NEVER in production.
 * 
 * Reference: 
 * - Card Payments: https://docs.moyasar.com/guides/card-payments/test-cards/
 * - Apple Pay: https://docs.moyasar.com/guides/apple-pay/testing/
 */

export interface TestCard {
  id: string;
  name: string;
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string; // MM format (e.g., "12")
  expiryYear: string; // YY format (e.g., "28")
  cvc: string;
  cardType: "mada" | "visa" | "mastercard" | "amex";
  expectedResult: "success" | "failed" | "insufficient_funds" | "lost_card" | "stolen_card" | "expired_card" | "declined" | "3ds_attempt";
  responseCode?: string;
  notes?: string;
}

/**
 * Test cards for Moyasar sandbox environment
 */
export const TEST_CARDS: TestCard[] = [
  // ========== SUCCESSFUL PAYMENTS ==========
  
  // Mada - Success
  {
    id: "mada-success-001",
    name: "Mada - Approved Payment",
    cardNumber: "4201 3201 1111 1010",
    cardholderName: "Test User",
    expiryMonth: "12",
    expiryYear: "28",
    cvc: "123",
    cardType: "mada",
    expectedResult: "success",
    responseCode: "00",
    notes: "Standard Mada card that will be approved",
  },
  
  // Visa - Success (Basic)
  {
    id: "visa-success-001",
    name: "Visa - Approved Payment",
    cardNumber: "4111 1111 1111 1111",
    cardholderName: "John Doe",
    expiryMonth: "12",
    expiryYear: "28",
    cvc: "123",
    cardType: "visa",
    expectedResult: "success",
    responseCode: "00",
    notes: "Standard Visa card that will be approved",
  },
  
  // Visa - Success (Frictionless 3DS)
  {
    id: "visa-success-002",
    name: "Visa - Frictionless 3DS",
    cardNumber: "4111 1140 0576 5430",
    cardholderName: "Jane Smith",
    expiryMonth: "12",
    expiryYear: "28",
    cvc: "123",
    cardType: "visa",
    expectedResult: "success",
    responseCode: "00",
    notes: "Visa card with frictionless 3D Secure authentication",
  },
  
  // Mastercard - Success
  {
    id: "mastercard-success-001",
    name: "Mastercard - Approved Payment",
    cardNumber: "5421 0801 0100 0000",
    cardholderName: "Test User",
    expiryMonth: "12",
    expiryYear: "28",
    cvc: "123",
    cardType: "mastercard",
    expectedResult: "success",
    responseCode: "00",
    notes: "Standard Mastercard that will be approved",
  },
  
  // American Express - Success
  {
    id: "amex-success-001",
    name: "American Express - Approved Payment",
    cardNumber: "3400 0000 0900 000",
    cardholderName: "Test User",
    expiryMonth: "12",
    expiryYear: "28",
    cvc: "1234",
    cardType: "amex",
    expectedResult: "success",
    responseCode: "00",
    notes: "Standard Amex card that will be approved (4-digit CVC)",
  },
  
  // Visa - 3DS Attempt (Not Available)
  {
    id: "visa-3ds-attempt",
    name: "Visa - 3DS Attempt Not Available",
    cardNumber: "4111 1111 8250 2525 31",
    cardholderName: "Test User",
    expiryMonth: "12",
    expiryYear: "28",
    cvc: "123",
    cardType: "visa",
    expectedResult: "3ds_attempt",
    responseCode: "06",
    notes: "3D Secure attempt but service not available",
  },
  
  // ========== FAILED PAYMENTS ==========
  
  // Mada - Unspecified Failure
  {
    id: "mada-failed-001",
    name: "Mada - Unspecified Failure",
    cardNumber: "4201 3200 0001 3020",
    cardholderName: "Test User",
    expiryMonth: "12",
    expiryYear: "28",
    cvc: "123",
    cardType: "mada",
    expectedResult: "failed",
    responseCode: "99",
    notes: "Mada card that will fail with unspecified failure",
  },
  
  // ========== QUICK ACCESS CARDS ==========
  
  // Most commonly used success card
  {
    id: "quick-success-visa",
    name: "Quick Success - Visa",
    cardNumber: "4111 1111 1111 1111",
    cardholderName: "Test User",
    expiryMonth: "12",
    expiryYear: "28",
    cvc: "123",
    cardType: "visa",
    expectedResult: "success",
    responseCode: "00",
    notes: "Most commonly used test card for quick success testing",
  },
  
  // Most commonly used failure card
  {
    id: "quick-failed-mada",
    name: "Quick Failure - Mada",
    cardNumber: "4201 3200 0001 3020",
    cardholderName: "Test User",
    expiryMonth: "12",
    expiryYear: "28",
    cvc: "123",
    cardType: "mada",
    expectedResult: "failed",
    responseCode: "99",
    notes: "Most commonly used test card for quick failure testing",
  },
];

/**
 * Get test card by ID
 */
export const getTestCard = (id: string): TestCard | undefined => {
  return TEST_CARDS.find((card) => card.id === id);
};

/**
 * Get all successful test cards
 */
export const getSuccessCards = (): TestCard[] => {
  return TEST_CARDS.filter((card) => card.expectedResult === "success");
};

/**
 * Get all failed test cards
 */
export const getFailedCards = (): TestCard[] => {
  return TEST_CARDS.filter((card) => card.expectedResult === "failed");
};

/**
 * Get test cards by card type
 */
export const getCardsByType = (
  cardType: "mada" | "visa" | "mastercard" | "amex"
): TestCard[] => {
  return TEST_CARDS.filter((card) => card.cardType === cardType);
};

/**
 * Get a random test card
 */
export const getRandomTestCard = (): TestCard => {
  const randomIndex = Math.floor(Math.random() * TEST_CARDS.length);
  return TEST_CARDS[randomIndex];
};

/**
 * Get a random successful test card
 */
export const getRandomSuccessCard = (): TestCard => {
  const successCards = getSuccessCards();
  const randomIndex = Math.floor(Math.random() * successCards.length);
  return successCards[randomIndex];
};

/**
 * Get a random failed test card
 */
export const getRandomFailedCard = (): TestCard => {
  const failedCards = getFailedCards();
  const randomIndex = Math.floor(Math.random() * failedCards.length);
  return failedCards[randomIndex];
};

/**
 * Common test cards for quick access
 */
export const COMMON_TEST_CARDS = {
  // Success cards
  visaSuccess: TEST_CARDS.find((c) => c.id === "visa-success-001")!,
  madaSuccess: TEST_CARDS.find((c) => c.id === "mada-success-001")!,
  mastercardSuccess: TEST_CARDS.find((c) => c.id === "mastercard-success-001")!,
  amexSuccess: TEST_CARDS.find((c) => c.id === "amex-success-001")!,
  
  // Quick access
  quickSuccess: TEST_CARDS.find((c) => c.id === "quick-success-visa")!,
  quickFailure: TEST_CARDS.find((c) => c.id === "quick-failed-mada")!,
  
  // Failure cards
  madaFailure: TEST_CARDS.find((c) => c.id === "mada-failed-001")!,
};

/**
 * Format card number for display (removes spaces)
 */
export const formatCardNumber = (cardNumber: string): string => {
  return cardNumber.replace(/\s/g, "");
};

/**
 * Format expiry date as MM/YY
 */
export const formatExpiryDate = (month: string, year: string): string => {
  return `${month}/${year}`;
};

/**
 * Get formatted card details for easy copy-paste
 */
export const getFormattedCardDetails = (card: TestCard) => {
  return {
    cardNumber: formatCardNumber(card.cardNumber),
    cardholderName: card.cardholderName,
    expiry: formatExpiryDate(card.expiryMonth, card.expiryYear),
    cvc: card.cvc,
    fullDetails: {
      name: card.cardholderName,
      number: formatCardNumber(card.cardNumber),
      expiry: formatExpiryDate(card.expiryMonth, card.expiryYear),
      cvc: card.cvc,
    },
  };
};

// ========== APPLE PAY TEST DATA ==========

/**
 * Apple Pay Test Data
 * 
 * IMPORTANT: Apple Pay testing requires a REAL card in your Apple Wallet.
 * The test environment uses transaction AMOUNTS to determine responses,
 * not specific test cards.
 * 
 * Different amount ranges trigger different payment responses in sandbox.
 */

export interface ApplePayTestAmount {
  id: string;
  name: string;
  amountInSmallestUnit: number; // Amount in halalas (e.g., 20000 = 200.00 SAR)
  amountInSAR: number; // Amount in SAR for display
  expectedResult: "success" | "failed" | "insufficient_funds" | "lost_card" | "stolen_card" | "expired_card" | "declined" | "exceeds_limit";
  responseCode: string;
  notes: string;
  minAmount?: number; // For range-based tests
  maxAmount?: number; // For range-based tests
}

/**
 * Apple Pay test amounts based on Moyasar sandbox behavior
 * Amounts are in smallest currency unit (halalas for SAR)
 */
export const APPLE_PAY_TEST_AMOUNTS: ApplePayTestAmount[] = [
  // ========== SUCCESSFUL PAYMENTS ==========
  
  {
    id: "apple-pay-success-001",
    name: "Apple Pay - Approved Payment (200-300 SAR)",
    amountInSmallestUnit: 25000, // 250.00 SAR
    amountInSAR: 250.0,
    minAmount: 20000, // 200.00 SAR
    maxAmount: 30000, // 300.00 SAR
    expectedResult: "success",
    responseCode: "00",
    notes: "Amount between 200-300 SAR will be approved. Use any amount in this range.",
  },
  
  {
    id: "apple-pay-success-002",
    name: "Apple Pay - Approved Payment (250 SAR)",
    amountInSmallestUnit: 25000, // 250.00 SAR
    amountInSAR: 250.0,
    expectedResult: "success",
    responseCode: "00",
    notes: "Standard success amount - 250 SAR",
  },
  
  // ========== FAILED PAYMENTS ==========
  
  {
    id: "apple-pay-failed-001",
    name: "Apple Pay - Unspecified Failure (1000-1100 SAR)",
    amountInSmallestUnit: 105000, // 1050.00 SAR
    amountInSAR: 1050.0,
    minAmount: 100000, // 1000.00 SAR
    maxAmount: 110000, // 1100.00 SAR
    expectedResult: "failed",
    responseCode: "99",
    notes: "Amount between 1000-1100 SAR will fail with unspecified failure",
  },
  
  {
    id: "apple-pay-failed-002",
    name: "Apple Pay - Insufficient Funds (1101-1200 SAR)",
    amountInSmallestUnit: 115000, // 1150.00 SAR
    amountInSAR: 1150.0,
    minAmount: 110100, // 1101.00 SAR
    maxAmount: 120000, // 1200.00 SAR
    expectedResult: "insufficient_funds",
    responseCode: "51",
    notes: "Amount between 1101-1200 SAR will fail with insufficient funds",
  },
  
  {
    id: "apple-pay-failed-003",
    name: "Apple Pay - Lost Card (1201-1300 SAR)",
    amountInSmallestUnit: 125000, // 1250.00 SAR
    amountInSAR: 1250.0,
    minAmount: 120100, // 1201.00 SAR
    maxAmount: 130000, // 1300.00 SAR
    expectedResult: "lost_card",
    responseCode: "41",
    notes: "Amount between 1201-1300 SAR will fail with lost card",
  },
  
  {
    id: "apple-pay-failed-004",
    name: "Apple Pay - Declined (1301-1400 SAR)",
    amountInSmallestUnit: 135000, // 1350.00 SAR
    amountInSAR: 1350.0,
    minAmount: 130100, // 1301.00 SAR
    maxAmount: 140000, // 1400.00 SAR
    expectedResult: "declined",
    responseCode: "05",
    notes: "Amount between 1301-1400 SAR will be declined",
  },
  
  {
    id: "apple-pay-failed-005",
    name: "Apple Pay - Expired Card (1401-1500 SAR)",
    amountInSmallestUnit: 145000, // 1450.00 SAR
    amountInSAR: 1450.0,
    minAmount: 140100, // 1401.00 SAR
    maxAmount: 150000, // 1500.00 SAR
    expectedResult: "expired_card",
    responseCode: "54",
    notes: "Amount between 1401-1500 SAR will fail with expired card",
  },
  
  {
    id: "apple-pay-failed-006",
    name: "Apple Pay - Exceeds Limit (1501-1600 SAR)",
    amountInSmallestUnit: 155000, // 1550.00 SAR
    amountInSAR: 1550.0,
    minAmount: 150100, // 1501.00 SAR
    maxAmount: 160000, // 1600.00 SAR
    expectedResult: "exceeds_limit",
    responseCode: "61",
    notes: "Amount between 1501-1600 SAR will fail with exceeds limit",
  },
  
  {
    id: "apple-pay-failed-007",
    name: "Apple Pay - Stolen Card (1601-1700 SAR)",
    amountInSmallestUnit: 165000, // 1650.00 SAR
    amountInSAR: 1650.0,
    minAmount: 160100, // 1601.00 SAR
    maxAmount: 170000, // 1700.00 SAR
    expectedResult: "stolen_card",
    responseCode: "43",
    notes: "Amount between 1601-1700 SAR will fail with stolen card",
  },
];

/**
 * Get Apple Pay test amount by ID
 */
export const getApplePayTestAmount = (id: string): ApplePayTestAmount | undefined => {
  return APPLE_PAY_TEST_AMOUNTS.find((amount) => amount.id === id);
};

/**
 * Get Apple Pay test amount by expected result
 */
export const getApplePayTestAmountByResult = (
  result: ApplePayTestAmount["expectedResult"]
): ApplePayTestAmount[] => {
  return APPLE_PAY_TEST_AMOUNTS.filter((amount) => amount.expectedResult === result);
};

/**
 * Get Apple Pay test amount for a specific amount value
 * Returns the test scenario that matches the amount range
 */
export const getApplePayTestAmountForValue = (
  amountInSmallestUnit: number
): ApplePayTestAmount | undefined => {
  return APPLE_PAY_TEST_AMOUNTS.find((test) => {
    if (test.minAmount && test.maxAmount) {
      return amountInSmallestUnit >= test.minAmount && amountInSmallestUnit <= test.maxAmount;
    }
    return test.amountInSmallestUnit === amountInSmallestUnit;
  });
};

/**
 * Get all successful Apple Pay test amounts
 */
export const getApplePaySuccessAmounts = (): ApplePayTestAmount[] => {
  return getApplePayTestAmountByResult("success");
};

/**
 * Get all failed Apple Pay test amounts
 */
export const getApplePayFailedAmounts = (): ApplePayTestAmount[] => {
  return APPLE_PAY_TEST_AMOUNTS.filter((amount) => amount.expectedResult !== "success");
};

/**
 * Common Apple Pay test amounts for quick access
 */
export const COMMON_APPLE_PAY_TESTS = {
  // Success
  success: APPLE_PAY_TEST_AMOUNTS.find((a) => a.id === "apple-pay-success-002")!,
  successRange: APPLE_PAY_TEST_AMOUNTS.find((a) => a.id === "apple-pay-success-001")!,
  
  // Failures
  unspecifiedFailure: APPLE_PAY_TEST_AMOUNTS.find((a) => a.id === "apple-pay-failed-001")!,
  insufficientFunds: APPLE_PAY_TEST_AMOUNTS.find((a) => a.id === "apple-pay-failed-002")!,
  lostCard: APPLE_PAY_TEST_AMOUNTS.find((a) => a.id === "apple-pay-failed-003")!,
  declined: APPLE_PAY_TEST_AMOUNTS.find((a) => a.id === "apple-pay-failed-004")!,
  expiredCard: APPLE_PAY_TEST_AMOUNTS.find((a) => a.id === "apple-pay-failed-005")!,
  exceedsLimit: APPLE_PAY_TEST_AMOUNTS.find((a) => a.id === "apple-pay-failed-006")!,
  stolenCard: APPLE_PAY_TEST_AMOUNTS.find((a) => a.id === "apple-pay-failed-007")!,
};

/**
 * Apple Pay Testing Instructions
 * 
 * IMPORTANT NOTES:
 * 1. You MUST have a REAL card added to your Apple Wallet to test Apple Pay
 * 2. The test environment uses AMOUNT RANGES to determine responses, not specific cards
 * 3. Use the amount ranges below to trigger different payment responses
 * 4. Apple Pay only works on iOS devices with Apple Wallet configured
 * 
 * HOW TO TEST:
 * 1. Ensure you have a real card in Apple Wallet
 * 2. Set the payment amount to one of the test amounts below
 * 3. Initiate Apple Pay payment
 * 4. Complete the payment using Face ID, Touch ID, or passcode
 * 5. The response will match the expected result for that amount range
 */
export const APPLE_PAY_TESTING_INSTRUCTIONS = {
  requirements: [
    "Real card must be added to Apple Wallet",
    "iOS device with Apple Pay support",
    "Moyasar sandbox/test environment",
    "Apple Pay Merchant ID configured",
  ],
  steps: [
    "Add a real card to your Apple Wallet",
    "Set payment amount to one of the test amounts",
    "Tap Apple Pay button in the app",
    "Authenticate with Face ID, Touch ID, or passcode",
    "Payment will process with the expected result based on amount",
  ],
  quickTest: {
    success: "Use amount between 200-300 SAR (e.g., 250 SAR) for successful payment",
    failure: "Use amount between 1000-1100 SAR (e.g., 1050 SAR) for failed payment",
  },
};
