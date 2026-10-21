"use client";

import { ConfirmationModal, Link, toast, useAuth, useConfig, useListDrawerContext, useLocale, useModal } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { publicDocUrl } from "../../lib/admin/public-doc-url";
import { rowActionVisibility } from "../../lib/admin/row-actions";

export interface RowActionsRow {
  id: string | number;
  author?: unknown;
  slug?: unknown;
  status?: unknown;
  kind?: unknown;
  hasEnglish?: unknown;
  deletedAt?: unknown;
  title?: unknown;
  code?: unknown;
}

interface RowActionsProps {
  collectionSlug: string;
  row: RowActionsRow;
  inTrash: boolean;
  siteUrl: string;
}

const LABELS = { site: "Xem trên web", edit: "Sửa", duplicate: "Nhân bản", trash: "Chuyển vào Thùng rác" } as const;
const FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";
const FAILED_MESSAGE = "Không thực hiện được. Vui lòng thử lại.";

const ICON = { "aria-hidden": true, focusable: false, width: 18, height: 18, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const ICON_PATHS = {
  site: "M9 2.5h4.5V7M13.5 2.5 7 9M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3",
  edit: "M10.5 2.5 13.5 5.5 5.5 13.5H2.5v-3zM9 4l3 3",
  duplicate: "M5.5 5.5h7v8h-7zM3.5 10.5v-8h7",
  trash: "M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8.5h6l.5-8.5M6.5 7v4M9.5 7v4",
} as const;

const Icon = ({ name }: { name: keyof typeof ICON_PATHS }) => (
  <svg {...ICON}>
    <path d={ICON_PATHS[name]} />
  </svg>
);

const rowTitle = (row: RowActionsRow): string => {
  const value = typeof row.title === "string" && row.title ? row.title : typeof row.code === "string" ? row.code : "";
  return value || String(row.id);
};

/** Thông báo tiếng Việt cho phản hồi lỗi của server (thông điệp gốc của Payload là tiếng Anh/khó hiểu). */
const failureMessage = (status: number): string => (status === 401 || status === 403 ? FORBIDDEN_MESSAGE : FAILED_MESSAGE);

/**
 * Cột "Thao tác" của danh sách nội dung (BL-051 A12): icon-button Xem trên web / Sửa / Nhân bản / Chuyển vào Thùng rác.
 * Hiện nút theo `rowActionVisibility` (quyền Payload + quy tắc theo dòng như server) chỉ từ dữ liệu dòng, không fetch thêm.
 * Ẩn ở thùng rác, trong ListDrawer (picker quan hệ) và ở dòng đã xoá. Nhân bản/xoá gọi cùng endpoint với nút của Payload
 * (`POST /:id/duplicate`, `PATCH /:id {deletedAt}`) và làm mới danh sách bằng `router.refresh()`.
 */
export function RowActions({ collectionSlug, row, inTrash, siteUrl }: RowActionsProps) {
  const { user, permissions } = useAuth();
  const { config, getEntityConfig } = useConfig();
  const { code: locale } = useLocale();
  const { drawerSlug } = useListDrawerContext();
  const { openModal, closeModal } = useModal();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (inTrash || drawerSlug || row.deletedAt) return null;

  const collectionConfig = getEntityConfig({ collectionSlug });
  const visible = rowActionVisibility({ user, permissions: permissions?.collections?.[collectionSlug], rowData: row, disableDuplicate: Boolean(collectionConfig?.disableDuplicate) });
  const siteHref = publicDocUrl({ collectionSlug, savedDoc: row, locale, siteUrl });
  const base = `${config.routes.admin}/collections/${collectionSlug}`;
  const apiBase = `${config.routes.api}/${collectionSlug}/${encodeURIComponent(String(row.id))}`;
  const modalSlug = `row-trash-${collectionSlug}-${row.id}`;

  const send = async (url: string, method: "POST" | "PATCH", body: unknown): Promise<{ ok: boolean; doc?: { id?: string | number } }> => {
    setBusy(true);
    try {
      const response = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (response.ok) return { ok: true, doc: ((await response.json().catch(() => ({}))) as { doc?: { id?: string | number } }).doc };
      toast.error(failureMessage(response.status));
    } catch {
      toast.error(FAILED_MESSAGE);
    } finally {
      setBusy(false);
    }
    return { ok: false };
  };

  const duplicate = async () => {
    const { ok, doc } = await send(`${apiBase}/duplicate?locale=${encodeURIComponent(locale)}`, "POST", {});
    if (!ok) return;
    toast.success("Đã nhân bản.");
    if (doc?.id !== undefined) router.push(`${base}/${doc.id}?locale=${locale}`);
    else router.refresh();
  };

  const moveToTrash = async () => {
    const { ok } = await send(apiBase, "PATCH", { deletedAt: new Date().toISOString() });
    closeModal(modalSlug);
    if (!ok) return;
    toast.success("Đã chuyển vào Thùng rác.");
    router.refresh();
  };

  return (
    <span className="tami-row-actions">
      {siteHref && (
        <a className="tami-row-action" href={siteHref} target="_blank" rel="noopener noreferrer" aria-label={`${LABELS.site} (mở tab mới)`} title={LABELS.site}>
          <Icon name="site" />
        </a>
      )}
      {visible.edit && (
        <Link className="tami-row-action" href={`${base}/${encodeURIComponent(String(row.id))}`} prefetch={false} aria-label={LABELS.edit} title={LABELS.edit}>
          <Icon name="edit" />
        </Link>
      )}
      {visible.duplicate && (
        <button type="button" className="tami-row-action" onClick={duplicate} disabled={busy} aria-label={LABELS.duplicate} title={LABELS.duplicate}>
          <Icon name="duplicate" />
        </button>
      )}
      {visible.trash && (
        <>
          <button type="button" className="tami-row-action tami-row-action--danger" onClick={() => openModal(modalSlug)} disabled={busy} aria-label={LABELS.trash} title={LABELS.trash}>
            <Icon name="trash" />
          </button>
          <ConfirmationModal
            modalSlug={modalSlug}
            heading="Chuyển vào Thùng rác"
            body={`Chuyển "${rowTitle(row)}" vào Thùng rác? Có thể khôi phục lại từ Thùng rác.`}
            confirmLabel="Chuyển vào Thùng rác"
            confirmingLabel="Đang chuyển…"
            cancelLabel="Huỷ"
            onConfirm={moveToTrash}
          />
        </>
      )}
    </span>
  );
}
