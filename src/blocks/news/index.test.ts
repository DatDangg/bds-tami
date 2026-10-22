import type { Field } from "payload";
import { describe, expect, it } from "vitest";

import { collectSectionHeadings, collectTocHeadings } from "../../lib/content/section-headings";
import { firstParagraphText } from "../../lib/content/rich-text-lead";
import { mentionedProjectIds } from "../../lib/news/mentioned-projects";
import { richTextEditorOptions } from "../../lib/admin/rich-text-editor";
import { NEWS_BLOCK_SLUGS, NEWS_CONTENT_BLOCKS } from "./index";
import { forEachBlockTextSlot, NEWS_BLOCK_TEXT_FIELDS } from "./text-fields";

const named = (fields: Field[]) => fields.flatMap((field) => ("name" in field ? [field] : []));

describe("khối chèn Tin tức (BL-054)", () => {
  it("đúng 3 khối, slug ổn định, nhãn admin tiếng Việt", () => {
    expect(NEWS_CONTENT_BLOCKS.map((block) => [block.slug, block.labels?.singular])).toEqual([
      ["statHighlights", "Số liệu nổi bật"],
      ["projectMention", "Dự án nhắc đến"],
      ["imageText", "Ảnh cạnh chữ"],
    ]);
  });

  it("Số liệu nổi bật: 1–4 mục, value ≤ 16 + label ≤ 80 bắt buộc", () => {
    const [items] = named(NEWS_CONTENT_BLOCKS[0]!.fields);
    expect(items).toMatchObject({ name: "items", type: "array", required: true, minRows: 1, maxRows: 4 });
    expect(named((items as { fields: Field[] }).fields).map((field) => [field.name, field.type, (field as { maxLength?: number }).maxLength, (field as { required?: boolean }).required])).toEqual([
      ["value", "text", 16, true],
      ["label", "text", 80, true],
    ]);
  });

  it("Dự án nhắc đến: quan hệ bắt buộc tới projects, chỉ lưu id (maxDepth 0)", () => {
    expect(named(NEWS_CONTENT_BLOCKS[1]!.fields)).toEqual([expect.objectContaining({ name: "project", type: "relationship", relationTo: "projects", required: true, maxDepth: 0 })]);
  });

  it("Ảnh cạnh chữ: ảnh bắt buộc (chỉ ảnh), chữ bắt buộc, vị trí trái/phải mặc định trái", () => {
    const fields = named(NEWS_CONTENT_BLOCKS[2]!.fields);
    expect(fields.map((field) => [field.name, field.type, (field as { required?: boolean }).required])).toEqual([
      ["image", "upload", true],
      ["text", "textarea", true],
      ["imagePosition", "select", true],
    ]);
    expect(fields[0]).toMatchObject({ relationTo: "media", filterOptions: { mimeType: { contains: "image/" } } });
    expect(fields[2]).toMatchObject({ defaultValue: "left", options: [{ label: "Ảnh bên trái", value: "left" }, { label: "Ảnh bên phải", value: "right" }] });
  });

  it("danh sách trường chữ của bộ dịch / phút đọc khớp ĐÚNG mọi trường text/textarea của khối (thêm trường chữ mới mà quên → đỏ)", () => {
    const textFieldsOf = (fields: Field[], prefix = ""): string[] =>
      named(fields).flatMap((field) => {
        if (field.type === "text" || field.type === "textarea") return [`${prefix}${field.name}`];
        if (field.type === "array") return textFieldsOf(field.fields, `${prefix}${field.name}[].`);
        return [];
      });
    for (const block of NEWS_CONTENT_BLOCKS) {
      const spec = NEWS_BLOCK_TEXT_FIELDS[block.slug] ?? {};
      const declared = [...(spec.fields ?? []), ...Object.entries(spec.arrays ?? {}).flatMap(([array, names]) => names.map((name) => `${array}[].${name}`))];
      expect(declared.sort(), block.slug).toEqual(textFieldsOf(block.fields).sort());
    }
  });

  it("forEachBlockTextSlot bỏ qua khối lạ / sai dạng", () => {
    const seen: string[] = [];
    const visit = (holder: Record<string, unknown>, key: string) => void seen.push(String(holder[key]));
    for (const fields of [null, "x", { blockType: "embed", text: "a" }, { blockType: NEWS_BLOCK_SLUGS.projectMention, project: "p" }, { text: "không blockType" }]) forEachBlockTextSlot(fields, visit);
    expect(seen).toEqual([]);
    forEachBlockTextSlot({ blockType: "imageText", text: "chữ" }, visit);
    expect(seen).toEqual(["chữ"]);
  });
});

describe("editor có khối chỉ khi truyền `blocks`", () => {
  const keysOf = (options: ReturnType<typeof richTextEditorOptions>) => options.features({ defaultFeatures: [] }).map((feature: { key: string }) => feature.key);

  it("editor mặc định (collection khác) không có BlocksFeature; editor Tin tức có, vẫn ẩn nút + / tay kéo", () => {
    expect(keysOf(richTextEditorOptions())).not.toContain("blocks");
    const news = richTextEditorOptions(undefined, NEWS_CONTENT_BLOCKS);
    expect(keysOf(news)).toEqual(["toolbarFixed", "tamiHistory", "blocks"]);
    expect(news.admin).toMatchObject({ hideAddBlockButton: true, hideDraggableBlockElement: true });
  });
});

describe("khối không làm hỏng đoạn dẫn / mục lục / id dự án nhắc đến", () => {
  const heading = (value: string) => ({ type: "heading", tag: "h2", children: [{ type: "text", text: value }] });
  const paragraph = (value: string) => ({ type: "paragraph", children: [{ type: "text", text: value }] });
  const block = (fields: Record<string, unknown>) => ({ type: "block", version: 2, fields });
  const content = {
    root: {
      type: "root",
      children: [
        block({ blockType: "statHighlights", items: [{ value: "+18%", label: "Tăng" }] }),
        block({ blockType: "imageText", text: "Chữ khối", image: "m", imagePosition: "left" }),
        paragraph("Đoạn đầu"),
        heading("Mục một"),
        block({ blockType: "projectMention", project: "11111111-1111-4111-8111-111111111111" }),
        block({ blockType: "projectMention", project: { id: "22222222-2222-4222-8222-222222222222" } }),
        block({ blockType: "projectMention", project: "11111111-1111-4111-8111-111111111111" }),
        block({ blockType: "projectMention", project: "không-phải-uuid'; DROP" }),
        heading("Mục hai"),
      ],
    },
  };

  it("đoạn dẫn bỏ qua khối; mục lục chỉ heading", () => {
    expect(firstParagraphText(content)).toBe("Đoạn đầu");
    expect(collectTocHeadings(content, []).map((item) => item.text)).toEqual(["Mục một", "Mục hai"]);
    expect(collectSectionHeadings(content).map((item) => item.text)).toEqual(["Mục một", "Mục hai"]);
  });

  it("id dự án nhắc đến: theo thứ tự, không trùng, bỏ id không phải UUID", () => {
    expect(mentionedProjectIds(content)).toEqual(["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"]);
    expect(mentionedProjectIds(null)).toEqual([]);
  });
});
