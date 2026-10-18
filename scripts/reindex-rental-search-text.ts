// Dựng lại `rentals.searchText` của MỌI tin: `pnpm reindex:rentals-search` = `payload run scripts/reindex-rental-search-text.ts` (idempotent).
// Chạy tay sau khi đổi tên tỉnh, sửa hàng loạt tên dự án/phường ngoài admin (import, SQL), hoặc khi nghi `searchText` lệch.
// Đổi tên dự án / tên cũ của phường trong admin đã tự làm mới tin liên quan (hook), không cần chạy lệnh này.
import { getPayload } from "payload";

import config from "../src/payload.config";
import { reindexRentalSearchText } from "../src/lib/search/reindex-rental-search-text";

const payload = await getPayload({ config });
const { rentals, rows } = await reindexRentalSearchText(payload, "all");
payload.logger.info(`Reindex searchText: duyệt ${rentals} tin, ghi lại ${rows} bản ngôn ngữ.`);
await payload.destroy();
