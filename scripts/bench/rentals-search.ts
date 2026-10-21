// Bench `PostgresRentalSearch` với 100.000 tin giả lập (NFR-01: p95 ≤ 500ms): `pnpm bench:rentals-search` (= `payload run`).
// KHÔNG nằm trong `pnpm test`. Chỉ chạy trên DB dev (có chặn cứng ở `bench-guard.ts`: production/staging hoặc host DB không phải localhost -> thoát): script chèn tin có mã `BENCH-*` rồi xoá hết ở `finally` (cascade xoá dòng ngôn ngữ).
// Số tin đổi bằng `BENCH_ROWS`, số lần lặp mỗi kịch bản bằng `BENCH_RUNS`. `BENCH_METHOD=listing` đo trang danh sách `/cho-thue` (BL-052: lưới + nổi bật + số đếm,
// `available=true`) thay cho `search` (API).
import { sql } from "@payloadcms/db-postgres";
import { getPayload } from "payload";

import config from "../../src/payload.config";
import { benchBlockedReason } from "./bench-guard";
import { PostgresRentalSearch, sqlExecutorOf } from "../../src/lib/search/search-service";
import { rentalSearchParamsSchema } from "../../src/shared/types/api";

const blocked = benchBlockedReason(process.env);
if (blocked) {
  console.error(`Từ chối chạy bench: ${blocked}. Bench chèn ${process.env.BENCH_ROWS ?? 100_000} tin giả đã xuất bản, chỉ chạy trên DB dev ở máy này.`);
  process.exit(1);
}

const ROWS = Number(process.env.BENCH_ROWS ?? 100_000);
const RUNS = Number(process.env.BENCH_RUNS ?? 40);
const METHOD = process.env.BENCH_METHOD === "listing" ? "listing" : "search";
const P95_BUDGET_MS = 500;

const payload = await getPayload({ config });
const db = sqlExecutorOf(payload);
const search = new PostgresRentalSearch(db);

/** Từ khoá tiếng Việt không dấu như `searchText` thật (đã chuẩn hoá), ghép ngẫu nhiên thành chuỗi ~12 từ. */
const WORDS = "can ho chung cu vinhomes landmark masteri thao dien quan binh thanh nha pho mat tien duong nguyen hue le loi hem xe hoi gan ho ba mau day du noi that cao cap view song thoang mat yen tinh an ninh thang may ham xe ho boi gym".split(" ");
const wordsSql = sql`(SELECT string_agg((ARRAY[${sql.join(WORDS.map((word) => sql`${word}`), sql`, `)}])[1 + floor(random() * ${WORDS.length})::int], ' ') FROM generate_series(1, 12) WHERE r."id" IS NOT NULL)`;

async function seed(): Promise<void> {
  await db.execute(sql`
    INSERT INTO "rentals" ("code", "category_id", "province_id", "ward_id", "address", "show_exact_address", "price_monthly_vnd", "price_negotiable",
                           "area_m2", "bedrooms", "bathrooms", "furnishing", "status", "published_at", "author_id", "has_english", "is_featured")
    SELECT 'BENCH-' || g.n, c."id", w."province_id", w."id", g.n || ' duong gia lap', g.n % 2 = 0,
           CASE WHEN g.n % 15 = 0 THEN NULL ELSE 3000000 + (g.n % 90) * 1000000 END, g.n % 15 = 0,
           20 + (g.n % 180), g.n % 5, 1 + g.n % 3, (ARRAY['none','basic','full'])[1 + g.n % 3]::"enum_rentals_furnishing",
           CASE WHEN g.n % 20 = 0 THEN 'rented' WHEN g.n % 25 = 0 THEN 'draft' ELSE 'published' END::"enum_rentals_status",
           now() - (g.n || ' minutes')::interval, (SELECT "id" FROM "staff" LIMIT 1), g.n % 3 = 0, g.n % 97 = 0
    FROM generate_series(1, ${ROWS}) AS g(n)
    JOIN LATERAL (SELECT "id", "province_id" FROM "wards" OFFSET (g.n * 7) % (SELECT count(*) FROM "wards") LIMIT 1) w ON true
    JOIN LATERAL (SELECT "id" FROM "categories" WHERE "scope" = 'rental' AND "deleted_at" IS NULL OFFSET g.n % (SELECT count(*) FROM "categories" WHERE "scope" = 'rental' AND "deleted_at" IS NULL) LIMIT 1) c ON true`);
  for (const locale of ["vi", "en"]) {
    await db.execute(sql`
      INSERT INTO "rentals_locales" ("_parent_id", "_locale", "title", "slug", "search_text")
      SELECT r."id", ${locale}::"_locales", 'Tin gia lap ' || r."code", lower(r."code"),
             lower(r."code") || ' ' || ${wordsSql}
      FROM "rentals" r
      WHERE r."code" LIKE 'BENCH-%' AND (${locale} = 'vi' OR r."has_english")`);
  }
  await db.execute(sql`ANALYZE "rentals"`);
  await db.execute(sql`ANALYZE "rentals_locales"`);
}

