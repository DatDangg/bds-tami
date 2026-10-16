import { describe, expect, it } from "vitest";
import { buildLocaleCookie } from "./localeCookie";

describe("buildLocaleCookie", () => {
  it("đặt NEXT_LOCALE toàn site, sống 1 năm", () => {
    expect(buildLocaleCookie("en")).toBe("NEXT_LOCALE=en; Path=/; Max-Age=31536000; SameSite=Lax");
  });
});
