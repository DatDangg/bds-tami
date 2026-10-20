import { describe, expect, it } from "vitest";
import { collectSectionHeadings, collectTocHeadings } from "./section-headings";

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

describe("collectTocHeadings", () => {
  it("h1/h2 → level 2, h3–h6 → level 3; id = slug bỏ dấu; bỏ heading rỗng và heading không ở cấp gốc", () => {
    const data = doc(
      heading("h2", text("Giá nhà đất Hà Nội")),
      heading("h3", text("Đường Lê Đại Hành")),
      heading("h2", text("  ")),
      heading("h4", text("Mục nhỏ")),
      { type: "list", children: [{ type: "listitem", children: [heading("h2", text("Lồng nhau"))] }] },
    );
    expect(collectTocHeadings(data)).toEqual([
      { id: "gia-nha-dat-ha-noi", text: "Giá nhà đất Hà Nội", level: 2 },
      { id: "duong-le-dai-hanh", text: "Đường Lê Đại Hành", level: 3 },
      { id: "muc-nho", text: "Mục nhỏ", level: 3 },
    ]);
  });

  it("chống trùng bằng -2, -3 (cả với reservedIds); tiêu đề không ra chữ thì muc-<thứ tự>", () => {
    const data = doc(heading("h2", text("Giới thiệu")), heading("h2", text("Giới thiệu")), heading("h3", text("Giới thiệu")), heading("h2", text("???")), heading("h2", text("Related news")));
    expect(collectTocHeadings(data, ["related-news"]).map((item) => item.id)).toEqual(["gioi-thieu", "gioi-thieu-2", "gioi-thieu-3", "muc-4", "related-news-2"]);
  });

  it("id sinh ra luôn duy nhất kể cả khi chữ tiêu đề trùng hậu tố hoặc muc-N", () => {
    const data = doc(heading("h2", text("A")), heading("h2", text("A")), heading("h2", text("A 2")), heading("h2", text("!!")), heading("h2", text("Mục 4")));
    const ids = collectTocHeadings(data).map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.slice(0, 2)).toEqual(["a", "a-2"]);
  });

  it("slug dài bị cắt ≤ 60 ký tự; dữ liệu sai dạng → rỗng", () => {
    const long = "một hai ba bốn năm sáu bảy tám chín mười mười một mười hai mười ba mười bốn";
    expect(collectTocHeadings(doc(heading("h2", text(long))))[0]?.id.length).toBeLessThanOrEqual(60);
    for (const data of [null, undefined, "x", {}, { root: { children: "x" } }]) expect(collectTocHeadings(data)).toEqual([]);
  });
});
