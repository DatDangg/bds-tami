# feature-news-careers-contact-redesign · phase-3-task-01 — Dọn MINOR sau phase review P1+P2

- Nguồn: phase review `.context/review-reports/feature-news-careers-contact-redesign-phase-1-2-phase-review.md` (GAPS: 0 MAJOR, 6 MINOR) — danh sách close-out C1–C11. Spec 1.47.0 khối BL-054.
- Plan: phase 3, 1 task (tuần tự). Không migration, không đổi schema / API contract.
- Phụ thuộc: P1-T01..P2-T05 (đã merge staging).

## Classification / Risk
- Type: **MODIFY** (dọn dẹp + 1 thay đổi hiển thị nhỏ). Risk: **MEDIUM** — chạm form ứng tuyển (chỉ trình bày), truy vấn tìm tin (thêm điều kiện danh mục), i18n. Review: **STRICT** (form ứng tuyển + truy vấn công khai).
- Blast radius: `src/components/careers/CvPicker.tsx`, `src/components/careers/ApplyFormSlot.tsx`, `src/components/careers/JobDetail.tsx` (+ `src/lib/careers/job-view.ts`), `src/app/(frontend)/[locale]/lien-he/page.tsx`, `src/lib/backfill/offices.ts`, `src/collections/NewsletterSubscribers.ts`, `src/endpoints/admin/newsletter-export.ts`, `src/blocks/news/index.ts`, `src/lib/news/news-search.ts` (+ nơi gọi), `src/i18n/messages/{vi,en}.json`, `.context/design-spec.md`.
- Doc impact: `.context/design-spec.md` (S13, S15).

## Files to Create/Modify
- `src/components/careers/CvPicker.tsx`
- `src/components/careers/ApplyFormSlot.tsx`
- `src/components/careers/JobDetail.tsx`
- `src/lib/careers/job-view.ts`
- `src/app/(frontend)/[locale]/lien-he/page.tsx`
- `src/lib/backfill/offices.ts`
- `src/collections/NewsletterSubscribers.ts`
- `src/endpoints/admin/newsletter-export.ts`
- `src/blocks/news/index.ts`
- `src/lib/news/news-search.ts`
- `.context/design-spec.md`

## Scope
1. **C1** `CvPicker`: nút "Chọn tệp" giữ vùng chạm ≥ 44px ở mọi khổ (`min-h-11`), kiểu chữ nhấn như hiện tại.
2. **C2** `.context/design-spec.md` S15: icon thẻ Liên hệ = 48px (khớp `size-12`).
3. **C3** `lien-he/page.tsx` `md:-mt-[88px]`: gắn với độ overlap của `PageHero` — dùng chung một hằng / class hoặc comment ghép cặp rõ hai giá trị.
4. **C4** Backfill văn phòng: khi ghi VI thành công mà EN lỗi → báo cáo ghi rõ "nhập EN tay trong admin (Cài đặt website → Hệ thống văn phòng)".
5. **C5** `ApplyFormSlot`: subtitle ("Phản hồi trong 3 ngày làm việc") nằm trong header cùng `h2`, bỏ `-mt-3 mb-2`.
6. **C6/C7** i18n: xoá key không còn dùng (`page.news.readArticle` nếu còn; rà `page.careers.*` / `page.careerDetail.*` / `page.newsDetail.*` / `page.contact.*` cũ) — grep kỹ `src` + `tests`, kể cả key dựng động; `pnpm i18n:check` PASS.
7. **C8** `NewsletterSubscribers.ts`: export `LOCALE_LABELS` (đúng khoảng trắng) và dùng lại ở `newsletter-export.ts` thay `LOCALE_NAMES`.
8. **C9** `src/blocks/news/index.ts`: comment trỏ đúng `NEWS_BLOCK_TEXT_FIELDS` trong `text-fields.ts`.
9. **C10** `news-search.ts`: `findFilteredNewsIds` nhận `categoryIds` (danh mục + con) và lọc trong SQL trước trần 1000 id; trang danh mục truyền vào. Thêm test integration (danh mục + `q`).
10. **C11 (G4 — change-request quyết định theo tiền lệ BL-056 "đoạn dẫn + phần còn lại"):** chi tiết tuyển dụng: hero dùng đoạn đầu `description` làm mô tả ngắn; mục "Mô tả công việc" **bỏ đoạn đầu đó** khi phần còn lại có nội dung (đoạn đầu là paragraph); nếu `description` chỉ có 1 đoạn → giữ trong thân, hero không lặp (ẩn mô tả ngắn). JSON-LD `description` giữ đủ nội dung. Test.

