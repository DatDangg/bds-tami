Agent: reviewer

# Review — feature-homepage-redesign · phase-1-task-02 · round 1 (BL-044)

- **Review level:** STRICT
- **Reason:** sửa component dùng chung `layout/CtaBanner` (thêm prop `align`, dùng ở `/dich-vu/[slug]` + `ProjectDetail`); `ProjectsSlider` từng có bug BL-038/BL-037; nhúng iframe bên thứ ba (YouTube); xoá i18n key.
- **Blast radius:** trang chủ (Về TAMI, Dự án nổi bật, banner tư vấn); `src/components/layout/CtaBanner.tsx` → `src/app/(frontend)/[locale]/dich-vu/[slug]/page.tsx`, `src/components/projects/ProjectDetail.tsx` (đều dùng mặc định `center`, không đổi); `src/i18n/messages/{vi,en}.json` (xoá `page.home.projects.stats`, đổi `viewAll`).

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, 0 lỗi) |
| `pnpm lint` | PASS — 0 error, 2 warning cũ ở `tools/task-dashboard/server.mjs` (ngoài phạm vi) |
| `pnpm test` | PASS — 304 files / 3195 tests |
| `pnpm build` | skip (theo chỉ đạo: dev server dùng chung `.next`) |

## Kiểm tra chỉ định
- **/dich-vu CTA vẫn center:** OK — `align = "center"` mặc định (`src/components/layout/CtaBanner.tsx:26`); có 2 nơi gọi khác không truyền `align`; test `CtaBanner.test.tsx:42-53` kiểm cả center lẫn start.
- **BL-038 slider đi 1 vị trí / BL-037 khung tên đều:** OK — `useSnapSlider`/`SliderArrow` không đổi; các test BL-038 trong `ProjectsSlider.test.tsx` (dòng < 118) giữ nguyên và PASS; `h3 line-clamp-2 min-h-[2lh]` giữ (`ProjectsSlider.tsx:72`), thẻ `h-full flex-col` + `mt-auto` để hàng cuối thẳng nhau.
- **iframe:** OK — chỉ dựng trong `DialogContent` (Radix gỡ khi đóng), `title={label}`, `src` lấy từ `parseVideoUrl` → `https://www.youtube-nocookie.com/embed/<id>?autoplay=1&rel=0&playsinline=1` (`src/components/media/video-url.ts:48`). Test xác nhận chưa có iframe trước khi mở và không còn iframe sau khi đóng (`AboutBlock.test.tsx:61-71`).
- **CSP:** OK — repo không đặt header CSP toàn site (grep `Content-Security-Policy|frame-src` chỉ thấy `src/endpoints/admin/private-file-download.ts:96`, riêng cho endpoint tải file) → iframe youtube-nocookie không bị chặn. Ghi chú: nếu sau này thêm CSP thì phải cho phép `frame-src https://www.youtube-nocookie.com`.
- **/en thiếu bản EN → ẩn:** OK — mọi chữ mới chỉ render khi có giá trị (`eyebrow`, `titleAccent`, `imageCaption`, `videoLabel`, `cta`, `description`); có test EN (`AboutBlock.test.tsx:81-90`).
- **1 h1:** OK — diff không thêm h1 (khối dùng h2/h3).
- **AA:** OK — accent-text #8c6733 trên bg ≈ 5:1; text-muted #6b6b6b trên surface ≈ 5.3:1; chữ trắng trên `banner-scrim` 60% đen, trường hợp xấu nhất (ảnh trắng) ≈ 5:1; icon trong vòng tròn đều `aria-hidden` (chỉ trang trí).
- **Không hex:** OK — diff không có hex; chỉ dùng token (`bg-primary-soft`, `bg-banner-scrim`, `bg-surface`…).
- **i18n bị xoá `page.home.projects.stats`:** OK — grep không còn chỗ dùng (`t("handover")` ở `ProjectSpecs.tsx:51` thuộc namespace khác, `page.projectDetail.specs`).
- **Tim:** OK — `span aria-hidden`, không có button hay tabindex; mỗi thẻ chỉ có 1 phần tử tương tác (có test).

## Đánh giá các điểm builder tự khai lệch
1. Ảnh About vuông, ảnh thẻ 11:10 — **hợp lệ** (mockup: ảnh lớn ≈1:1, ảnh thẻ ≈1.09:1).
2. Ảnh trang trí rộng 9% thay vì 22% — **hợp lệ** (mockup chỉ hé ở mép phải; task yêu cầu "không đè chữ").
3. Mô tả rộng 80ch — **hợp lệ** (mockup để 1 dòng).
4. Scrim một màu thay gradient — **chấp nhận được** (token có sẵn, đạt AA, task cấm tạo kiểu mới).
5. Dùng `primary-soft` thay `primary-subtle` — **hợp lệ**: mockup dùng vòng tròn be đậm hơn; `primary-subtle` #f8f3eb gần như không phân biệt được với nền.
6. Bỏ mảng nền be phía sau ảnh phụ vì "không có token" — **không hợp lệ**: `--color-primary-soft: #ead3ae` (globals.css:13) và `--color-primary-subtle: #f8f3eb` (globals.css:16) là token màu be có sẵn, dựng được mảng nền này (chỉ cần thêm một div `absolute` `bg-primary-soft rounded-xl` lệch sau ảnh phụ). → finding MINOR #1.
7. Đổi chữ `viewAll` + xoá key `stats` — hợp lệ (đã grep).

