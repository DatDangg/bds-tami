"use client";

import { useAuth, useListDrawerContext, useListQuery } from "@payloadcms/ui";
import { useState } from "react";

import { collectConditions } from "@/lib/leads/export-filters";

const ENDPOINT = "/api/admin/newsletter-subscribers/export";
const DEFAULT_FILE_NAME = "tami-ban-tin.xlsx";
const REVOKE_DELAY_MS = 10_000;
const STATUSES = new Set(["active", "unsubscribed"]);

export const UNSUPPORTED_NEWSLETTER_FILTER_MESSAGE =
  'Chỉ xuất được khi bộ lọc là Trạng thái với "là" (hoặc không lọc) và ô tìm kiếm để trống. Hãy bỏ bộ lọc khác rồi xuất lại.';

export type NewsletterExportQuery = { ok: true; query: string } | { ok: false; reason: string };

/**
 * Bộ lọc danh sách (`where` của Payload, dạng `or[0].and[...]`) + ô tìm kiếm -> query của endpoint xuất. Chỉ ánh xạ được "Trạng thái là …";
 * mọi điều kiện khác (kể cả tìm kiếm) -> `ok: false` để nút bị khoá, không xuất lặng lẽ nhiều email hơn danh sách đang thấy.
 */
export function newsletterExportQueryFromWhere(where: unknown, search?: string): NewsletterExportQuery {
  const conditions: Record<string, unknown>[] = [];
  if (search || !collectConditions(where, conditions) || conditions.length > 1) return { ok: false, reason: UNSUPPORTED_NEWSLETTER_FILTER_MESSAGE };
  const [condition] = conditions;
  if (!condition) return { ok: true, query: "" };
  const { field, ...operators } = condition;
  const status = operators.equals;
  if (field !== "status" || Object.keys(operators).length !== 1 || typeof status !== "string" || !STATUSES.has(status)) {
    return { ok: false, reason: UNSUPPORTED_NEWSLETTER_FILTER_MESSAGE };
  }
  return { ok: true, query: new URLSearchParams({ status }).toString() };
}

/** Thông báo theo mã lỗi của `GET /api/admin/newsletter-subscribers/export` (API_SPEC §4). */
export function newsletterExportErrorMessage(status: number, retryAfter: string | null): string {
  if (status === 429) {
    const minutes = Math.max(1, Math.ceil(Number(retryAfter) / 60) || 1);
    return `Bạn đã xuất quá nhiều lần (tối đa 10 lần mỗi giờ, tính chung với xuất lead). Thử lại sau khoảng ${minutes} phút.`;
  }
  if (status === 422) return "Quá nhiều email để xuất một lần. Hãy lọc theo trạng thái rồi xuất lại.";
  if (status === 401 || status === 403) return "Bạn không có quyền xuất danh sách này.";
  if (status === 400) return "Bộ lọc hiện tại không xuất được. Hãy đổi bộ lọc rồi thử lại.";
  return "Không thể xuất danh sách lúc này. Thử lại sau.";
}

function fileNameFrom(contentDisposition: string | null): string {
  const match = /filename="([A-Za-z0-9._-]+)"/.exec(contentDisposition ?? "");
  return match?.[1] ?? DEFAULT_FILE_NAME;
}

function DownloadIcon() {
  return (
    <svg className="list-search-action__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M2.5 13h11" />
    </svg>
  );
}

/**
 * Nút "Xuất Excel" trên danh sách đăng ký bản tin (slot `beforeListTable`, cùng kiểu nút xuất lead), chỉ admin thấy (endpoint kiểm quyền lại).
 * Ẩn trong list drawer vì `filterOptions` của drawer không nằm trong `where`. Dùng fetch để lỗi 429/422 hiện thành thông báo.
 */
export function NewsletterExportButton() {
  const { user } = useAuth();
  const { query } = useListQuery();
  const { isInDrawer } = useListDrawerContext();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  if (user?.role !== "admin" || isInDrawer) return null;
  const converted = newsletterExportQueryFromWhere(query?.where, query?.search);

  async function exportSubscribers() {
    if (!converted.ok) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`${ENDPOINT}${converted.query ? `?${converted.query}` : ""}`, { credentials: "same-origin" });
      if (!response.ok) {
        setMessage(newsletterExportErrorMessage(response.status, response.headers.get("Retry-After")));
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameFrom(response.headers.get("Content-Disposition"));
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
    } catch {
      setMessage(newsletterExportErrorMessage(0, null));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="list-search-action">
        <button
          type="button"
          className="btn btn--style-secondary btn--size-medium list-search-action__button"
          disabled={busy || !converted.ok}
          aria-busy={busy}
          onClick={exportSubscribers}
        >
          <DownloadIcon />
          {busy ? "Đang xuất…" : "Xuất Excel"}
        </button>
      </div>
      {!converted.ok || message ? (
        <div className="list-toolbar-item">
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
      ) : null}
    </>
  );
}
