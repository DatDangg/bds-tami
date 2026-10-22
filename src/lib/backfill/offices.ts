import type { Payload } from "payload";

import { TRANSLATION_JOB_CONTEXT_KEY } from "../../hooks/translation/translation-targets";

/**
 * `pnpm backfill:offices` (BL-054 Quyết định 4): tạo văn phòng đầu tiên của `site-settings.offices` từ trường cũ
 * (`address` / `mapLocation` / `hotline` / `email`). Chỉ khi `offices` đang trống (idempotent); trường cũ giữ nguyên (header / footer / JSON-LD vẫn dùng).
 * Bản EN (tên + địa chỉ) chỉ ghi khi `address` EN đã có. Không xếp job dịch tự động (bản EN để admin soát).
 */

type Point = [number, number];

/** Phần `site-settings` script cần, đọc theo một locale với `fallbackLocale: false`. */
export interface OfficesSourceSettings {
  siteName?: string | null;
  address?: string | null;
  mapLocation?: Point | null;
  hotline?: string | null;
  email?: string | null;
  offices?: readonly { id?: string | null }[] | null;
}

/** Mẫu tên văn phòng theo ngôn ngữ (chuỗi i18n `page.contact.v2.fallbackOfficeName`, có `{siteName}`). */
export interface OfficeNameTemplates {
  vi: string;
  en: string;
}

export interface OfficeRowPlan {
  name: string;
  address: string;
  location?: Point;
  phone?: string;
  email?: string;
}

export type OfficesPlan =
  | { status: "skip-has-offices"; count: number }
  | { status: "skip-no-source" }
  | { status: "fill"; vi: OfficeRowPlan; en?: { name: string; address: string } };

export interface OfficesBackfillResult {
  plan: OfficesPlan;
  apply: boolean;
  /** Lượt ghi (chỉ `--apply`): `vi` bắt buộc, `en` khi có bản EN; lỗi ghi một bước ghi vào đây, không ném. */
  written: { vi: boolean; en: boolean };
  errors: string[];
}

const filled = (value: string | null | undefined) => value?.trim() || undefined;
const applyName = (template: string, siteName: string) => template.replace("{siteName}", siteName);
const isPoint = (value: unknown): value is Point =>
  Array.isArray(value) && value.length === 2 && value.every((n) => typeof n === "number" && Number.isFinite(n)) && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90;

/**
 * Kế hoạch thuần (test được, không DB). `offices` VI đã có hàng → bỏ qua. Không có `address` VI → bỏ qua (`name` + `address` bắt buộc trong hàng;
 * web vẫn dựng văn phòng dự phòng từ toạ độ / hotline / email nên không mất gì).
 */
export function planOfficesBackfill(vi: OfficesSourceSettings | null, en: OfficesSourceSettings | null, names: OfficeNameTemplates): OfficesPlan {
  const count = vi?.offices?.length ?? 0;
  if (count > 0) return { status: "skip-has-offices", count };
  const address = filled(vi?.address);
  if (!address) return { status: "skip-no-source" };
  const siteNameVi = filled(vi?.siteName) ?? "TAMI HOMES";
  const phone = filled(vi?.hotline);
  const email = filled(vi?.email);
  const row: OfficeRowPlan = {
    name: applyName(names.vi, siteNameVi),
    address,
    ...(isPoint(vi?.mapLocation) ? { location: vi.mapLocation } : {}),
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
  };
  const addressEn = filled(en?.address);
  return { status: "fill", vi: row, ...(addressEn ? { en: { name: applyName(names.en, filled(en?.siteName) ?? siteNameVi), address: addressEn } } : {}) };
}

const shortError = (error: unknown) => ((error instanceof Error ? error.message : String(error)).split("\n")[0] ?? "").slice(0, 300);

type GlobalApi = Pick<Payload, "findGlobal" | "updateGlobal">;

async function readLocale(payload: GlobalApi, locale: "vi" | "en"): Promise<OfficesSourceSettings> {
  return (await payload.findGlobal({ slug: "site-settings", locale, fallbackLocale: false, depth: 0, overrideAccess: true })) as OfficesSourceSettings;
}

