Agent: reviewer

# Review — build/tami-website · layer-4-task-01 · round 1

- **Review level:** STRICT
- **Reason:** schema + migration mới; quy tắc xoá (hard + soft); RBAC đọc/ghi; sửa shared factory `withContentDefaults` + shared `slugField` (dùng cho mọi collection nội dung sau này).
- **Blast radius:** `src/collections/_shared/content-defaults.ts`, `src/fields/slug.ts`, `src/lib/slug.ts` (mọi collection nội dung layer 5+); `categories`/`developers` (bảng mới + `payload_locked_documents_rels` thêm 2 cột nullable); access `readUnlessTrashed`; seed `pnpm seed:categories`; ERD §4.3/§4.4/§5.

## Verify commands + result (reviewer tự chạy)

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | OK |
| `pnpm lint` | OK (0 lỗi) |
| `pnpm typecheck` | OK |
| `pnpm test` | 66 file / 667 test PASS (gồm `tests/integration/categories.test.ts`, chạy trên DB tạm) |
| `pnpm build` | OK |
| `pnpm payload migrate:status` (DB dev) | 7/7 migration Ran, `20261017_031052_categories_developers` batch 7 |
| Kiểm drift schema ↔ migration | skip — không có cách dry-run an toàn mà không sinh file migration; ghi Residual risk |

Migration soát tay: `up()` chỉ CREATE TYPE/TABLE/INDEX/FK + 2 cột nullable trên `payload_locked_documents_rels`; `UNIQUE (scope_slug, _locale)` trên `categories_locales`, `UNIQUE (slug, _locale)` trên `developers_locales`; `parent_id` FK `ON DELETE set null`. Không DROP/SET NOT NULL/backfill ở `up()` → không phải HIGH_RISK_MIGRATION.

## Responsive Checklist Gate
N/A — diff không đụng UI (route/component/CSS).

## Skill gates
- aislop: skip, `aislop` không cài
- oxlint (anti-slop): skip, oxlint not configured (eslint chạy OK)
- ocr (open-code-review): skip, ocr not installed
- AI-readable: OK — tên rõ, hàm ngắn (<50 dòng), file <300 dòng, comment giải thích WHY, ERD as-built cập nhật. 0–1 indicator
- ai-friendly-web: N/A (không public-facing)
- blitzstrike: skip, không cài / không có môi trường

## Kiểm theo yêu cầu

- **scopeSlug đồng bộ:** create / update partial / locale khác / đổi slug / khôi phục từ trash → OK (beforeChange hook dùng `siblingData` sau khi Payload merge `originalDoc`; scope bị strip khi không có quyền). Locale `all` → slug hook ném 400 (đã có từ layer 3). **Ngoại lệ: thao tác Duplicate → xem MAJOR-1.** Không lộ API (`hidden`), không ghi được qua API (`access create/update: denyAll`, test `scopeSlug không lộ ra API`).
- **Race trùng slug:** hai request đồng thời → UNIQUE `(scope_slug,_locale)` chặn, Payload trả lỗi unique (400) chứ không tạo bản trùng. Chấp nhận (MINOR-4 về thông điệp).
- **guard-delete:** hard (`beforeDelete`, đọc lại scope với `trash: true`) + soft (`beforeValidate`, `deletedAt` mới đặt) đều chặn; đếm con/nội dung kể cả trong trash; map scope→collection khớp ERD (`rentals`, `property-posts`, `news`, `projects`, `job-postings`, field `category`). OK.
- **Tree 2 cấp:** cùng scope, cha phải là gốc, không tự làm cha, cha không tồn tại, bản có con không được gắn vào cha khác → chặn mọi hướng, vòng A↔B bị chặn qua luật "cha phải là gốc". OK (MINOR-2 về cha đang ở trash).
- **RBAC:** khách đọc chỉ bản chưa xoá mềm (`deletedAt exists:false`, test `trash:true` → 0), staff active đọc tất cả, staff khoá không đọc; ghi/xoá chỉ admin (test sale 403). OK.
- **Factory:** `test-content` giữ nguyên trường/hành vi (test cũ PASS); `fieldAccess` bỏ `undefined`, ném lỗi tên lạ/đã omit; `omit: status` bắt buộc tự đặt `access.read`; không mở quyền. OK.
- **Slug `in` theo lô:** `findFreeSlug` đúng khi >20 trùng (lặp lượt; số nhỏ nhất trống chỉ trả khi thuộc lượt vừa hỏi → mọi số nhỏ hơn đã được kiểm); base max-length dùng chung `suffixedSlug` với `appendUniqueSuffix` nên ứng viên query = ứng viên chọn. OK.
- **Seed:** idempotent theo (scope, slugify(name)) có `trash: true`, không ghi đè; test chạy 2 lần. OK.

## Findings

