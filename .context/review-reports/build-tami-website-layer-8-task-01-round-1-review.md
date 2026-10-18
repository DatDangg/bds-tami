Agent: reviewer

# Review — build/tami-website · layer-8-task-01 (global `homepage`) · round 1

- **Review level:** STRICT
- **Reason:** migration schema mới (8 bảng, 3 enum, `down` sửa tay); quyền ghi admin-only; validator upload video; hook revalidate gắn vào collection dùng chung `services`; `PUBLIC_GLOBAL_SLUGS` / `TRANSLATABLE_GLOBALS` dùng chung; seed.
- **Blast radius:** `src/globals/Homepage.ts`, `src/hooks/homepage/*`, `src/collections/Services.ts` (thêm hook afterChange/afterDelete), `src/lib/content/global-cache.ts` (cache tag công khai), `src/lib/translation/allowlist.ts` (pipeline dịch AI), `src/payload.config.ts`, `src/payload-types.ts`, `migrations/20261018_091949_homepage_global.*` + `migrations/index.ts`, `seed/index.ts` + `seed/sample/homepage.ts`, `tests/fixtures/services-pages/payload-config.ts`, docs ERD/ARCHITECTURE. Client: admin Payload, trang chủ công khai (layer 9), job dịch AI.

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 157 file, 1.712 test (72s). Log có cảnh báo `revalidatePath` ngoài Next, đúng như thiết kế (đã bắt lỗi) |
| `pnpm build` | PASS (exit 0) |
| `pnpm payload migrate` (DB dev, theo yêu cầu primary) | PASS: `Migrated: 20261018_091949_homepage_global (29ms)`. Đã áp lên DB dev dùng chung; không reset, không push |
| `pnpm install --frozen-lockfile` | không chạy (diff không đổi lockfile/package.json) |

## Responsive Checklist Gate

N/A: diff không đụng route/component/CSS công khai (chỉ cấu hình global trong admin Payload + hook + migration + seed).

## Skill gates

- aislop: skip, chưa cài `aislop`
- oxlint (anti-slop): skip, chưa cấu hình oxlint (không có `.oxlintrc*`); ESLint PASS
- ocr (open-code-review): skip, chưa cài `ocr`
- AI-readable: OK. Các file ≤ 300 dòng (Homepage.ts 195, seed 133, test 262), các hàm ≤ 50 dòng, hằng có tên (`HERO_VIDEO_MAX_BYTES`, `HERO_SLIDES_MAX`...), comment giải thích WHY, ERD/ARCHITECTURE đã cập nhật. 0 indicator.
- ai-friendly-web: N/A (không phải task public web surface)
- blitzstrike: skip, chưa cài / không có môi trường pentest được phép

## Kiểm theo yêu cầu đặc biệt

- **Migration additive:** chỉ có `CREATE TYPE/TABLE/INDEX` + `ADD CONSTRAINT` trên bảng mới. FK trỏ tới bảng có sẵn (`media`, `projects`, `services`, `property_posts`) chỉ là ràng buộc ở phía bảng mới, không đổi bảng cũ. `down` drop đúng 8 bảng + 3 enum mà `up` tạo (đã đối chiếu từng tên), dùng `IF EXISTS ... CASCADE`, không lệch. Cột/bảng khớp ERD §4.15 và các field trong `Homepage.ts` (slides, about.stats, block_order, rels projects/services/property_posts, locales, translation_*, seo_*). Không phải HIGH_RISK_MIGRATION. Snapshot JSON: không có test drift, chấp nhận kèm residual risk.
- **RBAC:** `access: { read: () => true, update: isAdmin }`; có test sale → 403 và khách đọc được. Group `translation` khách đọc được, nhưng PERMISSION.md:93 quy định "chỉ đọc với tất cả", giống header/footer/site-settings, nên không tính là finding.
- **Validator video:** `filterOptions` `mimeType in [mp4, webm]` + validator `upload` mặc định (lúc submit chạy `validateFilterOptions`, id không tồn tại hoặc sai MIME → 400) + đọc lại `mimeType`/`filesize` thật. Chưa tìm được cách lách khi submit. Xem MINOR-2 cho event `onChange`.
- **Hook services:** chỉ revalidate (không ghi DB) nên không có vòng lặp. Chỉ chạy khi bản ghi đang hoặc vừa công khai, nên nháp không làm mới cache (có test). Ngoài Next thì `revalidateTagsWithNext`/`revalidateWithNext` bắt lỗi và chỉ ghi warn. Gộp hook đúng thứ tự qua `withContentDefaults` (`...collection.hooks?.afterChange`).
- **Seed:** chỉ nằm trong `SAMPLE_STEPS`; `--sample` + `APP_ENV=production` thì ném lỗi (seed/index.ts:111-112). Idempotent: đã có slide thì bỏ qua.
- **Allowlist dịch:** thêm `homepage` vào `TRANSLATABLE_GLOBALS`, có test cả nhánh cho phép lẫn nhánh chặn. Bên gọi chọn field; các field localized của homepage là chữ công khai.

