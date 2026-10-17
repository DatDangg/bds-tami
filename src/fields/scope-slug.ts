import type { FieldHook, TextField } from "payload";

import { denyAll } from "../access";

/**
 * Khoá `${scope}/${slug}` của locale đang ghi; `null` khi chưa có slug (bản `en` chưa dịch) để nhiều bản
 * trống không đụng nhau. `scope` là enum [a-z_] và slug là [a-z0-9-] nên không có dấu `/` trong hai phần.
 */
function makeScopeSlugHook(scopeField: string): FieldHook {
  return ({ siblingData, originalDoc }) => {
    const scope = siblingData[scopeField] ?? originalDoc?.[scopeField];
    const slug = siblingData.slug ?? originalDoc?.slug;
    return typeof scope === "string" && typeof slug === "string" && slug !== "" ? `${scope}/${slug}` : null;
  };
}

/**
 * Trường phụ để DB giữ ràng buộc UNIQUE (`_locale`, `scope`, `slug`) (ERD §4.3). Postgres không tạo được
 * UNIQUE xuyên hai bảng (`scope` ở bảng chính, `slug` ở `<collection>_locales`), nên giữ khoá ghép này ở
 * `_locales` và để Payload sinh UNIQUE (`scope_slug`, `_locale`) cho trường `unique` + `localized`: cùng
 * ngữ nghĩa, không cần trigger, an toàn khi hai request ghi cùng lúc. Chỉ hook ghi; không hiện ở API/admin.
 */
export function scopeSlugField(scopeField: string): TextField {
  return {
    name: "scopeSlug",
    type: "text",
    localized: true,
    unique: true,
    hidden: true,
    access: { create: denyAll, update: denyAll },
    hooks: { beforeChange: [makeScopeSlugHook(scopeField)] },
    admin: { hidden: true, readOnly: true },
  };
}
