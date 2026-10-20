# feature-admin-list-columns-filters-locale · phase-1-task-02 — Ô ngôn ngữ "Tiếng Việt/English" + "Lọc nâng cao" + gợi ý ô tìm kiếm (BL-039 #3, #4 nút, #6)

- Change doc: `spec/changes/2026-10-20-admin-list-columns-filters-locale.md`. Spec delta: FR-ADM-19 câu "Danh sách gọn (BL-039)" (ô ngôn ngữ, "Lọc nâng cao", gợi ý tìm kiếm).
- Phụ thuộc: T01 (cùng file collection — chạy sau). Trạng thái: `pending`.

## Classification / Risk
- Type: **MODIFY** (`localization.locales` dạng object có `label`, ghi đè chữ Payload vi, SCSS, `listSearchableFields`). Không đổi schema/DB (locale code giữ `vi`/`en`).
- Risk: **MEDIUM** — `localization` là config toàn cục (frontend `[locale]`, job dịch, `payload-types`) → review **STRICT** (shared config).
- Blast radius: `src/payload.config.ts`, `src/lib/admin/payload-vi-overrides.ts` (+test), `src/components/admin/styles/*.scss`, `src/collections/*.ts` (`listSearchableFields`).
- Doc impact: FR-ADM-19 (đã ghi). Migration: không.

## Quyết định (auto proceed)
- D5 `localization.locales: [{ code: "vi", label: "Tiếng Việt" }, { code: "en", label: "English" }]`, `defaultLocale`/`fallback` giữ. Grep mọi chỗ đọc `config.localization.locales` / `localeCodes` / so sánh locale chuỗi (job dịch, hooks, test, `scripts/`) để không vỡ; `payload-types.ts` không đổi kiểu locale (`'vi' | 'en'`). Nhãn hiện cả trên nút lẫn danh sách xổ.
- D6 Danh sách xổ ngôn ngữ: nằm trên cùng (z-index cao hơn thanh công cụ danh sách/nút "Thùng rác"/"Tạo mới"), nền đặc theo token surface, viền/bóng; chữ "Thùng rác" không xuyên qua/đè; ở 375px nằm trong viewport (không tràn ngang). Chỉ SCSS trong `src/components/admin/styles/` (partial + token có sẵn), không override component Payload.
- D7 Nút bộ lọc của ListControls → chữ **"Lọc nâng cao"** bằng ghi đè khoá dịch trong `PAYLOAD_VI_OVERRIDES` (đúng khoá Payload 3.91 dùng cho nút; kiểm khoá đó không dùng chỗ khác làm sai nghĩa; cập nhật test khoá). Vị trí "sau hàng chip": chip ở slot `beforeListTable` (dưới hàng tìm kiếm). Nếu chỉ cần CSS (cùng container) → làm; nếu phải thay ListControls của Payload → **không làm**, giữ vị trí, ghi lý do + residual.
- D8 Gợi ý ô tìm kiếm: Payload hiện "Tìm theo {{label}}" từ nhãn `listSearchableFields` (hoặc `useAsTitle`). Khai báo `listSearchableFields` nghiệp vụ cho collection chưa có: Dự án `title`; Tin tức, Tin BĐS `title`; Tuyển dụng `title`; Hồ sơ ứng tuyển họ tên + email + SĐT (đúng tên trường thật); Trang, Dịch vụ `title`; Chủ đầu tư, Danh mục `name`; Media `filename` + `alt`; Staff họ tên + email; Tỉnh/Phường `name`. Chỉ trường `text`/`email` có thật (không relationship). Lead/Cho thuê giữ nguyên. Nếu cần, ghi đè `general.searchBy` (giữ `{{label}}`). Test: mỗi collection kể trên có `listSearchableFields` trỏ trường tồn tại kiểu text/email.

## Acceptance
- [ ] Ô ngôn ngữ hiện "Tiếng Việt" / "English" (nút + danh sách xổ); xổ xuống không bị "Thùng rác"/"Tạo mới" đè/xuyên; desktop + 375px.
- [ ] Nút bộ lọc chữ "Lọc nâng cao" (vị trí: làm hoặc ghi residual theo D7).
- [ ] Ô tìm kiếm mỗi màn nói rõ tìm theo gì, khớp `listSearchableFields`.
- [ ] Không đổi schema/DB/locale code; frontend `/en` + job dịch không vỡ (test liên quan PASS).

## Verify
`pnpm vitest run src/lib src/collections src/components/admin`, `pnpm typecheck`, `pnpm lint`.
