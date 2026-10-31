import { API_CONFIG } from "../constants/api";
import apiClient from "../utils/api";

export interface InvestorOnboardingData {
  risk_tolerance?: string;
  preferred_sectors?: string[];
  min_investment_amount?: number;
  max_investment_amount?: number;
  preferred_partnership_percentages?: number[];
  preferred_category_ids?: number[];
  preferred_categories_other?: string;
  preferred_locations?: string[];
  preferred_partnership_types?: string[];
  preferred_investment_type?: string;
  investment_range?: string;
  annual_investment_budget?: string;
  project_stage?: string;
  investor_persona?: string;
  geographic_preference?: string;
  value_add?: string[];
  investment_interests?: string[];
}

export interface OnboardingOptions {
  investment_ranges: { value: string; label: string }[];
  annual_budgets: { value: string; label: string }[];
  sectors: { value: string; label: string }[];
  project_stages: { value: string; label: string }[];
  investor_personas: { value: string; label: string }[];
  geographic_preferences: { value: string; label: string }[];
  value_add_options: { value: string; label: string }[];
}

export interface InvestorProfileResponse {
  profile: {
    id: number;
    user_id: number;
    max_investment_amount?: number;
    min_investment_amount?: number;
    preferred_sectors?: string[];
    preferred_category_ids?: number[];
    preferred_categories_other?: string;
    preferred_locations?: string[];
    preferred_investment_type?: string;
    [key: string]: unknown;
  };
  user?: { id: number; name: string; email: string; phone?: string };
  stats?: { profile_completion?: number };
}

export const investorService = {
  getProfile: async (): Promise<InvestorProfileResponse> => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.INVESTOR_PROFILE);
    return response.data;
  },

  updateProfile: async (
    data: InvestorOnboardingData
  ): Promise<{ message: string; profile: unknown }> => {
    const response = await apiClient.put(
      API_CONFIG.ENDPOINTS.INVESTOR_PROFILE,
      data
    );
    return response.data;
  },

  getOnboardingOptions: async (): Promise<OnboardingOptions> => {
    const response = await apiClient.get(
      API_CONFIG.ENDPOINTS.INVESTOR_ONBOARDING_OPTIONS
    );
    return response.data;
  },
};
