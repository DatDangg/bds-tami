import type { DocumentViewServerProps, PayloadRequest, SanitizedCollectionConfig, SelectField } from "payload";
import { Gutter, SetDocumentStepNav } from "@payloadcms/ui";
import Link from "next/link";
import { formatAdminURL } from "payload/shared";

import { countChangedFields, formatVersionTime, statusLabelFromOptions } from "../../lib/admin/version-history";
import { relativeTimeVi } from "./dashboard/dashboard-format";
import { StatusBadge } from "./StatusBadge";

/** Payload giữ tối đa `maxPerDoc` (20) bản mỗi bài; lấy dư để không bao giờ phải phân trang. */
const VERSION_FETCH_LIMIT = 100;

type VersionRow = { id: string | number; updatedAt: string; version: Record<string, unknown> };

type VersionRowProps = {
  row: VersionRow;
  previous: VersionRow | undefined;
  isCurrent: boolean;
  href: string;
  statusOptions: SelectField["options"] | undefined;
  now: Date;
};

/** Cả dòng bấm được: link ở ô thời điểm phủ `::after` lên `li` (xem `_version-history.scss`). */
function VersionRowItem({ row, previous, isCurrent, href, statusOptions, now }: VersionRowProps) {
  const status = typeof row.version.status === "string" ? row.version.status : null;
  const changed = previous ? countChangedFields(row.version, previous.version) : null;
  return (
    <li className="version-history__row">
      <Link className="version-history__time" href={href} prefetch={false} title={`Mã phiên bản: ${row.id}`}>
        {formatVersionTime(row.updatedAt)}
        <span className="version-history__ago">{relativeTimeVi(row.updatedAt, now)}</span>
      </Link>
      <span className="version-history__status">{status ? <StatusBadge value={status} label={statusLabelFromOptions(statusOptions, status)} /> : "—"}</span>
      <span className="version-history__changes">{changed === null ? "Bản cũ nhất" : changed === 0 ? "Không đổi trường nào" : `${changed} trường đã đổi`}</span>
      <span className="version-history__current">{isCurrent && <StatusBadge value="current" label="Phiên bản hiện tại" tone="accent" />}</span>
    </li>
  );
}

/**
 * Mới nhất trước. `locale: "all"` để trường localized thành `{ vi, en }`: job dịch chỉ ghi EN nên nếu chỉ lấy ngôn ngữ đang xem,
 * bản do job dịch sẽ bị báo "không đổi trường nào". Trường không localized (vd `status`) vẫn là giá trị thường.
 */
async function loadVersionRows(req: PayloadRequest, collection: SanitizedCollectionConfig, docID: string | number, isTrashed: boolean): Promise<VersionRow[]> {
  const result = await req.payload.findVersions({
    collection: collection.slug,
    where: { parent: { equals: docID } },
    sort: "-updatedAt",
    limit: VERSION_FETCH_LIMIT,
    depth: 0,
    locale: "all",
    trash: isTrashed,
    overrideAccess: false,
    user: req.user,
    req,
  });
  return result.docs as unknown as VersionRow[];
}

/**
 * Màn "Lịch sử chỉnh sửa" của collection nội dung (BL-058): thay bảng mặc định "Ngày cập nhật + Mã phiên bản" bằng danh sách mới nhất trước
 * (giờ Việt Nam, trạng thái bài lúc đó, số trường đã đổi so với bản liền trước, nhãn bản hiện tại). Bấm dòng vẫn vào màn so sánh của Payload.
 * Quyền đọc không đổi: view chỉ được Payload render khi `readVersions` cho phép, và `findVersions` chạy với `overrideAccess: false`.
 */
export async function VersionHistoryView(props: DocumentViewServerProps) {
  const { collectionConfig, docID, req } = props.initPageResult;
  if (!collectionConfig || docID === undefined) return null;
  const isTrashed = props.routeSegments[2] === "trash";
  const rows = await loadVersionRows(req, collectionConfig, docID, isTrashed);
  // flattenedFields: `status` có thể nằm trong khối bố cục không tên (tab/row/collapsible), không chỉ ở cấp ngoài cùng.
  const statusField = collectionConfig.flattenedFields.find((field): field is SelectField => field.type === "select" && field.name === "status");
  const pluralLabel = typeof collectionConfig.labels.plural === "function" ? collectionConfig.labels.plural({ i18n: req.i18n, t: req.t }) : collectionConfig.labels.plural;
  const now = new Date();
  const trashSegment = isTrashed ? "/trash" : "";
  const adminRoute = req.payload.config.routes.admin;

  return (
    <>
      <SetDocumentStepNav collectionSlug={collectionConfig.slug} id={docID} isTrashed={isTrashed} pluralLabel={pluralLabel} useAsTitle={collectionConfig.admin?.useAsTitle} view={req.t("version:versions")} />
      <main className="version-history">
        <Gutter className="version-history__wrap">
          {rows.length === 0 ? (
            <p className="version-history__empty">{req.t("version:noFurtherVersionsFound")}</p>
          ) : (
            <ul className="version-history__list">
              <li className="version-history__head" aria-hidden="true">
                <span>Thời điểm</span>
                <span>Trạng thái bài</span>
                <span>Thay đổi so với bản trước</span>
                <span />
              </li>
              {rows.map((row, index) => (
                <VersionRowItem
                  key={row.id}
                  row={row}
                  previous={rows[index + 1]}
                  isCurrent={index === 0}
                  href={formatAdminURL({ adminRoute, path: `/collections/${collectionConfig.slug}${trashSegment}/${docID}/versions/${row.id}` })}
                  statusOptions={statusField?.options}
                  now={now}
                />
              ))}
            </ul>
          )}
        </Gutter>
      </main>
    </>
  );
}
