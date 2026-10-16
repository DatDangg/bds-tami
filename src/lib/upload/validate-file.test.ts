import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { inspectUpload, MEDIA_POLICY, PRIVATE_FILE_POLICY } from "./validate-file";

const MB = 1024 * 1024;

const jpeg = () => sharp({ create: { width: 8, height: 8, channels: 3, background: "#fff" } }).jpeg().toBuffer();
const pdfBytes = () => Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\nxref\n0 1\n0000000000 65535 f\ntrailer<<>>\nstartxref\n0\n%%EOF\n");

async function statusOf(promise: Promise<unknown>): Promise<number | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    return (error as { status?: number }).status;
  }
}

describe("inspectUpload", () => {
  it("nhận ảnh JPG thật và trả đuôi/MIME theo nội dung", async () => {
    expect(await inspectUpload(await jpeg(), MEDIA_POLICY)).toEqual({ mime: "image/jpeg", extension: "jpg" });
  });

  it("nhận WebP, PNG, AVIF", async () => {
    const base = sharp({ create: { width: 8, height: 8, channels: 3, background: "#fff" } });
    expect((await inspectUpload(await base.clone().webp().toBuffer(), MEDIA_POLICY)).mime).toBe("image/webp");
    expect((await inspectUpload(await base.clone().png().toBuffer(), MEDIA_POLICY)).mime).toBe("image/png");
    expect((await inspectUpload(await base.clone().avif().toBuffer(), MEDIA_POLICY)).mime).toBe("image/avif");
  });

  it("HTML / SVG / văn bản: 415", async () => {
    expect(await statusOf(inspectUpload(Buffer.from("<html><script>alert(1)</script></html>"), MEDIA_POLICY))).toBe(415);
    expect(await statusOf(inspectUpload(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), MEDIA_POLICY))).toBe(415);
    expect(await statusOf(inspectUpload(Buffer.from("plain"), MEDIA_POLICY))).toBe(415);
  });

  it("file rỗng: 400", async () => {
    expect(await statusOf(inspectUpload(new Uint8Array(), MEDIA_POLICY))).toBe(400);
  });

  it("ảnh quá 10MB: 413, nhưng PDF cùng cỡ vẫn được (trần 20MB)", async () => {
    const bigJpeg = Buffer.concat([await jpeg(), Buffer.alloc(11 * MB)]);
    expect(await statusOf(inspectUpload(bigJpeg, MEDIA_POLICY))).toBe(413);
    const bigPdf = Buffer.concat([pdfBytes(), Buffer.alloc(11 * MB)]);
    expect((await inspectUpload(bigPdf, MEDIA_POLICY)).extension).toBe("pdf");
    expect(await statusOf(inspectUpload(Buffer.concat([pdfBytes(), Buffer.alloc(21 * MB)]), MEDIA_POLICY))).toBe(413);
  });

  it("private-files: PDF nhận, ảnh từ chối, trần 5MB", async () => {
    expect((await inspectUpload(pdfBytes(), PRIVATE_FILE_POLICY)).mime).toBe("application/pdf");
    expect(await statusOf(inspectUpload(await jpeg(), PRIVATE_FILE_POLICY))).toBe(415);
    expect(await statusOf(inspectUpload(Buffer.concat([pdfBytes(), Buffer.alloc(6 * MB)]), PRIVATE_FILE_POLICY))).toBe(413);
  });

  it("private-files: .doc (OLE2) lưu MIME msword", async () => {
    const ole2 = Buffer.concat([Buffer.from("d0cf11e0a1b11ae1", "hex"), Buffer.alloc(600)]);
    expect(await inspectUpload(ole2, PRIVATE_FILE_POLICY)).toEqual({ mime: "application/msword", extension: "doc" });
  });
});