## Acceptance
- [ ] C1–C11 xong, có test cho C1, C5, C8, C10, C11.
- [ ] Payload / validate / Turnstile của ApplyForm không đổi (test hiện có PASS).
- [ ] `pnpm typecheck` · `pnpm lint` · test liên quan + integration `news` / `job-postings` / `job-applications` · `pnpm build` PASS.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Quyết định (builder)
- **C1:** thêm `md:min-h-11` cho nút "Chọn tệp" (< md đã có `h-11` của `Button size=md`). Đo trên trình duyệt: 44px ở 390 và 1024.
- **C3:** hằng `CARDS_OVERLAP_PULL = "-mt-16 md:-mt-[88px]"` ở `lien-he/page.tsx`, có comment ghép cặp với đệm đáy `PageHero overlap` (`pb-24 md:pb-[120px]`). `PageHero` có thêm comment ngược lại, nêu cả `OVERLAP_CLASS` của `CategoryListTemplate`. Không đổi giá trị nào, không tạo biến dùng chung: hai nơi dùng kéo khác nhau (64/88 và 56/84).
- **C4:** báo cáo thêm dòng "Bản EN chưa ghi được — nhập EN tay trong admin (…)" khi `apply`, có EN, VI đã ghi mà EN lỗi. Đường dẫn admin ghi đúng nhãn thật: "Cài đặt website → Cấu hình chung → Liên hệ & mạng xã hội → Hệ thống văn phòng". Task chỉ ghi gọn "Cài đặt website → Hệ thống văn phòng". Dòng ảnh văn phòng dùng chung hằng này.
- **C5:** `LeadFormSlot` (dùng chung) có thêm prop tuỳ chọn `subtitle`. Có `subtitle` thì `h2` và dòng phụ nằm chung `<header>` (mb-4, gap-1). Không có thì DOM y như cũ, nên Liên hệ / tin tức / `DetailContactAside` không đổi. `ApplyFormSlot` bỏ `-mt-3 mb-2`. File này ngoài danh sách task nhưng là cách duy nhất để dòng phụ vào cùng header với `h2`.
- **C6/C7:** `page.news.readArticle` đã bị xoá từ P2. Quét theo translator + namespace của từng file (literal + khoá dựng động `employmentType.${…}`, `sections.${…}`) trên `page.news|newsDetail|careers|careerDetail|jobDetail|contact`. Chỉ còn sót `page.news.v2.backToAll`, đã xoá ở vi + en. Mọi khoá cũ `page.careers.*` / `page.careerDetail.*` vẫn còn chỗ dùng.
- **C8:** `export const LOCALE_LABELS` trong `NewsletterSubscribers.ts` (khoảng trắng `= {` đã đúng sẵn). `newsletter-export.ts` dùng lại nó, bỏ `LOCALE_NAMES`.
- **C10:** `findFilteredNewsIds(payload, locale, { q, tag, categoryIds? })`. Tham số nằm trong object filters để lời gọi ở `/tin-tuc` không đổi. Điều kiện `n."category_id"::text IN (…)` (có tham số) chạy trong SQL trước `LIMIT 1001`; `categoryIds: []` trả `[]`. `loadNewsListing` chỉ truyền khi có danh mục. `listPublicNews` vẫn kèm `categoryIds` làm lớp chặn thứ hai.
- **C11:** dùng `splitDescriptionLead(description)` thay `firstBlockText`, hàm cũ đã xoá vì không còn chỗ dùng. Nếu khối đầu có chữ là `paragraph` và phần sau còn chữ: hero lấy đoạn đó, thân "Mô tả công việc" bỏ đoạn đó (bỏ cả khối trống phía trước). Các trường hợp còn lại (chỉ 1 đoạn, khối đầu là danh sách hay tiêu đề…): `intro = null` (hero ẩn mô tả ngắn), thân giữ nguyên. Khối đầu là danh sách thì cũng ẩn mô tả ngắn để không lặp, đúng "đoạn đầu là paragraph". JSON-LD `description` và meta description vẫn đọc `doc.description` đủ. Dữ liệu gốc không bị sửa (đã test).
- **Attempt 2 (sửa review round 1 STRICT FAIL, phương án change-request chọn (a)+(c)):**
  - **MAJOR-1 / C11 (c):** `splitDescriptionLead` chỉ tách khi khối đầu có chữ là đoạn **chữ thuần** (`isPlainTextParagraph`: mọi con là nút `text` có `format` 0 và không `style`). Có link, xuống dòng (`linebreak`), đậm / nghiêng / gạch chân / gạch ngang / code / style hay nút khác thì không tách: hero không có mô tả ngắn, thân giữ đủ cả link lẫn định dạng. Xuống dòng cũng tính là không thuần vì hero gộp khoảng trắng, sẽ làm mất ngắt dòng.
  - **MAJOR-1 / C11 (a):** `JobDetailHero` bỏ `line-clamp-2`, giữ `max-w-[56ch]`. Khi đã tách, đoạn dẫn hiện toàn văn. Khi không tách, hero không có đoạn mô tả (như attempt 1).
  - **MINOR-1:** JSDoc `findFilteredNewsIds` ghi rõ thứ tự: không `q`/`tag` → `null` (kể cả khi có `categoryIds`), có lọc và `categoryIds` rỗng → `[]`, còn lại → id khớp. Không đổi logic.
  - **MINOR-2:** `LeadFormSlot` gom `h2` vào một biến `heading`, lớp là `cn(!subtitle && "mb-4", "font-display text-h2-sm")`. Khi không có `subtitle`, chuỗi class vẫn là `mb-4 font-display text-h2-sm`, DOM y như cũ.
  - `.context/design-spec.md` S13: mô tả ngắn = đoạn dẫn chữ thuần, hiện toàn văn, không `line-clamp`. Có link / định dạng thì không tách.

