import { describe, expect, it } from "vitest";
import { buildBreadcrumbJsonLd, serializeJsonLd } from "./json-ld";

describe("json-ld", () => {
  it("BreadcrumbList: position từ 1, URL tuyệt đối", () => {
    const data = buildBreadcrumbJsonLd(
      [
        { label: "A", href: "/a" },
        { label: "B", href: "/a/b" },
      ],
      "https://x.test",
    );
    expect(data.itemListElement.map((entry) => [entry.position, entry.item])).toEqual([
      [1, "https://x.test/a"],
      [2, "https://x.test/a/b"],
    ]);
  });

  it("serialize thay < để không đóng thẻ script sớm", () => {
    const text = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(text).not.toContain("<");
    expect(JSON.parse(text)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});
