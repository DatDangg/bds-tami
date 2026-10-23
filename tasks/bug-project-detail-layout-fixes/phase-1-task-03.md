# bug-project-detail-layout-fixes · phase-1-task-03 — Dải "… tương tự" tách biệt với phần nội dung chi tiết

- Nguồn: BL-071 · change doc `spec/changes/2026-10-23-project-detail-layout-fixes.md` (Lỗi 3).
- Không đổi schema, không migration. Đổi lại quyết định nền của BL-060 → cần user chọn phương án (xem § Câu hỏi).
- Trạng thái: **done** — plan duyệt 2026-10-23 (phương án A); NORMAL PASS r1 (`.context/review-reports/bug-project-detail-layout-fixes-phase-1-task-03-round-1-review.md`); spec 1.56.2 / scope v75.

## Classification / Risk
- Type: **BUG** (regression về thị giác: hai quyết định BL-060 + khung chi tiết cùng dùng một token nền) · severity **low–medium**.
- Scope: `SimilarCarousel` — dùng chung cho **Dự án** (`ProjectDetail.tsx:203-210`), **Cho thuê** (`src/components/rentals/SimilarRentals.tsx`), **Tin BĐS** (`src/components/posts/RelatedPosts.tsx`). BL-060 đã chốt "dùng chung cho 3 màn" → sửa ở component cho cả 3 (nhất quán), verify cả 3.
- Root cause category: trùng token nền giữa dải và nền trang.
- Expected review level: **NORMAL** (component dùng chung 3 màn nhưng chỉ đổi class nền; không API/auth/schema). Reviewer chạy `impeccable` (tương phản AA).
- Blast radius: `src/components/detail/SimilarCarousel.tsx` + test `src/components/projects/project-detail.test.tsx:324` (đang khẳng định `bg-primary-subtle`) + test Cho thuê / Tin BĐS nếu khẳng định nền.
- Doc impact: `.context/design-spec.md` (dòng mô tả dải "… tương tự" BL-060) + `docs/DESIGN.md` (as-built) — reconcile. Change doc BL-060 đã archive, không sửa.

## Root cause (file:line)
- `src/components/detail/SimilarCarousel.tsx:28` — `<section className="border-t border-border bg-primary-subtle py-section-tight">` (BL-060, khi đó để tách khỏi các dải trắng phía trên).
- `src/components/detail/DetailLayout.tsx:53` — gốc trang chi tiết `data-detail-page` cũng `bg-primary-subtle` (từ BL-027 `046d891`); sau BL-061 các khối nội dung thành thẻ trắng nằm TRONG lưới trên nền này → vùng quanh thẻ và dải "… tương tự" cùng `#f8f3eb` (`globals.css:16`) → liền một mảng.
- Viền `border-border` (`#e8e6e3`, `globals.css:25`) trên nền `#f8f3eb` gần như không thấy → không đủ phân cách.

## Hướng sửa đề xuất (chờ user chọn — mặc định A)
- **A (đề xuất):** dải nền **`bg-surface`** (trắng `#ffffff`) + giữ `border-t border-border`. Khác hẳn nền kem phía trên, nối tiếp dải Điểm mạnh `bg-bg` (`#f7f5f4`, `src/components/home/StrengthsBlock.tsx:12`) cũng phân biệt được. Chữ/link `text-accent-text` trên trắng vẫn AA (≥ 4.63:1 như trên kem).
- **B:** giữ nền kem nhưng thêm khoảng/đường phân cách đậm hơn (vd `border-t` dùng `border-primary-soft` + `mt-section-tight`). Ít thay đổi nhưng vẫn cùng nền — tách yếu hơn.
- **C:** dải tối `theme-dark-block` — tách rất mạnh nhưng nặng, đổi cả style `ProjectCard`/`RentalCard` trên nền tối → ngoài phạm vi bug.
- Chỉ dùng token có sẵn (không hex).