- **Attempt 3 (sửa review round 2 STRICT FAIL, change-request chọn quy tắc bảo thủ):**
  - **MAJOR-1 / C11:** `splitDescriptionLead` chỉ bỏ qua các **đoạn rỗng** ở đầu (`isEmptyParagraph`: `paragraph` mà mọi con là `text` trắng/rỗng hoặc `linebreak`, hoặc không có con). Khối đầu tiên còn lại phải là đoạn chữ thuần mới tách. Khối khác đứng trước (upload, horizontalrule, relationship, heading, list, quote, block…) → không tách, thân là chính `content`. Khi tách, thân = `blocks.slice(leadIndex + 1)`: mọi khối trước `leadIndex` chắc chắn là đoạn rỗng nên bỏ chúng không mất nội dung (giữ hành vi test attempt 1).
  - **MINOR-1:** `isPlainTextParagraph` thêm điều kiện đoạn `format` rỗng (căn lề mặc định) và `indent` 0; căn giữa / thụt lề → không tách.
  - JSDoc `splitDescriptionLead` / `DescriptionLead` / helper mới + `.context/design-spec.md` S13 cập nhật theo quy tắc bảo thủ.
## Verification summary (Builder)
- `pnpm typecheck` PASS. `pnpm lint` PASS (0 lỗi; 2 warning có sẵn trong `tools/task-dashboard/server.mjs`).
- `pnpm i18n:check` PASS.
- Unit + UI (59 file: careers, tuyen-dung, lien-he, news, newsletter-export, backfill offices, blocks/news, forms, detail, layout, i18n): **539/539 PASS**.
- Integration chạy tuần tự trên DB `tami_wt54_p2t03`: `news` + `job-postings` + `job-applications` **77/77 PASS**; `newsletter` + `globals` **39/39 PASS**.
- `pnpm build` PASS.
- Test mới / sửa: C1 `ApplyForm.test.tsx` (class vùng chạm); C5 + C11 `tuyen-dung/[slug]/page.test.tsx` (dòng phụ nằm chung header với h2; đoạn dẫn chỉ hiện 1 lần, thân bỏ đoạn đó, JSON-LD đủ; 1 đoạn thì hero không có mô tả ngắn); C11 `job-view.test.ts` (`splitDescriptionLead`: nhiều đoạn / 1 đoạn / danh sách đứng đầu / rỗng / null, không đổi dữ liệu gốc); C8 `newsletter-export.test.ts`; C4 `offices.test.ts` (EN lỗi thì có dòng nhập tay, thành công thì không); C10 `tests/integration/news.test.ts` (id chỉ thuộc danh mục truyền vào, `q` / `tag` + danh mục, `[]`, `loadNewsListing` có danh mục + `q`).
- Ảnh (`next start` :3131 trên build, DB worktree), lưu ở `.context/review-reports/assets/`: `bl054-p3t01-vi-multi-1440.png` / `-390.png` (`chuyen-vien-tu-van-cho-thue-can-ho`: đoạn dẫn ở hero, thân bắt đầu từ đoạn 2; dòng phụ form ngay dưới h2; "Chọn tệp"), `bl054-p3t01-vi-single-1440.png` / `-390.png` (`thuc-tap-sinh-marketing`: hero không có mô tả ngắn, đoạn duy nhất ở thân). Kiểm thêm trong Browser pane: ở 390 `scrollWidth = 390` (không tràn ngang), nút "Chọn tệp" cao 44px ở 390 và 1024.
- Residual: ảnh 390 chụp bằng Edge headless bị cắt mép phải vì Edge headless dựng trang rộng hơn 390px. Trang thật ở 390 không tràn (đo `scrollWidth`). C10 chưa test đúng ca chạm trần 1000 id (cần > 1000 bài); test chỉ chứng minh danh mục được lọc trong SQL. Server :3131 đã tắt, không còn process node nào của worktree.
- **Attempt 2:**
  - `pnpm typecheck` PASS. `pnpm lint` PASS (0 lỗi; 2 warning có sẵn trong `tools/task-dashboard/server.mjs`). `pnpm i18n:check` PASS.
  - Unit + UI (careers, forms, lib/careers, lib/news, tuyen-dung, lien-he): 15 file, **209/209 PASS**.
  - Đã kiểm Postgres (`select 1` → 1), rồi chạy integration `tests/integration/job-postings.test.ts`: **35/35 PASS**.
  - `pnpm build` PASS.
  - Test mới, `job-view.test.ts`: đoạn dẫn dài lấy toàn văn; không tách khi có link / đậm (`format: 1`) / `style` / `linebreak`; `format: 0, style: ""` tường minh vẫn tách.
  - Test mới, `tuyen-dung/[slug]/page.test.tsx`: đoạn dẫn dài (3 câu) hiện đủ trong hero, `<p>` không có class `line-clamp`, thân không chứa đoạn đó. Đoạn dẫn có link thì hero không có mô tả, thân giữ link (`href` đúng) cùng đoạn sau.
  - Test cũ của LeadFormSlot / Liên hệ / ApplyForm PASS.
  - Ảnh: thêm tin `chuyen-vien-phat-trien-quy-can-ho-cho-thue` vào DB `tami_wt54_p2t03`. Tin chép từ `chuyen-vien-tu-van-cho-thue-can-ho`, chỉ có bản vi, đoạn dẫn khoảng 330 ký tự. Chụp lại `bl054-p3t01-vi-multi-1440.png` / `-390.png` (`next start` :3131 trên build): hero hiện đủ 5 dòng đoạn dẫn, "Mô tả công việc" bắt đầu từ đoạn 2. Đã kiểm thêm bằng HTML SSR: `<p class="max-w-[56ch] text-body text-text-secondary">` chứa toàn văn.
  - Residual: ảnh 390 vẫn bị Edge headless cắt mép phải như attempt 1 (Edge dựng rộng hơn 390px), lần này không đo lại `scrollWidth` bằng trình duyệt. Tin thêm vẫn còn trong DB worktree. Server :3131 đã tắt, không còn process node nào của worktree.

