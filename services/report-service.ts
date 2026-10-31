import { API_CONFIG } from "../constants/api";
import apiClient from "../utils/api";

export type ReportType = "chat" | "project";

export type ChatReportReason =
  | "spam_fraud"
  | "harassment_abuse"
  | "inappropriate_content"
  | "scam_misleading"
  | "other";

export type ProjectReportReason =
  | "fake_project"
  | "misleading_info"
  | "inappropriate_content"
  | "scam_fraud"
  | "duplicate_listing"
  | "other";

export interface CreateReportParams {
  report_type: ReportType;
  reported_user_id?: number;
  reported_project_id?: number;
  message_id?: number;
  reason: ChatReportReason | ProjectReportReason;
  description?: string;
}

export interface ReportReason {
  value: string;
  labelEn: string;
  labelAr: string;
}

export const CHAT_REPORT_REASONS: ReportReason[] = [
  { value: "spam_fraud", labelEn: "Spam or Fraud", labelAr: "رسائل مزعجة أو احتيال" },
  { value: "harassment_abuse", labelEn: "Harassment or Abuse", labelAr: "تحرش أو إساءة" },
  { value: "inappropriate_content", labelEn: "Inappropriate Content", labelAr: "محتوى غير لائق" },
  { value: "scam_misleading", labelEn: "Scam or Misleading", labelAr: "احتيال أو تضليل" },
  { value: "other", labelEn: "Other", labelAr: "أخرى" },
];

export const PROJECT_REPORT_REASONS: ReportReason[] = [
  { value: "fake_project", labelEn: "Fake Project", labelAr: "مشروع وهمي" },
  { value: "misleading_info", labelEn: "Misleading Information", labelAr: "معلومات مضللة" },
  { value: "inappropriate_content", labelEn: "Inappropriate Content", labelAr: "محتوى غير لائق" },
  { value: "scam_fraud", labelEn: "Scam or Fraud", labelAr: "احتيال أو نصب" },
  { value: "duplicate_listing", labelEn: "Duplicate Listing", labelAr: "إعلان مكرر" },
  { value: "other", labelEn: "Other", labelAr: "أخرى" },
];

export const reportService = {
  createReport: async (params: CreateReportParams): Promise<void> => {
    await apiClient.post(API_CONFIG.ENDPOINTS.REPORTS, params);
  },
};
