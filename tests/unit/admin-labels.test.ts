import { readdirSync } from "node:fs";
import path from "node:path";

import type { CollectionConfig, Config, Field, GlobalConfig } from "payload";
import { describe, expect, it } from "vitest";

import { contentRedirectsPlugin } from "../../src/collections/redirects-plugin";

/**
 * Quét cấu hình THÔ (chưa qua `buildConfig`, không cần DB) để bảo đảm admin hiện toàn tiếng Việt (BL-015 T02, FR-ADM-19):
 * `buildConfig` tự điền `labels` mặc định từ slug nên không dùng được để phát hiện thiếu nhãn.
 * Nạp mọi module trong `src/collections` / `src/globals` (trừ `_shared`, test) và lấy export nào là config → thêm collection mới
 * là tự động được kiểm. Collection `redirects` sinh từ plugin nên áp plugin lên config rỗng để lấy.
 */
const ROOT = path.resolve(import.meta.dirname, "../..");

type Labelled = { label?: unknown; labels?: unknown; admin?: { hidden?: unknown; components?: { RowLabel?: unknown } }; name?: string; type?: string };

function isVietnameseLabel(label: unknown): boolean {
  if (typeof label === "string") return label.trim() !== "";
  return typeof label === "object" && label !== null && typeof (label as { vi?: unknown }).vi === "string" && (label as { vi: string }).vi.trim() !== "";
}

function hasPluralLabels(labels: unknown): boolean {
  const pair = labels as { singular?: unknown; plural?: unknown } | undefined;
  return isVietnameseLabel(pair?.singular) && isVietnameseLabel(pair?.plural);
}

async function loadConfigs<T extends { slug: string; fields: unknown }>(dir: string): Promise<T[]> {
  const files = readdirSync(dir).filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"));
  const configs: T[] = [];
  for (const file of files) {
    const mod = (await import(path.join(dir, file))) as Record<string, unknown>;
    for (const value of Object.values(mod)) {
      if (typeof value === "object" && value !== null && "slug" in value && "fields" in value) configs.push(value as T);
    }
  }
  return configs;
}

/** Trường trong `fields`/`tabs`/`blocks` của một field bố cục; trả kèm nhãn ngữ cảnh để báo lỗi dễ tìm. */
function childFields(field: Field): Field[] {
  if ("tabs" in field) return field.tabs.flatMap((tab) => tab.fields);
  if ("blocks" in field) return (field.blocks as { fields: Field[] }[]).flatMap((block) => block.fields);
  if ("fields" in field) return field.fields;
  return [];
}

/** Mọi vi phạm nhãn trong cây field; chuỗi `path` để thông báo lỗi chỉ đúng chỗ. */
export function scanFieldLabels(fields: Field[], prefix: string): string[] {
  const problems: string[] = [];
  for (const field of fields) {
    const entry = field as Labelled;
    const here = `${prefix}.${entry.name ?? `(${entry.type})`}`;
    const hiddenInAdmin = entry.admin?.hidden === true;
    if (entry.name && !hiddenInAdmin && !isVietnameseLabel(entry.label)) problems.push(`${here}: thiếu label`);
    if ((field.type === "array" || field.type === "blocks") && !hiddenInAdmin && !hasPluralLabels(entry.labels) && !entry.admin?.components?.RowLabel) {
      problems.push(`${here}: array/blocks thiếu labels hoặc RowLabel`);
    }
    if (field.type === "tabs") {
      for (const tab of field.tabs) if (!isVietnameseLabel(tab.label)) problems.push(`${here}: tab thiếu label`);
    }
    if (field.type === "select" || field.type === "radio") {
      for (const option of field.options) {
        // Nhãn trùng y hệt giá trị mã (`{ label: value, value }`) là mã tiếng Anh thô, không phải nhãn.
        const rawCode = typeof option === "string" || option.label === option.value;
        if (rawCode || !isVietnameseLabel(option.label)) problems.push(`${here}: option ${JSON.stringify(typeof option === "string" ? option : option.value)} thiếu label`);
      }
    }
    if (!hiddenInAdmin) problems.push(...scanFieldLabels(childFields(field), here));
  }
  return problems;
}

export function scanCollection(collection: CollectionConfig): string[] {
  const problems = hasPluralLabels(collection.labels) ? [] : [`${collection.slug}: thiếu labels.singular/plural`];
  return [...problems, ...scanFieldLabels(collection.fields, collection.slug)];
}

export function scanGlobal(global: GlobalConfig): string[] {
  const problems = isVietnameseLabel(global.label) ? [] : [`${global.slug}: thiếu label`];
  return [...problems, ...scanFieldLabels(global.fields, global.slug)];
}

const collections = await loadConfigs<CollectionConfig>(path.join(ROOT, "src/collections"));
const redirects = contentRedirectsPlugin()({ collections: [] } as unknown as Config).collections?.find((collection) => collection.slug === "redirects");
const globals = await loadConfigs<GlobalConfig>(path.join(ROOT, "src/globals"));

describe("nhãn tiếng Việt của admin (quét config thô, không cần DB)", () => {
  it("nạp đủ collection (21 + redirects) và 4 global", () => {
    expect(collections.map((collection) => collection.slug).sort()).toHaveLength(21);
    expect(redirects).toBeDefined();
    expect(globals.map((global) => global.slug).sort()).toEqual(["footer", "header", "homepage", "site-settings"]);
  });

  it.each([...collections, redirects as CollectionConfig].map((collection) => [collection.slug, collection] as const))(
    "collection %s: labels + mọi field hiển thị/array/option có nhãn",
    (_slug, collection) => {
      expect(scanCollection(collection)).toEqual([]);
    },
  );

  it.each(globals.map((global) => [global.slug, global] as const))("global %s: label + mọi field hiển thị/array/option có nhãn", (_slug, global) => {
    expect(scanGlobal(global)).toEqual([]);
  });

  it("bắt được thiếu nhãn (kiểm âm tính: bỏ 1 label là FAIL)", () => {
    const fields: Field[] = [
      { name: "ok", type: "text", label: "Ổn" },
      { name: "missing", type: "text" },
      { name: "secret", type: "text", admin: { hidden: true } },
      { name: "rows", type: "array", label: "Dòng", fields: [{ name: "inner", type: "select", label: "Trong", options: [{ label: "", value: "a" }, "b", { label: "c", value: "c" }] }] },
      { type: "row", fields: [{ name: "deep", type: "number" }] },
    ];
    expect(scanFieldLabels(fields, "x")).toEqual([
      "x.missing: thiếu label",
      "x.rows: array/blocks thiếu labels hoặc RowLabel",
      'x.rows.inner: option "a" thiếu label',
      'x.rows.inner: option "b" thiếu label',
      'x.rows.inner: option "c" thiếu label',
      "x.(row).deep: thiếu label",
    ]);
    expect(scanCollection({ slug: "c", fields: [] })).toEqual(["c: thiếu labels.singular/plural"]);
    expect(scanGlobal({ slug: "g", fields: [] })).toEqual(["g: thiếu label"]);
  });
});
