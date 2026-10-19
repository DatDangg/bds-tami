# feature-public-ui-market-vinhomes · phase-2-task-01 — Schema global Homepage cho các khối mới

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **done** — STRICT PASS round 1 (+ sửa MINOR-1..4)
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
ADDITIVE schema · DB/migration → STRICT.

## Việc (theo chốt câu 2: thanh thông báo ở Homepage hay SiteSettings)
- `announcementBar` (group): `enabled`, `text` (localized), `link` (navLinkField); khoá "đã đóng" = hash nội dung để đổi chữ thì hiện lại.
- `heroSearch` (group): `enabled`, `placeholder` (localized), `chipProjects` (relationship projects, hasMany, ≤ 6; trống → dự án `isFeatured` mới nhất).
- `rentals` (group): `enabled`, `title`, `categories` (relationship categories scope rental, hasMany, ≤ 4; trống → danh mục đang có tin).
- `news` (group): `enabled`, `title`, `intro` (textarea localized), `posts` (relationship news, ≤ 3; trống → 3 bài mới nhất).
- `ctaBanner`: thêm `image` (upload ảnh), `secondaryLabel` (localized) + `secondaryLink`.
- `HOMEPAGE_BLOCKS` + `BLOCK_LABELS` thêm `rentals`, `news`; tab admin mới; các text localized mới vào danh sách trường dịch của homepage.
- Migration `pnpm payload migrate:create homepage_market_blocks`: chỉ ADD COLUMN nullable / bảng con mới / thêm giá trị enum (`ADD VALUE`), không phá huỷ. `migrate` + `migrate:down` + `migrate` trên `tami_wt_bl020`. Regen `src/payload-types.ts`.
- Docs: `docs/ERD.md` §4.15.

## Acceptance
- [ ] Admin thấy các nhóm mới, nhãn VI; dữ liệu cũ giữ nguyên; `blockOrder` cũ vẫn hợp lệ
- [ ] Migration additive, không HIGH_RISK; integration test global Homepage PASS


## Decision log (builder)
- `enabled` mặc định: `announcementBar` **false** (chỉ hiện khi admin bật), `heroSearch`/`rentals`/`news` **true** (theo đề xuất). Với bản ghi homepage đang có, `ADD COLUMN ... DEFAULT` điền sẵn giá trị này → dữ liệu mẫu (3 slide, 6 hàng blockOrder) còn nguyên, kiểm trên `tami_wt_bl020`.
- Khoá "đã đóng" của thanh thông báo = hash nội dung ở UI sau → không thêm field version.
- Khối thiếu trong `blockOrder`: `orderedBlocks()` chỉ lấy khối có trong mảng (không có mảng thì lấy `HOMEPAGE_BLOCKS` mặc định) → homepage cũ (6 khối) không hiện `rentals`/`news` cho tới khi admin thêm vào "Thứ tự khối". Chưa đổi gì ở UI; `rentals`/`news` chưa nằm trong `RENDERED_BLOCKS` nên bị lọc. Chỉ thêm 2 nhánh `return null` trong `toBlock` để switch vẫn biên dịch. P2-T03/T04 cần quyết định có tự thêm khối mới vào cuối khi thiếu trong `blockOrder` hay không (hiện: không). Mặc định `blockOrder` cho cài mới giờ gồm 8 khối (defaultValue lấy từ `HOMEPAGE_BLOCKS`).
- `rentals.categories`: `filterOptions { scope: rental }` + `validate` server (đọc lại scope; API/seed không lách được) — theo mẫu `scopedCategoryField`. `chipProjects`/`news.posts` không lọc trạng thái xuất bản trong schema (giống `featuredProjects`/`featuredOffers`); lọc published/có bản EN làm ở tầng hiển thị.
- Tab admin: "Thanh thông báo" (đầu), "Hero" chứa thêm group `heroSearch`, "Cho thuê" + "Tin tức" (trước "Đối tác").
- Dịch: thêm `announcementBar`, `heroSearch`, `rentals`, `news` vào `TRANSLATABLE_FIELDS.homepage` (`src/lib/translation/leaves.ts`); `translatable-fields.test.ts` khớp cấu hình thật PASS. `ctaBanner` đã có sẵn nên `secondaryLabel` được tự lấy. `link`/`secondaryLink`/ảnh/quan hệ không localized → không dịch.
- Ngoài danh sách việc nhưng cần để nhất quán: `ctaBanner.image` thêm vào `blockDeleteWhileUsedByHomepage` (xoá media đang dùng → 409, như `backgroundImage`); fixture test `tests/fixtures/homepage/payload-config.ts` thêm collection `News` (quan hệ `news.posts` cần collection đích).
- Migration hand-edit chỉ ở `down`: Postgres không DROP VALUE khỏi enum nên Payload tạo lại enum cũ bằng ép kiểu; nếu có hàng `blockOrder` = rentals/news thì ép kiểu lỗi → thêm `DELETE` các hàng đó + hàng `homepage_rels` có path `rentals.categories`/`news.posts`/`heroSearch.chipProjects` trước. `up` giữ nguyên bản Payload sinh.
- `seed/sample/homepage.ts` không đổi (khối mới trống, dùng mặc định); cập nhật mẫu thuộc task UI nếu cần.

