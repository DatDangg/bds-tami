import { describe, expect, it } from "vitest";

import { isSafeInternalPath } from "./internal-path";

describe("isSafeInternalPath (chống open redirect)", () => {
  it.each(["/", "/tin-tuc/bai-viet", "/en/news/new", "/tin-tuc/a%5Cb", "/tin-tuc/%E1%BB%99", "/a?x=1"])("nhận %s", (value) =>
    expect(isSafeInternalPath(value)).toBe(true),
  );

  it.each([
    "/\\evil.com",
    "/\\\\evil.com",
    "/\\/evil.com",
    "\\\\evil.com",
    "/a\\b",
    "//evil.com",
    "/%5Cevil.com",
    "/%5cevil.com",
    "/%2Fevil.com",
    "/%2fevil.com",
    "https://evil.com",
    "evil.com",
    "tin-tuc/a",
    "",
    "/a b",
    "/a\tb",
    "/a\nb",
    "/\u0000a",
    "/\u007fa",
    undefined,
    null,
    42,
  ])("từ chối %j", (value) => expect(isSafeInternalPath(value)).toBe(false));
});
