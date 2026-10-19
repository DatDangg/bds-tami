"use client";

import { useAuth, useListDrawerContext, useListQuery } from "@payloadcms/ui";
import { useState } from "react";

import { leadExportQueryFromWhere } from "@/lib/leads/export-filters";

const DEFAULT_FILE_NAME = "tami-leads.xlsx";
const REVOKE_DELAY_MS = 10_000;

/** Thông báo cho người dùng theo mã lỗi của `GET /api/admin/leads/export` (API_SPEC §4). */
export function exportErrorMessage(status: number, retryAfter: string | null): string {
  if (status === 429) {
    const minutes = Math.max(1, Math.ceil(Number(retryAfter) / 60) || 1);
    return `Bạn đã xuất quá nhiều lần (tối đa 10 lần mỗi giờ). Thử lại sau khoảng ${minutes} phút.`;
  }
  if (status === 422) return "Quá nhiều lead để xuất một lần. Hãy lọc theo trạng thái, nguồn hoặc khoảng ngày rồi xuất lại.";
  if (status === 401 || status === 403) return "Bạn không có quyền xuất lead.";
  if (status === 400) return "Bộ lọc hiện tại không xuất được. Hãy đổi bộ lọc rồi thử lại.";
  return "Không thể xuất lead lúc này. Thử lại sau.";
}

function fileNameFrom(contentDisposition: string | null): string {
  const match = /filename="([A-Za-z0-9._-]+)"/.exec(contentDisposition ?? "");
  return match?.[1] ?? DEFAULT_FILE_NAME;
}

/**
 * Nút "Xuất Excel" trên danh sách lead, chỉ hiện cho admin (sale không được xuất: PERMISSION §3.3). Xuất đúng bộ lọc đang áp
 * trong danh sách (trạng thái, nguồn, sale, khoảng ngày, ô tìm kiếm: server tự dựng điều kiện tìm như danh sách). Bộ lọc không chuyển được (nhiều nhóm điều kiện, toán tử lạ)
 * thì nút bị khoá kèm thông báo, không xuất lặng lẽ toàn bộ lead. Dùng fetch thay vì liên kết tải thẳng để
 * lỗi 429/422 hiện thành thông báo thay vì tải về một file JSON lỗi. Thùng rác do `LeadExportSlot` (server) chặn; ở đây chỉ ẩn
 * trong list drawer (chọn lead từ collection khác): `filterOptions` của drawer không nằm trong `where` nên xuất sẽ rộng hơn danh sách đang thấy.
 */
export function LeadExportButton() {
  const { user } = useAuth();
  const { query } = useListQuery();
  // Ngoài drawer Payload trả context mặc định `{}` (không throw), `isInDrawer` undefined.
  const { isInDrawer } = useListDrawerContext();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  if (user?.role !== "admin" || isInDrawer) return null;
  const converted = leadExportQueryFromWhere(query?.where, query?.search);

  async function exportLeads() {
    if (!converted.ok) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/leads/export${converted.query ? `?${converted.query}` : ""}`, { credentials: "same-origin" });
      if (!response.ok) {
        setMessage(exportErrorMessage(response.status, response.headers.get("Retry-After")));
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameFrom(response.headers.get("Content-Disposition"));
      link.click();
      // Revoke đồng bộ ngay sau click có thể huỷ tải ở vài trình duyệt.
      setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
    } catch {
      setMessage(exportErrorMessage(0, null));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="list-toolbar-item">
      <button
        type="button"
        className="btn btn--style-secondary btn--size-medium"
        disabled={busy || !converted.ok}
        aria-busy={busy}
        onClick={exportLeads}
      >
        {busy ? "Đang xuất…" : "Xuất Excel"}
      </button>
      {!converted.ok ? (
        <p role="status" className="field-description list-toolbar-item__note">
          {converted.reason}
        </p>
      ) : null}
      {message ? (
        <p role="alert" className="field-description list-toolbar-item__note">
          {message}
        </p>
      ) : null}
    </div>
  );
}
