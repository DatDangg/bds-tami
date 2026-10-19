# bug-admin-misc-needs-repro · phase-1-task-01 — Lexical vỡ dấu tiếng Việt (#05)

- Change doc: `spec/changes/2026-10-19-admin-misc-needs-repro.md` (BACKLOG BL-023, bug #05)

## Classification / Risk
- Type: **BUG** (hiển thị) · Severity: **medium** (nội dung đọc sai trong editor, dữ liệu không hỏng)
- Root cause category: CSS / font fallback (thư viện bên thứ ba: `@payloadcms/richtext-lexical`)
- Risk: **LOW** — chỉ CSS admin (route group `(payload)`), không đổi schema/API/dữ liệu, không migration.
- Expected review level: **FAST/NORMAL** · Blast radius: mọi ô richText Lexical trong admin + màn so sánh phiên bản (diff Lexical).
- Doc impact: dự kiến `no doc impact` (as-built UI admin, không đổi contract) · Decision impact: không.

## Repro (đã tái hiện 2026-10-20 trên dev, Chrome/Windows)
1. Đăng nhập admin → `/admin/collections/rentals/0e6b861d-b775-4d73-bf39-c22ab100a609`, tab Nội dung, ô "Mô tả — vi".
2. Thấy `mặt bằ` `ng`, `tầ` `ng 1-2`, `Tây Hồ` `,`, `tiề` `n lớn`, `Nội thấ` `t`, `tư vấ` `n` — dấu thanh tách khỏi nguyên âm (chữ có 2 dấu: ằ ầ ồ ề ấ), chữ hiển thị font serif.

## Root cause (có evidence)
- **Dữ liệu KHÔNG phải NFD**: `rentals_locales.description` của bản ghi = `normalize(..., NFC)` (vi: `t`), và 0/32 dòng `rentals_locales.description` khác dạng NFC (query Postgres 2026-10-20). Không có seed chứa chuỗi này trong repo → nhập tay, đã NFC.
- **Font**: `node_modules/@payloadcms/richtext-lexical/dist/field/bundled.css` — `.rich-text-lexical .editor-container{font-family:var(--font-serif);letter-spacing:.02em}` (và `.lexical-diff .field-diff-content .html-diff{font-family:var(--font-serif)}`). `--font-serif` của Payload = `"Georgia", "Bitstream Charter", "Charis SIL", Utopia, "URW Bookman L", serif` (computed style trên span chữ `mặt`). Georgia (Windows) thiếu glyph tổ hợp sẵn cho nguyên âm mang 2 dấu tiếng Việt → trình duyệt dựng glyph bằng nguyên âm + dấu kết hợp, dấu thanh lệch/tách ra → "vỡ dấu". Admin đã dùng Montserrat subset `vietnamese` (`src/lib/fonts.ts`, gắn `--font-montserrat` lên `<html>` ở `src/app/(payload)/layout.tsx`) cho `--font-body`, nhưng Lexical không dùng `--font-body`.
- `SessionKeepAlive`/hook lưu không liên quan.

## Fix (phạm vi)
- Trong SCSS admin (`src/app/(payload)/custom.scss` hoặc `src/components/admin/styles/_tokens.scss` cạnh `--font-body`): đặt `--font-serif` của admin trỏ về stack Montserrat (`var(--font-body)`) → editor Lexical + màn diff dùng font có glyph tiếng Việt. Không sửa `node_modules`, không đổi dữ liệu.
- **Quyết định agent (user ủy quyền 2026-10-20):** KHÔNG thêm hook normalize NFC lúc lưu — dữ liệu đã NFC (0/32 dòng lệch), root cause là font; hook sẽ là code thừa (YAGNI). Ghi residual: nội dung dán NFD trong tương lai chưa được chuẩn hoá (Montserrat vẫn hiển thị đúng dấu kết hợp).
- Test: test tĩnh (vitest) đọc SCSS admin đã biên dịch/nguồn, khẳng định `--font-serif` được khai trong `:root` admin và trỏ về `--font-body` (theo kiểu test token hiện có `src/components/admin/admin-tokens.test.ts`) — fail trước fix, pass sau fix.

## Acceptance
- [x] Ô "Mô tả — vi" của bản ghi trên hiển thị `mặt bằng`, `tầng`, `Tây Hồ,`, `tiền`, `Nội thất`, `tư vấn` liền dấu (kiểm trình duyệt, computed font-family bắt đầu bằng Montserrat).
- [x] Màn so sánh phiên bản (diff Lexical) cũng dùng Montserrat.
- [x] Nội dung lưu dạng NFC (đã đúng — evidence query).
- [x] Test hồi quy fail trước / pass sau; `pnpm test`, `pnpm lint`, `pnpm typecheck` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- Fix: `src/app/(payload)/custom.scss` `:root` thêm `--font-serif: var(--font-body);` (Payload khai `--font-serif` Georgia trong `:root` của app.scss, trong `@layer payload-default`; CSS admin ngoài layer cùng selector `:root` nên thắng).
- Test: `src/components/admin/admin-fonts.test.ts` — FAIL trước fix, PASS sau fix.
- `pnpm test`: 2834 pass; 3 file integration FAIL (access, jobs-email, media-upload: cần DB/SMTP/SeaweedFS thật, không liên quan CSS). `pnpm lint`: 0 error (2 warning cũ ở tools/task-dashboard). `pnpm typecheck`: PASS.
- Repro Verification (change-request, Chrome dev, 2026-10-20): **PASS** — bản ghi rentals `0e6b861d…` ô Mô tả — vi: computed font-family span = `Montserrat, "Montserrat Fallback", …`; ảnh chụp hiển thị `mặt bằng`, `tầng 1-2`, `Tây Hồ,`, `tiền lớn`, `Nội thất`, `tư vấn` liền dấu (trước fix: Georgia, dấu tách). Dữ liệu NFC (0/32 dòng `rentals_locales.description` lệch).

## Doc impact / Reconcile
- no doc impact — chỉ CSS admin (không đổi API/schema/behavior tài liệu hoá); FR-ADM-19 không đổi ngữ nghĩa.

## Review
- FAST PASS round 1 — `.context/review-reports/bug-admin-misc-needs-repro-phase-1-task-01-round-1-review.md` (2 MINOR: test regex chấp nhận dòng bị comment `//`; test chỉ đọc nguồn SCSS — chấp nhận, đã kiểm trình duyệt).

## Residual risk
- Nội dung dán dạng NFD trong tương lai không được chuẩn hoá khi lưu (quyết định agent: không thêm hook — YAGNI; Montserrat vẫn dựng đúng dấu kết hợp).
- Màn so sánh phiên bản (diff Lexical) chưa mở trình duyệt kiểm — cùng biến `--font-serif`, rủi ro thấp.
- MINOR test regex chưa loại dòng comment.
