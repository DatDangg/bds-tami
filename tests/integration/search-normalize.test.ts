import pg from "pg";
import { describe, expect, it } from "vitest";
import { normalizeSearchText } from "../../src/lib/search/normalize";

const databaseUrl = process.env.DATABASE_URL_TEST;

const SAMPLES = [
  "Căn hộ dịch vụ Quận 1",
  "ĐƯỜNG Đồng Khởi",
  "Phường Bến Nghé, TP.HCM",
  "Nguyễn Thị Ánh Tuyết",
  "Ở đây có Ừ Ữ Ự Ỳ Ỷ Ỹ Ỵ",
  "Studio 30m² view sông",
  "Vinhomes Grand Park (S2.05)",
  "đ Đ",
  "Thủ Đức - Bình Thạnh",
];

// Thiếu DATABASE_URL_TEST thì bỏ qua có chủ đích (giống smoke test).
describe.skipIf(!databaseUrl)("integration: normalizeSearchText vs Postgres unaccent(lower())", () => {
  it("cho cùng kết quả (sau khi gộp khoảng trắng) trên bộ mẫu tiếng Việt", async () => {
    const client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      for (const sample of SAMPLES) {
        const { rows } = await client.query<{ value: string }>("SELECT unaccent(lower($1::text)) AS value", [sample]);
        const expected = rows[0]!.value.replace(/\s+/g, " ").trim();
        expect(normalizeSearchText(sample), sample).toBe(expected);
      }
    } finally {
      await client.end();
    }
  });
});
