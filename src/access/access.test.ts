import type { Access } from "payload";
import { describe, expect, it } from "vitest";

import {
  isAdmin,
  isAssignedOrAdmin,
  isAuthorOrAdmin,
  isStaff,
  publishedOnly,
  rentalsPublishedOnly,
} from "./index";
import { ROLES } from "./roles";

type AccessArgs = Parameters<Access>[0];

interface FakeUser {
  id: string;
  role: string;
  active: boolean;
}

// Dựng đối số access tối thiểu: các hàm chỉ đọc `req.user`.
function argsFor(user: FakeUser | null): AccessArgs {
  return { req: { user } } as unknown as AccessArgs;
}

const admin: FakeUser = { id: "a-1", role: ROLES.admin, active: true };
const sale: FakeUser = { id: "s-1", role: ROLES.sale, active: true };
const lockedAdmin: FakeUser = { ...admin, active: false };
const lockedSale: FakeUser = { ...sale, active: false };

describe("isAdmin", () => {
  it("chỉ admin đang hoạt động", () => {
    expect(isAdmin(argsFor(admin))).toBe(true);
    expect(isAdmin(argsFor(sale))).toBe(false);
    expect(isAdmin(argsFor(null))).toBe(false);
    expect(isAdmin(argsFor(lockedAdmin))).toBe(false);
  });
});

describe("isStaff", () => {
  it("admin/sale đang hoạt động; khách và tài khoản khoá thì không", () => {
    expect(isStaff(argsFor(admin))).toBe(true);
    expect(isStaff(argsFor(sale))).toBe(true);
    expect(isStaff(argsFor(null))).toBe(false);
    expect(isStaff(argsFor(lockedSale))).toBe(false);
  });

  it("không tin giá trị active không phải boolean true", () => {
    const weird = { id: "x", role: ROLES.sale, active: "true" } as unknown as FakeUser;
    expect(isStaff(argsFor(weird))).toBe(false);
  });
});

describe.each([
  ["isAuthorOrAdmin", isAuthorOrAdmin, "author"],
  ["isAssignedOrAdmin", isAssignedOrAdmin, "assignedTo"],
] as const)("%s", (_name, access, field) => {
  it("admin: true", () => {
    expect(access(argsFor(admin))).toBe(true);
  });

  it(`sale: query constraint { ${field}: { equals: user.id } }`, () => {
    expect(access(argsFor(sale))).toEqual({ [field]: { equals: sale.id } });
  });

  it("khách và tài khoản khoá: false", () => {
    expect(access(argsFor(null))).toBe(false);
    expect(access(argsFor(lockedAdmin))).toBe(false);
    expect(access(argsFor(lockedSale))).toBe(false);
  });

  it("vai trò lạ: false (fail closed)", () => {
    const unknownRole = { id: "u-1", role: "intern", active: true };
    expect(access(argsFor(unknownRole))).toBe(false);
  });
});

describe("publishedOnly", () => {
  it("khách: chỉ published và chưa xoá mềm", () => {
    expect(publishedOnly(argsFor(null))).toEqual({
      and: [{ status: { in: ["published"] } }, { deletedAt: { exists: false } }],
    });
  });

  it("rentals: khách thấy cả published và rented", () => {
    expect(rentalsPublishedOnly(argsFor(null))).toEqual({
      and: [{ status: { in: ["published", "rented"] } }, { deletedAt: { exists: false } }],
    });
  });

  it("staff đang hoạt động: thấy tất cả", () => {
    expect(publishedOnly(argsFor(admin))).toBe(true);
    expect(publishedOnly(argsFor(sale))).toBe(true);
  });

  it("tài khoản khoá: false, không rơi về quyền khách", () => {
    expect(publishedOnly(argsFor(lockedSale))).toBe(false);
  });
});
