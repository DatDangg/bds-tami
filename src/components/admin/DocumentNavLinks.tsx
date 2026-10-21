"use client";

import { Link, useConfig, useDocumentInfo, useEditDepth, useLocale } from "@payloadcms/ui";

import { publicDocUrl } from "../../lib/admin/public-doc-url";

const BACK_LABEL = "Quay lại danh sách";
const SITE_LABEL = "Xem trên website";

const ICON_PROPS = { "aria-hidden": true, focusable: false, width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/**
 * Slot `beforeDocumentControls` của mọi collection (BL-051 A7), nằm cạnh nút Lưu trong thanh dính của màn sửa:
 * - "Quay lại danh sách": link rõ về `/admin/collections/<slug>` (breadcrumb Payload trôi mất khi cuộn).
 * - "Xem trên website": chỉ khi doc ĐÃ LƯU và đang công khai (xem `publicDocUrl`), mở tab mới, theo ngôn ngữ đang sửa.
 * Không hiện trong drawer sửa nhanh (`useEditDepth() > 1`): ở đó Payload đã có nút đóng và không nên rời trang hiện tại.
 */
export function DocumentNavLinks({ siteUrl }: { siteUrl: string }) {
  const { collectionSlug, id, savedDocumentData } = useDocumentInfo();
  const { config } = useConfig();
  const { code: locale } = useLocale();
  const editDepth = useEditDepth();
  if (!collectionSlug || editDepth > 1) return null;

  const siteHref = id ? publicDocUrl({ collectionSlug, savedDoc: savedDocumentData, locale, siteUrl }) : null;
  return (
    <>
      <Link className="tami-doc-nav tami-doc-nav--back" href={`${config.routes.admin}/collections/${collectionSlug}`} prefetch={false}>
        <svg {...ICON_PROPS}>
          <path d="M13 8H3M7.5 3.5 3 8l4.5 4.5" />
        </svg>
        <span className="tami-doc-nav__text">{BACK_LABEL}</span>
      </Link>
      {siteHref && (
        <a className="tami-doc-nav tami-doc-nav--site" href={siteHref} target="_blank" rel="noopener noreferrer" aria-label={`${SITE_LABEL} (mở tab mới)`}>
          <svg {...ICON_PROPS}>
            <path d="M9 2.5h4.5V7M13.5 2.5 7 9M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" />
          </svg>
          <span className="tami-doc-nav__text">{SITE_LABEL}</span>
        </a>
      )}
    </>
  );
}
