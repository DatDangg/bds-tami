"use client";

import { useFormFields } from "@payloadcms/ui";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Đường dẫn endpoint có kiểm quyền + audit; không có URL công khai nào tới CV. */
export function cvDownloadPath(cvId: unknown): string | null {
  return typeof cvId === "string" && UUID_PATTERN.test(cvId) ? `/api/admin/private-files/${cvId}/download` : null;
}

/**
 * Nút "Tải CV" trong form hồ sơ ứng tuyển (field `ui`, không có cột DB). Là liên kết thường: trình duyệt gửi cookie phiên,
 * server trả `Content-Disposition: attachment`. Hồ sơ đã ẩn danh (CV bị xoá) thì không có nút.
 */
export function CvDownloadButton() {
  const cvId = useFormFields(([fields]) => fields.cv?.value);
  const href = cvDownloadPath(cvId);
  if (!href) return <p className="field-description">CV đã được xoá (hồ sơ đã ẩn danh).</p>;
  return (
    <a className="btn btn--style-secondary btn--size-medium" href={href} download style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>
      Tải CV
    </a>
  );
}
