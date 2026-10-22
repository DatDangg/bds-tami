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

## Verification summary (Builder)

## Review

## Doc impact
