Agent: spec-validator

# Spec Validation (Phase review) — feature/ui-polish-sticky-underline-flags · phase 1 · round 1

- **Mode:** Phase review (end-of-phase), BL-074, class MODIFY (UI only)
- **Branch:** staging · commits 541dc36 (T01), 82979e4 (T02), 34d1cdb (T03)
- **Sources:** `spec/changes/2026-10-23-ui-polish-sticky-underline-flags.md` (Acceptance) · `SPECIFICATIONS.md` (spec_version 1.58.0, Overview bullet "Chỉnh UI BL-074" line 70, F12 FR-PUB-19 line 223) · `spec/updates/2026-10-24-ui-polish-sticky-underline-flags.md` · `spec/test-scope/current.json` (scopeVersion 77) · `spec/CHANGELOG.md` 1.58.0 · `.context/design-spec.md` (§2.1 header "Mục đang xem"/"Sticky", §2.3, "Hover link điều hướng", 1a AnnouncementBar, S03 khối 11) · task files `tasks/feature-ui-polish-sticky-underline-flags/phase-1-task-0{1,2,3}.md` · review reports task-01 r1, task-02 r2, task-03 r1 (STRICT PASS) · code `src/**`.
- **Verify:** không chạy lại full suite (builder + reviewer đã PASS `pnpm lint` / `pnpm typecheck` / `pnpm test` 436 file / 4592 test — xem task-02/03 verification summary). Kiểm bằng Grep/Read + `git show --stat` / `git diff 085352f 34d1cdb`.

## Verdict: ✅ PASS (implementation COMPLETE) — có 1 gap MEDIUM + 3 LOW về doc/test-scope cần reconcile lúc close-out phase (không cần sửa code)

## Acceptance → evidence

| # | Acceptance (change doc) | Evidence | Status | Note |
|---|---|---|---|---|
| A1 | Chi tiết dự án 390/768/< lg: thanh mục con (dính + không dính) không chạm/đè thẻ "Nhận thông tin dự án", khe theo token spacing; kiểm khối liền kề cùng thanh dính | 541dc36: `src/components/detail/DetailLayout.tsx:45-47` (`py-4 lg:py-8` không subNav / `pb-4 lg:pb-8` khi có subNav), `:71-74` (`div.lg:contents` bọc thanh + cột chính, `frameClassName="mb-4 lg:col-span-2 lg:mb-8"`); `DetailSubNav.tsx:33,94` (prop `frameClassName`); `DetailContactAside.tsx:29` (`scroll-mt` < lg `+1rem`, ≥ lg `+4.5rem`). Task-01 verification: khe thẻ↔thanh ≥ 40px mọi mức cuộn ở 390/768 cho Dự án / Cho thuê / Tin BĐS (trước fix âm tới −562). Review task-01 r1 STRICT PASS | ✅ | Áp dụng cả 3 màn dùng `DetailPageShell`; Dịch vụ / Tuyển dụng (không subNav) giữ DOM |
| A2 | Không còn `underline` (mặc định / `hover:`) trên link/nút/mục điều hướng site công khai; hover/focus nhìn thấy (màu/nền), `focus-visible` giữ | 82979e4 sửa 29 file public. Grep `underline\|decoration-\|text-decoration` trong `src` (bỏ test, admin scss): chỉ còn `src/components/content/RichText.tsx:48`. Header: `DesktopNav.tsx:65` bỏ `border-b-2`, hover `hover:bg-text/6`, đang xem `aria-[current=page]:bg-text/10` + `rounded-pill`; test `DesktopNav.test.tsx:139` khẳng định không `border-b`/`underline`. Link giữa câu: `ConsentCheckbox.tsx:51`, `CookieBanner.tsx:144,160`, `NewsArticleContactNote.tsx:31`, `ApplyFormSlot.tsx:40`, `JobListPage.tsx:125` = `font-semibold text-accent-text`; `FormStatus.tsx:76`, `RentalListPage.tsx:290` nền `hover:bg-text/6`; `AnnouncementBar.tsx:68,83` `hover:bg-primary-foreground/10`. Không còn `@tailwindcss/typography` (`.news-prose` ở `globals.css:401+` không thêm gạch chân). Review task-02 r2 STRICT PASS | ✅ | `text-decoration: underline` còn ở `src/components/admin/styles/*.scss` = Admin Payload, ngoài phạm vi (spec update §Ngoài phạm vi) |
| A3 | Ngoại lệ link trong RichText — mặc định giữ gạch chân (WCAG 1.4.1) | `RichText.tsx:48` `link: "text-accent-text underline underline-offset-4 hover:text-text"` giữ; SPEC line 70 "**Ngoại lệ:** … giữ gạch chân"; design-spec "Hover link điều hướng" as-built BL-074; test-scope acceptance line 101 + regression line 92 | ✅ | Quyết định đã chốt với user (task-02 Quyết định) |
| A4 | Cờ VN/EN chữ nhật ~3:2, nhỏ hơn; đang chọn phân biệt được (viền mảnh hơn); vùng bấm ≥ 24×24 | 34d1cdb: `flag-icons.tsx:10` `viewBox "0 0 30 20"`, `:14` rect 30×20, `:33` sao tâm (15,10); Union Jack `:22-26`. `LanguageSwitcher.tsx:49` khung `h-3.5 w-[21px]` (21×14), `:50` đang chọn `ring-[1.5px] ring-accent-text ring-offset-1` (thay `ring-2 ring-offset-2`), `:43` cờ kia `opacity-60`, `:42` link `min-h-11 min-w-11` (44×44). Tương phản ring ≈ 4.8:1 sáng / ≈ 10:1 tối (task-03). Review task-03 r1 STRICT PASS | ✅ | |
| A5 | Cập nhật design-spec §2.3 + test `flag-icons.test.tsx` / `LanguageSwitcher.test.tsx` | design-spec §2.3 thêm bullet "As-built BL-074" (34d1cdb). `src/components/layout/flag-icons.test.tsx:7,10,14` (viewBox `0 0 30 20`, class `h-3.5 w-[21px]`); `LanguageSwitcher.test.tsx:68-69` (`ring-[1.5px]`, `ring-offset-1`, `h-3.5`, `w-[21px]`), `:89-98` tone offset | ✅ (⚠️ G3) | Bullet "Đang xem" cũ trong §2.3 còn ghi ring 2px offset 2px — xem G3 |

