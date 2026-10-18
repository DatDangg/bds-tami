import { describe, expect, it } from "vitest";

import { isUuid } from "./uuid";

describe("isUuid", () => {
  it("nhận UUID, từ chối mọi thứ khác (kể cả object { id })", () => {
    expect(isUuid("11111111-2222-4333-8444-555555555555")).toBe(true);
    expect(isUuid("AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA")).toBe(true);
    for (const bad of ["khong-phai-uuid", "", "1234", "11111111-2222-4333-8444-55555555555", { id: "11111111-2222-4333-8444-555555555555" }, null, undefined, 5]) {
      expect(isUuid(bad), String(bad)).toBe(false);
    }
  });
});
