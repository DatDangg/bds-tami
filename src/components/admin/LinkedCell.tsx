"use client";

import { Link, useConfig, useListDrawerContext } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";
import type { ReactNode } from "react";

type LinkedCellProps = {
  cell: DefaultCellComponentProps;
  /** Ép cell này thành link của hàng dù Payload không đánh dấu cột link (cột tiêu đề khi cột đầu là ảnh đại diện). */
  forceLink?: boolean;
  children: ReactNode;
};

/**
 * Cell tuỳ biến của Payload KHÔNG đi qua `RenderDefaultCell` (renderCell.js) nên phải tự làm phần nó làm:
 * cột link (`props.link`) ngoài drawer là `<Link>` sửa bản ghi; TRONG ListDrawer (picker relationship/upload/Lexical) là nút gọi
 * `onSelect` của drawer (RenderDefaultCell/index.js) — dùng `<Link>` ở đó sẽ rời trang đang soạn và không chọn được bản ghi.
 */
export function LinkedCell({ cell, forceLink = false, children }: LinkedCellProps) {
  const { drawerSlug, onSelect } = useListDrawerContext();
  const { config } = useConfig();
  const linked = cell.link === true || forceLink;
  if (!linked) return <span>{children}</span>;

  const { collectionSlug, rowData } = cell;
  if (drawerSlug) {
    return (
      <button type="button" className="default-cell__first-cell" onClick={() => onSelect?.({ collectionSlug, doc: rowData, docID: rowData.id })}>
        {children}
      </button>
    );
  }
  const trash = cell.viewType === "trash" ? "/trash" : "";
  const href = cell.linkURL || `${config.routes.admin}/collections/${collectionSlug}${trash}/${encodeURIComponent(rowData.id)}`;
  return (
    <Link href={href} prefetch={false}>
      {children}
    </Link>
  );
}
