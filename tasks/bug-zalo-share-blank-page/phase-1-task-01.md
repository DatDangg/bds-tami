# bug-zalo-share-blank-page · phase-1-task-01 — Nút chia sẻ Zalo ra trang trắng (BL-105, QA 24 Cao)

- Change doc: `spec/changes/2026-11-05-zalo-share-blank-page.md` (BACKLOG BL-105) — đọc mục "Điều tra root cause" + "Quyết định (user 2026-11-09)".
- Phụ thuộc: không.
- Trạng thái: `done` — NORMAL PASS round 1 (`.context/review-reports/bug-zalo-share-blank-page-phase-1-task-01-round-1-review.md`); 6 MINOR không chặn (m1 câu Zalo còn hiện khi bấm sao chép trong 3s, m2 fragment thừa, m3 comment prop variant, m4 test icons chưa khẳng định mất nút Zalo, m5 desktop có Web Share thấy "Chia sẻ", m6 design-spec còn mô tả Zalo là link)

## Classification / Risk
- Type: **BUG** (không đổi requirement khác ngoài hành vi nút Zalo theo quyết định user).
- Severity: high (QA Cao — nút chia sẻ chết).
- Risk: **MEDIUM** — `ShareButtons` là component dùng chung: chi tiết tin tức (biến thể `icons`, `NewsArticleHero`), tuyển dụng (biến thể `default`), menu dự phòng của `DetailShareButton` (Dự án / Cho thuê / Tin BĐS).
- Expected review level: NORMAL (shared component UI, không auth/schema/API).
- Doc impact dự kiến: `docs/DESIGN.md` nếu có mô tả cụm chia sẻ Zalo (builder grep "Zalo" trong DESIGN/design-spec — chỉ ghi lại nếu khớp phần as-built; KHÔNG commit `docs/DESIGN.md` vì file đang bẩn ngoài scope → ghi đề xuất vào task).

## Root cause (đã chứng minh — không điều tra lại)
`src/components/news/ShareButtons.tsx:83` dựng link `https://sp.zalo.me/plugins/share?dl=<url>&type=link`; endpoint này Zalo không còn hỗ trợ: `curl` trả HTTP 200 body 0 byte cho mọi domain (kể cả vnexpress.net) → trang trắng. Đây là nguồn Zalo DUY NHẤT trong `src` (`grep -rn "sp.zalo" src`).

## Thiết kế fix (quyết định user — không mở rộng)
- Bỏ hẳn endpoint `sp.zalo.me/plugins/share`; KHÔNG dùng SDK Zalo / OA ID.
- **Thiết bị có Web Share API** (`navigator.share`, đã có hook `useCanNativeShare` trong file): nút Zalo đổi thành nút **"Chia sẻ"** gọi `navigator.share({ title, url })` (mở menu chia sẻ của hệ điều hành; người dùng chọn Zalo). Tránh trùng: biến thể `icons` hiện đã có nút "thêm" (`shareMore`) dùng `navigator.share` khi có — builder gộp cho gọn (vd khi có Web Share thì chỉ còn 1 nút chia sẻ hệ điều hành thay cho cả Zalo + "thêm"), giữ Facebook + sao chép link.
- **Không có Web Share** (desktop): nút **"Chia sẻ qua Zalo"** (EN: "Share via Zalo") → copy link bài vào clipboard + thông báo hiển thị **"Đã sao chép liên kết — dán vào Zalo để chia sẻ"** (EN tương ứng). Dùng lại `useCopyLink` (`src/components/news/use-copy-link.ts`) hoặc trạng thái riêng; lỗi clipboard → câu `copyFailed` sẵn có. Site công khai KHÔNG có hệ thống toast — thông báo là vùng `role="status" aria-live="polite"` **nhìn thấy được** (biến thể `icons` hiện vùng status chỉ `sr-only` → thông báo Zalo phải nhìn thấy, vd dòng chữ nhỏ cạnh/ dưới cụm nút, kể cả tone `on-dark`), tự ẩn sau ~3s như mẫu `CopyVoucherButton`.
- Server/trước hydrate render nút desktop (copy) — `useCanNativeShare` đã trả `false` ở server, không lệch hydrate.
- Nút là `<button type="button">`, không còn `<a target=_blank>` tới Zalo; vùng chạm ≥ 44px giữ class sẵn có; `aria-label` theo ngữ cảnh.
- i18n: thêm key vào `src/i18n/messages/vi.json` + `en.json` (namespace `page.news.share` hoặc tương đương đang dùng) — test `messages-check` phải PASS.
- `DetailShareButton` (`src/components/detail/DetailShareButton.tsx`) chỉ dùng `ShareButtons` làm menu dự phòng khi không có Web Share → tự hưởng hành vi desktop; không cần sửa trừ khi test vỡ.

