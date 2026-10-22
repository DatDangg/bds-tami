"use client";

import { ConfirmationModal, useAuth, useDocumentInfo, useFormFields, useModal } from "@payloadcms/ui";
import { useState } from "react";

import { canRetranslate, retranslateMessage } from "@/lib/translation/admin-ui";

const CONFIRM_MESSAGE = "Dịch lại toàn bộ bản tiếng Anh bằng AI? Bản đã sửa tay sẽ bị ghi đè.";

/**
 * Nút "Dịch lại bằng AI" trong nhóm Dịch của form bài/global (FR-ADM-18). Ẩn khi chưa lưu bản ghi hoặc khi người dùng không được dịch lại bài này
 * (`canRetranslate`; endpoint `POST /api/admin/translations/:collection/:id` vẫn kiểm lại và là nơi quyết định). Hỏi xác nhận bằng modal của admin (không dùng hộp thoại trình duyệt) vì dịch đè bản sửa tay.
 */
export function RetranslateButton() {
  const { user } = useAuth();
  const { id, collectionSlug, globalSlug } = useDocumentInfo();
  const author = useFormFields(([fields]) => fields.author?.value);
  const { openModal, closeModal } = useModal();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const target = globalSlug ? `globals/${globalSlug}` : id && collectionSlug ? `${collectionSlug}/${id}` : null;
  const modalSlug = `retranslate-${globalSlug ? `global-${globalSlug}` : `${collectionSlug}-${id}`}`;
  if (!target || !canRetranslate(user, collectionSlug ?? "globals", author)) return null;

  async function retranslate() {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/translations/${target}`, { method: "POST", credentials: "same-origin" });
      setMessage({ text: retranslateMessage(response.status, response.headers.get("Retry-After")), ok: response.status === 202 });
    } catch {
      setMessage({ text: retranslateMessage(0, null), ok: false });
    } finally {
      setBusy(false);
      closeModal(modalSlug);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
      <button type="button" className="btn btn--style-secondary btn--size-medium" style={{ minHeight: 44, alignSelf: "flex-start" }} disabled={busy} aria-busy={busy} onClick={() => openModal(modalSlug)}>
        {busy ? "Đang gửi…" : "Dịch lại bằng AI"}
      </button>
      <ConfirmationModal modalSlug={modalSlug} heading="Dịch lại bằng AI" body={CONFIRM_MESSAGE} confirmLabel="Dịch lại" confirmingLabel="Đang gửi…" cancelLabel="Huỷ" onConfirm={retranslate} />
      {message ? (
        <p role={message.ok ? "status" : "alert"} className="field-description" style={{ margin: 0 }}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
