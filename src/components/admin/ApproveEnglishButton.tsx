"use client";

import { useAuth, useDocumentInfo, useFormFields } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

const FALLBACK_ERROR = "Không duyệt được bản tiếng Anh. Thử lại sau.";

/** Thông báo theo mã của `POST /api/admin/translations/pages/:id/approve`; 422 nêu trường EN còn thiếu. */
export function approveErrorMessage(status: number, missing: string[] = []): string {
  if (status === 422) return `Bản tiếng Anh chưa đủ để duyệt, còn thiếu: ${missing.join(", ") || "tiêu đề, nội dung"}. Nhập ở bản EN rồi duyệt lại.`;
  if (status === 409) return "Bản tiếng Anh đã được duyệt. Tải lại trang.";
  if (status === 401 || status === 403) return "Chỉ admin được duyệt bản tiếng Anh.";
  if (status === 404) return "Không tìm thấy trang này.";
  return FALLBACK_ERROR;
}

async function missingFieldsOf(response: Response): Promise<string[]> {
  try {
    const body = (await response.json()) as { details?: { path?: string[] }[] };
    return (body.details ?? []).flatMap((detail) => detail.path ?? []);
  } catch {
    return [];
  }
}

/**
 * Nút "Duyệt bản EN" của trang pháp lý (BR-08): chỉ admin thấy, khi `hasEnglish` còn tắt (bản AI chờ duyệt hoặc bản EN nhập tay). Gọi
 * `POST /api/admin/translations/pages/:id/approve`, đường duy nhất bật `hasEnglish` của trang pháp lý (hook `guardEnglishApproval`: lưu form không bao giờ
 * tự duyệt, kể cả form mở sẵn còn `hasEnglish = true` cũ). Audit và chuyển `done` do hook `approveEnglish` làm ở server. */
export function ApproveEnglishButton() {
  const { user } = useAuth();
  const { id } = useDocumentInfo();
  const hasEnglish = useFormFields(([fields]) => fields.hasEnglish?.value);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (user?.role !== "admin" || !id || hasEnglish === true) return null;

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/translations/pages/${id}/approve`, { method: "POST", credentials: "same-origin" });
      if (!response.ok) {
        setError(approveErrorMessage(response.status, response.status === 422 ? await missingFieldsOf(response) : []));
        return;
      }
      router.refresh();
    } catch {
      setError(FALLBACK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
      <p className="field-description" style={{ margin: 0 }}>
        Bản tiếng Anh (AI dịch hoặc nhập tay) chưa được duyệt nên chưa hiển thị cho khách. Kiểm tra rồi bấm duyệt.
      </p>
      <button type="button" className="btn btn--style-primary btn--size-medium" style={{ minHeight: 44, alignSelf: "flex-start" }} disabled={busy} aria-busy={busy} onClick={approve}>
        {busy ? "Đang duyệt…" : "Duyệt bản EN"}
      </button>
      {error ? (
        <p role="alert" className="field-description" style={{ margin: 0 }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
