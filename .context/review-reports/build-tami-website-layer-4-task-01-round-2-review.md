Agent: reviewer

# Review — build/tami-website · layer-4-task-01 · round 2

- **Review level:** STRICT
- **Reason:** schema + migration mới; quy tắc xoá (hard + soft); RBAC; sửa shared factory `withContentDefaults` + shared `slugField` (mọi collection nội dung layer 5+). Round 2 kiểm lại fix MAJOR-1/MINOR-1..3 và tìm regression.
- **Blast radius:** `src/collections/Categories.ts` (`disableDuplicate`, hook `lockCategoryScope`), `src/hooks/categories/{lock-scope,validate-tree}.ts`, `src/fields/slug.ts` (`isAllowedScope` — nằm trong shared `slugField`, chỉ chạy khi có `scopeField`); bảng `categories*`/`developers*` (migration `20261017_031052_categories_developers`); seed `pnpm seed:categories`; ERD §4.3/§4.4/§5.

## Verify commands + result (reviewer tự chạy)

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | OK |
| `pnpm lint` | OK (eslint, 0 lỗi) |
| `pnpm typecheck` | OK (`tsc --noEmit`) |
| `pnpm test` | 66 file / 672 test PASS (gồm test round 2: MAJOR-1, MINOR-1/2/3 trong `tests/integration/categories.test.ts:207-257`) |
| `pnpm build` | OK (bảng route Next in ra, không lỗi) |
| `pnpm payload migrate:status` | 7/7 Ran, `20261017_031052_categories_developers` batch 7 |
| Drift | Reviewer không chạy `migrate:create` (không tạo migration vào repo). `git status migrations/` chỉ có migration của task + `index.ts` → builder không để lại file `drift_check_tmp`; chấp nhận evidence builder ("No schema changes detected"). Round 2 không đổi schema (chỉ hook/access/config `disableDuplicate`) → không cần migration mới. |

## Responsive Checklist Gate
N/A — diff không đụng UI (route/component/CSS).

## Skill gates
- aislop: skip, `aislop` không cài
- oxlint (anti-slop): skip, oxlint not configured (eslint OK)
- ocr (open-code-review): skip, ocr not installed
- AI-readable: OK — hook mới ngắn (lock-scope 4 dòng logic), comment giải thích WHY, không magic number, không indirection thêm; 0 indicator
- ai-friendly-web: N/A (không public-facing)
- blitzstrike: skip, không cài / không có môi trường

## Kiểm theo yêu cầu round 2

### MAJOR-1 (duplicate) — ĐÓNG
Mọi đường duplicate trong Payload 3.91 đều bị chặn bởi `disableDuplicate: true` (`src/collections/Categories.ts:25`):
- **REST** `/api/categories/:id/duplicate`: `collections/config/sanitize.js:95` bỏ endpoint duplicate khi `disableDuplicate === true` → route không tồn tại; thêm lớp chặn ở `collections/operations/create.js:106` (`isDuplicating && disableDuplicate`) cho mọi lối gọi create có `duplicateFromID`.
- **Local API** `payload.duplicate`: `collections/operations/local/duplicate.js:10` ném lỗi → test `categories.test.ts:208-223` xác nhận 400 và chỉ còn 1 bản (en, news, `duplicate-me`).
- **GraphQL**: đã tắt (`src/payload.config.ts:60` `graphQL: { disable: true }`); kể cả bật, `@payloadcms/graphql/.../initCollections.js:303` không đăng ký mutation `duplicate*`.
- **Admin UI**: nút Duplicate ẩn theo `collectionConfig.disableDuplicate` (hành vi chuẩn `@payloadcms/ui`); kể cả bị gọi thì endpoint REST đã bị gỡ. Không chạy browser → xem Residual risk.

### MINOR-1 (lock scope) — ĐÓNG, không regression
- `src/hooks/categories/lock-scope.ts:8-11`: chỉ tác động `operation === "update"` → create không bị ảnh hưởng (test tạo danh mục mọi scope vẫn PASS).
- Khôi phục từ trash = update `deletedAt: null`: hook chỉ ép lại đúng scope đã lưu → không đổi gì; `validateCategoryTree` chạy sau `lockCategoryScope` (`Categories.ts:27`) nên kiểm cây bằng scope đã khoá. Trường hợp "khôi phục con khi cha đang trong trash" không xảy ra được vì guard xoá mềm chặn xoá cha còn con (kể cả con trong trash, `guard-delete.ts:36`).
- Test `categories.test.ts:225-246` (overrideAccess, cả locale vi/en) PASS.

