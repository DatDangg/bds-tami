Agent: reviewer

# Review — feature-admin-vietnamese-wording · phase-1-task-01 · round 1 (BL-040 T01)

- **Review level:** NORMAL
- **Reason:** Chỉ đổi chữ hiển thị (i18n override) dùng chung cho toàn admin + 1 chuỗi thông báo xuất lead phải khớp nhãn toán tử. Không đụng auth/schema/API contract/dữ liệu; merge semantics của Payload đã xác minh trong source gói; có test khoá giá trị, tồn tại khoá, placeholder. Không có risk đỏ → không cần STRICT.
- **Blast radius:** mọi màn Payload admin (danh sách/bộ lọc/thùng rác/form/khoá sửa/phiên bản/tải lên/đăng nhập/toast lỗi); thông báo khoá nút "Xuất Excel" lead (`UNSUPPORTED_FILTER_MESSAGE`, `src/lib/leads/export-filters.ts:142-145`). Không ảnh hưởng site công khai, DB, API shape.
- **Scope reviewed:** `src/lib/admin/payload-vi-overrides.ts` (mới), `src/lib/admin/payload-vi-overrides.test.ts` (mới), `src/payload.config.ts` (khối i18n + import), `src/lib/leads/export-filters.ts`, `src/lib/leads/export-filters.test.ts`. File bẩn khác (T02/session khác) ngoài phạm vi.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/lib/admin src/lib/leads` | PASS — 12 files, 130 tests |
| `pnpm typecheck` (`tsc --noEmit`) | PASS — 0 error (tree gồm cả file T02) |
| `pnpm lint` (`eslint .`) | PASS — 0 error, 2 warning cũ ở `tools/task-dashboard/server.mjs` (ngoài scope) |

## Kiểm tra yêu cầu
- **Bảng mục 1–8:** đối chiếu từng dòng — đủ 102 khoá (1:16 · 2:5 · 3:22 · 4:21 · 5:13 · 6:8 · 7:15 · 8:2), chữ khớp nguyên văn cột "Đề xuất". Test `EXPECTED` khoá đúng 102 khoá + `toEqual` nên không thiếu/thừa khoá.
- **Khoá tồn tại trong `vi.js`:** test "mọi khoá override tồn tại" PASS (flatten `viTranslations` của gói 3.91.0); spot-check `general.documents` (vi.js:288), `version.changedFieldsCount_one` (vi.js:542).
- **Placeholder `{{…}}` / `<n>`:** test so tập marker từng override với chuỗi gốc PASS (vd `aboutToTrash`/`aboutToDelete` giữ `<1>{{title}}</1>`, `documentNotFound`/`loadingDocument` giữ `{{id}}`). `general.noLabel` loại trừ có chủ đích (giữ hành vi cũ).
- **Deep-merge:** `@payloadcms/translations/dist/utilities/init.js:90` — `deepMergeSimple(translations, config.translations[language])` → override một phần đè lên bản mặc định, khoá khác giữ nguyên. Cấu hình cũ `{ general: { noLabel } }` cũng dựa vào cơ chế này.
- **`general.noLabel: "—"`:** vẫn còn (overrides.ts:54), test assert `"—"`.
- **Thông báo xuất Excel:** chuỗi mới dùng "là", "là một trong", "có giá trị" = Không, "lớn hơn hoặc bằng" / "nhỏ hơn hoặc bằng" (vi.js:462/465 không đổi), "hoặc" (vi.js:362 `general.or`, không đổi) → khớp chữ trên màn lọc. Test `export-filters.test.ts:159,246` đã cập nhật.
- **Không còn chữ cũ trong `src`:** grep `"bằng"|"có trong"|"tồn tại"|= Sai|Bảng điều khiển|Danh sách phiên bản|Lưu Thay Đổi` trong `src/` → 0 kết quả.
- Không đổi slug/schema/URL/access; không cần migration.

## Responsive Checklist Gate
N/A — diff không đụng route/component/CSS; chỉ đổi chuỗi i18n (độ dài chuỗi mới ngắn hơn hoặc tương đương bản gốc ở hầu hết khoá).

## Skill gates
- aislop: skip — không chạy (ngoài allow-list verify commands của profile); diff nhỏ, không có dấu hiệu slop.
- oxlint (anti-slop): skip, oxlint not configured (không thấy trong verify commands; Glob tìm config bị timeout → residual risk). ESLint 0 error.
- ocr (open-code-review): skip, ocr not installed / không trong allow-list.
- AI-readable: OK — 0 indicator (tên rõ, file ≤ 160 dòng, không hàm > 50 dòng, comment 1 dòng/nhóm giải thích WHY).
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: N/A (không phải STRICT).

## Findings
- **[MINOR] Doc impact chưa reconcile:** `docs/API_SPEC.md:202` (as-built) còn mô tả thông báo xuất lead với nhãn cũ ("bằng", "có trong", "tồn tại" = Sai). Đây là as-built doc → close-out phải cập nhật sang "là", "là một trong", "có giá trị" = Không (cùng spec delta FR-ADM-19). Không chặn PASS của code, nhưng bắt buộc trước commit theo Doc Impact & Reconcile Rules.
- **[MINOR] Comment cũ trong export-filters:** `src/lib/leads/export-filters.ts:141` vẫn nói "lấy đúng nhãn tiếng Việt Payload … (`@payloadcms/translations` vi …)" — nay nhãn đến từ `PAYLOAD_VI_OVERRIDES` (+ gói cho `isGreaterThanOrEqualTo`/`isLessThanOrEqualTo`/`or`). Đề xuất sửa comment trỏ `src/lib/admin/payload-vi-overrides.ts`. Tuỳ chọn: thêm test nối 2 nguồn (assert message chứa `"${PAYLOAD_VI_OVERRIDES.operators.equals}"` …) để đổi nhãn lần sau không lệch thông báo.
- **[MINOR] Hệ quả phụ của `general.document(s)` = "Mục" / `general.true/false` = "Có/Không":** khoá dùng ở nhiều nơi khác trong `@payloadcms/ui` (vd cột checkbox, đếm mục khi xoá hàng loạt). User đã chấp nhận Q6/Q7; chưa xem admin thật → residual risk về câu ghép ngữ pháp (vd "{{count}} Mục").

Không có CRITICAL/MAJOR.

## Residual risk
- Chưa xác minh hiển thị trên admin thật (builder cũng ghi chưa xem trình duyệt); reviewer không chạy app.
- Không xác minh được có/không config oxlint (Glob timeout).

## Verdict
✅ PASS — 0 CRITICAL / 0 MAJOR / 3 MINOR. Close-out cần reconcile `docs/API_SPEC.md:202` trước commit.
