import { API_CONFIG } from "@/constants/api";
import apiClient from "@/utils/api";

export interface ExpressInterestParams {
  projectId: string;
  investmentAmount: number;
  message?: string;
}

export interface ExpressInterestResult {
  success: boolean;
  message?: string;
}

export interface ProjectInterest {
  id: number;
  user_id: number;
  project_id: number;
  investment_amount: number;
  message?: string;
  status: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    investor_profile?: { company?: string };
  };
}

export interface GetProjectInterestsResult {
  data: ProjectInterest[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
  summary: { total_interests: number; pending: number; accepted: number; rejected: number };
}

export const interestService = {
  expressInterest: async ({
    projectId,
    investmentAmount,
    message,
  }: ExpressInterestParams): Promise<ExpressInterestResult> => {
    const url = `${API_CONFIG.ENDPOINTS.PROJECTS}/${projectId}/interest`;
    const response = await apiClient.post(url, {
      investment_amount: investmentAmount,
      message: message || undefined,
    });
    const data = response.data as { message?: string };
    return {
      success: true,
      message: data.message,
    };
  },

  getProjectInterests: async (
    projectId: string,
    page = 1
  ): Promise<GetProjectInterestsResult> => {
    const url = `${API_CONFIG.ENDPOINTS.PROJECTS}/${projectId}/interests`;
    const response = await apiClient.get(url, { params: { page, per_page: 20 } });
    const d = response.data as {
      data?: ProjectInterest[];
      meta?: Record<string, number>;
      summary?: Record<string, number>;
    };
    return {
      data: d.data ?? [],
      meta: {
        current_page: d.meta?.current_page ?? 1,
        last_page: d.meta?.last_page ?? 1,
        per_page: d.meta?.per_page ?? 20,
        total: d.meta?.total ?? 0,
      },
      summary: {
        total_interests: d.summary?.total_interests ?? 0,
        pending: d.summary?.pending ?? 0,
        accepted: d.summary?.accepted ?? 0,
        rejected: d.summary?.rejected ?? 0,
      },
    };
  },
};