## Findings

### [MAJOR-1] `ctaBanner.title` bắt buộc khi `enabled` bị lách được qua bản `en`
- `src/globals/Homepage.ts:45-49`: `validateCtaTitle` trả `true` ngay khi `req.locale !== "vi"`. Nhưng `ctaBanner.enabled` **không localized**. Admin đang ở tab EN tick `enabled` (bản vi chưa có title) rồi lưu thì lưu được. Kết quả: global có `enabled = true` mà `title` vi rỗng, vi phạm AC "ctaBanner (`title` bắt buộc khi `enabled`)" và ERD §4.15. Trang `/vi` sẽ hiện banner không có tiêu đề, trừ khi layer 9 tự che.
- Test hiện có (tests/integration/homepage.test.ts:189-197) lưu bản vi có title **trước**, rồi mới lưu en, nên không phủ đường này.
- **Fix đề xuất:** khi locale ≠ vi và `enabled === true`, đọc title vi đang lưu (`req.payload.findGlobal({ slug: "homepage", locale: "vi", fallbackLocale: false, depth: 0, overrideAccess: true, req })`, lấy `ctaBanner.title`). Nếu rỗng thì trả lỗi "Cần tiêu đề (tiếng Việt) khi bật khối kêu gọi hành động". Thêm test: đặt `enabled:false` + title vi rỗng, rồi `updateGlobal` locale `en` với `{ ctaBanner: { enabled: true } }` → 400.

### [MINOR-1] Xoá media đang là ảnh slide hero → lỗi 500
- `migrations/20261018_091949_homepage_global.ts`: cột `homepage_hero_slides.image_id uuid NOT NULL` + FK `ON DELETE set null` (mẫu Payload sinh cho upload bắt buộc). Xoá hẳn media đang dùng thì Postgres báo vi phạm NOT NULL, ra 500 thay vì 409 có thông báo. Hướng xử lý tương tự provinces/wards (ERD đã ghi). Sale cũng xoá được media của mình (`ownedByUserOrAdmin`).
- **Đề xuất:** thêm hook `beforeDelete` cho `media` để chặn 409 khi media đang được global `homepage` tham chiếu, hoặc ghi vào gap register / task riêng. Không chặn PASS.

### [MINOR-2] `validateHeroVideo` truy vấn DB và có thể ném lỗi ở event `onChange`
- `src/globals/Homepage.ts:27-37`: validator `upload` mặc định trả `true` sớm khi `event === "onChange"` (node_modules/payload/dist/fields/validations.js:564), nên mỗi lần dựng form-state trong admin vẫn chạy `findByID`. Nếu id đã bị xoá thì `findByID` ném `NotFound` (lỗi không được bắt) thay vì trả thông báo.
- **Đề xuất:** thêm `if (options.event === "onChange") return true;`, hoặc dùng `payload.find({ where: { id: { equals } }, limit: 1 })` / `disableErrors: true` rồi trả chuỗi lỗi khi không có.

### [MINOR-3] Thiếu test cho nhánh `afterDelete` của hook services
- `src/hooks/homepage/revalidate-homepage-on-service.ts:17-20`: chưa có test xoá hẳn một dịch vụ đang công khai → làm mới `global:homepage`. Nhánh xoá mềm (đi qua afterChange) cũng chưa có assert riêng.
- **Đề xuất:** thêm 1 case vào `tests/integration/homepage.test.ts` mục "revalidate".

### [MINOR-4] Seed mẫu chọn cả dịch vụ/dự án đã xoá mềm
- `seed/sample/homepage.ts:82-85`: `findIds` chỉ lọc `status: published`, không lọc `deletedAt: { exists: false }`. Chỉ ảnh hưởng dữ liệu dev/staging.

## Residual risk

- Snapshot `migrations/20261018_091949_homepage_global.json` khớp `payload-types`/config: chưa chạy `migrate:create` để dò drift (reviewer không được tạo file). Typecheck + test up→down→down→up PASS và migrate dev PASS, nên rủi ro thấp.
- `media.mimeType`/`filesize` là giá trị lưu trong DB. Validator tin hai giá trị này. Chưa kiểm được API có cho owner PATCH `mimeType` hay không (ngoài scope, collection `media` có sẵn từ L2-T02).
- AC1, vế "FR-ADM-16 (`publishedAt ≤ now`) phải loại trừ services/pages": FR-ADM-16 chưa được implement ở đâu (`src/access/publishedOnly.ts` chưa có điều kiện `publishedAt`), nên chưa kiểm được. Cần ghi rõ ràng buộc này vào task FR-ADM-16.
- Migration đã áp lên DB dev dùng chung. Worktree L8-T03/T04 nếu sinh migration mới cần merge snapshot cẩn thận.

## Verdict

**FAIL**: còn 1 MAJOR (MAJOR-1). Builder sửa MAJOR-1 kèm test hồi quy; nên sửa luôn MINOR-2 và MINOR-3 trong cùng round. MINOR-1 có thể tách task riêng.
