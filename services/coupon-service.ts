import { API_CONFIG } from "@/constants/api";
import apiClient from "@/utils/api";

export interface CouponValidateResult {
  valid: boolean;
  message: string;
  coupon_id: number | null;
  discount_amount: number;
  final_amount: number;
}

export const validateCoupon = async (
  code: string,
  amount: number,
  type: string = "fee"
): Promise<CouponValidateResult> => {
  const response = await apiClient.post<CouponValidateResult>(
    API_CONFIG.ENDPOINTS.COUPONS_VALIDATE,
    { code: code.trim(), amount, type }
  );
  return response.data;
};
