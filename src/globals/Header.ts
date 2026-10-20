import type { Field, GlobalConfig } from "payload";

import { hideFromNonAdmin, isAdmin } from "../access";
import { translationGroup } from "../fields/translation";
import { navLinkField } from "../fields/nav-link";
import { createRevalidateGlobal, type RevalidateTags } from "../hooks/revalidate-global";
import { detectManualEnglishGlobal } from "../hooks/translation/detect-manual-en";
import { enqueueTranslation } from "../hooks/translation/enqueue-translation";
import { ADMIN_GLOBAL_LABELS } from "../lib/admin/collection-labels";
import { textRowLabel } from "../lib/admin/row-label";

const labelField: Field = { name: "label", type: "text", label: "Tên mục", localized: true, required: true };
const menuRowLabel = (fallback: string) => ({ components: { RowLabel: textRowLabel({ field: "label", fallback }) } });

/** Menu chính + nút CTA (ERD §4.15). Link là khoá trang hoặc URL, nên mỗi ngôn ngữ tự ra đúng đường dẫn (`resolveNavLink`). Menu 2 cấp. */
export function createHeader(revalidate?: RevalidateTags): GlobalConfig {
  return {
    slug: "header",
    label: ADMIN_GLOBAL_LABELS.header,
    admin: { hidden: hideFromNonAdmin, description: "Menu chính (2 cấp) và nút nổi bật ở đầu trang." },
    access: { read: () => true, update: isAdmin },
    hooks: { beforeChange: [detectManualEnglishGlobal], afterChange: [createRevalidateGlobal("header", revalidate), enqueueTranslation.globalAfterChange] },
    fields: [
      {
        name: "navItems",
        type: "array",
        label: "Mục menu",
        labels: { singular: "Mục menu", plural: "Mục menu" },
        admin: menuRowLabel("Mục menu"),
        fields: [
          labelField,
          navLinkField("link", { required: true }),
          {
            name: "children",
            type: "array",
            label: "Menu con",
            labels: { singular: "Mục con", plural: "Mục con" },
            admin: menuRowLabel("Mục con"),
            fields: [labelField, navLinkField("link", { required: true })],
          },
        ],
      },
      {
        name: "ctaButton",
        type: "group",
        label: "Nút nổi bật (vd Nhận tư vấn)",
        fields: [{ name: "label", type: "text", label: "Chữ trên nút", localized: true }, navLinkField("link")],
      },
      translationGroup(),
    ],
  };
}

export const Header = createHeader();
