import { describe, expect, it } from "vitest";

import { ADVISORY_LOCK_KEYS } from "./advisory-lock-keys";

describe("registry khoá advisory", () => {
  it("mỗi nghiệp vụ một id riêng và đều là số nguyên an toàn", () => {
    const ids = Object.values(ADVISORY_LOCK_KEYS);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(Number.isSafeInteger(id)).toBe(true);
  });

  it("job nhắc lead không dùng chung id với hook redirect slug (lỗi trùng 726002 trước đây)", () => {
    expect(ADVISORY_LOCK_KEYS.remindUnassignedLeads).not.toBe(ADVISORY_LOCK_KEYS.slugRedirectWrite);
  });
});