## Responsive Checklist Gate (diff đụng UI)
Không có browser; xác minh bằng CSS + ảnh 1440 (ảnh 390 không dùng được vì Edge headless).
- Layout — không tràn ngang: **OK** — dưới lg chỉ có 1 cột; các khối `absolute` (ảnh phụ, thẻ chú thích) chỉ áp dụng từ lg; ảnh trang trí ẩn dưới xl; slider tràn ngang có chủ đích trong `ul overflow-x-auto`. Builder khai ở 375 thì scrollWidth = 375 (chưa tự kiểm chứng).
- Mobile-first `min-width`: **OK** — dùng tiền tố `sm:`/`lg:`/`xl:`.
- Grid/container không cố định px: **OK** — dùng `%` / `max-w-[30rem]`; thẻ dùng `w-[82%] sm:w-[320px] lg:w-[272px]` (thẻ slider, chấp nhận được).
- Typography rem/token: **OK** — `text-h2`, `text-small`, `text-lead`, `text-eyebrow`.
- Media: **OK** — `ResponsiveImage` có `sizes`; khung có `aspect-*`; video dùng `aspect-video`.
- Touch ≥ 44px: **OK** — nút play `min-h-11` + vòng tròn `size-11`; cả thẻ là link.
- Nav/table: N/A.
- 100vh: N/A (không dùng).
- prefers-reduced-motion: **OK** — có `motion-reduce:` cho zoom ảnh và cuộn.
- Che lỗi bằng overflow:hidden: **OK (có ghi chú)** — `section overflow-hidden` đã có từ trước; xem MINOR #3.

## Skill gates
- aislop: skip, chưa cài `aislop`.
- oxlint (anti-slop): skip, chưa cấu hình oxlint; eslint 0 error.
- ocr: skip, chưa cài `ocr`.
- AI-readable: OK — 1 indicator (hàm `ProjectsSlider` khoảng 95 dòng, vượt 50 dòng, tình trạng đã có từ trước), dưới ngưỡng 3.
- ai-friendly-web: N/A (không đổi route/meta/robots).
- blitzstrike: N/A (không phải task auth/API).

## Findings
**CRITICAL:** không có.
**MAJOR:** không có.

**[MINOR] #1** `src/components/home/AboutBlock.tsx:32-36` — thiếu mảng nền be phía sau ảnh phụ như mockup; lý do "không có token" sai vì có `primary-soft` / `primary-subtle`. Cách sửa: thêm `<div aria-hidden className="absolute ... hidden lg:block rounded-xl bg-primary-soft" />` lệch lên trên/trái phía sau ảnh phụ, rồi cập nhật lại mục lệch (6) trong task file.

**[MINOR] #2** `src/components/home/ProjectsSlider.tsx:68` (vùng `ul` ở `:35`) — focus ring đổi từ `outline-offset-[-4px]` sang `outline-offset-2`. `ul` có `overflow-x-auto` nhưng không có padding trên, nên cạnh trên của vòng focus (4px phía ngoài thẻ) bị cắt; 3 cạnh còn lại vẫn thấy (`pb-2`, gutter). Cách sửa: thêm `pt-1`/`py-2` cho `ul` hoặc quay lại offset âm.

**[MINOR] #3** `src/components/home/AboutBlock.tsx:56-65` — số liệu ở lưới 2 cột trên 375: vòng icon 56px + gap 16px còn khoảng 80px cho `text-h2`. Giá trị dài (vd "10.000+") không xuống dòng được, sẽ tràn ô và bị `section overflow-hidden` cắt mất. Dữ liệu hiện tại ("10+", "500+") vẫn vừa. Cách sửa: thêm `break-words`, hoặc `size-12` dưới sm, hoặc 1 cột dưới 400px.

**[MINOR] #4** `src/components/home/AboutBlock.tsx:21` — khi không có `image` (nhưng có `secondaryImage`/video) thì cả cụm ảnh bị ẩn, kể cả nút video, và từ lg nửa trái lưới để trống. Hành vi này chấp nhận được nhưng nên ghi vào task / docs (vì "thiếu link video → ẩn" còn "thiếu ảnh lớn → ẩn cả video" thì chưa được nêu).

**[MINOR] #5** `tasks/feature-homepage-redesign/phase-1-task-02.md` — task yêu cầu `src/lib/home/youtube.ts` + test; builder dùng lại `parseVideoUrl` (đã có test ở `VideoFacade.test.tsx`). Cách này hợp lý (tránh trùng lặp), đã ghi lý do trong Verification summary — chỉ cần nhắc reconcile ở T03 / design-spec.

## Residual risk
- Chưa tự kiểm chứng độ rộng 375/390 bằng trình duyệt (ảnh 390 không dùng được); kết luận dựa trên CSS và lời builder khai.
- Nếu sau này thêm header CSP, phải whitelist `frame-src https://www.youtube-nocookie.com`.
- Mảng nền be và gradient của scrim là khác biệt hình ảnh nhỏ so với mockup.

## Verdict
**PASS** — không có CRITICAL/MAJOR; typecheck/lint/test PASS. Còn 5 MINOR, đề xuất sửa #1–#2 trong cùng task hoặc ở T03.
