import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Trang danh sách công khai là `force-dynamic` và gọi `notFound()` khi vượt số trang. Một `loading.tsx` (Suspense) phía trước làm Next
 * stream khung chờ trước, HTTP status đã gửi là 200 nên `notFound()` thành soft-404 (đã đo ở layer-9-task-08, round 1). Cấm đặt `loading.tsx`
 * ở các route này và ở MỌI thư mục tổ tiên của chúng lên tới `app/` (loading.tsx cấp cha cũng bọc trang con). Phản hồi chờ phía client dùng
 * `PendingRegion`/`PendingLink` (`components/layout/PendingRegion.tsx`) thay vì skeleton cấp route.
 */
const LIST_PAGES = [
  "cho-thue/page.tsx",
  "cho-thue/danh-muc/[category]/page.tsx",
  "du-an/page.tsx",
  "du-an/danh-muc/[category]/page.tsx",
  "tin-tuc/page.tsx",
  "tin-tuc/danh-muc/[category]/page.tsx",
  "tin-bds/page.tsx",
  "tin-bds/danh-muc/[category]/page.tsx",
  "tuyen-dung/page.tsx",
];

const LOCALE_DIR = __dirname;
const APP_DIR = path.resolve(LOCALE_DIR, "../../..", "app");

/** Thư mục chứa `pagePath` rồi từng thư mục cha lên tới `src/app` (gồm cả hai đầu). */
function directoriesUpToApp(pagePath: string): string[] {
  const directories: string[] = [];
  for (let dir = path.dirname(path.join(LOCALE_DIR, pagePath)); dir.startsWith(APP_DIR); dir = path.dirname(dir)) {
    directories.push(dir);
  }
  return directories;
}

describe("không có loading.tsx trước trang danh sách force-dynamic", () => {
  it("đường đi ngược tìm đúng src/app", () => {
    expect(path.basename(APP_DIR)).toBe("app");
    expect(statSync(APP_DIR).isDirectory()).toBe(true);
    expect(readdirSync(LOCALE_DIR)).toContain("du-an");
  });

  it.each(LIST_PAGES)("%s: có page.tsx và không loading.tsx ở nó hay thư mục tổ tiên", (pagePath) => {
    expect(existsSync(path.join(LOCALE_DIR, pagePath))).toBe(true);
    const directories = directoriesUpToApp(pagePath);
    expect(directories).toContain(APP_DIR);
    for (const directory of directories) {
      expect(existsSync(path.join(directory, "loading.tsx")), `${directory}/loading.tsx`).toBe(false);
    }
  });
});
