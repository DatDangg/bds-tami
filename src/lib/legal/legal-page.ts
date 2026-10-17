import config from "@payload-config";
import { getPayload } from "payload";
import { cache } from "react";

import type { Locale } from "../../i18n/routing";
import type { Page } from "../../payload-types";
import { type LegalPageKind } from "../content/content-paths";
import { findPublicOne } from "../content/public-queries";

/**
 * Trang pháp lý công khai theo `kind` và ngôn ngữ đang xem; `null` khi chưa xuất bản / đã ẩn / xoá mềm, hoặc là `en` mà admin chưa
 * bật `hasEnglish` (bản AI dịch chưa duyệt, BR-08). Một lần đọc cho cả `generateMetadata` lẫn trang (React `cache` theo request).
 * Không populate gì thêm nên `depth: 0`.
 */
export const loadLegalPage = cache(async (locale: Locale, kind: LegalPageKind): Promise<Page | null> => {
  const payload = await getPayload({ config });
  const doc = await findPublicOne<Page>(payload, "pages", locale, { kind: { equals: kind } }, { depth: 0 });
  return doc && doc.title ? doc : null;
});
