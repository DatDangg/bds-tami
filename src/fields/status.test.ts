import type { FieldHook } from "payload";
import { describe, expect, it } from "vitest";

import { statusField } from "./status";

describe("statusField beforeDuplicate (BL-128)", () => {
  it("bản sao của bài đã xuất bản về nháp, không tự công khai", () => {
    const hook = statusField().hooks?.beforeDuplicate?.[0] as FieldHook;
    expect(hook({ value: "published" } as unknown as Parameters<FieldHook>[0])).toBe("draft");
  });
});
