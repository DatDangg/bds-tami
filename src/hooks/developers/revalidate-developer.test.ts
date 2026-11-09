import type { PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";

import { createRevalidateDeveloper } from "./revalidate-developer";

const req = {} as PayloadRequest;
const HOME_PATHS = ["/vi", "/en"];

describe("createRevalidateDeveloper (BL-107)", () => {
  it("afterChange: đối tác (đang hoặc vừa là đối tác) làm mới trang chủ vi + en", async () => {
    const revalidate = vi.fn();
    const { afterChange } = createRevalidateDeveloper(revalidate);
    await afterChange({ doc: { id: "d1", showAsPartner: true }, previousDoc: { showAsPartner: true }, req, operation: "update" } as never);
    expect(revalidate).toHaveBeenLastCalledWith(expect.arrayContaining(HOME_PATHS), req);
    // Vừa tắt `showAsPartner`: khối phải bỏ mục đó ngay.
    await afterChange({ doc: { id: "d1", showAsPartner: false }, previousDoc: { showAsPartner: true }, req, operation: "update" } as never);
    // Vừa bật.
    await afterChange({ doc: { id: "d1", showAsPartner: true }, previousDoc: { showAsPartner: false }, req, operation: "update" } as never);
    expect(revalidate).toHaveBeenCalledTimes(3);
  });

  it("afterChange: chủ đầu tư không là đối tác (trước và sau) thì không làm mới gì", async () => {
    const revalidate = vi.fn();
    const { afterChange } = createRevalidateDeveloper(revalidate);
    await afterChange({ doc: { id: "d2", showAsPartner: false }, previousDoc: { showAsPartner: false }, req, operation: "update" } as never);
    await afterChange({ doc: { id: "d2" }, previousDoc: undefined, req, operation: "create" } as never);
    expect(revalidate).not.toHaveBeenCalled();
  });

  it("afterDelete: xoá hẳn một đối tác làm mới trang chủ; không là đối tác thì bỏ qua", async () => {
    const revalidate = vi.fn();
    const { afterDelete } = createRevalidateDeveloper(revalidate);
    await afterDelete({ doc: { id: "d1", showAsPartner: true }, req } as never);
    expect(revalidate).toHaveBeenCalledWith(expect.arrayContaining(HOME_PATHS), req);
    await afterDelete({ doc: { id: "d2", showAsPartner: false }, req } as never);
    expect(revalidate).toHaveBeenCalledTimes(1);
  });
});
