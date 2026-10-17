import { describe, expect, it } from "vitest";

import { resolveProdMigrations } from "./prod-migrations";

const migrations = [{ name: "a" }, { name: "b" }];

describe("resolveProdMigrations", () => {
  it("không đặt cờ → undefined (app/jobs không tự migrate lúc khởi động)", () => {
    expect(resolveProdMigrations(undefined, migrations)).toBeUndefined();
  });

  it("giá trị khác đúng chuỗi 'true' → undefined", () => {
    for (const value of ["", "false", "1", "TRUE", "yes"]) {
      expect(resolveProdMigrations(value, migrations)).toBeUndefined();
    }
  });

  it("'true' → trả đúng danh sách migration", () => {
    expect(resolveProdMigrations("true", migrations)).toBe(migrations);
  });
});
