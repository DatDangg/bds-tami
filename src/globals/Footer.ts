import type { GlobalConfig } from "payload";

import { hideFromNonAdmin, isAdmin } from "../access";
import { translationGroup } from "../fields/translation";
import { navLinkField } from "../fields/nav-link";
import { createRevalidateGlobal, type RevalidateTags } from "../hooks/revalidate-global";
import { detectManualEnglishGlobal } from "../hooks/translation/detect-manual-en";
import { enqueueTranslation } from "../hooks/translation/enqueue-translation";
import { ADMIN_GLOBAL_LABELS } from "../lib/admin/collection-labels";
import { textRowLabel } from "../lib/admin/row-label";

/** Chân trang (ERD §4.15): cột liên kết, khối liên hệ, bản quyền. Chữ localized; link là khoá trang hoặc URL. */
export function createFooter(revalidate?: RevalidateTags): GlobalConfig {
  return {
    slug: "footer",
    label: ADMIN_GLOBAL_LABELS.footer,
    admin: { hidden: hideFromNonAdmin, description: "Các cột liên kết, khối liên hệ và dòng bản quyền ở chân trang." },
    access: { read: () => true, update: isAdmin },
    hooks: { beforeChange: [detectManualEnglishGlobal], afterChange: [createRevalidateGlobal("footer", revalidate), enqueueTranslation.globalAfterChange] },
    fields: [
      {
        name: "columns",
        type: "array",
        label: "Cột liên kết",
        labels: { singular: "Cột", plural: "Cột" },
        admin: { components: { RowLabel: textRowLabel({ field: "title", fallback: "Cột" }) } },
        fields: [
          { name: "title", type: "text", label: "Tiêu đề cột", localized: true, required: true },
          {
            name: "links",
            type: "array",
            label: "Liên kết trong cột",
            labels: { singular: "Liên kết", plural: "Liên kết" },
            admin: { components: { RowLabel: textRowLabel({ field: "label", fallback: "Liên kết" }) } },
            fields: [{ name: "label", type: "text", label: "Tên liên kết", localized: true, required: true }, navLinkField("link", { required: true })],
          },
        ],
      },
      { name: "contactBlock", type: "textarea", label: "Khối liên hệ", localized: true, admin: { description: "Địa chỉ, giờ làm việc... hiện ở chân trang." } },
      { name: "copyright", type: "text", label: "Dòng bản quyền", localized: true },
      translationGroup(),
    ],
  };
}

export const Footer = createFooter();
