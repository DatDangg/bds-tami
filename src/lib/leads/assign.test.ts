import type { Payload, PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";

import { isAutoAssignSource, resolveAutoAssignee } from "./assign";

const AUTHOR_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const POST_ID = "7f1c0f0e-2b0a-4c53-9d0e-2d6e1f0a9b11";
const req = {} as PayloadRequest;

function fakePayload(post: { author?: unknown } | null, staff: { role?: string; active?: boolean } | null) {
  const findByID = vi.fn(async (args: { collection: string }) => (args.collection === "staff" ? staff : post));
  return { payload: { findByID } as unknown as Payload, findByID };
}

describe("resolveAutoAssignee (BR-12)", () => {
  it("chỉ rental và property_post tự giao", () => {
    expect(["rental", "property_post", "project", "contact"].map((source) => isAutoAssignSource(source as never))).toEqual([true, true, false, false]);
  });

  it("author là sale đang hoạt động -> giao cho author (đọc tin ở đúng collection)", async () => {
    const { payload, findByID } = fakePayload({ author: AUTHOR_ID }, { role: "sale", active: true });
    expect(await resolveAutoAssignee(payload, { source: "property_post", sourceId: POST_ID, req })).toBe(AUTHOR_ID);
    expect(findByID.mock.calls[0]![0]).toMatchObject({ collection: "property-posts", id: POST_ID });
  });

  it("author dạng object đã populate vẫn nhận ra id", async () => {
    const { payload } = fakePayload({ author: { id: AUTHOR_ID } }, { role: "sale", active: true });
    expect(await resolveAutoAssignee(payload, { source: "rental", sourceId: POST_ID, req })).toBe(AUTHOR_ID);
  });

  it.each([
    ["sale bị khoá", { role: "sale", active: false }],
    ["admin", { role: "admin", active: true }],
    ["không còn tài khoản", null],
  ])("author là %s -> để trống", async (_label, staff) => {
    const { payload } = fakePayload({ author: AUTHOR_ID }, staff);
    expect(await resolveAutoAssignee(payload, { source: "rental", sourceId: POST_ID, req })).toBeNull();
  });

  it("dự án, liên hệ, hoặc tin không có author -> để trống, không truy vấn thừa", async () => {
    const project = fakePayload({ author: AUTHOR_ID }, { role: "sale", active: true });
    expect(await resolveAutoAssignee(project.payload, { source: "project", sourceId: POST_ID, req })).toBeNull();
    expect(await resolveAutoAssignee(project.payload, { source: "contact", sourceId: null, req })).toBeNull();
    expect(project.findByID).not.toHaveBeenCalled();
    const noAuthor = fakePayload({}, { role: "sale", active: true });
    expect(await resolveAutoAssignee(noAuthor.payload, { source: "rental", sourceId: POST_ID, req })).toBeNull();
    expect(noAuthor.findByID).toHaveBeenCalledTimes(1);
  });
});