## Spec delta ↔ as-built (yêu cầu (c))

| Nguồn | Mô tả | Khớp as-built? |
|---|---|---|
| SPECIFICATIONS.md line 70 (Overview BL-074) | (1) thanh dính trong cột trái / lưới, `#lead-form` +1rem < lg; (2) bỏ gạch chân, menu nền viên thuốc + `aria-current`, link giữa câu đậm + màu nhấn, ngoại lệ RichText + tab bar; (3) cờ → F12 | ✅ khớp T01/T02/T03. Chi tiết nhỏ (hotline/"Thử lại" trên `error-subtle` dùng `--color-text` thay màu nhấn; DetailInfoGrid chỉ khác màu) không có trong SPEC — xem G4 |
| SPECIFICATIONS.md line 223 (F12 FR-PUB-19) | 3:2 `viewBox 30×20`, ~21×14, ring mảnh hơn, ≥ 44×44 | ✅ |
| spec/updates/2026-10-24-… | Delta + câu bị thay thế + ngoài phạm vi | ✅ nội dung đúng; dòng 5 "(đang build)" — trạng thái lúc phát hành, chấp nhận |
| spec/CHANGELOG.md 1.58.0 / scope v77 | Tóm tắt 3 mục | ✅ |
| `.context/design-spec.md` | header "Mục đang xem" + "Sticky" + S03 khối 11 + Hover link + AnnouncementBar 1a + §2.3 đều có note "As-built BL-074" | ✅ (trừ G3) |
| `spec/test-scope/current.json` v77 | acceptance / impact / regression đúng ý | ⚠️ G1, G2 — danh sách file sai path / thiếu, trạng thái verify cũ |

T02/T03 có phát sinh requirement mới chưa ghi spec không: **không** có requirement nghiệp vụ mới. Phát sinh as-built chưa có trong scope: `AnnouncementBar` (trang chủ) đổi gạch chân → chữ đậm + nền hover (đã ghi design-spec 1a, **chưa** có trong test-scope files/screens — G1); T03 chọn bán kính sao 20/3 thay 1/5 chiều dài (đã ghi design-spec §2.3, không ảnh hưởng requirement).

## Gaps

