Agent: reviewer

# Review — build/tami-website · layer-5-task-03 (Collection `news`) · round 1

- **Review level:** STRICT
- **Reason:** schema mới + migration versioned (6 bảng, enum, FK, cột trên `payload_locked_documents_rels`, index SQL tuỳ biến); RBAC nội dung (sale/admin/khách, xoá mềm/khôi phục/purge); sửa field dùng chung `hasEnglishField` (ảnh hưởng mọi collection qua `withContentDefaults`); field dùng chung mới `scopedCategoryField`; mở rộng allowlist truy vấn công khai.
- **Blast radius:** `src/collections/News.ts` (mới), `src/fields/scoped-category.ts` (mới, sẽ dùng lại cho rentals/property_posts/projects/jobs), `src/fields/translation.ts` (`hasEnglish` của developers/services/news; pages/categories có `disableDuplicate`), `src/lib/content/public-queries.ts` (`PublicCollectionSlug` + `news`), `src/payload.config.ts`, `migrations/20261017_093650_news.{ts,json}` + `migrations/index.ts`, `src/payload-types.ts` (sinh), `seed/sample/news.ts` + `scripts/seed-sample-news.ts` + `package.json`, `docs/ERD.md` §4.8/§5. Không đụng UI, API route, auth.

## Verify commands + result (reviewer tự chạy, lệnh từ `.context/project-config.md`)

| Lệnh | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0 — 81 files / 874 tests passed, 0 skipped (integration `news.test.ts` chạy thật trên DB tạm, `DATABASE_URL_TEST` có) |
| `pnpm build` | exit 0 |
| `pnpm payload migrate` / `migrate:create` drift | không chạy (migration command KHÔNG auto-allow cho reviewer) — dựa evidence builder (batch 12, "No schema changes detected") + đọc artifact |

## Migration inspection (gate `migration_required: true`)

- `up`: toàn bộ CREATE TYPE/TABLE/INDEX + FK trên bảng mới; thao tác duy nhất trên bảng cũ là `ALTER TABLE payload_locked_documents_rels ADD COLUMN news_id uuid` (nullable) + FK/idx → **additive**, không DROP / đổi type / SET NOT NULL / UNIQUE trên data cũ / backfill → **không** `HIGH_RISK_MIGRATION`.
- UNIQUE `news_slug_idx (slug, _locale)` trên `news_locales` (bảng mới) — đúng AC.
- `news_list_idx (status, has_english, category_id, published_at DESC)` — đúng ERD §5; `down` có `DROP INDEX IF EXISTS` (thực ra thừa vì `DROP TABLE news CASCADE` cũng xoá, vô hại).
- **Rủi ro drift lâu dài (đánh giá):** `payload migrate:create` (Drizzle) diff **snapshot `.json` trước ↔ schema hiện tại**, không introspect DB; index không có trong cả hai snapshot nên các migration sau **không** sinh `DROP INDEX news_list_idx` (`grep news_list_idx` trong `.json` = 0). `push: false` ở `src/payload.config.ts:83` cho mọi môi trường nên không có Drizzle push introspect DB để xoá index lạ. Rủi ro còn lại: LOW — (a) nếu sau này thêm `indexes` tương đương vào config collection sẽ trùng tên/trùng chức năng; (b) fixture test dùng `push: true` nên index này không tồn tại ở DB test của `news.test.ts`. Ghi residual.
- `_news_v*` với `author_id NOT NULL` + `ON DELETE set null` là pattern Payload sinh, giống các collection trước — ngoài scope.

## Kiểm theo yêu cầu primary

1. **RBAC** — access mặc định `withContentDefaults` (`content-defaults.ts:140-146`), News không ghi đè. Test `news.test.ts:160-186`: sale khác sửa → 403, xoá mềm (update `deletedAt`) → 403, `delete` → 403; sale xoá mềm bài mình OK, purge → 403, khôi phục → 403; admin khôi phục + purge OK; khách create → 403; khách không thấy draft/hidden/xoá mềm qua `publicWhere` (`:241-266`). OK.
2. **scoped-category không bypass được** — `validate` chạy cả create/update; partial update không gửi `category` dùng `previousValue` (không bypass vì giá trị đã lưu đã từng hợp lệ); gửi `category` sai scope → 400 (test `:198-203`); object `{id}` được `toId` chuẩn hoá, shape lạ → null → 400. `findByID` dùng `req` (cùng transaction) + `overrideAccess: true` (hợp lý: kiểm tính toàn vẹn, không lộ dữ liệu ra ngoài) + `trash: true` để bắt được danh mục đã xoá mềm. `versions.drafts: false` nên không có đường lưu nháp bỏ qua validate. Danh mục bị xoá mềm SAU khi gán: guard danh mục chặn 409 khi còn tin (test `:205-215`). OK.
3. **`beforeDuplicate` ở `hasEnglishField`** — chỉ hạ `hasEnglish` về false khi nhân bản (hướng an toàn: không bao giờ làm bản ghi lộ EN). `withFieldAccess` spread giữ nguyên `hooks`. pages/categories `disableDuplicate`; developers/services/news nhận hành vi mới — đúng ý (slug `en` bị bỏ khi duplicate nên EN không đủ điều kiện). OK.
4. **Revalidate** — route `news: /tin-tuc, /tin-tuc/[slug]` (`content-paths.ts:19`); test `:268-275` xác nhận `/vi/tin-tuc/lam-moi-tin`, `/vi/tin-tuc`, `/en/tin-tuc`, `/vi`, `/en` khi xuất bản + featured; nháp không revalidate. OK.
5. **Không quan hệ leads** — test `:141-150` khẳng định tập `relationTo` = `categories, media, staff`. OK.
6. **Seed** — `scripts/seed-sample-news.ts` thoát 1 khi `APP_ENV=production` trước `getPayload`; tin mẫu `draft`, idempotent theo title (kể cả thùng rác), lỗi rõ khi thiếu danh mục/admin; test `:301-315`. OK.

