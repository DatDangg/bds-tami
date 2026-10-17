import { describe, expect, it } from "vitest";
import { collectSectionHeadings } from "./section-headings";

const text = (value: string) => ({ type: "text", text: value });
const heading = (tag: string, ...children: unknown[]) => ({ type: "heading", tag, children });
const doc = (...children: unknown[]) => ({ root: { type: "root", children } });

describe("collectSectionHeadings", () => {
  it("lấy h1/h2 cấp gốc theo thứ tự, id theo vị trí; bỏ h3 và heading rỗng", () => {
    const data = doc(heading("h2", text("1. Phạm vi")), heading("h3", text("con")), heading("h2", text("  ")), heading("h1", text("2. "), text("Mục đích")));
    expect(collectSectionHeadings(data)).toEqual([
      { id: "muc-1", text: "1. Phạm vi" },
      { id: "muc-2", text: "2. Mục đích" },
    ]);
  });

  it("dữ liệu sai dạng → rỗng", () => {
    for (const data of [null, undefined, "x", {}, { root: { children: "x" } }]) expect(collectSectionHeadings(data)).toEqual([]);
  });
});
