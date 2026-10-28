import { PgDialect } from "@payloadcms/db-postgres/drizzle/pg-core";
import type { Payload } from "payload";
import { describe, expect, it } from "vitest";

import { findFilteredNewsIds, listTopNewsTags } from "./news-search";
import { rankNewsByViews } from "./most-read";

const NOW = new Date("2026-10-28T03:00:00.000Z");
const dialect = new PgDialect();

/** Payload giả: ghi lại câu SQL thô mà module tin tức gửi xuống Postgres. */
function fakePayload() {
  const executed: Array<{ sql: string; params: unknown[] }> = [];
  const payload = {
    db: { drizzle: { execute: async (query: Parameters<PgDialect["sqlToQuery"]>[0]) => (executed.push(dialect.sqlToQuery(query)), { rows: [] }) } },
    logger: { warn: () => undefined },
  } as unknown as Payload;
  return { payload, executed };
}

const HIDES_FUTURE = /\(n\."published_at" IS NULL OR n\."published_at" <= \$\d+::timestamptz\)/;

describe("SQL thô của Tin tức bỏ bài hẹn giờ chưa tới giờ (BL-091)", () => {
  it("findFilteredNewsIds (q / tag): published_at trống hoặc ≤ now, now là tham số", async () => {
    const { payload, executed } = fakePayload();
    await findFilteredNewsIds(payload, "vi", { q: "dong anh" }, NOW);
    expect(executed[0]?.sql).toMatch(HIDES_FUTURE);
    expect(executed[0]?.params).toContain(NOW.toISOString());
  });

  it("listTopNewsTags (khối Chủ đề): cùng điều kiện", async () => {
    const { payload, executed } = fakePayload();
    await listTopNewsTags(payload, "vi", NOW);
    expect(executed[0]?.sql).toMatch(HIDES_FUTURE);
    expect(executed[0]?.params).toContain(NOW.toISOString());
  });

  it("rankNewsByViews (Đọc nhiều): cùng điều kiện", async () => {
    const { payload, executed } = fakePayload();
    await rankNewsByViews(payload, "vi", new Date("2026-09-29T00:00:00.000Z"), 10, NOW);
    expect(executed[0]?.sql).toMatch(HIDES_FUTURE);
    expect(executed[0]?.params).toContain(NOW.toISOString());
  });
});
