import { describe, expect, it } from "vitest";

import { ADMIN_COLLECTION_LABELS, ADMIN_GLOBAL_LABELS } from "./collection-labels";

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
