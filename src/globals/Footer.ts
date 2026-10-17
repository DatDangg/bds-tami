import type { GlobalConfig } from "payload";

import { hideFromNonAdmin, isAdmin } from "../access";
import { translationGroup } from "../fields/translation";
import { navLinkField } from "../fields/nav-link";
import { createRevalidateGlobal, type RevalidateTags } from "../hooks/revalidate-global";

/** Chân trang (ERD §4.15): cột liên kết, khối liên hệ, bản quyền. Chữ localized; link là khoá trang hoặc URL. */
export function createFooter(revalidate?: RevalidateTags): GlobalConfig {
  return {
    slug: "footer",
    label: "Chân trang",
    admin: { hidden: hideFromNonAdmin },
    access: { read: () => true, update: isAdmin },
    hooks: { afterChange: [createRevalidateGlobal("footer", revalidate)] },
    fields: [
      {
        name: "columns",
        type: "array",
        fields: [
          { name: "title", type: "text", localized: true, required: true },
          {
            name: "links",
            type: "array",
            fields: [{ name: "label", type: "text", localized: true, required: true }, navLinkField("link", { required: true })],
          },
        ],
      },
      { name: "contactBlock", type: "textarea", localized: true },
      { name: "copyright", type: "text", localized: true },
      translationGroup(),
    ],
  };
}

export const Footer = createFooter();
