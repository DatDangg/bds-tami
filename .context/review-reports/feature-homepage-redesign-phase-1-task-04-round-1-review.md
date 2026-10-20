Agent: reviewer

# Review — feature-homepage-redesign · phase-1-task-04 · round 1

- Task: `tasks/feature-homepage-redesign/phase-1-task-04.md` (BL-044, G-M1 + spacing + ERD D1)
- Review level: **NORMAL**
- Reason: MODIFY, chỉ đụng khối Về TAMI / Dự án nổi bật của trang chủ, 2 key i18n mới và doc as-built. Không có auth, schema, migration hay API contract. `AboutBlock` và `FeaturedProjects` chỉ được dùng ở `HomeBlocks`, không phải component dùng chung toàn site.
- Blast radius: `src/components/home/AboutBlock.tsx`, `src/components/home/FeaturedProjects.tsx` (chỉ trang chủ, render qua `src/components/home/HomeBlocks.tsx`), `src/i18n/messages/{vi,en}.json` (namespace `page.home.about`), `docs/ERD.md` §4.15. Không đổi `home-view.ts` hay `Homepage.ts`.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 error, 2 warning cũ ở `tools/task-dashboard/server.mjs:64,490` (ngoài scope) |
| `pnpm test` | PASS: `Test Files 305 passed (305)`, `Tests 3205 passed (3205)`, 183.23s. Lần này không gặp timeout integration chập chờn |
| `pnpm build` | Không chạy (dev server dùng chung `.next`, theo chỉ dẫn). Builder báo PASS |

## Kiểm đặc biệt
- **Selector `[[data-block=about]+&]:pt-4`**: OK. `HomeBlocks.tsx:50-52` render từng khối trong `<Fragment>` (không sinh DOM), còn `AboutBlock` và `FeaturedProjects` đều có gốc là `<section>`. Vì vậy hai section là anh em liền kề trong DOM, và selector anh em liền kề `+` áp dụng được. `data-block="about"` có ở `AboutBlock.tsx:83`. Ảnh 1440 của builder cho khoảng ~40px, khớp phép tính CSS (pb-6 24px + pt-4 16px).
- **Đổi thứ tự khối**: OK. Khối khác chen giữa thì selector không khớp, nên FeaturedProjects giữ `pt-section`.
- **Nền kem About có `pb-6`**: OK. Trên ảnh 1440, mép dưới cụm ảnh cách mép dưới nền kem ~26px. Mockup ~23px.
- **Khoảng cách so với mockup**: ≈ OK. Đáy cụm ảnh tới eyebrow Dự án nổi bật đo được ~49px, mockup ~67px. Riêng đoạn từ mép nền kem tới eyebrow là ~23px, mockup ~44px. Lệch nhỏ, xem n2.
- **/en mặc định tiếng Anh**: OK. `en.json` có `defaultEyebrow: "About us"` và `defaultVideoLabel: "Discover TAMI HOMES"`. Test `AboutBlock.test.tsx` kiểm cả nhánh `en`.
- **Nút play chỉ phụ thuộc `videoEmbedUrl`**: OK (`AboutBlock.tsx:22`). Nhãn trống fallback sang i18n.
- **Trống → null**: OK. `home-view.ts:234,243` dùng `text(...) || null`, nên chuỗi rỗng hay toàn khoảng trắng đều về `null` rồi mới dùng `??`.
- **Mô tả admin `Homepage.ts:162,170`**: OK. Chữ "Để trống thì dùng "Về chúng tôi"" và "Để trống thì dùng "Khám phá TAMI HOMES"" khớp hành vi. Ở :169, "Để trống thì ẩn nút" nói về `videoUrl` cũng khớp.
- **ERD §4.15 so với `src/globals/Homepage.ts`**: OK. Có đủ hero `eyebrow`/`caption`/`slides[].titleAccent`, about `ctaLabel`/`ctaLink` + ghi chú mặc định, featuredProjects `eyebrow`/`description` (`Homepage.ts:195,197`), kèm tham chiếu migration.
- **1 h1, không hex**: OK. `h1` vẫn duy nhất ở `HomeBlocks.tsx:45`, và diff không thêm mã hex nào.

## Responsive Checklist Gate (diff đụng UI)
- Layout, không cuộn ngang: OK. Diff chỉ đổi padding dọc (`pt-section pb-6`, `pt-4`), không thêm chiều rộng nào.
- Mobile-first, grid: N/A, diff không đổi grid.
- Typography rem/clamp: OK. Eyebrow mặc định dùng lại class `text-eyebrow` sẵn có, không thêm px.
- Spacing theo scale: OK. `pb-6` và `pt-4` đều là scale Tailwind, `pt-section` là token sẵn có.
- Media: N/A, diff không đổi ảnh.
- Touch target ≥ 44px: OK. Nút play vẫn dùng `AboutVideoButton` cũ, chỉ đổi điều kiện hiển thị.
- Nav/table: N/A.
- 100vh / reduced-motion / overflow-hidden: N/A. `overflow-hidden` trên section là code có sẵn, không phải để che lỗi.
- Residual: chưa xác minh trong trình duyệt ở 375/768. Theo CSS, ở mobile nền kem có 24px đệm dưới phần tử cuối khối, đủ tách. Ảnh 390 builder không đưa vào artifact.

## Skill gates
- aislop: skip, không có `aislop` trên PATH.
- oxlint (anti-slop): skip. Không có `oxlint` trên PATH, và Glob tìm file cấu hình bị timeout. `pnpm lint` (eslint) đã PASS 0 error.
- ocr: skip, chưa cài `ocr`.
- AI-readable: OK, 0 indicator. Tên key rõ (`defaultEyebrow`/`defaultVideoLabel`), không hàm mới >50 dòng, comment mới giải thích lý do (WHY).
- ai-friendly-web: N/A, task không đổi crawl/SEO surface.
- blitzstrike: N/A, không phải STRICT.

## Findings
- [CRITICAL] none
- [MAJOR] none
- [MINOR] n1 — `src/lib/home/home-view.test.ts:322`: tên test vẫn ghi "nút chỉ khi có nhãn + link", nay đã sai. Nút giờ chỉ phụ thuộc link, nhãn có mặc định i18n ở component. Fix: đổi tên test, ví dụ "…nhãn trống → null (component dùng mặc định i18n)".
- [MINOR] n2 — `src/components/home/FeaturedProjects.tsx:25`: khoảng từ mép nền kem tới eyebrow ~23px, mockup ~44px. Tổng khoảng từ đáy cụm ảnh vẫn ≈ mockup (49px so với 67px), chấp nhận được. Nếu muốn sát mockup hơn: `[[data-block=about]+&]:pt-10`, hoặc giữ `pt-4` và tăng nhẹ `pb` của About.
- [MINOR] n3 — chưa có unit test khẳng định FeaturedProjects mang class biến thể `[[data-block=about]+&]:pt-4`. Hành vi chỉ được chứng minh qua ảnh 1440. Fix (tuỳ chọn): thêm assertion class trong `FeaturedProjects.test.tsx`.

## Verdict
**PASS** (không có CRITICAL/MAJOR; 3 MINOR không chặn)
