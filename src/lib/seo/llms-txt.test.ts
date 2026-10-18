import { describe, expect, it } from "vitest";

import { renderLlmsTxt } from "./llms-txt";

describe("renderLlmsTxt", () => {
  it("H1, blockquote, mục có link kèm mô tả; bỏ mục rỗng; làm sạch xuống dòng và ngoặc", () => {
    const text = renderLlmsTxt({
      siteName: "TAMI",
      summary: "Bất động sản\nviệt nam",
      contactLines: ["Hotline: 0900"],
      sections: [
        { heading: "Dự án", links: [{ title: "Dự án [A]\nB", url: "https://t.example/du-an/a", description: "Mô tả\n dài" }, { title: "Không mô tả", url: "https://t.example/x" }] },
        { heading: "Trống", links: [] },
      ],
    });
    expect(text).toBe(
      "# TAMI\n\n> Bất động sản việt nam\n\nHotline: 0900\n\n## Dự án\n- [Dự án A B](https://t.example/du-an/a): Mô tả dài\n- [Không mô tả](https://t.example/x)\n",
    );
  });
});
