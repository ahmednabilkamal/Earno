import { API_CONFIG } from "../constants/api";
import apiClient from "../utils/api";

export const userBlockService = {
  async blockUser(userId: number): Promise<void> {
    await apiClient.post(`${API_CONFIG.ENDPOINTS.USERS}/${userId}/block`);
  },

  async unblockUser(userId: number): Promise<void> {
    await apiClient.delete(`${API_CONFIG.ENDPOINTS.USERS}/${userId}/block`);
  },
};
