import { describe, expect, it } from "vitest";

import { buildAttachmentDisposition } from "./content-disposition";

describe("buildAttachmentDisposition", () => {
  it("tên UUID thường: ASCII và filename* giống nhau", () => {
    const value = buildAttachmentDisposition("0a1b2c3d-1111-2222-3333-444455556666.pdf");
    expect(value).toBe(
      'attachment; filename="0a1b2c3d-1111-2222-3333-444455556666.pdf"; filename*=UTF-8\'\'0a1b2c3d-1111-2222-3333-444455556666.pdf',
    );
  });

  it("tên cố tình chèn header (CR/LF, dấu nháy, ;) không phá được header", () => {
    const value = buildAttachmentDisposition('a".pdf"\r\nSet-Cookie: x=1; b\u0000.pdf');
    expect(value).not.toMatch(/[\r\n\u0000]/);
    expect(value.startsWith('attachment; filename="')).toBe(true);
    const ascii = /filename="([^"]*)"/.exec(value)![1]!;
    expect(ascii).toMatch(/^[A-Za-z0-9._-]+$/);
    expect(value).not.toContain('"\r\n');
    expect(value).toMatch(/filename\*=UTF-8''[A-Za-z0-9%._~!-]+$/);
  });

  it("tên Unicode: ASCII dự phòng + filename* UTF-8", () => {
    const value = buildAttachmentDisposition("Hồ sơ (Ứng viên).pdf");
    expect(/filename="([^"]*)"/.exec(value)![1]).toMatch(/^[A-Za-z0-9._-]+\.pdf$/);
    expect(value).toContain("filename*=UTF-8''H%E1%BB%93%20s%C6%A1%20%28%E1%BB%A8ng%20vi%C3%AAn%29.pdf");
  });

  it("tên rỗng/thiếu: dùng tên mặc định", () => {
    expect(buildAttachmentDisposition(undefined)).toBe('attachment; filename="download"');
    expect(buildAttachmentDisposition("\r\n")).toBe('attachment; filename="download"');
  });
});
