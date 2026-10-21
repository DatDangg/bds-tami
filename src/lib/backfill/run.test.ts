import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import type { Payload } from "payload";
import { describe, expect, it, vi } from "vitest";

import { TRANSLATION_JOB_CONTEXT_KEY } from "../../hooks/translation/translation-targets";
import type { Project } from "../../payload-types";
import { projectsBackfill } from "./projects";
import { backfillReportFileName, renderBackfillReport, writeBackfillReport } from "./report";
import { parseBackfillArgs, runBackfill } from "./run";

const overview = (text: string) => ({ root: { type: "root", children: [{ type: "paragraph", children: [{ type: "text", text }] }] } });

/** Payload giả: giữ tin trong bộ nhớ, `update` gộp `data` vào tin (đủ để kiểm dry-run / apply / chạy lại). */
function fakePayload(projects: Partial<Project>[]) {
  const docs = projects.map((p) => ({ ...p })) as Project[];
  const update = vi.fn(async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
    const doc = docs.find((d) => d.id === id);
    if (!doc) throw new Error("not found");
    if (doc.title === "Lỗi ghi") throw new Error("ValidationError: The following field is invalid: gallery\nstack…");
    Object.assign(doc, data);
    return doc;
  });
  const find = vi.fn(async ({ collection }: { collection: string }) => ({
    docs: collection === "categories" ? [{ id: "c1", title: "Căn hộ chung cư" }] : docs.map((d) => structuredClone(d)),
  }));
  return { payload: { find, update } as unknown as Payload, update, docs };
}

const seed = (): Partial<Project>[] => [
  { id: "a", title: "Biệt thự Hồ Tây", status: "published", category: "c1", overview: overview("Gồm 20 căn biệt thự đơn lập 200 – 300 m², gần bệnh viện.") } as unknown as Partial<Project>,
  { id: "b", title: "Đã đủ", status: "draft", productTypes: ["office"], featuredAmenities: ["green_park"], products: [{ type: "Văn phòng", count: 1 }] } as unknown as Partial<Project>,
  { id: "c", title: "Khu đô thị Xanh", status: "published" } as unknown as Partial<Project>,
];

describe("runBackfill", () => {
  it("dry-run (mặc định) KHÔNG gọi update nhưng vẫn lập kế hoạch", async () => {
    const { payload, update } = fakePayload(seed());
    const [result] = await runBackfill(payload, parseBackfillArgs([]));
    expect(update).not.toHaveBeenCalled();
    expect(result?.plans.find((p) => p.id === "a")?.patch).toMatchObject({ productTypes: ["apartment", "villa"], featuredAmenities: ["near_hospital"] });
  });

  it("--apply chỉ ghi ô trống của tin cần điền, locale vi + context job dịch, không gửi status; chạy lại không đổi gì", async () => {
    const { payload, update, docs } = fakePayload(seed());
    await runBackfill(payload, parseBackfillArgs(["--apply"]));
    expect(update).toHaveBeenCalledTimes(1);
    const call = update.mock.calls[0]?.[0] as unknown as Record<string, unknown>;
    expect(call).toMatchObject({ collection: "projects", id: "a", locale: "vi", overrideAccess: true, context: { [TRANSLATION_JOB_CONTEXT_KEY]: true } });
    expect(Object.keys(call.data as object).sort()).toEqual(["featuredAmenities", "productTypes", "products"]);
    expect(call.data).not.toHaveProperty("status");
    expect(docs.find((d) => d.id === "b")).toMatchObject({ productTypes: ["office"], featuredAmenities: ["green_park"] });

    update.mockClear();
    const [again] = await runBackfill(payload, parseBackfillArgs(["--apply"]));
    expect(update).not.toHaveBeenCalled();
    expect(again?.plans.every((p) => Object.keys(p.patch).length === 0)).toBe(true);
  });

  it("lỗi ghi một tin không dừng lượt chạy, ghi lỗi ngắn (dòng đầu) vào kế hoạch", async () => {
    const { payload } = fakePayload([{ id: "x", title: "Lỗi ghi", overview: overview("Căn hộ cao cấp") } as unknown as Partial<Project>, ...seed()]);
    const [result] = await runBackfill(payload, parseBackfillArgs(["--apply"]));
    expect(result?.plans.find((p) => p.id === "x")?.error).toBe("ValidationError: The following field is invalid: gallery");
    expect(result?.plans.find((p) => p.id === "a")?.error).toBeUndefined();
  });
});

