import type { PayloadRequest } from "payload";
import { describe, expect, it } from "vitest";

import { ORIGINAL_UPLOAD_NAME_KEY } from "../../lib/upload/alt-from-filename";
import { fillImageAlt } from "./default-alt";

const run = (data: Record<string, unknown>, context: Record<string, unknown> = { [ORIGINAL_UPLOAD_NAME_KEY]: "phoi-canh-du-an.jpg" }) =>
  fillImageAlt({ data, req: { context } as unknown as PayloadRequest } as never) as Record<string, unknown>;

describe("fillImageAlt", () => {
  it("ảnh trống alt → điền từ tên file gốc", () => {
    expect(run({ mimeType: "image/jpeg", alt: "" }).alt).toBe("phoi canh du an");
    expect(run({ mimeType: "image/webp" }).alt).toBe("phoi canh du an");
    expect(run({ mimeType: "image/png", alt: "   " }).alt).toBe("phoi canh du an");
  });
  it("ảnh đã có alt → giữ nguyên", () => {
    expect(run({ mimeType: "image/jpeg", alt: "Mặt tiền toà nhà" }).alt).toBe("Mặt tiền toà nhà");
  });
  it("PDF / video không điền", () => {
    expect(run({ mimeType: "application/pdf" }).alt).toBeUndefined();
    expect(run({ mimeType: "video/mp4", alt: "" }).alt).toBe("");
  });
  it("tên gốc vô nghĩa → Hình ảnh", () => {
    expect(run({ mimeType: "image/jpeg" }, { [ORIGINAL_UPLOAD_NAME_KEY]: "20260101.jpg" }).alt).toBe("Hình ảnh");
  });
  it("không có file vừa tải (sửa metadata) → để validator báo lỗi", () => {
    expect(run({ mimeType: "image/jpeg", alt: "" }, {}).alt).toBe("");
  });
});
