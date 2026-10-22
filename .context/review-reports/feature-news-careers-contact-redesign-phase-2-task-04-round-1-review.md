Agent: reviewer

# Review — feature-news-careers-contact-redesign · phase-2-task-04 · round 1 (BL-054 Chi tiết tuyển dụng `/tuyen-dung/[slug]`)

- **Review level:** STRICT
- **Reason:** form ứng tuyển có upload CV + Turnstile + consent (upload/file access), shared component (`DetailShareButton` dùng ở `PostDetail`, `icons.ts`, `vi/en.json`), query mới `findOtherOpenJobs` (lọc công khai/EN/còn hạn), SEO (noindex + JSON-LD JobPosting), xoá component `JobCard` + nhiều key i18n.
- **Blast radius:** `src/app/(frontend)/[locale]/tuyen-dung/[slug]/page.tsx`, `src/components/careers/{JobDetail,JobDetailHero(new),OtherJobs(new),ApplyForm,ApplyFormSlot,CvPicker}.tsx`, `JobCard.tsx` (deleted), `src/components/detail/DetailShareButton.tsx` (shared, `PostDetail`), `src/components/icons.ts`, `src/lib/careers/{job-queries,job-view}.ts`, `src/i18n/messages/{vi,en}.json`, docs `.context/design-spec.md` S13, `docs/DESIGN.md`. Không schema/migration/API contract. `src/payload-types.ts` chỉ khác EOL (không có trong `git diff --stat`).
- Worktree: `D:\prj\bds\.worktrees\feature-news-careers-contact-redesign__phase-2__task-04`, base `2b99a60`, chưa commit.

## Verify commands + result
| Command | Result |
|---|---|
| `docker exec tami-postgres psql -U tami -d postgres -Atc "select 1"` | `1` (OK) |
| `pnpm typecheck` | PASS (0 error) |
| `pnpm lint` | PASS — 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (ngoài scope) |
| `pnpm vitest run src/components/careers src/lib/careers src/components/detail src/i18n "src/app/(frontend)/[locale]/tuyen-dung"` | 20 file / 170 test PASS |
| `pnpm vitest run tests/integration/job-postings.test.ts tests/integration/job-applications.test.ts` | 2 file / 45 test PASS (WARN "Dịch: không xếp được job dịch" là log có sẵn của hook dịch, không fail) |

## Trọng tâm kiểm
- **ApplyForm payload/validate/Turnstile/% tải lên:** `git diff` ApplyForm chỉ đổi nhãn (`tv("submit")`, `tv("cv")`), thêm `icon`/`placeholder` vào `FormField` (prop có sẵn; typecheck PASS), bỏ `sm:w-fit` nút. Không đụng `additionalFields`, validate, `TurnstileWidget`, consent, logic `uploadPercent`. Diff `ApplyForm.test.tsx` chỉ đổi tên nút "Ứng tuyển"/"Apply" → "Gửi hồ sơ"/"Send application"; mọi assert payload (`body.get("cv")`…) giữ nguyên. Integration `job-applications` 10 PASS. OK.
- **CvPicker:** input thật sr-only + nút "Chọn tệp" thật giữ nguyên (aria-invalid/aria-describedby); `helperId` chỉ dời vào trong vùng drop, vẫn được tham chiếu. Thẻ tệp: icon `aria-hidden`, tên + dung lượng, nút xoá giữ `onRemove` + `aria-label` "Xoá tệp {name}" (key `removeFile` còn). OK.
- **Tin hết hạn:** `page.tsx:124` vẫn `!view.expired && …` mới build JSON-LD; breadcrumb `jsonLd={!view.expired}`; hero ẩn "Ứng tuyển ngay" khi expired; `ProjectStickyCta` chỉ khi còn hạn; aside đổi thành thẻ gửi CV + "Xem tất cả vị trí". Ảnh `bl054-p2t04-vi-expired-1440.png` khớp. noindex không đổi trong diff (test route PASS). OK.
- **JSON-LD JobPosting:** dựng từ `toJobPostingJsonLdInput(doc, …)` (dữ liệu doc, không phụ thuộc khối tóm tắt UI) → bỏ khối tóm tắt không làm mất `workplace`/`validThrough`/… Chỉ đổi headings sang `page.jobDetail.v2.sections` ("Yêu cầu"). OK.
- **Bỏ khối tóm tắt (workplace/số lượng):** SPECIFICATIONS BL-054 "Chi tiết tuyển dụng (Quyết định 10)" định nghĩa hàng thông tin = "tỉnh/thành · hình thức · mức lương · Hạn nộp" — khớp; design cũng không có. Xác nhận hợp lệ theo spec.
- **"Vị trí khác":** `findOtherOpenJobs` đi qua `findPublicList` (published + `/en` cần bản EN, như cũ), lọc `deadline >= startOfVietnamDay(now)`, loại tin hiện tại (`not_equals` rồi `not_in` gồm cả tin cùng danh mục đã lấy) → không trùng, ≤ 4, ≤ 2 query. Integration có ca 4 tin / cùng danh mục trước / loại tin đang xem / `/en`. Spec "4 thẻ… tin còn hạn khác, cùng danh mục trước" — khớp. OK.
- **i18n key bị xoá:** grep `src` + `tests` các key `page.careers.{provinceLabel, allProvinces, apply, resultCount, deadline, perks*, jobs*, applyCta}` và `page.careerDetail.{summaryTitle, location, employmentType, quantity(Value), salary, deadline, applyCta, otherTitle, sectionLabel, sections.*, applyForm.cv, applyForm.submit}`: các lần gọi trùng tên còn lại đều thuộc namespace khác (`page.careers.v2` ở `JobFilters`/`JobListPage`/`CareersPerks`/`JobRow`, `tProjects` ở `HeroSearch`, `CategoryListTemplate`, `FilterPanel`…). `page.careers.employmentType.*` (object) còn. Typecheck (messages typed) PASS. Không còn test tìm "Ứng tuyển"/"Apply" button / "Vị trí đang tuyển khác" / `JobCard`. OK.
- **`DetailShareButton`:** `label` tuỳ chọn; không truyền → className và `aria-label` y như cũ (PostDetail không đổi). Có label → tên truy cập = chữ hiển thị (label-in-name). OK.
- **Banner tư vấn:** route vẫn render sau `JobDetail` (ảnh 1440 có "Cần tư vấn bất động sản?"). OK.
- **Token màu:** chỉ class token (`bg-bg`, `bg/90`, `text-accent-text`, `accent-display`, `primary-soft`, `border-primary`); không hex/raw color. OK.

