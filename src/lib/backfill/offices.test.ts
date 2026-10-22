import { describe, expect, it, vi } from "vitest";

import { TRANSLATION_JOB_CONTEXT_KEY } from "../../hooks/translation/translation-targets";
import { type OfficesSourceSettings, planOfficesBackfill, renderOfficesReport, runOfficesBackfill } from "./offices";
import { backfillReportFileName } from "./report";

const NAMES = { vi: "Văn phòng {siteName}", en: "{siteName} office" };
const VI: OfficesSourceSettings = { siteName: "TAMI HOMES", address: "Lô A, Tây Hồ", mapLocation: [105.81, 21.07], hotline: "1900 0000", email: "info@tami.vn", offices: [] };
const EN: OfficesSourceSettings = { siteName: "TAMI HOMES", address: "Lot A, Tay Ho", offices: [] };

/** Payload giả: lưu `offices` theo locale như global thật (hàng dùng chung, chữ localized theo locale). */
function fakePayload(initial: { vi: OfficesSourceSettings; en: OfficesSourceSettings }) {
  const state = structuredClone(initial);
  const findGlobal = vi.fn(async ({ locale }: { locale: "vi" | "en" }) => structuredClone(state[locale]));
  const updateGlobal = vi.fn(async ({ locale, data }: { locale: "vi" | "en"; data: { offices: Record<string, unknown>[] } }) => {
    const offices = data.offices.map((row, index) => ({ id: (row.id as string | undefined) ?? `row-${index}`, ...row }));
    state[locale] = { ...state[locale], offices };
    // Hàng dùng chung: locale kia thấy cùng số hàng (chữ localized của nó vẫn trống).
    const other = locale === "vi" ? "en" : "vi";
    if ((state[other].offices ?? []).length === 0) state[other] = { ...state[other], offices: offices.map(({ id }) => ({ id })) };
    return structuredClone(state[locale]);
  });
  return { payload: { findGlobal, updateGlobal } as unknown as Parameters<typeof runOfficesBackfill>[0], findGlobal, updateGlobal, state };
}

describe("planOfficesBackfill", () => {
  it("offices trống + có địa chỉ → 1 văn phòng VI (+ EN khi có địa chỉ EN)", () => {
    expect(planOfficesBackfill(VI, EN, NAMES)).toEqual({
      status: "fill",
      vi: { name: "Văn phòng TAMI HOMES", address: "Lô A, Tây Hồ", location: [105.81, 21.07], phone: "1900 0000", email: "info@tami.vn" },
      en: { name: "TAMI HOMES office", address: "Lot A, Tay Ho" },
    });
    expect(planOfficesBackfill(VI, { ...EN, address: " " }, NAMES)).not.toHaveProperty("en");
  });

  it("offices đã có → bỏ qua; không có địa chỉ VI → bỏ qua; toạ độ sai bị bỏ", () => {
    expect(planOfficesBackfill({ ...VI, offices: [{ id: "x" }] }, EN, NAMES)).toEqual({ status: "skip-has-offices", count: 1 });
    expect(planOfficesBackfill({ ...VI, address: null }, EN, NAMES)).toEqual({ status: "skip-no-source" });
    const plan = planOfficesBackfill({ ...VI, mapLocation: [200, 95] }, null, NAMES);
    expect(plan.status === "fill" && plan.vi.location).toBeUndefined();
  });
});

describe("runOfficesBackfill", () => {
  it("dry-run: chỉ đọc, KHÔNG ghi", async () => {
    const { payload, updateGlobal, findGlobal } = fakePayload({ vi: VI, en: EN });
    const result = await runOfficesBackfill(payload, { apply: false }, NAMES);
    expect(result.plan.status).toBe("fill");
    expect(updateGlobal).not.toHaveBeenCalled();
    expect(findGlobal).toHaveBeenCalledWith(expect.objectContaining({ slug: "site-settings", fallbackLocale: false, overrideAccess: true }));
    expect(renderOfficesReport(result, "2026-10-22 10:00 (giờ VN)")).toContain("Chạy thử (dry-run) — KHÔNG ghi DB");
  });

  it("--apply: ghi VI rồi EN cùng hàng (không xếp job dịch); chạy lại → bỏ qua (idempotent)", async () => {
    const { payload, updateGlobal, state } = fakePayload({ vi: VI, en: EN });
    const first = await runOfficesBackfill(payload, { apply: true }, NAMES);
    expect(first.written).toEqual({ vi: true, en: true });
    expect(first.errors).toEqual([]);
    expect(updateGlobal).toHaveBeenCalledTimes(2);
    const [viCall, enCall] = updateGlobal.mock.calls.map(([args]) => args as unknown as { locale: string; data: { offices: Record<string, unknown>[] }; context: Record<string, unknown> });
    expect(viCall).toMatchObject({ locale: "vi", context: { [TRANSLATION_JOB_CONTEXT_KEY]: true }, data: { offices: [{ name: "Văn phòng TAMI HOMES", address: "Lô A, Tây Hồ", location: [105.81, 21.07] }] } });
    expect(enCall).toMatchObject({ locale: "en", data: { offices: [{ id: "row-0", name: "TAMI HOMES office", address: "Lot A, Tay Ho", phone: "1900 0000", email: "info@tami.vn" }] } });
    expect(state.vi.offices).toHaveLength(1);
    expect(renderOfficesReport(first, "x")).not.toContain("nhập EN tay");

    const second = await runOfficesBackfill(payload, { apply: true }, NAMES);
    expect(second.plan).toEqual({ status: "skip-has-offices", count: 1 });
    expect(updateGlobal).toHaveBeenCalledTimes(2);
    expect(renderOfficesReport(second, "x")).toContain("Bỏ qua — `offices` đã có 1 văn phòng");
  });

  it("ghi EN lỗi → VI giữ, lỗi ghi vào kết quả + báo cáo (không ném)", async () => {
    const { payload, updateGlobal } = fakePayload({ vi: VI, en: EN });
    updateGlobal.mockImplementationOnce(async () => ({ offices: [{ id: "row-0" }] })).mockRejectedValueOnce(new Error("siteName required\nstack"));
    const result = await runOfficesBackfill(payload, { apply: true }, NAMES);
    expect(result.written).toEqual({ vi: true, en: false });
    expect(result.errors).toEqual(["Ghi EN lỗi (VI đã ghi): siteName required"]);
    const report = renderOfficesReport(result, "x");
    expect(report).toContain("| Lỗi khi ghi | 1 |");
    // C4: chỉ dẫn nhập EN tay trong admin khi VI đã ghi mà EN lỗi.
    expect(report).toContain("nhập EN tay trong admin");
    expect(report).toContain("Cài đặt website → Cấu hình chung → Liên hệ & mạng xã hội → Hệ thống văn phòng");
  });

  it("tên báo cáo theo tiền tố script", () => {
    expect(backfillReportFileName(new Date("2026-10-22T02:05:00Z"), true, 1, "backfill-offices")).toBe("backfill-offices-2026-10-22-0905-apply.md");
  });
});