## Acceptance (từ change doc)
- [x] Dải "Dự án tương tự" phân biệt rõ với nội dung phía trên (nền/khoảng/phân cách theo design tokens), light theme ở 375px và 1440px.
- [x] Cho thuê / Tin BĐS: dải "… tương tự / tin liên quan" cùng quy tắc, không vỡ.
- [x] Tương phản chữ/link trong dải đạt WCAG AA.

## Scope
1. Sửa `SimilarCarousel.tsx:28` (+ JSDoc dòng 21) theo phương án được duyệt.
2. Test (vitest, TDD): cập nhật `project-detail.test.tsx:324` sang class mới và khẳng định khác nền gốc `data-detail-page`; Grep test Cho thuê / Tin BĐS có khẳng định nền.
3. Doc reconcile `.context/design-spec.md` + `docs/DESIGN.md`.

## Verification plan
- `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build`.
- Trình duyệt light theme, viewport **375 / 768 / 1440 / 1920**: chuyển cảnh từ khối cuối (Hỏi đáp/aside) sang "Dự án tương tự" → Điểm mạnh → banner, trên **The Windsor Collection**, **Maison Privée**, **Astor 1** + **1 dự án mẫu**; thêm 1 tin cho thuê + 1 tin BĐS (dùng chung component).
- Ảnh chụp `.context/review-reports/assets/bl071-p1t03-<page>-<vw>.png`.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Repro Verification

| Mục | Expected | Actual before fix | Actual after fix | Evidence | Status |
|---|---|---|---|---|---|
| Ranh giới nội dung → "Dự án tương tự" | Khác nền / phân cách rõ | Cùng `bg-primary-subtle` (#f8f3eb) với nền trang | Dải `rgb(255,255,255)` ≠ gốc `rgb(248,243,235)`; viền trên `rgb(232,230,227)`; dải kế tiếp `rgb(247,245,244)`; thẻ trong dải có viền riêng, ranh giới rõ | `.context/review-reports/assets/bl071-p1t03-{project-375,project-1440,rental-375,post-375}.jpg` + số đo computed | PASS |

## Verification summary (builder)
- Phương án A (user duyệt 2026-10-23): `SimilarCarousel.tsx:28` `bg-primary-subtle` → `bg-surface` (giữ `border-t border-border py-section-tight`); JSDoc ghi BL-071.
- TDD: đổi khẳng định ở `project-detail.test.tsx` (bg-surface + not primary-subtle + gốc data-detail-page vẫn primary-subtle) và `PostDetail.test.tsx:211`; chạy trước fix → 2 FAIL; sau fix → PASS. Test Cho thuê không khẳng định nền.
- `pnpm typecheck` PASS · eslint 3 file scope sạch · `pnpm test` 436 file / 4587 test PASS. `pnpm build`: không chạy (dev server port 3000 dùng chung `.next`) → residual.
- Tương phản trên #ffffff: accent-text #8c6733 5.12:1 (kem 4.63) · text #141414 18.42:1 · text-muted #6b6b6b 5.33:1 → AA (≥ 4.5). Trắng vs kem chỉ 1.10:1 nên phân tách dựa thêm viền trên + dải sau (#f7f5f4).
- Trình duyệt (dev :3000, DB dev), light: Astor 1 ở 375/768/1440/1920, Cho thuê (1920 + 375), Tin BĐS (375): dải `rgb(255,255,255)` vs gốc `rgb(248,243,235)`, dải kế tiếp `rgb(247,245,244)`; scrollWidth ≤ viewport (không h-scroll). Thẻ ProjectCard/Rental/Post có viền + bo riêng, nhìn rõ trên nền trắng — không có finding.

## Doc impact
- `.context/design-spec.md` (dòng 235: ghi as-built BL-071) · `docs/DESIGN.md` (3 dòng as-built Dự án/Cho thuê/Tin BĐS: nền `--color-surface`). Không sửa intent docs / change doc BL-060.
