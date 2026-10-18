import { renderJobApplication } from "./job-application";
import { type RenderedEmail } from "./layout";
import { renderLeadAssigned } from "./lead-assigned";
import { renderNewLead } from "./new-lead";
import { renderTranslationBudgetExceeded } from "./translation-budget-exceeded";
import { renderUnassignedReminder } from "./unassigned-reminder";

/** Nguồn duy nhất tên template; job `send-notification-email` lấy danh sách này làm options. */
const renderers = {
  "new-lead": renderNewLead,
  "lead-assigned": renderLeadAssigned,
  "job-application": renderJobApplication,
  "unassigned-reminder": renderUnassignedReminder,
  "translation-budget-exceeded": renderTranslationBudgetExceeded,
} as const satisfies Record<string, (data: unknown) => RenderedEmail>;

export type EmailTemplateName = keyof typeof renderers;

export const EMAIL_TEMPLATE_NAMES = Object.keys(renderers) as EmailTemplateName[];

/** Ném lỗi (ZodError) nếu `data` thiếu biến bắt buộc. */
export function renderEmailTemplate(template: EmailTemplateName, data: unknown): RenderedEmail {
  return renderers[template](data);
}

export type { RenderedEmail } from "./layout";