### MINOR-2 — ĐÓNG
`validate-tree.ts` đọc `deletedAt` và báo "Danh mục cha đang ở thùng rác." trước kiểm scope; test `:248-252` PASS. Update thường của con (đổi tên) không bị chặn vì cha không thể nằm trong trash khi còn con.

### MINOR-3 — ĐÓNG
`src/fields/slug.ts:41-45,70`: scope ngoài enum → trả `base`, không truy vấn cột enum; select validate trả 400 (test `:254-256`).
An toàn với collection khác: `isAllowedScope` chỉ chạy khi có `scopeField` (hiện chỉ `categories`); trường không phải `select` → `true` (giữ hành vi cũ). Lưu ý nhỏ: nếu sau này `scopeField` nằm trong named group (không có trong `flattenedFields` cấp đầu) thì `find` ra `undefined` → coi là hợp lệ và quay lại hành vi cũ (có thể 500) — không phải regression, không ảnh hưởng hiện tại.

### MINOR-4 — chấp nhận residual (lỗi race unique báo trên trường ẩn `scopeSlug`).

## Findings

### [MINOR-1] `developers` duplicate gán slug locale khác thành `xyz - Copy` (sai định dạng `[a-z0-9-]`)
- `src/collections/Developers.ts:23-50` (không `disableDuplicate`) + shared `src/fields/slug.ts:109-119` (`unique: true` khi không có `scopeField` → Payload gắn `beforeDuplicate` mặc định `${value} - Copy` cho mọi locale; hook slug `beforeValidate` chỉ chuẩn hoá locale đang ghi).
- **Đánh giá mức:** MINOR, chấp nhận làm follow-up. Lý do: (1) root cause là `slugField` chung có từ layer 3 (commit 0e3a8d7), đã ảnh hưởng mọi collection nội dung, không do task này sinh ra; `developers` chỉ thừa hưởng; (2) không phá ràng buộc UNIQUE/invariant dữ liệu (khác MAJOR-1 của categories) — chỉ sinh slug xấu ở locale phụ, admin sửa tay được; (3) `developers` có `route: null` (không có trang chi tiết theo slug) nên không sinh URL công khai hỏng; (4) fix đúng chỗ là `beforeDuplicate` chung trong `slugField` → phạm vi rộng hơn task.
- **Điều kiện:** follow-up đã ghi trong task file (Follow-up (2)); khi close-out primary phải đưa thành mục backlog/task riêng (vd `spec/changes/BACKLOG.md` hoặc AC layer 5 task đầu tiên dùng `slugField`) để không mất trước khi collection nội dung layer 5 mở nút Duplicate. Fix gợi ý: `slugField` thêm `hooks.beforeDuplicate: [({ value, req }) => locale ≠ req.locale ? null : value]` hoặc slugify + dedupe; tạm thời có thể đặt `disableDuplicate: true` cho `developers`.

### [MINOR-2] Task file "Verify commands + result" cũ còn ghi 667 test
- `tasks/tami-website/layer-4-task-01.md` (dòng "Verify commands + result (Builder, sau lần sửa cuối) … 667 test") song song với dòng attempt 2 (672). Không sai sự thật (đánh dấu theo attempt) nhưng dễ đọc nhầm; nên ghi rõ "attempt 1" khi close-out. Không chặn PASS.

Không có CRITICAL/MAJOR. Không phát hiện regression (672/672 PASS; `test-content` + test factory cũ vẫn PASS; drift không có).

## Residual risk
- Ẩn nút Duplicate trong admin xác minh qua config Payload, không chạy browser (reviewer không chạy app). Lớp chặn server (endpoint bị gỡ + `create.js:106`) đã đủ đảm bảo invariant.
- Drift schema ↔ migration dựa evidence builder (`migrate:create` báo no changes); reviewer không chạy lại để không tạo file vào repo.
- MINOR-1 (developers duplicate) kết luận từ đọc source Payload, chưa có test tái hiện.
- Dockerfile chưa COPY `seed/` — follow-up layer-6-task-01 (đã ghi task file) trước deploy staging.

## Verdict
✅ **PASS** — MAJOR-1 round 1 đã đóng ở mọi đường duplicate, MINOR-1..3 đóng có test, không regression. 2 MINOR còn lại là follow-up/ghi chú, không chặn commit.