const cleanup = () => db.execute(sql`DELETE FROM "rentals" WHERE "code" LIKE 'BENCH-%'`);

const SCENARIOS: Record<string, Record<string, unknown>> = {
  "danh sách mặc định": {},
  "trang 50": { page: 50 },
  "q 1 từ": { q: "vinhomes" },
  "q nhiều từ có dấu": { q: "Căn hộ Thảo Điền view sông" },
  "q hiếm (mã tin)": { q: "bench-77777" },
  "q không khớp": { q: "khongcotunaonhuthe" },
  "giá + diện tích": { priceMin: 5_000_000, priceMax: 20_000_000, areaMin: 30, areaMax: 80 },
  "sort giá tăng": { sort: "price_asc" },
  "bedrooms 4+ + nội thất": { bedrooms: 4, furnishing: "full", sort: "price_desc" },
  "q + giá + sort": { q: "noi that cao cap", priceMax: 15_000_000, sort: "price_asc" },
  "tiếng Anh": { locale: "en" },
  "tiếng Anh + q": { locale: "en", q: "ho boi", limit: 48 },
  "tỉnh": { province: "ho-chi-minh" },
  "dự án (BL-052)": { project: "du-an-mau-can-ho-song-sai-gon" },
};

const percentile = (sorted: number[], p: number): number => sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)] ?? 0;

async function measure(params: Record<string, unknown>): Promise<number[]> {
  const parsed = rentalSearchParamsSchema.parse(METHOD === "listing" ? { available: true, ...params } : params);
  const runOnce = () => (METHOD === "listing" ? search.listing(parsed) : search.search(parsed));
  await runOnce(); // khởi động nguội bỏ ra ngoài số đo
  const samples: number[] = [];
  for (let run = 0; run < RUNS; run++) {
    const startedAt = performance.now();
    await runOnce();
    samples.push(performance.now() - startedAt);
  }
  return samples.sort((a, b) => a - b);
}

let exitCode = 0;
try {
  await cleanup(); // lần chạy trước bị ngắt giữa chừng
  console.log(`Chèn ${ROWS} tin giả lập (đo ${METHOD})...`);
  await seed();
  const all: number[] = [];
  for (const [name, params] of Object.entries(SCENARIOS)) {
    const samples = await measure(params);
    all.push(...samples);
    console.log(`${name.padEnd(28)} p50=${percentile(samples, 0.5).toFixed(1)}ms p95=${percentile(samples, 0.95).toFixed(1)}ms max=${samples.at(-1)?.toFixed(1)}ms`);
  }
  all.sort((a, b) => a - b);
  const p95 = percentile(all, 0.95);
  console.log(`TỔNG (${all.length} lần): p50=${percentile(all, 0.5).toFixed(1)}ms p95=${p95.toFixed(1)}ms — ngưỡng ${P95_BUDGET_MS}ms: ${p95 <= P95_BUDGET_MS ? "ĐẠT" : "KHÔNG ĐẠT"}`);
  if (p95 > P95_BUDGET_MS) exitCode = 1;
} finally {
  await cleanup();
  await db.execute(sql`ANALYZE "rentals_locales"`);
  await payload.destroy();
}
process.exit(exitCode);
