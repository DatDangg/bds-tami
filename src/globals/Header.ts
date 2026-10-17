import type { Field, GlobalConfig } from "payload";

import { hideFromNonAdmin, isAdmin } from "../access";
import { translationGroup } from "../fields/translation";
import { navLinkField } from "../fields/nav-link";
import { createRevalidateGlobal, type RevalidateTags } from "../hooks/revalidate-global";

const labelField: Field = { name: "label", type: "text", localized: true, required: true };

/** Menu chính + nút CTA (ERD §4.15). Link là khoá trang hoặc URL, nên mỗi ngôn ngữ tự ra đúng đường dẫn (`resolveNavLink`). Menu 2 cấp. */
export function createHeader(revalidate?: RevalidateTags): GlobalConfig {
  return {
    slug: "header",
    label: "Menu đầu trang",
    admin: { hidden: hideFromNonAdmin },
    access: { read: () => true, update: isAdmin },
    hooks: { afterChange: [createRevalidateGlobal("header", revalidate)] },
    fields: [
      {
        name: "navItems",
        type: "array",
        fields: [
          labelField,
          navLinkField("link", { required: true }),
          { name: "children", type: "array", fields: [labelField, navLinkField("link", { required: true })] },
        ],
      },
      {
        name: "ctaButton",
        type: "group",
        fields: [{ name: "label", type: "text", localized: true }, navLinkField("link")],
      },
      translationGroup(),
    ],
  };
}

export const Header = createHeader();