## Responsive Checklist Gate

N/A — diff không đụng route/component/CSS (chỉ collection/field/migration/seed/test/docs).

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip — `aislop` không nằm trong verify commands được allow cho reviewer |
| oxlint (anti-slop) | skip, oxlint not configured (không có `.oxlintrc*`); `pnpm lint` (eslint) + `pnpm typecheck` PASS |
| ocr (open-code-review) | skip, ocr not installed / không trong allowlist |
| AI-readable | OK — tên rõ (`scopedCategoryField`, `validateCover`, `seedSampleNews`), hàm < 50 dòng, file < 320 dòng (test 317 dòng — file test, chấp nhận), comment giải thích WHY, ERD reconciled; 0–1 indicator (trùng nhỏ validator cover) |
| ai-friendly-web | N/A — không phải thay đổi public web surface (chỉ backend collection) |
| blitzstrike | skip — không có môi trường pentest được phép; không có endpoint mới ngoài REST mặc định của Payload |

## Findings

**CRITICAL:** không có.

**MAJOR:** không có.

**[MINOR-1] Bản sao giữ nguyên nhóm `translation` (status/enSource/sourceHash/translatedAt)** — `src/fields/translation.ts:24-46`. Sau duplicate, bản sao có `hasEnglish=false`, slug `en` rỗng nhưng `translation.status` có thể là `done` + `sourceHash` khớp nội dung vi → job dịch (layer sau) có thể coi là "đã dịch, không đổi" và không bao giờ sinh lại slug `en`/bật EN cho bản sao. Hiện chưa có job dịch nên chưa gây lỗi. Đề xuất: thêm `hooks.beforeDuplicate` reset group (`status: "none"`, xoá `sourceHash`/`translatedAt`/`enSource`/`model`/`lastError`) ở task dịch, hoặc ghi follow-up gắn vào AC của task job dịch.

**[MINOR-2] Index tuỳ biến `news_list_idx` không có test tự động** — `tests/integration/news.test.ts:152-156` chỉ kiểm UNIQUE (DB tạo bằng `push: true` ở `tests/fixtures/news/payload-config.ts`, nên không chứa index SQL tuỳ biến). Đã có pattern chạy full `migrations` trong test (`tests/integration/audit-staff.test.ts:95-96`); đề xuất thêm 1 assertion `pg_indexes` cho `news_list_idx` (có `published_at DESC`) ở một test chạy migration thật, để AC "Index (...)" có evidence tự động thay vì chỉ thủ công.

**[MINOR-3] Nhánh "Danh mục đang ở thùng rác" của `scopedCategoryField` chưa có test** — `src/fields/scoped-category.ts:36`. Field dùng chung sẽ tái sử dụng cho các collection sau; đề xuất test: gán danh mục `news` đã xoá mềm (chưa có tin) → 400. Liên quan: tin đã xoá mềm khi danh mục bị xoá sau đó → admin khôi phục tin sẽ nhận 400 trừ khi gửi kèm `category` mới; hành vi chấp nhận được nhưng nên ghi vào runbook/thông báo admin.

**[MINOR-4] Trùng logic validator ảnh bìa với Services** — `src/collections/News.ts:13-17` vs `src/collections/Services.ts:21-25` (builder đã tự khai). Đề xuất gom thành helper `requiredWhenPublished` khi có collection thứ 3 cần (rentals/projects), không cần làm trong task này.

## Residual risk

- Không tự chạy `pnpm payload migrate` / `migrate:create` (không được allow) → migration up/down trên DB dev và drift check dựa evidence builder + đọc artifact; logic diff snapshot của Payload cho thấy rủi ro DROP index về sau thấp.
- `tests/fixtures/categories` vẫn dùng FakeNews (builder khai) — guard xoá danh mục đã được kiểm thêm bằng collection thật trong `news.test.ts:205-215`.

## Verdict

**PASS** — không có CRITICAL/MAJOR; verify commands đều exit 0 (874/874 test). 4 MINOR ghi lại làm follow-up (MINOR-1 nên gắn vào AC task job dịch, MINOR-2 nên gắn vào task kế tiếp có migration).