## Responsive Checklist Gate (diff đụng UI) — bằng chứng: ảnh builder 390/768/1440 + CSS math
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Builder đo `scrollWidth == clientWidth` mọi cỡ; ảnh 390 không tràn; tên/email dài có `min-w-0`/`truncate`/`break-all` |
| Mobile-first `min-width` | OK | Tailwind `sm:/md:/lg:` (min-width) |
| Grid | OK | `OtherJobs` 1 → 2 (sm) → 4 (lg) cột theo spec; không auto-fit nhưng đúng quy ước repo + thẻ co theo cột, không fixed px |
| Container không fixed px | OK | `max-w-container px-gutter`, `max-w-2xl`, `max-w-[56ch]` |
| Typography rem/fluid | OK | token `text-h1/h2/h3/body/small` (rem/clamp của theme) |
| Spacing scale | OK | scale Tailwind / `py-section-tight` |
| Media | OK | hero `ResponsiveImage sizes="100vw" priority decorative` (srcset do component), `absolute inset-0` |
| Touch ≥ 44px (mobile 375) | OK | "Ứng tuyển ngay"/"Chia sẻ" dùng `buttonVariants`; link "Xem tất cả vị trí" `min-h-11`; nút "Chọn tệp" < md là nút viền đủ cao; thẻ "Vị trí khác" là cả khối link. (Xem MINOR-1 cho ≥ md) |
| Nav mobile / table | N/A | không đổi header; table trong RichText dùng wrapper có sẵn |
| Không `100vh` | OK | không dùng |
| `prefers-reduced-motion` | OK | CvPicker giữ `motion-reduce:transition-none`; thêm chỉ transition-colors/shadow ngắn |
| Không che lỗi bằng overflow:hidden | OK | `overflow-hidden` chỉ ở hero (cắt ảnh nền `absolute`) và nút submit (dải %) — có chủ đích |

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc.json`); ESLint + tsc PASS.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — tên rõ (`splitJobTitle`, `firstBlockText`, `OtherJobsContext`), hằng số đặt tên (`TITLE_*`, `OTHER_OPEN_JOBS_COUNT`), không indirection sâu, hàm ≤ 50 dòng, `docs/DESIGN.md` + design-spec S13 cập nhật. 0–1 indicator (class dài `ACCENT_LIST_CLASS` có comment WHY).
- ai-friendly-web: N/A (không đổi robots/sitemap/llms).
- blitzstrike: skip, không cài / không môi trường được phép; diff không đổi endpoint upload.

## Findings
- **[CRITICAL]** none
- **[MAJOR]** none
- **[MINOR-1]** `src/components/careers/CvPicker.tsx` (className nút "Chọn tệp", `md:h-auto md:px-0 md:text-small … md:underline`): từ md (768, tablet cảm ứng) nút thành chữ ~20px cao → touch target < 44px. Đề xuất giữ `md:min-h-11` (hoặc padding dọc) khi khoác kiểu chữ nhấn; hoặc cho cả vùng drop click mở file.
- **[MINOR-2]** `src/components/careers/JobDetailHero.tsx` + `JobDetail.tsx`: mô tả ngắn hero = khối đầu `description` nên đoạn đó lặp lại ngay ở "Mô tả công việc" (ảnh 1440/390). Đúng chữ spec ("đoạn đầu `description`"), nhưng design không lặp — cân nhắc bỏ khối đầu khỏi thân khi đã dùng làm intro, hoặc ghi chú để spec-validator/user quyết.
- **[MINOR-3]** `src/components/careers/ApplyFormSlot.tsx` subtitle dùng `-mt-3 mb-2` bù gap của thẻ cha — chạy được nhưng dễ vỡ khi đổi gap; nên để subtitle trong header cùng `h2`.
- **[MINOR-4]** `OtherJobs` lưới cột cố định (`sm:grid-cols-2 lg:grid-cols-4`) thay vì `auto-fit/minmax` theo skill responsive — chấp nhận theo spec "1 → 2 → 4", ghi nhận.

## Residual risk
- Không tự chạy browser: responsive xác minh qua ảnh builder + CSS math; 768 chỉ có ảnh `vi-urgent-768`.
- Độ tương phản chữ tối trên scrim `bg/75`–`bg/10` phụ thuộc ảnh banner thực tế (builder khẳng định AA ở < lg phủ gần kín).
- `splitJobTitle` là heuristic hiển thị (h1 vẫn đọc đủ tên).
- `icons.ts`, `vi/en.json` là file chung — có thể conflict khi merge với P2-T02.

## Verdict
**PASS** — không CRITICAL/MAJOR; hành vi form ứng tuyển (payload/validate/Turnstile/consent/% tải lên), tin hết hạn (băng/ẩn form/noindex/không JSON-LD), JSON-LD JobPosting, nguồn "Vị trí khác" và dọn i18n đều đã kiểm. 4 MINOR không chặn.
