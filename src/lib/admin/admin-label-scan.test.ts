import type { SanitizedConfig } from "payload";
import { describe, expect, it } from "vitest";

/** Thuật ngữ dev/mã yêu cầu nội bộ không được lọt vào nhãn hay mô tả hiển thị trong admin (BL-040 T02). */
const FORBIDDEN_TERMS = ["(slug)", "noindex", "canonical", "(br-", "(fr-", "vi → en", "bucket", "consentversion", "og image"];

type Node = Record<string, unknown>;

const isNode = (value: unknown): value is Node => typeof value === "object" && value !== null;

/** Gom mọi chuỗi hiển thị (label/description/option/tab) của một cây field, đi qua tabs/row/group/array/blocks/collapsible. */
function collectDisplayStrings(node: unknown, path: string, out: { path: string; text: string }[]): void {
  if (Array.isArray(node)) {
    node.forEach((child, index) => collectDisplayStrings(child, `${path}[${index}]`, out));
    return;
  }
  if (!isNode(node)) return;
  const here = typeof node.name === "string" ? `${path}.${node.name}` : path;
  if (typeof node.label === "string") out.push({ path: `${here}.label`, text: node.label });
  const admin = node.admin;
  if (isNode(admin) && typeof admin.description === "string") out.push({ path: `${here}.admin.description`, text: admin.description });
  for (const key of ["fields", "tabs", "blocks", "options"]) collectDisplayStrings(node[key], `${here}.${key}`, out);
}

describe("quét nhãn/mô tả admin: không còn thuật ngữ dev", async () => {
  const { default: loaded } = await import("../../payload.config");
  const config = (await loaded) as SanitizedConfig;
  const entities = [...config.collections, ...config.globals].filter((entity) => !entity.slug.startsWith("payload-"));

  it("mọi collection/global có nhãn + mô tả + field sạch thuật ngữ cấm", () => {
    const found: { path: string; text: string }[] = [];
    for (const entity of entities) {
      collectDisplayStrings(entity.fields, entity.slug, found);
      const description = (entity.admin as Node | undefined)?.description;
      if (typeof description === "string") found.push({ path: `${entity.slug}.admin.description`, text: description });
    }
    expect(found.length).toBeGreaterThan(100);
    const offenders = found.filter(({ text }) => FORBIDDEN_TERMS.some((term) => text.toLowerCase().includes(term))).map(({ path, text }) => `${path}: ${text}`);
    expect(offenders).toEqual([]);
  });

  it("không nhãn field nào kết thúc bằng ' lúc' (dùng 'Ngày X')", () => {
    const found: { path: string; text: string }[] = [];
    for (const entity of entities) collectDisplayStrings(entity.fields, entity.slug, found);
    const offenders = found.filter(({ path, text }) => path.endsWith(".label") && text.trim().endsWith(" lúc")).map(({ path, text }) => `${path}: ${text}`);
    expect(offenders).toEqual([]);
  });

  it("nhãn cột MIME của collection upload là 'Loại tệp' và cột vẫn ẩn/chỉ đọc (không đổi schema)", () => {
    for (const slug of ["media", "private-files"]) {
      const collection = config.collections.find((entry) => entry.slug === slug);
      const field = collection?.fields.find((entry) => "name" in entry && entry.name === "mimeType") as Node | undefined;
      expect(field, slug).toMatchObject({ type: "text", label: "Loại tệp", admin: { hidden: true, readOnly: true } });
      expect(typeof field?.validate, slug).toBe("function");
    }
  });
});