- **Attempt 3:**
  - `pnpm typecheck` PASS. `pnpm lint` PASS (0 lỗi; 2 warning có sẵn trong `tools/task-dashboard/server.mjs`). `pnpm i18n:check` PASS.
  - Unit + UI (careers, forms, lib/careers, lib/news, tuyen-dung, lien-he): 15 file, **211/211 PASS** (gồm toàn bộ test attempt 1+2).
  - Postgres `select 1` → 1; integration `tests/integration/job-postings.test.ts` **35/35 PASS**.
  - `pnpm build` PASS.
  - Test mới `job-view.test.ts`: upload đứng trước (kể cả đoạn rỗng → upload → đoạn dẫn) / horizontalrule / relationship / heading đứng trước → không tách, `body` là chính `content`; đoạn rỗng (text trắng, không con, chỉ `linebreak`) rồi đoạn chữ thuần → tách đúng, thân giữ upload + đoạn sau; `format: "center"` / `indent: 1` → không tách; `format: ""`, `indent: 0` tường minh vẫn tách.
  - Test mới `tuyen-dung/[slug]/page.test.tsx`: ảnh (upload media) trước đoạn dẫn → hero không có mô tả ngắn; "Mô tả công việc" render `img` (alt đúng) + đoạn dẫn + đoạn hai.
  - Residual: không chụp ảnh lại và không khởi động server :3131 (thay đổi chỉ ở logic tách, đã phủ bằng test render); chưa kiểm dữ liệu tin thật trong DB có khối ảnh/HR đứng đầu hay không — nếu có, các tin đó nay không còn mô tả ngắn ở hero.