/** Đọc VI + EN → lập kế hoạch → (chỉ `apply`) ghi VI rồi EN qua Local API (`overrideAccess`, context job dịch để không xếp job dịch). */
export async function runOfficesBackfill(payload: GlobalApi, options: { apply: boolean }, names: OfficeNameTemplates): Promise<OfficesBackfillResult> {
  const [vi, en] = await Promise.all([readLocale(payload, "vi"), readLocale(payload, "en")]);
  const plan = planOfficesBackfill(vi, en, names);
  const result: OfficesBackfillResult = { plan, apply: options.apply, written: { vi: false, en: false }, errors: [] };
  if (!options.apply || plan.status !== "fill") return result;
  const common = { slug: "site-settings" as const, depth: 0, overrideAccess: true, context: { [TRANSLATION_JOB_CONTEXT_KEY]: true } };
  const { name, address, ...shared } = plan.vi;
  let rowId: string | undefined;
  try {
    const doc = (await payload.updateGlobal({ ...common, locale: "vi", data: { offices: [{ name, address, ...shared }] } })) as OfficesSourceSettings;
    rowId = doc.offices?.[0]?.id ?? undefined;
    result.written.vi = true;
  } catch (error) {
    result.errors.push(`Ghi VI lỗi: ${shortError(error)}`);
    return result;
  }
  if (plan.en) {
    try {
      // Cùng hàng (`id`) + trường không localized gửi lại nguyên giá trị: chỉ thêm chữ EN, không tạo hàng thứ hai.
      await payload.updateGlobal({ ...common, locale: "en", data: { offices: [{ ...(rowId ? { id: rowId } : {}), ...plan.en, ...shared }] } });
      result.written.en = true;
    } catch (error) {
      result.errors.push(`Ghi EN lỗi (VI đã ghi): ${shortError(error)}`);
    }
  }
  return result;
}

const cell = (value: string | undefined) => (value ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim() || "—";

export function renderOfficesReport(result: OfficesBackfillResult, ranAt: string): string {
  const { plan, apply, written, errors } = result;
  const head = [
    "# Báo cáo điền dữ liệu cũ — văn phòng (BL-054)",
    "",
    `- Thời điểm chạy: ${ranAt}`,
    `- Chế độ: ${apply ? "**Ghi thật (`--apply`)**" : "**Chạy thử (dry-run) — KHÔNG ghi DB**; chạy lại với `--apply` để ghi"}`,
    "- Quy tắc: chỉ tạo khi `site-settings.offices` đang trống; 1 văn phòng từ Địa chỉ / Toạ độ / Hotline / Email cũ (trường cũ giữ nguyên); bản EN chỉ khi Địa chỉ EN đã có; không xếp job dịch tự động.",
    "",
  ];
  if (plan.status === "skip-has-offices") return [...head, `## Kết quả`, "", `Bỏ qua — \`offices\` đã có ${plan.count} văn phòng (không ghi đè).`, ""].join("\n");
  if (plan.status === "skip-no-source") return [...head, "## Kết quả", "", "Bỏ qua — chưa có Địa chỉ công ty (VI) để tạo văn phòng. Web vẫn dùng toạ độ / hotline / email cũ.", ""].join("\n");
  const verb = apply ? "Đã ghi" : "Sẽ ghi";
  const { vi, en } = plan;
  return [
    ...head,
    "## Kết quả",
    "",
    "| Chỉ số | Giá trị |",
    "|---|---|",
    `| Văn phòng tạo | 1 |`,
    `| ${verb} VI | ${apply ? (written.vi ? "có" : "không") : "có"} |`,
    `| ${verb} EN | ${en ? (apply ? (written.en ? "có" : "không") : "có") : "không (chưa có Địa chỉ EN)"} |`,
    ...(apply ? [`| Lỗi khi ghi | ${errors.length} |`] : []),
    "",
    "## Văn phòng",
    "",
    "| Trường | VI | EN |",
    "|---|---|---|",
    `| Tên | ${cell(vi.name)} | ${cell(en?.name)} |`,
    `| Địa chỉ | ${cell(vi.address)} | ${cell(en?.address)} |`,
    `| Toạ độ [kinh độ, vĩ độ] | ${vi.location ? `${vi.location[0]}, ${vi.location[1]}` : "—"} | (dùng chung) |`,
    `| Điện thoại | ${cell(vi.phone)} | (dùng chung) |`,
    `| Email | ${cell(vi.email)} | (dùng chung) |`,
    "",
    "## Cần admin soát",
    "",
    ...(errors.length > 0 ? errors.map((e) => `- ${cell(e)}`) : []),
    "- Ảnh văn phòng chưa có — tải ảnh trong \"Cấu hình chung → Liên hệ & mạng xã hội → Hệ thống văn phòng\".",
    ...(en ? [] : ["- Tên / địa chỉ EN chưa có — `/en` vẫn dựng văn phòng dự phòng từ trường cũ cho tới khi nhập bản EN của văn phòng."]),
    "",
  ].join("\n");
}
