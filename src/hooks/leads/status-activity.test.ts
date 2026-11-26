import type { CollectionBeforeChangeHook } from "payload";
import { describe, expect, it } from "vitest";

import type { Lead } from "../../payload-types";
import { clearLostReasonWhenNotLost } from "./status-activity";

type HookArgs = Parameters<CollectionBeforeChangeHook<Lead>>[0];

const run = (operation: "create" | "update", data: Partial<Lead>, originalDoc?: Partial<Lead>) =>
  clearLostReasonWhenNotLost({ data, originalDoc, operation } as unknown as HookArgs) as Partial<Lead>;

describe("clearLostReasonWhenNotLost", () => {
  it("create với status ≠ lost: không mang lý do", () => {
    expect(run("create", { status: "new", lostReason: "cũ" }).lostReason).toBeNull();
  });

  it("update đầy đủ rời lost: xoá lý do", () => {
    expect(run("update", { status: "new", lostReason: "cũ" }, { status: "lost", lostReason: "cũ" }).lostReason).toBeNull();
  });

  it("update một phần chỉ gửi status (originalDoc còn lý do): xoá lý do", () => {
    const result = run("update", { status: "new" }, { status: "lost", lostReason: "cũ" });
    expect(result.status).toBe("new");
    expect(result.lostReason).toBeNull();
  });

  it("update không gửi status, lead không phải lost mà còn lý do cũ: xoá", () => {
    expect(run("update", { fullName: "A" }, { status: "contacted", lostReason: "cũ" }).lostReason).toBeNull();
  });

  it("vẫn lost: giữ nguyên lý do", () => {
    expect(run("update", { status: "lost", lostReason: "mới" }, { status: "lost", lostReason: "cũ" }).lostReason).toBe("mới");
    const partial = run("update", { fullName: "A" }, { status: "lost", lostReason: "cũ" });
    expect("lostReason" in partial).toBe(false);
  });

  it("create với status lost: giữ lý do", () => {
    expect(run("create", { status: "lost", lostReason: "giá cao" }).lostReason).toBe("giá cao");
  });
});
