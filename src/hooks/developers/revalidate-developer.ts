import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { locales } from "../../i18n/routing";
import { internalPath } from "../../lib/content/content-paths";
import { revalidateWithNext, type RevalidatePaths } from "../revalidate-content";

/**
 * Hook `afterChange`/`afterDelete` của `developers` (collection `route: null` nên không có hook làm mới chung): chủ đầu tư chỉ xuất hiện ở
 * khối Đối tác của trang chủ (FR-PUB-17, BL-107), nên chỉ làm mới trang chủ vi + en, và chỉ khi bản ghi đang hoặc vừa là đối tác
 * (đổi tên/logo/thứ tự, bật/tắt `showAsPartner`, xoá mềm/khôi phục đều đi qua `afterChange`).
 */
export function createRevalidateDeveloper(revalidate: RevalidatePaths = revalidateWithNext) {
  const homePaths = locales.map((locale) => internalPath("/", locale));

  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
    if (doc.showAsPartner === true || previousDoc?.showAsPartner === true) await revalidate(homePaths, req);
    return doc;
  };

  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    if (doc.showAsPartner === true) await revalidate(homePaths, req);
    return doc;
  };

  return { afterChange, afterDelete };
}