### [MAJOR-1] Duplicate (nút "Duplicate" mặc định trong admin) phá vỡ UNIQUE (`_locale`, `scope`, `slug`) ở locale không phải locale đang ghi
- `src/fields/scope-slug.ts:23-33`, `src/fields/slug.ts:99-108` (`unique: !scopeField`), `src/collections/Categories.ts:15-58` (không `disableDuplicate`).
- Payload 3.91 gắn `beforeDuplicate` mặc định cho trường `unique` text: `${value} - Copy` (`node_modules/payload/dist/fields/setDefaultBeforeDuplicate.js:5-6`), và `beforeDuplicate` chạy trên **mọi locale** (`.../fields/hooks/beforeDuplicate/promise.js:31,100`). Khi duplicate một danh mục có bản `en`:
  - locale đang ghi (vi): slug hook dedupe + scopeSlug tính lại → đúng.
  - locale còn lại (en): `slug` (categories không còn `unique`) được copy nguyên → trùng slug en cùng scope; `scopeSlug` en thành `news/xyz - Copy` → UNIQUE DB **không bắt** → DB có 2 bản cùng (`en`, scope, slug) — đúng invariant AC "slug unique theo (`_locale`, `scope`, `slug`)" và ERD §4.3 as-built ("cùng ngữ nghĩa") bị vi phạm; URL `/en/...` theo slug ra 2 bản.
- Fix đề xuất (chọn 1):
  a) `scopeSlugField`: thêm `hooks.beforeDuplicate: [() => null]` **và** `slugField` khi có `scopeField`: `beforeDuplicate` trả `null` cho locale ≠ `req.locale` (để admin tự đặt lại slug en) — hoặc tính lại scopeSlug từ slug đã copy để UNIQUE chặn; hoặc
  b) `Categories`: `disableDuplicate: true` (đơn giản nhất cho danh mục nền).
- Thêm integration test: tạo category có vi+en → `payload.duplicate` → không tồn tại 2 bản cùng (en, scope, slug) (hoặc duplicate bị chặn).
- Ghi chú ngoài scope (đề xuất task riêng, không tính FAIL): collection `slug` unique (developers, và mọi collection nội dung layer 3) khi duplicate sẽ nhận slug en `xyz - Copy` (sai định dạng `[a-z0-9-]`) — nên có `beforeDuplicate` chung cho `slugField`.

### [MINOR-1] `scope` chỉ khoá với request không `overrideAccess`
- `src/collections/Categories.ts:35` — `access.update: denyAll` bị bỏ qua khi Local API `overrideAccess: true` (mặc định của Local API: seed/job/script sau này). Đổi scope khi đó chỉ tính lại `scopeSlug` của locale đang ghi (locale khác giữ scope cũ), con/nội dung không bị kiểm. ERD as-built ghi "sửa sau bị bỏ qua" chưa đúng tuyệt đối.
- Fix: thêm collection `beforeValidate` (hoặc field hook) ép `data.scope = originalDoc.scope` khi `operation === "update"`, bất kể overrideAccess.

### [MINOR-2] Cho phép gắn `parent` là danh mục đang trong trash
- `src/hooks/categories/validate-tree.ts:39-51` (`findByID` với `trash: true`, không kiểm `deletedAt`). Con hiện công khai trong khi cha bị ẩn với khách. Fix: trả lỗi khi `parent.deletedAt` có giá trị (vẫn giữ `trash: true` cho `hasChildren`).

### [MINOR-3] `scope` không hợp lệ đi vào truy vấn trước khi validate select
- `src/fields/slug.ts:59-71` — admin gửi `scope` ngoài enum qua REST: slug hook query `scope equals <giá trị lạ>` trên cột enum Postgres → có thể ra 500 thay vì 400. Fix: chỉ query khi `scope` thuộc options (vd truyền danh sách hợp lệ hoặc `CATEGORY_SCOPES.includes`), còn lại trả `base` để validate select báo lỗi.

### [MINOR-4] Lỗi race UNIQUE báo trên trường ẩn
- `src/fields/scope-slug.ts` — khi hai request ghi cùng slug đồng thời, lỗi unique gắn path `scopeSlug` (ẩn) → admin khó hiểu. Chấp nhận được; có thể map thông điệp sang `slug` sau.

## Đánh giá lệch task / residual builder
- UNIQUE qua field ẩn `scopeSlug` thay SQL tuỳ biến: **chấp nhận** (Payload-native, không drift migration, test DB chứng minh 23505) — với điều kiện sửa MAJOR-1.
- scope khoá sau khi tạo, `versions: false`, không status/author/isFeatured: **chấp nhận** (đúng ERD §4.3/§4.4 không có các trường đó).
- Dockerfile không COPY `seed/`: **chấp nhận làm follow-up**, nhưng phải có task/ghi chú ở DevOps trước deploy staging (staging cần danh mục mặc định).
- Reseed tạo lại mục admin đổi slug: chấp nhận (đã ghi trong doc seed).
- guard-delete chỉ test với `news` giả: chấp nhận theo AC (mỗi task nội dung thêm test).
- Test DB dùng push không chạy migration: residual — xem dưới.

## Residual risk
- Chưa xác minh drift schema config ↔ migration snapshot (không có dry-run an toàn); `migrate:status` chỉ chứng minh đã apply. Đề xuất builder chạy `pnpm payload migrate:create --skip-empty` trên DB dev ở nhánh tạm và xác nhận không sinh file.
- MAJOR-1 kết luận từ đọc source Payload 3.91 (beforeDuplicate chạy mọi locale + default unique hook), chưa chạy repro thực tế.

## Verdict
❌ **FAIL** — 1 MAJOR (MAJOR-1: Duplicate phá UNIQUE `(_locale, scope, slug)`). Builder sửa MAJOR-1 + test; MINOR-1..3 nên sửa cùng round (rẻ), MINOR-4 tuỳ chọn.
