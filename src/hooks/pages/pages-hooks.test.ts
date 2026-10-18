import type { CollectionAfterChangeHook, CollectionBeforeValidateHook } from "payload";
import { describe, expect, it, vi } from "vitest";

import { TRANSLATABLE_COLLECTIONS } from "../../lib/translation/allowlist";
import { lockPageKind } from "./lock-kind";
import { createRevalidatePage } from "./revalidate-page";
import { MISSING_SITE_NAME_MESSAGE, syncPrivacyPolicyVersion } from "./sync-privacy-version";

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

describe("syncPrivacyPolicyVersion: thiếu siteName", () => {
  const publish = (global: object) => {
    const updateGlobal = vi.fn();
    const req = { payload: { findGlobal: async () => global, updateGlobal } };
    const result = syncPrivacyPolicyVersion({ doc: { kind: "privacy", status: "published", version: "1.1" }, req } as unknown as AfterChangeArgs);
    return { result, updateGlobal };
  };

  it("site-settings chưa có siteName -> lỗi 400 rõ ràng, không ghi global", async () => {
    const { result, updateGlobal } = publish({ privacyPolicyVersion: "1.0" });
    await expect(result).rejects.toMatchObject({ status: 400, message: MISSING_SITE_NAME_MESSAGE });
    expect(updateGlobal).not.toHaveBeenCalled();
  });

  it("có siteName -> ghi phiên bản như cũ", async () => {
    const { result, updateGlobal } = publish({ siteName: "TAMI", privacyPolicyVersion: "1.0" });
    await result;
    expect(updateGlobal).toHaveBeenCalledOnce();
  });
});