## Verification summary (builder)
| Lệnh | Kết quả |
|---|---|
| `pnpm payload migrate:create homepage_market_blocks` | OK → `migrations/20261019_144259_homepage_market_blocks.{ts,json}` + `migrations/index.ts` |
| `pnpm payload migrate` (`tami_wt_bl020`) → `migrate:down` → `migrate` | PASS / PASS (108ms) / PASS; sau đó homepage còn 3 slide, 6 hàng blockOrder, `announcement_bar_enabled=false`, `rentals/news_enabled=true` |
| `pnpm payload generate:types` / `generate:importmap` | OK (`src/payload-types.ts` cập nhật; importMap.js chỉ do regen, kiểm diff trước commit) |
| `pnpm lint` | PASS (0 error; 2 warning có sẵn ở `tools/task-dashboard/server.mjs`) |
| `pnpm typecheck` | PASS |
| `pnpm test` (toàn bộ, DB `tami_wt_bl020`) | 262/264 file, 2761 pass / 1 fail / 5 skip. Fail: `jobs-email.test.ts` (beforeAll timeout 10s khi chạy cả bộ) và `media-upload.test.ts` "khách đọc được danh sách và file media" (404 từ SeaweedFS) — đều ngoài diff, **chạy riêng lại: 25/25 PASS** (môi trường/tải) |
| `pnpm build` | Không chạy (theo yêu cầu: lỗi do path `.claude/worktrees`) |

### SQL migration (up) — chỉ additive
```sql
ALTER TYPE "enum_homepage_block_order_block" ADD VALUE 'rentals'; ... ADD VALUE 'news';
ALTER TABLE "homepage" ADD COLUMN announcement_bar_enabled boolean DEFAULT false, announcement_bar_link varchar,
  hero_search_enabled boolean DEFAULT true, rentals_enabled boolean DEFAULT true, news_enabled boolean DEFAULT true,
  cta_banner_image_id uuid, cta_banner_secondary_link varchar;           -- (mỗi cột 1 ALTER)
ALTER TABLE "homepage_locales" ADD COLUMN announcement_bar_text, hero_search_placeholder, rentals_title, news_title, news_intro, cta_banner_secondary_label (varchar);
ALTER TABLE "homepage_rels" ADD COLUMN categories_id uuid, news_id uuid;
FK: homepage.cta_banner_image_id -> media ON DELETE set null; homepage_rels.categories_id/news_id -> categories/news ON DELETE cascade
INDEX: homepage_cta_banner_cta_banner_image_idx, homepage_rels_categories_id_idx, homepage_rels_news_id_idx
```
Không DROP/đổi type/NOT NULL/backfill → không HIGH_RISK_MIGRATION. Down: DELETE hàng giá trị mới, DROP FK/INDEX/COLUMN, tạo lại enum 6 giá trị (enum mới không thể "bỏ giá trị" — down thay enum chứ không DROP VALUE).

### Test thêm
- `tests/integration/homepage.test.ts` (+5): khối mới save/read + default enabled; EN lưu riêng chữ localized, link/ảnh dùng chung, chưa có EN = trống (fallback false); link sai → 400; giới hạn 6/4/3 → 400; `rentals.categories` chặn scope khác + `news.posts` lưu bài thật; blockOrder nhận `rentals`/`news`, cũ 6 khối hợp lệ, trùng → 400.
- `src/lib/home/home-view.test.ts` (+1): `rentals`/`news` trong blockOrder + đã bật vẫn chưa hiện; homepage cũ render như trước.

## Residual risk
- UI chưa render khối mới (đúng phạm vi); cần quyết định hành vi "khối mới thiếu trong blockOrder" ở P2-T03/T04 (xem Decision log).
- Test integration in cảnh báo "không xếp được job dịch / revalidatePath ngoài Next" là ồn có sẵn của fixture, không phải lỗi.
- Hook dịch: `enqueueTranslation.globalAfterChange` tính hash từ `TRANSLATABLE_FIELDS` → lưu text mới (announcementBar/rentals/news/…) sẽ xếp job dịch EN như các khối hiện có (đọc code + test khớp cấu hình; chưa chạy job Claude thật).

### Minor fixes after review r1 (builder)
- MINOR-1: `homepage.test.ts` "video slide, ảnh Về TAMI, nền CTA..." thêm `ctaBanner.image` → xoá media đó trả 409; cleanup đặt `image: null`.
- MINOR-2: tách `validateRentalCategories`, `announcementBarBlock`, `heroSearchBlock`, `rentalsBlock`, `newsBlock` + `enabledField`/`titleField` + hằng số giới hạn + nhãn khối Cho thuê/Tin tức sang `src/globals/homepage/blocks.ts` (92 dòng); `Homepage.ts` còn 255 dòng và re-export 3 hằng `*_MAX`. `enabledField`/`titleField` đổi sang `as const satisfies Field` (khai báo `: Field` mất narrowing khi import qua module). Schema không đổi: `generate:types` cho `payload-types.ts` giống hệt byte-by-byte, `migrate:create` thử lại không sinh file mới (thoát code 13 = không có thay đổi), không có migration mới.
- MINOR-3: test giới hạn tạo 5 danh mục rental thật; 4 lưu được, 5 → 400 (đúng do `maxRows`).
- MINOR-4: test blockOrder nay assert `defaultValue` của field = `HOMEPAGE_BLOCKS` (8 khối); tên test cập nhật.
- `importMap.js`: chỉ khác line ending (CRLF), để nguyên, primary loại khỏi commit.
- Kết quả: `pnpm lint` 0 error (2 warning cũ); `pnpm typecheck` PASS; `vitest run src/lib src/globals src/hooks` 101 file / 1015 test PASS; `vitest run tests/integration/homepage.test.ts` 27/27 PASS (DB `tami_wt_bl020`).
