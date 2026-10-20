Agent: reviewer

# Review — feature-detail-subnav-full-width · phase-1-task-01 · round 1 (BL-028)

- **Review level:** FAST
- **Reason:** diff là 1 lớp Tailwind (`ul` `w-fit max-w-full` -> `w-full`) + 1 dòng JSDoc + assert test. Không đụng logic observer/neo/hằng 4.5rem, schema, API hay quyền. `DetailSubNav` là component dùng chung nhưng chỉ ở 2 trang chi tiết, và chỉ đổi bố cục.
- **Blast radius:** `src/components/detail/DetailSubNav.tsx`, dùng ở `/du-an/[slug]`, `/en/projects/[slug]`, `/cho-thue/[slug]`, `/en/for-rent/[slug]`.

## Verify commands + result
- `pnpm vitest run src/components/detail src/components/projects src/components/rentals` -> 12 file / 156 test PASS (reviewer tự chạy lại).
- typecheck / lint: theo Builder là PASS / 0 error. Reviewer không chạy lại vì diff chỉ đổi một chuỗi className.

## Requirements coverage
- Mục "Sửa lại" (thanh thẳng mép với nội dung, không theo 84rem): **OK**. `nav` dùng `mx-auto w-full max-w-container px-gutter` (`DetailSubNav.tsx:83`), giống hệt khung lưới tại `DetailLayout.tsx:36`. `ul` `w-full` lấp đầy content-box, nên hai mép trùng mép thẻ trắng (trái) và mép aside (phải, >= lg), còn < lg thì trùng mép thẻ nội dung. Số đo dev server của primary (1440: 105->1321, 375: 16->359) khớp với CSS math.
- Cuộn ngang khi tràn: giữ `overflow-x-auto` + `whitespace-nowrap`. `w-full` trong khung `max-w-container` không vượt được viewport, nên trang không tràn ngang.
- Nút căn trái: `flex` mặc định là `justify-start`, **OK**.
- Neo/highlight: logic không đổi, **OK**.

## Responsive Checklist Gate (diff đụng UI)
- Layout, không tràn ngang: **OK**. `w-full` nằm trong `max-w-container` + `px-gutter`. Ở 375 primary đo được scrollWidth = viewport.
- Mobile-first / grid: **N/A**, diff không thêm media query hay grid.
- Container không fixed px: **OK**, dùng token `max-w-container` và `w-full`.
- Typography/Spacing: **N/A**, không đổi.
- Media: **N/A**.
- Touch target: **N/A**, nút không đổi (thanh cao 54px như trước).
- Nav mobile: **OK**, thanh cuộn ngang trong viên thuốc như trước.
- Table: **N/A**.
- 100vh / reduced-motion: **N/A**, không đổi. Logic `prefersReducedMotion` vẫn giữ.
- overflow:hidden che lỗi: **OK**, không thêm.
- Residual: 768px chưa đo bằng mắt. Tuy vậy CSS math giống hệt khung lưới (cùng lớp), nên mép vẫn trùng.

## Skill gates
- aislop: skip. Diff 1 lớp CSS + JSDoc + 5 dòng assert, không có dấu hiệu slop.
- oxlint (anti-slop): skip. Builder đã chạy `pnpm lint`, 0 error.
- ocr: skip, ocr not installed.
- AI-readable: **OK**, 0 indicator. JSDoc ghi lý do (WHY), có kèm mã BL-028.
- ai-friendly-web: **N/A**, chỉ đổi bề rộng một thanh UI, không đổi crawl surface.
- blitzstrike: **N/A**, không phải task nhạy cảm.

## Findings
- **[MINOR]** `tasks/feature-detail-subnav-full-width/phase-1-task-01.md:27`: mục Files vẫn ghi assert `max-w-[84rem]`, mâu thuẫn với D1 (dòng 20), Verification summary (dòng 43) và test thật (assert `max-w-container`). Đề xuất sửa thành "assert nav `max-w-container` + `px-gutter`, ul `w-full`, không `w-fit`" để người đọc/resume sau không hiểu nhầm. Không chặn PASS.
- **[MINOR]** `phase-1-task-01.md:1` (tiêu đề "dài ngang bằng header nổi") và `:21` (D2 "đúng ý dài ngang header") là diễn đạt cũ. Nên cập nhật theo ý "bằng khung nội dung" khi close-out.
- **[MINOR]** Doc impact (dòng 12: design-spec S03 + SPECIFICATIONS) cần ghi theo khung nội dung (`max-w-container`), không ghi 84rem, ở bước close-out/spec-publisher.

## Verdict
PASS. Không có CRITICAL/MAJOR. Ba MINOR là văn bản task/doc, nên sửa ở bước close-out.
