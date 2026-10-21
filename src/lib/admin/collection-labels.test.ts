import { describe, expect, it } from "vitest";

import { ADMIN_COLLECTION_LABELS, ADMIN_GLOBAL_LABELS, collectionDisplayName } from "./collection-labels";

describe("nhãn collection/global admin (BL-040 T02)", () => {
  it("khoá các nhãn đã rà ngữ nghĩa (tránh thuật ngữ khó hiểu)", () => {
    expect(ADMIN_COLLECTION_LABELS["private-files"]).toEqual({ singular: "Tệp CV", plural: "Tệp CV ứng viên" });
    expect(ADMIN_COLLECTION_LABELS.leads).toEqual({ singular: "Lead", plural: "Lead" });
    expect(ADMIN_COLLECTION_LABELS["lead-activities"]).toEqual({ singular: "Hoạt động chăm sóc", plural: "Lịch sử chăm sóc" });
    expect(ADMIN_COLLECTION_LABELS["click-stats-daily"].plural).toBe("Thống kê liên hệ theo ngày");
    expect(ADMIN_COLLECTION_LABELS["translation-usage"].plural).toBe("Chi phí dịch tự động");
    expect(ADMIN_COLLECTION_LABELS.redirects.plural).toBe("Chuyển hướng đường dẫn");
    expect(ADMIN_COLLECTION_LABELS.media).toEqual({ singular: "Ảnh, tệp", plural: "Thư viện ảnh & tệp" });
  });

  it("tên global dùng ở nơi khác (thông báo) vẫn là 'Cấu hình chung'", () => {
    expect(ADMIN_GLOBAL_LABELS["site-settings"]).toBe("Cấu hình chung");
  });
});

describe("collectionDisplayName (BL-043)", () => {
  it("slug biết → nhãn số ít", () => {
    expect(collectionDisplayName("rentals")).toBe("Tin cho thuê");
    expect(collectionDisplayName("job-applications")).toBe("Hồ sơ ứng tuyển");
  });

  it("slug global → nhãn global (nhật ký dịch lại global)", () => {
    expect(collectionDisplayName("site-settings")).toBe("Cấu hình chung");
    expect(collectionDisplayName("homepage")).toBe("Trang chủ");
    expect(collectionDisplayName("header")).toBe("Menu đầu trang");
    expect(collectionDisplayName("footer")).toBe("Chân trang");
  });

  it("slug lạ giữ nguyên, kể cả tên thuộc prototype", () => {
    expect(collectionDisplayName("old-collection")).toBe("old-collection");
    expect(collectionDisplayName("constructor")).toBe("constructor");
  });

  it.each([null, undefined, "", 5, {}])("rỗng/không phải chuỗi (%s) → —", (value) => {
    expect(collectionDisplayName(value)).toBe("—");
  });
});
