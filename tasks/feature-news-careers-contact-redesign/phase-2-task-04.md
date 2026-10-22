# feature-news-careers-contact-redesign · phase-2-task-04 — Chi tiết tuyển dụng `/tuyen-dung/[slug]` theo design

- Nguồn: BL-054 Quyết định 10; design `docs/specs/listing-detail-redesign/chi-tiet-tuyen-dung.webp`. Spec 1.47.0 khối BL-054 mục "Chi tiết tuyển dụng".
- Plan: phase 2 wave B (song song P2-T02).
- Phụ thuộc: P1-T01 (`isUrgent`), P2-T03 (`job-view` / badge / helper lương-hạn).

## Classification / Risk
- Type: **MODIFY**. Risk: **HIGH** — form ứng tuyển (upload CV, Turnstile, consent) phải giữ nguyên hành vi; tin hết hạn (noindex, ẩn form, JSON-LD). Review: **STRICT**.
- Blast radius: `src/app/(frontend)/[locale]/tuyen-dung/[slug]/*`, `src/components/careers/JobDetail.tsx`, `src/components/careers/ApplyForm.tsx` / `ApplyFormSlot.tsx` / `CvPicker.tsx` (chỉ trình bày: thẻ tệp đã chọn + nút xoá; không đổi payload gửi), `src/components/careers/*` mới (`JobDetailHero`, `OtherJobs`), `src/lib/careers/job-queries.ts` (việc khác ưu tiên cùng danh mục), i18n namespace `page.jobDetail.v2`, `.context/design-spec.md`, `docs/DESIGN.md`.
- Doc impact: `.context/design-spec.md` (Chi tiết tuyển dụng), `docs/DESIGN.md`.

## Files to Create/Modify
- `src/app/(frontend)/[locale]/tuyen-dung/[slug]/`
- `src/components/careers/JobDetail.tsx`
- `src/components/careers/ApplyForm.tsx`
- `src/components/careers/CvPicker.tsx`
- `src/components/careers/JobDetailHero.tsx`
- `src/components/careers/OtherJobs.tsx`

## Scope (theo spec — xem ảnh design)
1. Hero ảnh nhạt (ảnh Tuyển dụng sẵn có + scrim sáng token): breadcrumb → phòng ban + badge "Tuyển gấp" → tiêu đề 2 dòng (dòng 2 màu nhấn; tách tiêu đề theo quy tắc hiển thị — vd cụm cuối / sau dấu "–" — không thêm trường; không tách được → 1 dòng) → mô tả ngắn (đoạn đầu `description`, ≤ 2 dòng) → hàng thông tin có icon (tỉnh/thành · hình thức · mức lương · "Hạn nộp: …" — `/en` MM/DD/YYYY) → nút "Ứng tuyển ngay" (neo tới form) + "Chia sẻ" (`DetailShareButton` BL-052 nếu hợp).
2. Cột trái thẻ trắng: "Mô tả công việc", "Yêu cầu", "Quyền lợi" (`description` / `requirements` / `benefits`), danh sách dấu chấm tròn màu nhấn (style chỉ ở trang này); `benefits` trống → ẩn mục.
3. Cột phải dính ≥ lg: "Ứng tuyển vị trí này" + "Phản hồi trong 3 ngày làm việc" (i18n) + form hiện có: Họ tên, SĐT, Email, CV kéo-thả + **thẻ tệp đã chọn** (tên, dung lượng, nút xoá có `aria-label`), ô "Lời nhắn" tuỳ chọn (giữ), đồng ý chính sách, "Gửi hồ sơ" (giữ % tiến trình). < lg: form sau nội dung + thanh dính đáy như hiện tại. Payload gửi / validate / Turnstile **không đổi**.
4. "Vị trí khác": 4 thẻ (phòng ban, tên, tỉnh/thành, lương, nút mũi tên; tin còn hạn khác, cùng danh mục trước rồi mới nhất, cùng ngôn ngữ) + "Xem tất cả vị trí" → `/tuyen-dung`. Rỗng → ẩn. → banner tư vấn (**giữ** như hiện tại dù design không vẽ — spec-validation F6).
5. Tin hết hạn: băng + ẩn form + `noindex` + bỏ JSON-LD như hiện tại. JSON-LD `JobPosting` giữ.
6. Responsive 375 / 768 / 1280 / 1440.
7. Test: component (hero badge gấp, tách tiêu đề, thẻ tệp xoá được, benefits rỗng ẩn, việc khác), regression form (ApplyForm test hiện có PASS), hết hạn; chụp 1440 + 390 lưu `.context/review-reports/assets/bl054-p2t04-*`.

