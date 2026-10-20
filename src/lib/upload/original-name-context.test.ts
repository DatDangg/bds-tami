import type { PayloadRequest } from "payload";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { ORIGINAL_UPLOAD_NAME_KEY } from "./alt-from-filename";
import { createUploadGuard, MEDIA_POLICY } from "./validate-file";

describe("createUploadGuard giữ tên gốc cho hook alt (BL-042)", () => {
  it("ghi tên gốc vào req.context rồi mới đổi file sang UUID", async () => {
    const data = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#fff" } }).jpeg().toBuffer();
    const req = { context: {}, file: { name: "Phoi canh du an.jpg", data, mimetype: "image/png", size: data.length } } as unknown as PayloadRequest;
    await createUploadGuard(MEDIA_POLICY)({ args: { req }, operation: "create" } as never);
    expect(req.context[ORIGINAL_UPLOAD_NAME_KEY]).toBe("Phoi canh du an.jpg");
    expect(req.file?.name).toMatch(/^[0-9a-f-]{36}\.jpg$/);
    expect(req.file?.mimetype).toBe("image/jpeg");
  });
});
