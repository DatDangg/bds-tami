import type { CollectionConfig } from "payload";

import { denyAll, isAdmin } from "../access";
import { adminDate } from "../fields/admin-date";
import { markRequired, requiredByLocale } from "../fields/required-by-locale";
import { titleField } from "../fields/title";
import { createRevalidatePage } from "../hooks/pages/revalidate-page";
import { approveEnglish, guardEnglishApproval, revokeEnglishOnManualEdit } from "../hooks/pages/approve-english";
import { lockPageKind } from "../hooks/pages/lock-kind";
import { syncPrivacyPolicyVersion } from "../hooks/pages/sync-privacy-version";
import type { RevalidatePaths } from "../hooks/revalidate-content";
import { collectionLabels } from "../lib/admin/collection-labels";
import { LEGAL_PAGE_ROUTES } from "../lib/content/content-paths";
import { withContentDefaults } from "./_shared/content-defaults";

const KIND_LABELS = { privacy: "Chính sách bảo mật", terms: "Điều khoản sử dụng" } as const;

/**
 * Trang pháp lý (ERD §4.9b, FR-PUB-14): chỉ hai loại, route CỐ ĐỊNH theo `kind` (không slug). Khách đọc bản đã xuất bản; CHỈ admin
 * tạo/sửa/xoá và chỉ admin bật `hasEnglish` sau khi duyệt bản AI dịch (PERMISSION §3.1, §4; BR-08). `kind` duy nhất (DB UNIQUE) và
 * không đổi sau khi tạo. Không `slug`/`author`/`isFeatured`/`publishedAt`: hook làm mới cache riêng theo `kind`.
 * `revalidate` chỉ để test ghi đè.
 */
export function createPages(revalidate?: RevalidatePaths): CollectionConfig {
  const revalidatePage = createRevalidatePage(revalidate);
  return withContentDefaults(
    {
      slug: "pages",
      labels: collectionLabels("pages"),
      admin: {
        useAsTitle: "title",
        defaultColumns: ["title", "kind", "version", "status"],
        description: "Chính sách bảo mật và Điều khoản sử dụng; bản tiếng Anh phải được admin duyệt trước khi hiển thị.",
      },
      access: { create: isAdmin, update: isAdmin, delete: isAdmin },
      // Hai bản ghi cố định (seed): nhân bản chỉ để đụng `kind` UNIQUE.
      disableDuplicate: true,
      hooks: {
        beforeValidate: [lockPageKind],
        // Sửa tay EN của trang đã duyệt hạ `hasEnglish` TRƯỚC, rồi guard chặn form cũ bật lại (BR-08).
        beforeChange: [revokeEnglishOnManualEdit, guardEnglishApproval],
        afterChange: [revalidatePage.afterChange, syncPrivacyPolicyVersion, approveEnglish],
        afterDelete: [revalidatePage.afterDelete],
      },
      fields: [
        {
          name: "kind",
          type: "select",
          label: "Loại trang",
          required: true,
          unique: true,
          index: true,
          options: (Object.keys(LEGAL_PAGE_ROUTES) as (keyof typeof LEGAL_PAGE_ROUTES)[]).map((value) => ({
            label: KIND_LABELS[value],
            value,
          })),
          // Chỉ chọn lúc tạo; sửa sau đó bị bỏ qua (`lockPageKind`).
          access: { update: denyAll },
          admin: { position: "sidebar" },
        },
        titleField({ placeholder: "VD: Giới thiệu" }),
        markRequired({ name: "content", type: "richText", label: "Nội dung", localized: true, validate: requiredByLocale("Nội dung không được để trống.") }),
        { name: "version", type: "text", label: "Phiên bản", required: true, admin: { description: "Phiên bản văn bản, vd 1.0. Phiên bản chính sách bảo mật đang xuất bản được lưu kèm mỗi lần khách đồng ý trên form." } },
        { name: "effectiveDate", type: "date", label: "Ngày hiệu lực", required: true, admin: { date: adminDate("dayOnly") } },
      ],
    },
    {
      englishRequiredFields: ["title", "content"],
      route: null,
      omit: ["slug", "author", "isFeatured", "publishedAt"],
      fieldAccess: { hasEnglish: { update: isAdmin } },
      // Trường ảo: nút "Duyệt bản EN" (chỉ admin, chỉ khi bản dịch AI đang chờ duyệt), nằm trong khối bản dịch cột phải cùng công tắc + nút Dịch lại (A11).
      translationActions: [{ name: "approveEnglishAction", type: "ui", label: "Duyệt bản tiếng Anh", admin: { components: { Field: "/components/admin/ApproveEnglishButton#ApproveEnglishButton" } } }],
    },
  );
}

export const Pages = createPages();
