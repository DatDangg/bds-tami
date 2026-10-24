---
id: ui-polish-sticky-underline-flags
type: feature
status: done
completed: 2026-10-24
created: 2026-10-23
---

# Chỉnh UI: thanh mục con dính sát thẻ "Nhận thông tin dự án" ở màn nhỏ, bỏ gạch chân khi hover, cờ ngôn ngữ nhỏ + chữ nhật

## Yêu cầu
User test local (2026-10-23) báo 3 điểm:

1. **Màn nhỏ bị dính:** ở chi tiết dự án, thanh mục con dạng viên thuốc (… "Chính sách", "Hỏi đáp") dính sát / đè lên thẻ "Nhận thông tin dự án" (form tư vấn) — không có khoảng cách giữa hai khối. Tránh tình trạng này ở các màn nhỏ.
2. **Bỏ gạch chân:** rà mọi phần tử bấm/hover được có chữ (link, nút, mục menu, thẻ…) trên site công khai — chỗ nào hiện gạch chân (lúc thường hoặc khi hover) thì bỏ đi.
3. **Cờ đổi ngôn ngữ** (header, `FlagIcon` / `LanguageSwitcher`): nhỏ lại và đổi từ hình vuông sang hình chữ nhật.

## Bối cảnh / tái hiện
- Màn/route/role: khách vãng lai — chi tiết dự án `/du-an/<slug>` (vi/en), màn nhỏ; header mọi trang.
- Ảnh user: thanh mục con trắng bo tròn nằm ngay trên thẻ "Nhận thông tin dự án / Đăng ký để nhận bảng giá…", hai khối sát nhau; cờ VN có viền nâu dày (đang chọn) + cờ Anh, cả hai vuông.
- Expected: hai khối có khoảng cách rõ, thanh dính không che thẻ; link/nút không gạch chân; cờ chữ nhật, nhỏ.
- Actual: như mô tả ở trên.

## Acceptance (bắt buộc)
- [x] Chi tiết dự án ở 390 / 768 / < lg: thanh mục con (khi dính và khi không dính) không chạm/đè thẻ "Nhận thông tin dự án" — có khoảng cách theo token spacing; kiểm các khối liền kề khác dùng cùng thanh dính.
- [x] Không còn `underline` (mặc định hoặc `hover:underline`) trên link/nút/mục điều hướng của site công khai; vẫn có trạng thái hover/focus nhìn thấy được (đổi màu/nền) và `focus-visible` giữ nguyên — đạt a11y.
- [x] Ngoại lệ cần quyết: link nằm trong đoạn văn bản bài viết (richText tin tức/pháp lý) — mặc định giữ gạch chân để nhận ra link trong văn bản (WCAG 1.4.1), trừ khi user muốn bỏ cả ở đó.
- [x] Cờ VN/EN hình chữ nhật (tỉ lệ ~3:2), nhỏ hơn hiện tại; trạng thái đang chọn vẫn phân biệt được (viền mảnh hơn); vùng bấm vẫn ≥ 24×24px (WCAG 2.5.8).
- [x] Cập nhật design-spec §2.3 (cờ) + test `flag-icons.test.tsx` / `LanguageSwitcher.test.tsx` nếu đổi viewBox/kích thước.

## Ghi chú
- Liên quan BL-063 (cờ vuông SVG inline — `src/components/layout/flag-icons.tsx`), BL-020 P4 (thẻ Tư vấn dính, thanh mục con viên thuốc — `src/components/detail/DetailContactAside.tsx`, `src/components/projects/ProjectDetail.tsx`).
- Chưa điều tra root cause khoảng cách — để `/change` làm.

## Kết quả (2026-10-24)
- T01 541dc36 · T02 82979e4 · T03 34d1cdb — đều STRICT PASS; spec-validation phase 1 PASS (`.context/review-reports/spec-validation-feature-ui-polish-sticky-underline-flags-phase-1.md`).
- Spec 1.58.0 (MINOR) / test-scope v78 (v77 archive). Ngoại lệ gạch chân: giữ ở link RichText (mặc định WCAG 1.4.1).
