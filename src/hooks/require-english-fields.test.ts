import type { CollectionBeforeValidateHook, PayloadRequest } from "payload";
import { ValidationError } from "payload";
import { describe, expect, it, vi } from "vitest";

import { handleApproveEnglish } from "../endpoints/admin/approve-english";
import { isFilled, missingEnglishFields, requireEnglishFields } from "./require-english-fields";

type Node = Record<string, unknown>;

const text = (value: string): Node => ({ type: "text", text: value });
const node = (type: string, children: Node[] = []): Node => ({ type, children });
const richText = (...children: Node[]) => ({ root: { type: "root", children } });

/** Lexical để lại khi admin xoá hết chữ. */
const emptyParagraphRichText = richText(node("paragraph"));

describe("isFilled — richText Lexical", () => {
  it.each<[string, unknown]>([
    ["root không con", richText()],
    ["1 paragraph không con", emptyParagraphRichText],
    ["paragraph chỉ có khoảng trắng", richText(node("paragraph", [text("   ")]))],
    ["paragraph chỉ có linebreak", richText(node("paragraph", [{ type: "linebreak" }]))],
    ["paragraph chỉ có tab", richText(node("paragraph", [{ type: "tab" }]))],
    ["heading rỗng", richText(node("heading", [text("")]))],
    ["nhiều paragraph rỗng", richText(node("paragraph"), node("paragraph", [text(" ")]), node("paragraph", [{ type: "linebreak" }]))],
    ["list/listitem rỗng", richText(node("list", [node("listitem"), node("listitem", [text(" ")])]))],
  ])("rỗng: %s -> false", (_label, value) => {
    expect(isFilled(value)).toBe(false);
  });

  it.each<[string, unknown]>([
    ["paragraph có chữ", richText(node("paragraph", [text("Hello")]))],
    ["chữ lồng trong link", richText(node("paragraph", [node("link", [text("Tami")])]))],
    ["chữ lồng trong listitem", richText(node("list", [node("listitem", [text("one")])]))],
    ["chữ lồng trong quote", richText(node("quote", [text("said")]))],
    ["upload ở root", richText({ type: "upload", value: "m1" })],
    ["block ở root", richText({ type: "block", fields: {} })],
    ["relationship ở root", richText({ type: "relationship", value: "p1" })],
    ["horizontalrule ở root", richText({ type: "horizontalrule" })],
    ["upload trong paragraph", richText(node("paragraph", [{ type: "upload", value: "m1" }]))],
    ["paragraph rỗng rồi tới paragraph có chữ", richText(node("paragraph"), node("paragraph", [text("x")]))],
  ])("có nội dung: %s -> true", (_label, value) => {
    expect(isFilled(value)).toBe(true);
  });
});

describe("isFilled — giữ nguyên các kiểu khác", () => {
  it("string", () => {
    expect(isFilled("")).toBe(false);
    expect(isFilled("   ")).toBe(false);
    expect(isFilled(" a ")).toBe(true);
  });
  it("array", () => {
    expect(isFilled([])).toBe(false);
    expect(isFilled(["x"])).toBe(true);
  });
  it("null / undefined / number -> false", () => {
    expect(isFilled(null)).toBe(false);
    expect(isFilled(undefined)).toBe(false);
    expect(isFilled(0)).toBe(false);
    expect(isFilled(5)).toBe(false);
  });
  it("object không phải Lexical -> true", () => {
    expect(isFilled({ id: "m1" })).toBe(true);
    expect(isFilled({ root: {} })).toBe(true);
  });
});

describe("missingEnglishFields", () => {
  it("richText chỉ có paragraph rỗng bị coi là thiếu", () => {
    expect(missingEnglishFields(["title", "content"], { title: "x", content: emptyParagraphRichText })).toEqual(["content"]);
  });
});

describe("handleApproveEnglish — bản EN chỉ có paragraph rỗng", () => {
  it("-> 422 và không gọi payload.update", async () => {
    const findByID = vi
      .fn()
      .mockResolvedValueOnce({ id: "p1", hasEnglish: false })
      .mockResolvedValueOnce({ id: "p1", title: "Privacy", content: emptyParagraphRichText });
    const update = vi.fn();
    const req = {
      user: { id: "u1", role: "admin", active: true, collection: "staff" },
      payload: { findByID, update, collections: { pages: { config: { custom: {} } } } },
    } as unknown as PayloadRequest;

    const response = await handleApproveEnglish(req, "11111111-2222-4333-8444-555555555555");
    expect(response.status).toBe(422);
    expect(update).not.toHaveBeenCalled();
    expect(findByID).toHaveBeenCalledTimes(2);
  });
});

describe("requireEnglishFields — bản EN chỉ có paragraph rỗng", () => {
  it("bật hasEnglish với content rỗng -> ValidationError", async () => {
    const hook = requireEnglishFields(["title", "content"]);
    const args = {
      data: { hasEnglish: true },
      originalDoc: { id: "p1", hasEnglish: false, title: "x", content: emptyParagraphRichText },
      req: { locale: "en", payload: { findByID: vi.fn() } },
      collection: { slug: "pages" },
      operation: "update",
      context: {},
    } as unknown as Parameters<CollectionBeforeValidateHook>[0];

    await expect(hook(args)).rejects.toBeInstanceOf(ValidationError);
  });
});