## Review
- Round 1: `...-phase-3-task-01-round-1-review.md` — STRICT FAIL (MAJOR-1 C11 hero line-clamp cắt đoạn dẫn).
- Round 2: `...-round-2-review.md` — STRICT FAIL (MAJOR-1 khối không chữ trước đoạn dẫn bị cắt; MINOR căn lề).
- Round 3: `.context/review-reports/feature-news-careers-contact-redesign-phase-3-task-01-round-3-review.md` — **STRICT PASS**. MINOR-1 `splitDescriptionLead` chạy 2 lần / request → residual (rẻ, không side-effect); MINOR-2 chỉ có ảnh sau đoạn dẫn → không tách (chủ ý).

## Verification summary (close-out)
- Acceptance: **PASS** (attempt 3). Reviewer **STRICT PASS r3**: typecheck · lint · i18n:check · 15 file / 211 · integration job-postings 35/35 PASS. Builder: build PASS.

## Doc impact
- `.context/design-spec.md` S15: icon thẻ Liên hệ 56px → 48px (`size-12`) (C2). S13 as-built: mô tả ngắn = đoạn dẫn theo `splitDescriptionLead` (C11), dòng phụ cùng `<header>` với h2 (C5), "Chọn tệp" vùng chạm ≥ 44px (C1).
- Không đổi API contract / schema / migration. `docs/API_SPEC.md` / `docs/ERD.md`: no doc impact. C10 chỉ đổi truy vấn nội bộ, kết quả công khai không đổi ngoài việc không còn mất bài khi chạm trần.
