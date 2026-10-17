import type { CollectionConfig } from "payload";

import { denyAll, isAdmin } from "../access";
import { requiredByLocale } from "../fields/required-by-locale";
import { titleField } from "../fields/title";
import { createRevalidatePage } from "../hooks/pages/revalidate-page";
import { lockPageKind } from "../hooks/pages/lock-kind";
import { syncPrivacyPolicyVersion } from "../hooks/pages/sync-privacy-version";
import type { RevalidatePaths } from "../hooks/revalidate-content";
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
      admin: { useAsTitle: "title", defaultColumns: ["title", "kind", "version", "status"] },
      access: { create: isAdmin, update: isAdmin, delete: isAdmin },
      // Hai bản ghi cố định (seed): nhân bản chỉ để đụng `kind` UNIQUE.
      disableDuplicate: true,
      hooks: {
        beforeValidate: [lockPageKind],
        afterChange: [revalidatePage.afterChange, syncPrivacyPolicyVersion],
        afterDelete: [revalidatePage.afterDelete],
      },
      fields: [
        {
          name: "kind",
          type: "select",
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
        titleField(),
        { name: "content", type: "richText", localized: true, validate: requiredByLocale("Nội dung không được để trống.") },
        { name: "version", type: "text", required: true, admin: { description: "Phiên bản văn bản, vd 1.0. Bản chính sách bảo mật đã xuất bản là consentVersion của form (BR-30)." } },
        { name: "effectiveDate", type: "date", required: true, admin: { date: { pickerAppearance: "dayOnly" } } },
      ],
    },
    {
      englishRequiredFields: ["title", "content"],
      route: null,
      omit: ["slug", "author", "isFeatured", "publishedAt"],
      fieldAccess: { hasEnglish: { update: isAdmin } },
    },
  );
}

export const Pages = createPages();
