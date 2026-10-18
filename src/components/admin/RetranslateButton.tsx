"use client";

import { useAuth, useDocumentInfo, useFormFields } from "@payloadcms/ui";
import { useState } from "react";

import { canRetranslate, retranslateMessage } from "@/lib/translation/admin-ui";

const CONFIRM_MESSAGE = "Dịch lại toàn bộ bản tiếng Anh bằng AI? Bản đã sửa tay sẽ bị ghi đè.";

/**
 * Nút "Dịch lại bằng AI" trong nhóm Dịch của form bài/global (FR-ADM-18). Ẩn khi chưa lưu bản ghi hoặc khi người dùng không được dịch lại bài này
 * (`canRetranslate`; endpoint `POST /api/admin/translations/:collection/:id` vẫn kiểm lại và là nơi quyết định). Hỏi xác nhận vì dịch đè bản sửa tay.
 */
export function RetranslateButton() {
  const { user } = useAuth();
  const { id, collectionSlug, globalSlug } = useDocumentInfo();
  const author = useFormFields(([fields]) => fields.author?.value);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const target = globalSlug ? `globals/${globalSlug}` : id && collectionSlug ? `${collectionSlug}/${id}` : null;
  if (!target || !canRetranslate(user, collectionSlug ?? "globals", author)) return null;

  async function retranslate() {
    if (!window.confirm(CONFIRM_MESSAGE)) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/translations/${target}`, { method: "POST", credentials: "same-origin" });
      setMessage({ text: retranslateMessage(response.status, response.headers.get("Retry-After")), ok: response.status === 202 });
    } catch {
      setMessage({ text: retranslateMessage(0, null), ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
      <button type="button" className="btn btn--style-secondary btn--size-medium" style={{ minHeight: 44, alignSelf: "flex-start" }} disabled={busy} aria-busy={busy} onClick={retranslate}>
        {busy ? "Đang gửi…" : "Dịch lại bằng AI"}
      </button>
      {message ? (
        <p role={message.ok ? "status" : "alert"} className="field-description" style={{ margin: 0 }}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
