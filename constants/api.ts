/** If in-app DELETE /profile is unavailable, users can finish deletion here (Apple 5.1.1(v)). */
export const ACCOUNT_DELETE_WEB_URL = "https://earno.app/delete-account";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || "https://earno.app/api";

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 100000,
  ENDPOINTS: {
    LOGIN: "/login",
    REGISTER: "/register",
    LOGOUT: "/logout",
    PROFILE: "/profile",
    PHONE_OTP_SEND: "/phone/otp/send",
    PHONE_OTP_VERIFY: "/phone/otp/verify",
    INVESTOR_PROFILE: "/investor/profile",
    INVESTOR_ONBOARDING_OPTIONS: "/investor/profile/onboarding-options",
    PROJECTS: "/projects",
    PROJECT_DETAILS: "/projects/details", // append /{id} when calling
    PROJECT_CATEGORIES: "/project-categories",
    CITIES: "/cities",
    SUPPORT_CONTACT: "/support-contact",
    CREATE_PROJECT: "/projects",
    FORGOT_PASSWORD: "/forgot-password",
    FORGOT_PASSWORD_OTP_SEND: "/forgot-password/otp/send",
    FORGOT_PASSWORD_OTP_VERIFY: "/forgot-password/otp/verify",
    RESET_PASSWORD: "/reset-password",
    EMAIL_OTP_SEND: "/email/otp/send",
    EMAIL_OTP_VERIFY: "/email/otp/verify",
    PROFILE_PASSWORD: "/profile/password",
    /** DELETE with Bearer token — permanently removes the authenticated account (backend must implement). */
    DELETE_ACCOUNT: "/profile",
    NOTIFICATIONS_UNREAD_COUNT: "/notifications/unread-count",
    /** In-app notification list (GET) */
    NOTIFICATIONS: "/notifications",
    /** Expo push token registration (mobile) */
    NOTIFICATIONS_EXPO_REGISTER: "/notifications/expo/register",
    /** Remove Expo push token (mobile) */
    NOTIFICATIONS_EXPO_REMOVE: "/notifications/expo",
    PROJECT_FAVORITE: "/projects", // append /{id}/favorite when calling
    FAVORITES: "/favorites", // Get user's favorite projects
    OWNER_PROJECTS: "/owner/projects", // Get owner's projects
    INVESTOR_PROJECTS: "/investor/projects", // Investor-seeking projects (create, list)
    TRANSACTIONS: "/transactions",
    PUBLICATION_FEE: "/publication-fee",
    /** Moyasar publishable key for native SDK (authenticated). Full URL: {BASE_URL}/payments/moyasar-client */
    MOYASAR_CLIENT: "/payments/moyasar-client",
    MOYASAR_HOSTED_PENDING_INTENT: "/payments/moyasar-hosted/pending-intent",
    MOYASAR_HOSTED_EXISTING_INTENT: "/payments/moyasar-hosted/projects", // append /{projectId}/intent
    MOYASAR_HOSTED_EXISTING_FREE: "/payments/moyasar-hosted/projects", // append /{projectId}/complete-free
    MOYASAR_HOSTED_INVOICE_STATUS: "/payments/moyasar-hosted/invoices", // append /{invoiceId}
    COUPONS_VALIDATE: "/coupons/validate",
    MESSAGES: "/messages",
    USERS: "/users",
    TICKETS: "/tickets",
    REPORTS: "/reports",
  },
};
