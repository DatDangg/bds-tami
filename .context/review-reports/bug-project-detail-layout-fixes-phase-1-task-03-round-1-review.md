Agent: reviewer

# Review — bug-project-detail-layout-fixes · phase-1-task-03 · round 1 (BL-071, Lỗi 3)

- **Review level:** NORMAL
- **Reason:** đổi 1 class nền trong component dùng chung 3 màn chi tiết (`SimilarCarousel`). Không đụng API, auth, schema hay data, không có logic mới. Component dùng chung nhưng chỉ đổi một token màu đã có sẵn, nên không cần STRICT.
- **Blast radius:** `src/components/detail/SimilarCarousel.tsx` → `ProjectDetail.tsx:203`, `rentals/SimilarRentals.tsx:29`, `posts/RelatedPosts.tsx:30`. Ngoài 3 chỗ này không có nơi nào khác render `<SimilarCarousel` (đã Grep `src/components`). Test: `project-detail.test.tsx`, `PostDetail.test.tsx`. Doc: `.context/design-spec.md:235`, `docs/DESIGN.md` (3 dòng).

## Root cause vs fix
- Root cause đúng. Gốc trang `DetailLayout.tsx:53` có `data-detail-page` và `bg-primary-subtle`. Dải `SimilarCarousel.tsx:28` cũng dùng `bg-primary-subtle` (`#f8f3eb`, `globals.css:16`) nên hai vùng liền thành một mảng. Viền `#e8e6e3` (`globals.css:25`) không đủ để tách.
- Fix theo phương án A đã được duyệt: đổi sang `bg-surface` (`#ffffff`, `globals.css:23`), giữ `border-t border-border py-section-tight`. Diff chỉ gồm class này và JSDoc, không có thay đổi nào ngoài phạm vi.
- Sửa ở component dùng chung nên cả 3 màn tự nhất quán. `SimilarRentals` và `RelatedPosts` chỉ truyền props, không tự ghi đè class nền.

## Verify commands + result
- `pnpm typecheck` → PASS (`tsc --noEmit` không báo lỗi).
- `pnpm vitest run src/components/detail src/components/projects src/components/posts src/components/rentals` → 25 file / 292 test PASS.
- `pnpm build` → **không chạy** (theo chỉ dẫn: dev server khác đang giữ `.next`). Rủi ro thấp: chỉ đổi class Tailwind. Token `bg-surface` đã được dùng ở nhiều nơi khác nên chắc chắn được sinh ra; không đổi import, type hay ranh giới server/client.

## Contrast / phân cấp thị giác (impeccable)
- Chữ trên nền trắng (tôi tự tính lại, khớp số của builder): `text-accent-text #8c6733` khoảng 5.1:1, `text #141414` khoảng 18.4:1, `text-muted #6b6b6b` khoảng 5.3:1. Tất cả đạt AA (≥ 4.5).
- Chuỗi nền từ trên xuống: kem `#f8f3eb` (nội dung) → trắng `#ffffff` + viền trên (dải tương tự) → `#f7f5f4` (Điểm mạnh) → banner tối.
- Kem → trắng tách được nhờ đổi tông (ấm sang trung tính) cộng viền. Trong ảnh 1440 thấy ranh giới rõ ngay dưới thanh mục con.
- Trắng → `#f7f5f4` chỉ chênh khoảng 1.09:1. Tuy vậy dải Điểm mạnh có icon/nội dung riêng và nằm ngay trước banner tối, nên trong ảnh 1440 vẫn đọc được là hai khối khác nhau. Có thể coi là MINOR, xem Findings.
- Thẻ trong dải: `ProjectCard` có viền và bo góc riêng, ảnh nằm trên `bg-surface-muted`. Ảnh 375 và 1440 cho thấy thẻ vẫn rõ trên nền trắng.
- Theme tối: trong `globals.css` không có class `.dark`. Nơi ghi đè `--color-surface` chỉ là `.theme-dark-block` (`globals.css:222-228`, đổi thành `#1c1c1c`), và `SimilarCarousel` không nằm trong khối đó. Nếu sau này có ai bọc dải vào `theme-dark-block`, `bg-surface` sẽ tự đổi sang nền tối đúng token. Không có tác động xấu.

