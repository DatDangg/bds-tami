import type { CollectionAfterChangeHook, CollectionBeforeValidateHook } from "payload";
import { describe, expect, it } from "vitest";

import { TRANSLATABLE_COLLECTIONS } from "../../lib/translation/allowlist";
import { lockPageKind } from "./lock-kind";
import { createRevalidatePage } from "./revalidate-page";

type AfterChangeArgs = Parameters<CollectionAfterChangeHook>[0];

describe("allowlist dịch (G12)", () => {
  it("services và pages được phép dịch", () => {
    expect(TRANSLATABLE_COLLECTIONS).toEqual(expect.arrayContaining(["services", "pages"]));
  });
});

describe("lockPageKind", () => {
  const run = (args: object) => lockPageKind(args as unknown as Parameters<CollectionBeforeValidateHook>[0]);

  it("ép lại kind đã lưu khi sửa; tạo mới thì giữ nguyên dữ liệu gửi lên", async () => {
    expect(await run({ operation: "update", data: { kind: "terms", version: "2" }, originalDoc: { kind: "privacy" } })).toEqual({ kind: "privacy", version: "2" });
    expect(await run({ operation: "create", data: { kind: "terms" } })).toEqual({ kind: "terms" });
  });
});

describe("createRevalidatePage", () => {
  function setup() {
    const calls: string[][] = [];
    const { afterChange } = createRevalidatePage((paths) => void calls.push(paths));
    const run = (doc: object, previousDoc?: object) =>
      afterChange({ doc, previousDoc, req: {} } as unknown as AfterChangeArgs);
    return { calls, run };
  }

  it("route cố định theo kind, cả vi lẫn en", async () => {
    const { calls, run } = setup();
    await run({ kind: "privacy", status: "published" });
    await run({ kind: "terms", status: "published" });
    expect(calls).toEqual([
      ["/vi/chinh-sach-bao-mat", "/en/chinh-sach-bao-mat"],
      ["/vi/dieu-khoan-su-dung", "/en/dieu-khoan-su-dung"],
    ]);
  });

  it("làm mới khi vừa gỡ xuất bản; nháp → nháp thì không", async () => {
    const { calls, run } = setup();
    await run({ kind: "privacy", status: "draft" }, { kind: "privacy", status: "draft" });
    expect(calls).toEqual([]);
    await run({ kind: "privacy", status: "hidden" }, { kind: "privacy", status: "published" });
    expect(calls).toHaveLength(1);
  });
});
