import axios from "axios";
import { API_CONFIG } from "../constants/api";
import { useAuthStore } from "../store/auth-store";
import i18n from "./i18n";
import { storage } from "./storage";

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token and language
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getSecurely("user_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const lang = i18n.language || "en";
    config.headers["Accept-Language"] = lang;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: on auth/account errors clear auth and let layout redirect to login
apiClient.interceptors.response.use(
  (response) => {
    const headers = response.config?.headers as any;
    const hadAuth = !!(
      headers?.Authorization ||
      headers?.authorization ||
      useAuthStore.getState().isAuthenticated
    );
    if (hadAuth && useAuthStore.getState().isMaintenanceMode) {
      useAuthStore.getState().setMaintenanceMode(false);
    }
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const serverErrorCode = error.response?.data?.error;
    const isMaintenanceMode =
      status === 503 && serverErrorCode === "MAINTENANCE_MODE";
    const headers = error.config?.headers as any;
    const hadAuth = !!(
      headers?.Authorization ||
      headers?.authorization ||
      useAuthStore.getState().isAuthenticated
    );

    if (isMaintenanceMode && hadAuth) {
      useAuthStore.getState().setMaintenanceMode(true);
    }

    const isAuthExpired = status === 401;
    const isInactiveAccount = status === 403 && serverErrorCode === "ACCOUNT_INACTIVE";

    if (isAuthExpired || isInactiveAccount) {
      if (hadAuth) {
        await useAuthStore.getState().logout();
        // Root layout reacts to isAuthenticated and navigates to /login
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