## Acceptance
- [ ] Bố cục khớp `chi-tiet-tuyen-dung.webp` ở desktop; mobile hợp lý.
- [ ] Nộp CV hoạt động như cũ (test + thử tay trên DB worktree); hết hạn đúng hành vi cũ.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Quy ước song song
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- `src/payload-types.ts` là file sinh: regen bằng `pnpm generate:types` (primary regen lại khi merge nếu xung đột).
- Không sửa file thuộc task song song cùng wave; cần thì ghi vào báo cáo để primary chuyển.
- Tái dùng component BL-052 (`src/components/listing/*`, `src/components/detail/*`, `Pagination`, `ConsultBanner`, `SectionHeading`, Button/Badge/chip sẵn có); token màu theo `no-raw-colors.test`; không thêm màu / kiểu nút mới.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`. Migration phát sinh thao tác phá huỷ → DỪNG, gắn `HIGH_RISK_MIGRATION`, báo primary.

## Quyết định (builder)
Agent: builder-strong (attempt 1).
1. **Giữ `DetailLayout`** (nền `primary-subtle`, thẻ phải dính `DETAIL_ASIDE_CARD_CLASS`, header ẩn khi cuộn như các trang chi tiết khác). Design có nền hơi xám (`bg`); lệch nhẹ, đổi lại tái dùng khung + cơ chế dính sẵn có (spec không yêu cầu rời khung như chi tiết tin).
2. **Hero sáng mới `JobDetailHero`** (không dùng `PageHero` vì nó là `.theme-dark-block` chữ trắng): ảnh `pageBanners.careers` + scrim token `bg` (`from-bg via-bg/90 to-bg/75`, ≥ lg nhạt dần sang phải `to-bg/10`). Không thêm màu/token. Breadcrumb `variant="plain"`.
3. **Tách tiêu đề `splitJobTitle`** (không thêm trường): (1) gạch nối có khoảng trắng → dòng 1 giữ gạch; (2) tiêu đề ≥ 5 tiếng có từ nối `cho/tại/về/mảng/for/at/in/of` (chừa ≥ 2 tiếng mỗi bên) → dòng 2 bắt đầu từ từ nối ("Chuyên viên tư vấn / cho thuê căn hộ" như design); (3) ≥ 6 tiếng → cắt ở tiếng chẵn gần nửa (tiếng Việt chủ yếu từ ghép 2 tiếng nên ít tách đôi một từ); (4) còn lại 1 dòng. Ghép 2 dòng bằng khoảng trắng = đúng tiêu đề → tên `h1` đọc đủ. Trade-off: heuristic, có thể vẫn tách xấu với tên lạ (vd 7 tiếng có từ ghép 3 tiếng) — chỉ ảnh hưởng hiển thị.
4. **Mô tả ngắn hero** = khối đầu có chữ của `description` (`firstBlockText`), `line-clamp-2`; nên đoạn đó xuất hiện cả ở hero lẫn mục "Mô tả công việc" (đúng spec "đoạn đầu `description`").
5. **Bỏ khối "Thông tin tuyển dụng" cũ** (nơi làm chi tiết `workplace`, số lượng `quantity`) — spec/design chỉ còn tỉnh · hình thức · lương · hạn nộp. `workplace` vẫn vào JSON-LD `JobPosting`. Ghi rõ để reviewer/spec-validator xác nhận.
6. **"Chia sẻ"**: thêm prop tuỳ chọn `label` cho `DetailShareButton` (BL-052) → nút viên thuốc viền `outline` có chữ; không truyền thì nút tròn chỉ icon như cũ (PostDetail không đổi).
7. **Tiêu đề mục** dùng chuỗi mới `page.jobDetail.v2.sections` ("Yêu cầu" thay "Yêu cầu ứng viên" theo design); JSON-LD `description` dùng cùng tiêu đề hiển thị. Bỏ eyebrow "Mục N" (design không có). Danh sách `ul` trong nội dung thành vòng tròn viền `primary` bằng class bọc ngoài (chỉ trang này, `RichText` không đổi).
8. **Form**: chỉ đổi trình bày — icon + placeholder ví dụ trong ô (FormField `icon`/`placeholder` sẵn có), nhãn "CV của bạn", nút "Gửi hồ sơ" rộng hết thẻ (giữ dải % + `progressbar`). Vùng CV: ≥ md viền nét đứt + icon `CloudArrowUp` + "Kéo thả CV vào đây hoặc **Chọn tệp**" (nút thật giữ nguyên, khoác kiểu chữ nhấn để giữ bàn phím/focus/label-in-name; chuỗi cũ giữ nên test cũ PASS) + định dạng/dung lượng; < md nút viền như cũ. Thẻ tệp: icon `FileText` + tên + dung lượng + nút xoá `aria-label`. Payload / validate / Turnstile / consent không đổi. Thêm dòng "Phản hồi trong 3 ngày làm việc." qua prop `subtitle` của `ApplyFormSlot`. Kênh dự phòng email/hotline dưới form **giữ** (design không vẽ — đường nộp khi form lỗi).
9. **"Vị trí khác"** hiện ở **cả tin còn hạn lẫn hết hạn** (trước: chỉ hết hạn, 3 tin). `findOtherOpenJobs(payload, locale, { currentId, categoryId }, now)`: tối đa 4 (`OTHER_OPEN_JOBS_COUNT = 4`), tin còn hạn cùng ngôn ngữ (qua `findPublicList`), cùng danh mục (khớp đúng id, không gộp danh mục con) trước rồi bù tin mới nhất (`id not_in`), ≤ 2 truy vấn. Thẻ mới `OtherJobs` (tái dùng `JobDepartmentLine`, `useJobSalaryLabel`); **xoá `JobCard.tsx`** (không còn nơi dùng; `git rm` nên đang ở index).
10. **Tin hết hạn**: băng giữ nguyên; nút chia sẻ ở hero; cột phải (trước là chia sẻ) nay là thẻ "Gửi CV để TAMI liên hệ khi có vị trí phù hợp." + `mailto:` email site-settings + nút "Xem tất cả vị trí" (tránh cột phải trống ≥ lg). Không form/nút/thanh dính, `noindex, follow`, không JSON-LD như cũ.
11. **Icon mới** trong `src/components/icons.ts`: `CloudArrowUp`, `FileText` (file dùng chung — primary lưu ý khi gộp với P2-T02).
12. **i18n** namespace mới `page.jobDetail.v2` (thêm cuối `page`). Close-out MINOR P2-T03: xoá khoá chết `page.careers.{apply, resultCount, perksRegion, perksEyebrow, perksTitle, perksTitleAccent, jobsEyebrow, jobsTitle, jobsTitleAccent, provinceLabel, allProvinces, deadline, applyCta}` và (do task này làm chết) `page.careerDetail.{summaryTitle, location, employmentType, quantity, quantityValue, salary, deadline, applyCta, otherTitle, sectionLabel, sections.*, applyForm.cv, applyForm.submit}` ở vi + en — đã grep mọi nơi gọi namespace trong `src/` (kể cả `load-page-banner` dùng `page.careers.title/description`). Thêm test `/en` cho `q` (MINOR-1).

## Verification summary (Builder)
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 error; 2 warning có sẵn ở `tools/task-dashboard/server.mjs`).
- Unit/UI: `vitest run src/components src/lib/careers src/i18n "src/app/(frontend)"` 157 file / 1392 test PASS; `vitest run src/lib tests/unit` 141 file / 1508 test PASS (gồm `no-raw-colors`, `job-view` mới: `splitJobTitle`, `firstBlockText`, `toJobDetailView`).
- Route test `tuyen-dung/[slug]/page.test.tsx` 17 PASS: hero (ảnh, breadcrumb, phòng ban + Tuyển gấp, `h1` 2 dòng, mô tả ngắn, Chia sẻ), hàng thông tin + `<time>`, benefits rỗng/null ẩn, form "Gửi hồ sơ" + subtitle + Lời nhắn, Vị trí khác (gọi theo `categoryId`, thẻ h3 link, rỗng ẩn), hết hạn (băng, không form/nút, không JSON-LD, thẻ phải gửi CV), JSON-LD, metadata/noindex, 404, `/en` không chữ Việt.
- `ApplyForm.test.tsx` (regression form: validate, kéo-thả, thẻ tệp + xoá, % tải lên, 429/expired) PASS — chỉ đổi tên nút "Ứng tuyển"/"Apply" → "Gửi hồ sơ"/"Send application".
- Integration (tuần tự, đã `select 1` Postgres): `tests/integration/job-postings.test.ts` 35 PASS (mới: `/en` + `q`; `findOtherOpenJobs` 4 tin, cùng danh mục trước, loại tin đang xem, `/en`), `tests/integration/job-applications.test.ts` 10 PASS.
- `pnpm build` PASS.
- Thử tay trên `next start -p 3124` (DB `tami_wt54_p2t03`, Turnstile test key): nộp CV thật qua Edge headless (điền form, gắn PDF, đồng ý, Turnstile) → "TAMI đã nhận hồ sơ", có dòng `job_applications` (status `new`, `cv` có, `consentAt` có, lời nhắn đúng). PDF hỏng → lỗi gắn đúng ô CV ("CV bị lỗi hoặc không đọc được"). Đã tắt server.
- Ảnh (`.context/review-reports/assets/`): `bl054-p2t04-vi-urgent-{1440,768,390}.png` (Tuyển gấp + có Quyền lợi), `bl054-p2t04-vi-plain-{1440,390}.png` (không gấp, không Quyền lợi), `bl054-p2t04-vi-expired-{1440,390}.png`, `bl054-p2t04-en-urgent-{1440,390}.png`, `bl054-p2t04-vi-form-file-1440.png` (thẻ tệp đã chọn), `bl054-p2t04-vi-form-success-1440.png`. `scrollWidth == clientWidth` ở mọi cỡ (không tràn ngang). Dữ liệu thử: sửa nội dung 2 tin trong DB worktree (mô tả/yêu cầu/quyền lợi dạng danh sách).
- Residual risk: `splitJobTitle` là heuristic hiển thị; tin "cùng danh mục" không gộp danh mục con; khối tóm tắt nơi làm/số lượng bị bỏ theo design (chờ reviewer xác nhận); `icons.ts` + `vi/en.json` là file chung có thể xung đột khi gộp với P2-T02.

## Review

## Doc impact
- `.context/design-spec.md` S13: thêm khối **As-built BL-054 P2-T04** (hero sáng, tách tiêu đề, thẻ nội dung, form, Vị trí khác, hết hạn, i18n `page.jobDetail.v2`).
- `docs/DESIGN.md` bảng màn: hàng "Chi tiết tuyển dụng" → as-built BL-054.
- Không đổi API contract / schema / migration (không có `docs/API_SPEC.md` / `docs/ERD.md` impact). Intent docs (`SPECIFICATIONS.md`) không sửa.
