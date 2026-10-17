import type { ApplicantLocale } from "@/shared/types/api";

const MESSAGES = {
  vi: {
    invalidInput: "Dữ liệu không hợp lệ",
    captcha: "Xác thực captcha không thành công",
    rateLimited: "Bạn gửi quá nhiều lần, vui lòng thử lại sau",
    unavailable: "Hệ thống tạm thời không khả dụng, vui lòng thử lại sau",
    postingClosed: "Vị trí tuyển dụng này không còn nhận hồ sơ",
    cvMissing: "Vui lòng đính kèm CV",
    cvUnsupported: "CV chỉ nhận định dạng PDF, DOC hoặc DOCX",
    cvInvalid: "CV bị lỗi hoặc không đọc được, vui lòng chọn file khác",
    cvTooLarge: "CV vượt quá 5MB",
    bodyTooLarge: "Hồ sơ gửi lên quá lớn (CV tối đa 5MB)",
    consentRequired: "Bạn cần đồng ý với chính sách bảo mật",
    fieldInvalid: "Giá trị không hợp lệ",
    serverError: "Hệ thống gặp lỗi, vui lòng thử lại sau",
  },
  en: {
    invalidInput: "Invalid data",
    captcha: "Captcha verification failed",
    rateLimited: "Too many submissions, please try again later",
    unavailable: "The service is temporarily unavailable, please try again later",
    postingClosed: "This job is no longer accepting applications",
    cvMissing: "Please attach your CV",
    cvUnsupported: "CV must be a PDF, DOC or DOCX file",
    cvInvalid: "The CV file is corrupted or unreadable, please choose another file",
    cvTooLarge: "CV exceeds 5MB",
    bodyTooLarge: "The submission is too large (CV up to 5MB)",
    consentRequired: "You must agree to the privacy policy",
    fieldInvalid: "Invalid value",
    serverError: "Something went wrong, please try again later",
  },
} as const satisfies Record<ApplicantLocale, Record<string, string>>;

export type ApplicantMessageKey = keyof (typeof MESSAGES)["vi"];

export function applicantMessage(locale: ApplicantLocale, key: ApplicantMessageKey): string {
  return MESSAGES[locale][key];
}

export function fieldMessage(locale: ApplicantLocale, field: string): string {
  return applicantMessage(locale, field === "consent" ? "consentRequired" : "fieldInvalid");
}

/** Lỗi xảy ra trước khi biết ngôn ngữ trong form (429, body quá lớn): đoán theo `Accept-Language`, mặc định tiếng Việt. */
export function localeFromAcceptLanguage(header: string | null): ApplicantLocale {
  return header?.trim().toLowerCase().startsWith("en") ? "en" : "vi";
}
