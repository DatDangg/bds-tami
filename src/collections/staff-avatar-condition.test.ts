import { describe, expect, it } from "vitest";

import { Media } from "./Media";
import { Staff } from "./Staff";

type AvatarCondition = (data: unknown, siblingData: unknown, ctx: { user?: unknown }) => boolean;

function findAvatarField() {
  const field = Staff.fields.find((candidate) => "name" in candidate && candidate.name === "avatar");
  if (!field || field.type !== "upload") throw new Error("Staff.avatar phải là field upload");
  return field;
}

describe("Staff.avatar chỉ hiện khi đã đăng nhập (BL-069)", () => {
  const condition = findAvatarField().admin?.condition as AvatarCondition;

  it("ẩn ở /admin/create-first-user (chưa có user)", () => {
    expect(condition({}, {}, { user: null })).toBe(false);
    expect(condition({}, {}, { user: undefined })).toBe(false);
  });

  it("hiện với admin và sale đã đăng nhập", () => {
    expect(condition({}, {}, { user: { id: 1, role: "admin", active: true } })).toBe(true);
    expect(condition({}, {}, { user: { id: 2, role: "sale", active: true } })).toBe(true);
  });

  it("giữ nguyên upload → media, chỉ ảnh", () => {
    const field = findAvatarField();
    expect(field.relationTo).toBe("media");
    expect(field.filterOptions).toEqual({ mimeType: { contains: "image/" } });
  });

  it("không nới quyền tạo media cho người chưa đăng nhập", () => {
    const create = Media.access?.create as (args: { req: { user: unknown } }) => boolean;
    expect(create({ req: { user: null } })).toBe(false);
  });
});