## Files
- Sửa: `src/components/news/ShareButtons.tsx`, có thể `src/components/news/use-copy-link.ts`, `src/i18n/messages/vi.json`, `src/i18n/messages/en.json`, test `src/components/news/news-components.test.tsx` (hoặc file test mới cạnh component).
- KHÔNG đụng: file đang bẩn ngoài scope (`src/endpoints/**`, `src/jobs/**`, `docs/**`, `tools/**`, `package.json`, `pnpm-lock.yaml`, `spec/changes/BACKLOG.md`), `.context/runs/*`.

## Acceptance
- [ ] Không còn chuỗi `sp.zalo.me` trong `src/` (trừ test khẳng định không có).
- [ ] Có Web Share: bấm nút "Chia sẻ" gọi `navigator.share` với đúng `url` + `title`; huỷ (AbortError) không báo lỗi.
- [ ] Không có Web Share: nút "Chia sẻ qua Zalo" copy đúng URL bài và hiện thông báo nhìn thấy "Đã sao chép liên kết — dán vào Zalo để chia sẻ"; lỗi clipboard báo lỗi.
- [ ] Bản EN có chữ tiếng Anh; `messages-check` PASS.
- [ ] Test hồi quy (fail trước / pass sau): href Zalo cũ không còn; hai nhánh có/không `navigator.share`.
- [ ] Verify (`.context/project-config.md`): `pnpm typecheck`, `pnpm lint`, `pnpm vitest run src/components/news src/components/detail src/i18n` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: chi tiết tin tức → bấm Zalo → tab `sp.zalo.me/plugins/share?dl=…` trắng.
- Expected: mobile mở menu chia sẻ hệ điều hành; desktop copy link + thông báo dán vào Zalo.
- Actual before fix: nút Zalo là `<a href="https://sp.zalo.me/plugins/share?dl=…">` → endpoint trả 200 body rỗng → trang trắng.
- Actual after fix: không còn link sp.zalo.me. Có Web Share: nút "Chia sẻ" (icons: aria-label "Chia sẻ qua ứng dụng khác") thay cả Zalo + nút "thêm" cũ, gọi `navigator.share({title,url})`. Không có Web Share: nút `<button>` "Chia sẻ qua Zalo" copy URL + thông báo nhìn thấy "Đã sao chép liên kết: dán vào Zalo để chia sẻ" (tự ẩn 3s); lỗi clipboard → "Không sao chép được".
- Evidence: `pnpm vitest run src/components/news src/components/detail src/i18n` 21 file / 185 test PASS (thêm 2 test BL-105, sửa 2 assertion link→button); `grep sp.zalo src` chỉ còn comment + test khẳng định không có; `pnpm lint` PASS. `pnpm typecheck` lỗi duy nhất ở `src/globals/site-settings/social-links.test.ts` (ngoài scope, builder khác), không lỗi ở file task.
- Status: PASS (chờ reviewer)

## Residual risk
- Câu thông báo dùng ":" thay "—" vì test `messages-check` cấm gạch dài trong i18n (VI: "Đã sao chép liên kết: dán vào Zalo để chia sẻ").
- Chưa kiểm bằng trình duyệt thật / mobile (chỉ jsdom). Biến thể `default` trên thiết bị có Web Share (tuyển dụng) nay hiện nút "Chia sẻ" thay Zalo.
- Thông báo Zalo ở biến thể `icons` là dòng chữ `w-full` dưới hàng nút; chưa soi bố cục hero tối ở 375/768/1280.

## Doc impact
- `docs/DESIGN.md`: không nhắc cụm chia sẻ Zalo của tin tức → no doc impact.
- `.context/design-spec.md` (~dòng 553, 608) mô tả Zalo là link và nút "thêm" chỉ khi có `navigator.share`: đề xuất đổi thành "Zalo = nút sao chép link + thông báo; có Web Share thì nút Chia sẻ thay Zalo + nút thêm" (file đang bẩn ngoài scope, không sửa).
