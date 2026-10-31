import { API_CONFIG } from "@/constants/api";
import apiClient from "@/utils/api";

export interface SupportContactResponse {
  support_email?: string;
  support_phone?: string;
}

export const supportService = {
  getContact: async (): Promise<SupportContactResponse> => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.SUPPORT_CONTACT);
    return response.data ?? {};
  },
};