describe("parseBackfillArgs", () => {
  it("mặc định dry-run + mọi collection; nhận --apply và --collection", () => {
    expect(parseBackfillArgs([])).toEqual({ apply: false, collections: ["projects"] });
    expect(parseBackfillArgs(["--apply", "--collection", "projects"])).toEqual({ apply: true, collections: ["projects"] });
    expect(parseBackfillArgs(["--collection=projects"])).toEqual({ apply: false, collections: ["projects"] });
  });

  it("từ chối tham số lạ / collection chưa hỗ trợ", () => {
    expect(() => parseBackfillArgs(["--aply"])).toThrow("Tham số không hỗ trợ");
    expect(() => parseBackfillArgs(["--collection", "news"])).toThrow("Collection chưa hỗ trợ: news");
    expect(() => parseBackfillArgs(["--collection"])).toThrow("--collection cần tên collection");
  });
});

describe("renderBackfillReport", () => {
  it("ghi rõ chế độ, tổng quan theo trường, bảng chi tiết và mục cần soát; không chứa id tin", async () => {
    const { payload } = fakePayload(seed());
    const results = await runBackfill(payload, parseBackfillArgs([]));
    const report = renderBackfillReport(results, { apply: false, ranAt: "2026-10-21 10:00 (giờ VN)" });
    expect(report).toContain("**Chạy thử (dry-run) — KHÔNG ghi DB**");
    expect(report).toContain("| Tin quét | 3 |");
    expect(report).toContain("| Sẽ điền (ít nhất 1 ô) | 1 |");
    expect(report).toContain("| Không điền — mọi ô đã có giá trị | 1 |");
    expect(report).toContain("| Không điền — có ô trống nhưng không trích được | 1 |");
    expect(report).toContain("| Loại sản phẩm (`productTypes`) | 1 | 1 | 1 |");
    expect(report).toContain("| Biệt thự Hồ Tây | Sản phẩm | Biệt thự đơn lập · số lượng 20 · 200–300 m² |");
    expect(report).toContain("### Cần admin soát");
    expect(report).not.toMatch(/\| a \|/);
    expect(projectsBackfill.fields.map((f) => f.name)).toEqual(["productTypes", "featuredAmenities", "products"]);
  });

  it("sau --apply, chạy lại: tin có ô đã có giá trị + ô còn lại không trích được đếm đúng dòng (không gộp nhầm)", async () => {
    const { payload } = fakePayload(seed());
    await runBackfill(payload, parseBackfillArgs(["--apply"]));
    const report = renderBackfillReport(await runBackfill(payload, parseBackfillArgs([])), { apply: false, ranAt: "x" });
    // "a" đã có cả 3 ô sau apply; "b" vốn đủ → 2 tin "mọi ô đã có giá trị"; "c" trống, không trích được → 1.
    expect(report).toContain("| Không điền — mọi ô đã có giá trị | 2 |");
    expect(report).toContain("| Không điền — có ô trống nhưng không trích được | 1 |");
  });

  it("tin chưa xuất bản: chỉ id + trường + giá trị, không tên và không đoạn nội dung", async () => {
    const draft = { id: "d-42", title: "Dự án bí mật", status: "draft", overview: overview("Khu căn hộ bí mật gần bệnh viện tư.") } as unknown as Partial<Project>;
    const { payload } = fakePayload([draft]);
    const report = renderBackfillReport(await runBackfill(payload, parseBackfillArgs([])), { apply: false, ranAt: "x" });
    expect(report).toContain("| (chưa xuất bản) id `d-42` | Loại sản phẩm | Căn hộ (apartment) | (ẩn — tin chưa xuất bản) |");
    expect(report).not.toContain("bí mật");
  });
});

describe("báo cáo không bao giờ ghi đè", () => {
  const at = new Date("2026-10-21T02:05:00Z"); // 09:05 giờ VN

  it("tên file theo ngày-giờ VN + chế độ", () => {
    expect(backfillReportFileName(at, true)).toBe("backfill-listing-fields-2026-10-21-0905-apply.md");
    expect(backfillReportFileName(at, false)).toBe("backfill-listing-fields-2026-10-21-0905-dry-run.md");
    expect(backfillReportFileName(new Date("2026-10-21T17:30:00Z"), true, 3)).toBe("backfill-listing-fields-2026-10-22-0030-apply-3.md");
  });

  it("dry-run sau --apply cùng phút không đè báo cáo apply; apply lần 2 cùng phút ra file -2", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "backfill-report-"));
    try {
      const first = await writeBackfillReport(dir, at, true, "APPLY-1");
      await writeBackfillReport(dir, at, false, "DRY");
      const second = await writeBackfillReport(dir, at, true, "APPLY-2");
      expect(path.basename(second)).toBe("backfill-listing-fields-2026-10-21-0905-apply-2.md");
      expect(await readFile(first, "utf8")).toBe("APPLY-1");
      expect((await readdir(dir)).sort()).toEqual([
        "backfill-listing-fields-2026-10-21-0905-apply-2.md",
        "backfill-listing-fields-2026-10-21-0905-apply.md",
        "backfill-listing-fields-2026-10-21-0905-dry-run.md",
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
