import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Trang danh sách công khai là `force-dynamic` và gọi `notFound()` khi vượt số trang. Một `loading.tsx` (Suspense) phía trước làm Next
 * stream khung chờ trước, HTTP status đã gửi là 200 nên `notFound()` thành soft-404 (đã đo ở layer-9-task-08, round 1). Cấm đặt `loading.tsx`
 * ở các route này; phản hồi chờ phía client dùng trạng thái pending (`PendingRegion`) thay vì skeleton cấp route.
 */
const LIST_ROUTES = [
  "cho-thue",
  "cho-thue/danh-muc",
  "du-an",
  "tin-tuc",
  "tin-tuc/danh-muc",
  "tin-bds",
  "tin-bds/danh-muc",
  "tuyen-dung",
];

describe("không có loading.tsx trước trang danh sách force-dynamic", () => {
  it.each(LIST_ROUTES)("%s", (route) => {
    expect(existsSync(path.join(__dirname, route, "loading.tsx"))).toBe(false);
  });
});