## Test
- `project-detail.test.tsx:332-335` kiểm tra 3 điều: dải có `bg-surface` và `border-t`, dải không có `bg-primary-subtle`, gốc `[data-detail-page]` vẫn là `bg-primary-subtle`. Như vậy test khẳng định đúng điều kiện "khác nền gốc", có ý nghĩa.
- `PostDetail.test.tsx:211-212` cập nhật cho màn Tin BĐS.
- Test Cho thuê không kiểm tra nền. Phần này vẫn được bảo vệ gián tiếp vì dùng chung component. Theo builder, test đỏ trước khi sửa (2 FAIL), tôi không kiểm chứng lại được thứ tự này, nhưng nội dung assert đúng với hành vi mới.

## Repro Verification
- Status PASS. Bằng chứng gồm 4 ảnh `.context/review-reports/assets/bl071-p1t03-{project-375,project-1440,rental-375,post-375}.jpg` và số đo computed (`rgb(255,255,255)` so với `rgb(248,243,235)`).
- Tôi đã xem ảnh project-375 và project-1440: khớp mô tả.
- Có thêm test tự động khẳng định class nền khác gốc trang. Bằng chứng kiểm chứng được.

## Responsive Checklist Gate
Diff chỉ đổi màu nền, không đổi layout, kích thước hay media query.
- Layout (không h-scroll / mobile-first / grid / container): OK. Không có class layout nào đổi. Ảnh 375 không có h-scroll; builder đo được `scrollWidth ≤ viewport`.
- Typography / Spacing: N/A (không đổi).
- Media: N/A (không đổi).
- Touch / Interaction: N/A (không đổi; nút mũi tên và link giữ nguyên).
- Viewport / A11y (100vh, reduced-motion, overflow): N/A (không đổi). Contrast AA: OK (xem trên).

## Skill gates
- aislop: skip, không có trong allowlist verify command của reviewer. Diff chỉ 1 class + JSDoc + assert test, không thấy dấu hiệu slop.
- oxlint (anti-slop): skip, oxlint chưa được cấu hình (repo dùng eslint; builder báo eslint sạch trên 3 file).
- ocr (open-code-review): skip, ocr chưa được cài.
- AI-readable: OK. 0 indicator: không thêm hàm, không có magic number. Comment trong test giải thích lý do (WHY), không mô tả lại code.
- ai-friendly-web: N/A, chỉ đổi màu nền, không đụng robots, sitemap hay llms.
- blitzstrike: N/A, không phải NORMAL nhạy cảm.

## Doc reconcile
- `.context/design-spec.md:235` thêm ghi chú as-built BL-071.
- `docs/DESIGN.md` sửa 3 dòng (Dự án / Cho thuê / Tin BĐS) thành `--color-surface`, có ghi "đổi BL-071". Đây là doc as-built nên sửa là hợp lệ.
- Không đụng intent docs, cũng không đụng change doc BL-060 đã archive.

## Findings
- **[CRITICAL]** không có.
- **[MAJOR]** không có.
- **[MINOR]** Ranh giới dải trắng → Điểm mạnh `bg-bg #f7f5f4` (`StrengthsBlock.tsx:12`) có độ chênh rất thấp (khoảng 1.09:1). Hiện chấp nhận được vì nội dung hai khối khác hẳn nhau và banner tối nằm ngay sau. Nếu user thấy hai dải sáng liền nhau dễ lẫn ở màn lớn, đề xuất mở task riêng thêm `border-t border-border` cho dải Điểm mạnh khi nằm trên trang chi tiết. Không chặn PASS.
- **[MINOR]** Thiếu ảnh 768/1920 và ảnh Cho thuê ở 1440 trong assets (task chỉ lưu 4 ảnh, phần còn lại builder ghi bằng số đo). Rủi ro thấp vì chỉ đổi màu. Không chặn PASS.

## Residual risk
- `pnpm build` chưa chạy (rủi ro thấp, đã nêu ở trên).
- Ảnh tại 768/1920 chưa được lưu nên tôi chưa tự xem; chỉ dựa vào số đo của builder.

## Verdict: PASS