| ID | Severity | Loại | Mô tả | Requirement / task | Đề xuất (cho change-request / spec-publisher, close-out) |
|---|---|---|---|---|---|
| G1 | MEDIUM | [PARTIAL] test-scope | `spec/test-scope/current.json` `changed.files` lệch as-built: (a) 5 path test không tồn tại `tests/unit/DetailLayout.test.tsx`, `tests/unit/DetailPageShell.test.tsx`, `tests/unit/DesktopNav.test.tsx`, `tests/unit/flag-icons.test.tsx`, `tests/unit/LanguageSwitcher.test.tsx` (lines 52-56) — test thật đặt cạnh component `src/components/{detail,layout}/*.test.tsx`; (b) `src/app/(frontend)/not-found.tsx` (line 29) thật là `src/app/(frontend)/[locale]/not-found.tsx`; (c) thiếu `src/components/home/AnnouncementBar.tsx` (82979e4) và test đã đổi `src/components/projects/project-detail.test.tsx`, `src/components/rentals/rental-detail.test.tsx`, `src/components/detail/DetailBlocks.test.tsx`; (d) `src/components/detail/DetailPageShell.tsx` liệt kê nhưng không commit nào đổi; (e) `screens` thiếu trang chủ `/` · `/en` (thanh thông báo khi bật) | A2, A5 · T01/T02 | Chạy lại spec-publisher (hoặc reconcile tay ở close-out phase) sửa path + thêm AnnouncementBar/trang chủ; không cần bump spec_version |
| G2 | LOW | [PARTIAL] test-scope | `unverifiedLocally` (line 107) vẫn ghi "Chưa có build/verify (phase 1 đang build)" — phase đã build + verify PASS | — | Cập nhật bằng kết quả verify thật (lint/typecheck/test PASS; Firefox/Safari sticky chưa kiểm — G5) |
| G3 | LOW | doc conflict nội bộ | design-spec §2.3 bullet **"Đang xem"** vẫn ghi "ring 2px `--color-accent-text` có offset 2px", mâu thuẫn bullet "As-built BL-074" ngay trên (`ring-[1.5px]` offset 1). SPEC F12 có ghi "thay" nên SPEC ổn; chỉ design-spec thiếu đánh dấu bị thay | A4, A5 · T03 | Sửa bullet "Đang xem" (hoặc ghi "(thay bởi BL-074: 1.5px, offset 1)") |
| G4 | LOW | [PARTIAL] SPEC wording | SPEC line 70 nói link giữa câu ngoài RichText "chữ đậm + màu nhấn"; as-built có 2 biến thể đã quyết trong task-02 decision log: (i) hotline FormStatus / "Thử lại" RentalListPage trên `--color-error-subtle` dùng `--color-text` + nền hover (accent chỉ 4.40:1) — đã ghi design-spec, chưa ghi SPEC; (ii) `DetailInfoGrid.tsx:26` link trong `dd` vốn đã semibold nên chỉ khác màu + hover (chấp nhận ngoại lệ 1.4.1 vì ô giá trị riêng) — chỉ ghi task log, chưa ghi design-spec/SPEC | A2 · T02 | Ghi 2 ngoại lệ vào design-spec "Hover link điều hướng" (as-built); SPEC chỉ cần nếu muốn chi tiết — không phải requirement mới |
| G5 | LOW | Residual risk | T01: ≥ lg thanh là grid item `lg:col-span-2` trong lưới, sticky đã đo trên Chromium; Firefox/Safari chưa kiểm (task-01 Residual risk) | A1 · T01 | Đưa vào test-scope `unverifiedLocally` / QA cross-browser |

Không có ❌ Missing, không có conflict HIGH giữa các doc. Gaps G1–G4 là reconcile doc/test-scope, không đòi sửa code.

## Verdict Reasoning
- Cả 5 mục Acceptance của change doc có implementation + test + review STRICT PASS, cite được file:line.
- (a) Grep `underline` trong `src` site công khai: chỉ còn `RichText.tsx:48` (+ khẳng định `not.toHaveClass` trong test, + admin scss ngoài phạm vi) — đạt.
- (b) `flag-icons.test.tsx` / `LanguageSwitcher.test.tsx` khớp viewBox 30×20 và 21×14 / ring 1.5px offset 1 — đạt.
- (c) SPEC 1.58.0 + spec update + design-spec mô tả đúng as-built 3 task; test-scope v77 có lệch path/file (G1, MEDIUM) và trạng thái verify cũ (G2) — nên sửa trước commit close-out phase để bàn giao test chính xác.
