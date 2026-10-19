/**
 * Huy hiệu trạng thái tối giản cho dashboard, dùng token `--admin-badge-*` (BL-015 T04).
 * FOLLOW-UP: thay bằng `StatusBadge` + `status-tones.ts` của T05 khi T05 merge, rồi xoá file này.
 */
export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const STATUS_BADGES: Record<string, { label: string; tone: BadgeTone }> = {
  // Nội dung (ERD §1)
  draft: { label: "Nháp", tone: "neutral" },
  published: { label: "Đã xuất bản", tone: "success" },
  hidden: { label: "Ẩn", tone: "neutral" },
  rented: { label: "Đã thuê", tone: "neutral" },
  // Lead (BR-11)
  new: { label: "Mới", tone: "warning" },
  contacted: { label: "Đã liên hệ", tone: "info" },
  consulting: { label: "Đang tư vấn", tone: "info" },
  won: { label: "Đã chốt", tone: "success" },
  lost: { label: "Không thành", tone: "danger" },
  spam: { label: "Spam", tone: "neutral" },
};

export function DashboardBadge({ status }: { status: string }) {
  const badge = STATUS_BADGES[status];
  if (!badge) return null;
  return <span className={`tami-dash-badge tami-dash-badge--${badge.tone}`}>{badge.label}</span>;
}

export function DashboardTextBadge({ tone, children }: { tone: BadgeTone; children: string }) {
  return <span className={`tami-dash-badge tami-dash-badge--${tone}`}>{children}</span>;
}
