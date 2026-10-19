Agent: reviewer

> Ghi bởi primary (change-request) — guard chặn reviewer ghi vào worktree. Nội dung theo báo cáo reviewer.

# Review: feature-public-ui-market-vinhomes · phase-5-task-01 · round 1

## Review level
**STRICT** — schema DB + migration; đổi allowlist dịch và collection Projects mọi client đọc.

## Blast radius
- Bảng `projects`, `_projects_v` + 16 bảng mảng/`_locales` mới.
- `src/collections/Projects.ts` (tab "Nội dung mở rộng", list filter).
- `TRANSLATABLE_FIELDS.projects` (`src/lib/translation/leaves.ts`).
- `src/payload-types.ts`, `docs/ERD.md` §4.5.
- Không ảnh hưởng: UI công khai (P5-T02), access, `englishRequiredFields`.

## Verify (worktree `D:/prj/bds/.claude/worktrees/bl020-p3p5`)
- `pnpm lint`: PASS 0 error (2 warning ngoài diff).
- `pnpm typecheck`: PASS.
- `pnpm test src/collections src/lib/translation src/lib/admin tests/integration/projects.test.ts`: 14 files / 168 tests PASS; integration chạy DB thật ("Pulling schema from database"), chạy lại `projects.test.ts` + `market-blocks.test.ts`: 2 files / 35 tests PASS.
- Migrate up/down/up, full test (288 / 3032 PASS), build: primary + builder.

## Migration inspection (`migrations/20261019_215847_project_detail_market_blocks.ts`)
**up()**: 4 `CREATE TYPE` · 16 `CREATE TABLE` (4 mảng + 4 `_locales` cho `projects`, 4 + 4 cho `_projects_v_version_*`) · 2 `ADD COLUMN` nullable không default (`projects.price_updated_at`, `_projects_v.version_price_updated_at`) · 16 FK `ON DELETE cascade` trên bảng mới · 32 index trên bảng mới. Không DROP, đổi type, `SET NOT NULL`, FK/UNIQUE trên dữ liệu cũ, backfill. **Không HIGH_RISK_MIGRATION.**
- `category … DEFAULT 'other' NOT NULL` trên bảng **mới, rỗng** — an toàn.
- `NOT NULL` cột locales (`title`, `name`, `unit_type`, `question`, `answer`) chỉ áp hàng được ghi, khớp `required` của Payload.
- `geometry(Point)` cần PostGIS — đã bật (`projects.location`, migration `20261017_125429_projects` `CREATE EXTENSION`).
**down()**: drop 16 bảng (`CASCADE`) → 2 cột → 4 type, đúng thứ tự; chỉ phá dữ liệu do migration này thêm; cùng mẫu tiền lệ P2.

## Kiểm code/logic
- Tuỳ chọn: 5 field top-level không `required`, `englishRequiredFields` không đổi, access không đổi; dự án không khối lưu được (integration).
- Validator khoảng: `notBelow` gọi `number(value, options)` của Payload trước (field spread vào options, `beforeChange/promise.js:110`) → `min: 0` vẫn áp; một đầu / `null` / bằng nhau qua; ngược → 400 (integration).
- Localized required trong mảng không localized: cùng mẫu `amenities[].name`, `floorPlans[].title`; dự án cũ không có hàng → không chặn EN.
- Dịch mảng (đã đọc `leaves.ts`): `walkRows` phát leaf theo `id` hàng, chỉ `text`/`textarea` localized (không gửi `icon`, `distance`, `category`, số, `availability`); `buildEnglishWrite` clone mảng EN (chung id) và ghi vào hàng qua `stepInto` theo `rowId`; key mới chỉ xuất hiện khi có hàng → dự án EN đã duyệt không có khối không bị stale. Test allowlist PASS.
- Admin: nhãn VI; ẩn `priceUpdatedAt` khỏi list filter theo mẫu BL-021 #06.
- `payload-types.ts`: +101 dòng, chỉ 5 field mới trong `Project` + select type; không drift.
- Tests: unit (tuỳ chọn, `maxRows`, localized, validator) + integration (lưu/đọc, xoá `[]`, khoảng ngược, số âm, enum lạ, thiếu required, > 8 highlights).

## Skill gates
aislop/oxlint/ocr skip; AI-readable OK; ai-friendly-web/blitzstrike N/A; Responsive gate N/A (không UI công khai).

## Findings
1. **[MINOR]** `docs/ERD.md:242` đếm bảng sai ("8 bảng mảng + 8 bảng `_locales` + 16 …") → "4 bảng mảng + 4 bảng `_locales` cho `projects` và 8 bảng tương ứng cho `_projects_v` (16 bảng)". **Primary đã sửa trước commit.**
2. **[MINOR]** `src/collections/projects/market-blocks.ts:108-111` `vndRange` gắn `Cell: VndCell` cho field trong mảng (không bao giờ là cột list) → dùng `rangeNumber`, bỏ `vndRange`. *(Chuyển P5-T02.)*
3. **[MINOR]** `market-blocks.ts:36-37` `MAX_NEARBY_AMENITIES = 40`, `MAX_PRICE_ROWS = 30`, `required` cho `nearbyAmenities.name`, `faqs.answer` ngoài đề xuất — hợp lý, đã ghi ERD → nêu trong spec delta. *(Ghi là quyết định agent.)*
4. **[MINOR]** Thiếu test `areaTo`/`priceTo` âm qua validator tuỳ biến → thêm `priceTable: [{ unitType: "A", areaTo: -1 }]` → 400. *(Chuyển P5-T02.)*

## Residual risk
Reviewer không chạy lại migrate up/down / build; trải nghiệm admin EN khi có hàng chưa dịch (chặn lưu như amenities) chưa thử trình duyệt.

## Verdict
**PASS**
