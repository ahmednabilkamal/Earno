import { Platform } from "react-native";
import { API_CONFIG } from "../constants/api";
import apiClient from "../utils/api";

export interface LoginResponse {
  user: {
    id: string;
    email?: string | null;
    name?: string;
    profile_photo_url?: string;
    user_type: string;
    phone?: string | null;
    status: string;
    language: string;
  };
  token: string;
}

export interface RegisterResponse {
  user?: {
    id: string;
    email?: string | null;
    name?: string;
    profile_photo_url?: string;
    user_type: string;
    phone?: string | null;
    status: string;
    language: string;
  };
  token?: string;
  message?: string;
}

export interface VerifyOtpResponse {
  verified: boolean;
  message: string;
}

export interface ProfileResponse {
  user: {
    id: string;
    email?: string | null;
    name: string;
    profile_photo_url?: string;
    avatar?: string;
    user_type: string;
    phone?: string | null;
    status: string;
    language: string;
    country?: string;
    full_address?: string;
  };
}

export interface UpdateProfileBody {
  name: string;
  email?: string;
  country?: string;
  full_address?: string;
  avatar: string; // base64 string when uploading a new image, otherwise ""
}

export interface LoginBody {
  phone: string;
  phone_code?: string;
  password: string;
  push_token?: string;
  device_name?: string;
  platform?: "android" | "ios";
}

export interface RegisterBody {
  name: string;
  email?: string | null;
  phone: string;
  phone_code?: string;
  phone_registration_token: string;
  user_type: string;
  password: string;
  password_confirmation: string;
  city?: string;
  country?: string;
  push_token?: string;
  device_name?: string;
  platform?: "android" | "ios";
  [key: string]: unknown;
}

export const authService = {
  login: async (
    phone: string,
    password: string,
    pushToken?: string | null,
    deviceName?: string | null,
    phoneCode: string = "+966"
  ): Promise<LoginResponse> => {
    const body: LoginBody = { phone, password, phone_code: phoneCode };
    if (pushToken) {
      body.push_token = pushToken;
      body.platform = Platform.OS === "ios" ? "ios" : "android";
      if (deviceName) body.device_name = deviceName;
    }
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.LOGIN, body);
    return response.data;
  },

  register: async (
    userData: RegisterBody | Record<string, unknown>,
    pushToken?: string | null,
    deviceName?: string | null
  ): Promise<RegisterResponse> => {
    const payload: Record<string, unknown> = { ...userData };
    if (pushToken) {
      payload.push_token = pushToken;
      payload.platform = Platform.OS === "ios" ? "ios" : "android";
      if (deviceName) payload.device_name = deviceName;
    }
    const response = await apiClient.post(
      API_CONFIG.ENDPOINTS.REGISTER,
      payload
    );
    return response.data;
  },

  sendPhoneOtp: async (
    phone: string,
    phoneCode: string = "+966",
    purpose: "registration" | "login_contact_recovery" = "registration"
  ): Promise<{ message: string; phone?: string }> => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.PHONE_OTP_SEND, {
      phone,
      phone_code: phoneCode,
      purpose,
    });
    return response.data;
  },

  verifyPhoneOtp: async (
    phone: string,
    otp: string,
    phoneCode: string = "+966",
    purpose: "registration" | "login_contact_recovery" = "registration"
  ): Promise<{ message: string; phone_registration_token?: string }> => {
    const response = await apiClient.post(
      API_CONFIG.ENDPOINTS.PHONE_OTP_VERIFY,
      { phone, phone_code: phoneCode, otp, purpose }
    );
    return response.data;
  },

  sendEmailOtp: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.EMAIL_OTP_SEND, {
      email,
    });
    return response.data;
  },

  verifyEmailOtp: async (
    email: string,
    otp: string
  ): Promise<VerifyOtpResponse> => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.EMAIL_OTP_VERIFY, {
      email,
      otp,
    });
    return response.data;
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.PROFILE);
    
    // Handle different response structures
    if (response.data.response?.user) {
      return { user: response.data.response.user };
    } else if (response.data.user) {
      return { user: response.data.user };
    } else if (response.data.data?.user) {
      return { user: response.data.data.user };
    }
    
    return response.data;
  },

  /** Sends SMS OTP for forgot-password (mobile / in-app reset flow). */
  sendForgotPasswordOtp: async (
    phoneNational: string,
    phoneCode: string = "+966"
  ): Promise<{ message?: string; phone?: string }> => {
    const response = await apiClient.post(
      API_CONFIG.ENDPOINTS.FORGOT_PASSWORD_OTP_SEND,
      { phone: phoneNational.trim(), phone_code: phoneCode }
    );
    return response.data;
  },

  verifyForgotPasswordOtp: async (
    phoneNational: string,
    otp: string,
    phoneCode: string = "+966"
  ): Promise<{ message: string; token: string; phone?: string }> => {
    const response = await apiClient.post(
      API_CONFIG.ENDPOINTS.FORGOT_PASSWORD_OTP_VERIFY,
      {
        phone: phoneNational.trim(),
        phone_code: phoneCode,
        otp,
      }
    );
    return response.data;
  },

  resetPasswordWithToken: async (data: {
    phone: string;
    phoneCode?: string;
    token: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message?: string }> => {
    const response = await apiClient.post(
      API_CONFIG.ENDPOINTS.RESET_PASSWORD,
      {
        phone: data.phone.trim(),
        phone_code: data.phoneCode ?? "+966",
        token: data.token,
        password: data.password,
        password_confirmation: data.password_confirmation,
      }
    );
    return response.data;
  },

  changePassword: async (data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<any> => {
    const response = await apiClient.put(
      API_CONFIG.ENDPOINTS.PROFILE_PASSWORD,
      data
    );
    return response.data;
  },

  updateProfile: async (body: UpdateProfileBody): Promise<ProfileResponse> => {
    const response = await apiClient.put(
      API_CONFIG.ENDPOINTS.PROFILE,
      body
    );
    
    // Handle different response structures
    if (response.data.response?.user) {
      return { user: response.data.response.user };
    } else if (response.data.user) {
      return { user: response.data.user };
    } else if (response.data.data?.user) {
      return { user: response.data.data.user };
    }
    
    return response.data;
  },

  logout: async (pushToken?: string | null): Promise<void> => {
    try {
      const body = pushToken ? { push_token: pushToken } : {};
      await apiClient.post(API_CONFIG.ENDPOINTS.LOGOUT, body);
    } catch (error) {
      // Ignore API errors here; local logout will still proceed
      console.error("Logout API error:", error);
    }
  },

  /**
   * Permanently deletes the authenticated account. Sends password in body (many APIs require it).
   */
  deleteAccount: async (password: string): Promise<void> => {
    await apiClient.delete(API_CONFIG.ENDPOINTS.DELETE_ACCOUNT, {
      data: { password },
    });
  },
};
