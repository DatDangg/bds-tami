Agent: reviewer

# Review — feature-admin-list-columns-filters-locale · phase-1-task-02 · round 1

- **Review level:** STRICT
- **Reason:** `localization` là config toàn cục (frontend `[locale]`, job dịch, Local API, payload-types); CSS global `.popup__content` đụng mọi popup Payload; `listSearchableFields` gán cho 13 collection qua helper dùng chung.
- **Blast radius:** `src/payload.config.ts` (localization), `src/collections/admin-collections.ts` (ADMIN_COLLECTIONS → mọi collection admin), `src/components/admin/styles/_surfaces.scss` (mọi popup admin + Localizer), `src/lib/admin/payload-vi-overrides.ts` (khoá `general:filters`), test mới `src/collections/admin-list-search.test.ts`.

## Verify commands + result
- `pnpm vitest run src/lib src/collections src/components/admin` → 133 files / 1322 tests PASS.
- `pnpm typecheck` → PASS (tsc --noEmit, 0 lỗi).
- `pnpm lint` → 0 error, 2 warning cũ (`tools/task-dashboard/server.mjs`, ngoài diff).

## Kiểm từng điểm
1. **D5–D8 vs FR-ADM-19 "Danh sách gọn (BL-039)":** khớp. Spec câu FR-ADM-19 ghi rõ "vị trí nút do thanh công cụ Payload quyết định — chỉ đặt sau hàng chip nếu làm được bằng CSS, không thay component Payload; không được thì giữ vị trí" → D7 giữ vị trí là hợp lệ (đã ghi residual). Acceptance dòng 27 của change doc ("đặt sau hàng chip") được spec delta nới lỏng — chấp nhận.
2. **`localization.locales` dạng object:** Grep `localization.locales|localeCodes` trong `src/` → không code nào đọc ngoài test mới; các `locales.map/filter` (hooks revalidate, `build-search-text.ts`, sitemap, LanguageSwitcher) dùng `locales` của `src/i18n` (next-intl), không phải config Payload. `req.locale`/Local API `locale` vẫn là code `vi`/`en` (Payload sanitize cả 2 dạng; test xác nhận `localeCodes = ["vi","en"]`, `defaultLocale = "vi"`). `fallback: false` giữ. Không vỡ frontend `/en`/job dịch.
3. **`listSearchableFields`:** đối chiếu trường thật — JobApplications `fullName`/`phone` text, `email` email (field access chỉ chặn create/update, read mở → query được); Staff `fullName` text, `email` email; Provinces/Wards `name` text; Media `alt` text (localized), `filename` built-in upload. `withListSearchableFields` bỏ qua collection đã khai báo → Lead (`LEAD_LIST_SEARCHABLE_FIELDS`, chuẩn hoá SĐT BL-021, dùng chung xuất Excel) và Rentals (`code,title,address`) không bị ghi đè; cả 2 không có trong map. Trường localized (`title`, `alt`) tìm theo locale đang chọn, `fallback:false` → tìm bản en khi ở en — hợp lý. Không thêm index/migration; `like` trên cột text bảng admin nhỏ — chấp nhận.
4. **CSS:** Payload 3.91 `Popup/index.scss` (trong `@layer payload-default`) đã có `.popup__content { z-index: var(--z-popup); max-width: calc(100vw - var(--base)); }` và không có rule nào khác nâng z-index/max-width của `.popup__content` theo ngữ cảnh → rule unlayered mới chỉ lặp lại (max-width 16px thay 20px), không làm xấu menu cột/bulk/select. `.localizer__locale-code` chỉ render trong Localizer (`Localizer/index.js:83-93`); khi có label, span chỉ chứa "(vi)" → ẩn không mất thông tin. 375px: max-width ≤ viewport.
5. **`general.filters`:** chỉ dùng ở `@payloadcms/ui/dist/elements/ListControls/index.js:121` (+ bản bundle `exports/client/index.js` cùng component) → ghi đè an toàn.

## Responsive Checklist Gate (diff đụng CSS admin)
- Layout / không horizontal scroll: OK — popup `max-width: calc(100vw - 16px)`, không thêm width cố định.
- Mobile-first / grid: N/A (không thêm layout/grid).
- Typography rem / clamp: N/A (không đổi font/spacing).
- Media: N/A.
- Touch target ≥44px: N/A (không đổi kích thước nút; nút do Payload).
- Nav mobile / table: N/A.
- 100vh / reduced-motion / overflow:hidden: OK — không dùng.
- Residual: chưa xem trực quan popup ở 375px trong browser (builder cũng ghi residual); xác minh bằng CSS math.

## Skill gates
- aislop: skip, không nằm trong verify commands được allow.
- oxlint (anti-slop): skip, oxlint not configured (lint = eslint, 0 error).
- ocr: skip, ocr not installed / không trong allowlist.
- AI-readable: OK — tên rõ (`LIST_SEARCHABLE_FIELDS`, `withListSearchableFields`), hàm ngắn, comment nêu WHY; 0 indicator đáng kể.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: N/A (không đụng auth/input public).

## Findings
- [MINOR] `src/components/admin/styles/_surfaces.scss:153-157` — rule `.popup__content` gần như trùng Payload (cùng `--z-popup`, max-width 16 vs 20px); comment ngụ ý nó sửa lỗi "chữ xuyên qua" trong khi builder không tái hiện được. Đề xuất: bỏ rule hoặc sửa comment cho đúng (chỉ là tường minh hoá).
- [MINOR] `src/components/admin/styles/_surfaces.scss:161-163` — nếu sau này thêm locale không có `label` (label === code), Payload đặt toàn bộ nhãn trong `.localizer__locale-code` → option thành trống. Hiện test `admin-list-search.test.ts` khoá label cho vi/en nên chấp nhận; đề xuất ghi chú ràng buộc "mọi locale phải có label" vào comment.
- [MINOR] `src/collections/admin-list-search.test.ts:35` — `expect(leads.listSearchableFields).not.toEqual(undefined)` yếu; nên `toEqual([...LEAD_LIST_SEARCHABLE_FIELDS])` để thực sự chứng minh không bị ghi đè.

## Verdict
PASS — không có CRITICAL/MAJOR. Các MINOR có thể xử lý sau, không chặn commit.
