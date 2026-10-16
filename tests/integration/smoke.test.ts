import pg from "pg";
import { describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL_TEST;

// Thiếu DATABASE_URL_TEST thì bỏ qua có chủ đích (CI dựng service DB ở task layer-1/task-01).
describe.skipIf(!databaseUrl)("integration smoke: PostgreSQL dev", () => {
  it("kết nối được và có đủ extension postgis, unaccent, pg_trgm", async () => {
    const client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      const { rows } = await client.query<{ extname: string }>(
        "SELECT extname FROM pg_extension WHERE extname = ANY($1)",
        [["postgis", "unaccent", "pg_trgm"]],
      );
      expect(rows.map((row) => row.extname).sort()).toEqual(["pg_trgm", "postgis", "unaccent"]);
    } finally {
      await client.end();
    }
  });
});
