Agent: reviewer

# Review — feature-news-careers-contact-redesign · phase-2-task-03 · round 1

Danh sách Tuyển dụng `/tuyen-dung` theo design (BL-054). Worktree `.worktrees/feature-news-careers-contact-redesign__phase-2__task-03` (chưa commit, base f7936d4).

- **Review level:** STRICT
- **Reason:** trang công khai, tham số URL mới `q` (input người dùng → truy vấn DB), noindex/canonical khi lọc, shared component `src/components/layout/CtaBanner.tsx` (props đổi sang tuỳ chọn), shared `icons.ts`, `JobCardData` (view model) thêm field.
- **Blast radius:** `/tuyen-dung` · `/en/careers` (JobListPage, JobFilters, JobRow mới, CareersPerks/Process/CvBanner mới); `listOpenJobs` (`src/lib/careers/job-queries.ts`) — cũng được gọi ở chỗ khác qua nhánh không `q` (không đổi hành vi, chỉ tách `openJobConditions`); `JOB_CARD_FIELDS` thêm `category`, `isUrgent` (ảnh hưởng mọi truy vấn thẻ việc); `CtaBanner` layout — nơi dùng: `home/CtaBanner.tsx` (bọc cho HomeBlocks + ConsultBanner, luôn truyền action → không đổi), `CareersCvBanner` mới; i18n namespace mới `page.careers.v2`.

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `docker exec tami-postgres psql -U tami -d postgres -Atc "select 1"` | `1` (DB sống) |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS — 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (ngoài scope) |
| `pnpm vitest run src/components/careers src/lib/careers src/lib/content src/components/layout "src/app/(frontend)/[locale]/tuyen-dung"` | 48 files / 415 tests PASS |
| `DATABASE_URL_TEST=…/tami_wt54_p2t03 pnpm vitest run tests/integration/job-postings.test.ts` | 33/33 PASS (gồm test mới `q`: không dấu, AND, loại tin hết hạn + nháp, kết hợp tỉnh, `isUrgent` + phòng ban, phân trang 13 tin → 12 + 1, không trùng id) |
| `pnpm build` / full `pnpm test` | không chạy lại (Postgres dùng chung tải cao, theo chỉ dẫn primary); builder báo build PASS — residual risk |

## Kiểm trọng tâm

- **Tin hết hạn / chưa xuất bản / EN không lọt:** nhánh `q` gọi `findPublicList` (kèm `publicWhere`: published, chưa xoá mềm, `/en` cần `hasEnglish`) cho cả truy vấn quét lẫn truy vấn `id in` lấy trang; điều kiện `deadline >= startOfVietnamDay` dùng chung qua `openJobConditions` và được áp lại ở truy vấn thứ 2 (`and: [where, {id:{in}}]`) → không lọt tin đổi trạng thái giữa 2 truy vấn. Integration test chứng minh hết hạn + nháp bị loại. OK.
- **`q` an toàn:** không đi vào SQL — chỉ so khớp in-memory trên `title` sau `normalizeSearchText`; `firstValue` bỏ > 100 ký tự / rỗng; ≤ 8 từ; input `maxLength=100`; ra URL qua `URLSearchParams` (encode), render qua React (escape). Không injection/XSS. OK.
- **Phân trang với `q`:** `totalDocs = ids.length`, `totalPages = ceil/12`, slice offset `(page-1)*12`; trang vượt → `notFound()` (page>1 && page>totalPages; 0 kết quả trang 1 → empty state). Thứ tự giữ theo `JOB_SORT` nhờ map theo `pageIds`. OK.
- **Hiệu năng quét 500:** tối đa 10 truy vấn tuần tự × 50 dòng, `depth: 0`, chỉ `title`; chạm trần ghi warn. Quy mô tin tuyển dụng thực tế vài chục → 1 truy vấn. Chấp nhận được (xem MINOR-2).
- **noindex/canonical:** `hasJobFilterParams` thêm `q` → `noindex, follow` + canonical `/tuyen-dung` sạch; test metadata có case `{ q: "sale" }`. OK.
- **JSON-LD:** trang danh sách vốn không phát JSON-LD (chỉ `JobDetail.tsx:86`), diff không đụng → giữ nguyên. OK.
- **CtaBanner đổi không vỡ nơi khác:** chỉ `home/CtaBanner.tsx` và `CareersCvBanner` import; prop mới tuỳ chọn, additive; khối nút chỉ dựng khi có ít nhất 1 cặp label+href. `CtaBanner.test.tsx` PASS. OK.
- **Hạn nộp VN/en-US:** `job-view.test.ts` kiểm `30/11/2026` (vi) vs `11/30/2026` (en); UI test `/en` "Deadline: 11/30/2026". OK.
- **Phòng ban `/en`:** `visibleCategory` → danh mục chưa có bản EN trả `null` (không lộ chữ Việt). OK.
- **a11y:** cả hàng là một `<Link>` (test kiểm không có `a/button` lồng), tên vị trí `h3` dưới `h2`; nút mũi tên `aria-hidden`; badge là text; ô lọc có `label` sr-only; form GET + nút "Tìm" (không tự submit, WCAG 3.2.2); quy trình dùng `ol`, số `aria-hidden`; `role=status aria-live` cho số vị trí. OK.
- **Token màu:** chỉ class token (`bg-primary`, `bg-error-subtle text-error`, `text-accent-text`, `bg-primary-subtle`…), không màu thô. OK.
- **So design `tuyen-dung.webp`:** ảnh builder 1440 khớp bố cục: hero + nút neo, "Môi trường để bạn phát triển" 4 cột vạch dọc căn giữa, "Vị trí đang tuyển" + "N vị trí", chip + ô Khu vực + ô tìm, hàng 6 cột (phòng ban + Tuyển gấp, tỉnh, hình thức, lương đậm, Hạn, mũi tên), "4 bước đơn giản" có mũi tên, banner "Chưa tìm thấy vị trí phù hợp?" + "Gửi CV ngay". Lệch có chủ đích, đã ghi trong task + design-spec: nút "Tìm", placeholder "Tìm theo tên vị trí…" (không hứa tìm kỹ năng), banner tư vấn giữ.

## Responsive Checklist Gate (diff đụng UI)

Không có môi trường browser cho reviewer → xác minh bằng ảnh builder (1440 / 390) + CSS math; 375/768/1280 dựa trên báo cáo builder (`scrollWidth == clientWidth` ở 1440/1024/768/390/375) — residual risk.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Ảnh 390 không tràn; chip `< sm` cuộn ngang trong `ul overflow-x-auto` (container `nav min-w-0`), không đẩy document |
| Mobile-first `min-width` | OK | Tailwind `sm:/md:/lg:/xl:` (min-width) ở JobRow, JobFilters, CareersPerks, CareersProcess |
| Grid không cột cố định trên mobile | OK | JobRow `grid` 1 cột < sm, `minmax(0,1fr)_auto` ≥ sm, 6 cột ≥ lg (cột 1 `minmax(0,1fr)`); Filters 1 cột < sm, `minmax(0,13rem)_minmax(0,1fr)_auto` ≥ sm; Perks 1→2→4; Process 1→2→flex |
| Container không fixed px | OK | `max-w-container px-gutter` |
| Typography rem / heading fluid | OK | token `text-h2/text-h4/text-body/text-small/text-eyebrow` (scale dự án) |
| Spacing theo scale | OK | `py-section-tight`, gap scale |
| Media | OK | Hero/CtaBanner dùng `PageHero`/`ResponsiveImage` sẵn có (không đổi); ảnh CV banner dùng chung đường ảnh đã kiểm |
| Touch target ≥ 44px | OK | Chip `min-h-11`; link "Xoá bộ lọc" `min-h-11`; hàng việc là link toàn khối (≥ 60px cao); Input/Select/Button chuẩn UI kit |
| Nav mobile | N/A | Header không đổi |
| Table | N/A | Không có bảng |
| 100vh | N/A | Không dùng |
| prefers-reduced-motion | OK | Chỉ `transition-colors/shadow` (không animation chuyển động) |
| Không che lỗi bằng overflow:hidden | OK | Không thêm `overflow-hidden` để che tràn |

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip, aislop not installed |
| oxlint (anti-slop) | skip, oxlint not configured (không có `.oxlintrc.json`); ESLint 0 error |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK — 1 indicator: `JobListPage()` dài > 50 dòng (vốn đã dài, diff thêm ~20 dòng JSX). Magic number có tên (`KEYWORD_SCAN_MAX_PAGES`, `MAX_KEYWORD_TERMS`, `CAREERS_PROCESS_MAX_STEPS`, `OPEN_POSITIONS_ID`); DESIGN.md + API_SPEC §3.13 + design-spec đã cập nhật. < 3 indicators |
| ai-friendly-web | N/A — không đổi `robots`/`sitemap`/`llms.txt`; trang lọc `noindex, follow` đúng chuẩn |
| blitzstrike | skip, không cài / không có môi trường được phép; `q` đã kiểm tay (không vào SQL) |

## Findings

**CRITICAL:** không có.

**MAJOR:** không có.

**MINOR**

1. [MINOR] `tests/integration/job-postings.test.ts:623` — test `q` chỉ chạy `vi`; chưa có case `/en` (tin `hasEnglish=false` không lọt khi có `q`, tìm theo title EN). Logic đi qua `findPublicList` chung nên rủi ro thấp. Đề xuất: thêm 1 assertion `listOpenJobs(payload, "en", { q })` với tin chưa có bản EN.
2. [MINOR] `src/lib/careers/job-queries.ts:902-918` — quét tuần tự tối đa 10 truy vấn, mỗi `findPublicList` có thể kèm count. Ổn ở quy mô hiện tại; nếu số tin còn hạn tăng mạnh nên chuyển sang cột `searchText` (như ERD §6) thay vì quét. Ghi residual risk, không chặn.
3. [MINOR] `src/i18n/messages/{vi,en}.json` — các khoá cũ `page.careers.resultCount`, `perksEyebrow/perksTitle/perksTitleAccent/perksRegion`, `jobsEyebrow/jobsTitle/jobsTitleAccent`, `provinceLabel`, `allProvinces`, `apply` có thể không còn được dùng ở trang danh sách (một số còn dùng ở `JobCard`/chi tiết). Đề xuất dọn khi P2-T04 chuyển xong `JobCard` (tránh đụng file chung khi song song).
4. [MINOR] `src/components/careers/CareersCvBanner.tsx:24` — banner dùng lại ảnh hero Tuyển dụng làm nền (design dùng ảnh khác); không có trường ảnh riêng. Chấp nhận, đã ghi trong task (quyết định 7).

## Residual risk

- Không tự chạy `pnpm build` và full suite (DB dùng chung tải cao); dựa vào báo cáo builder build PASS.
- Responsive 375/768/1280 dựa trên ảnh 390/1440 + CSS math + số liệu `scrollWidth` của builder, reviewer không chạy browser.

## Verdict

**PASS** — không CRITICAL/MAJOR; 4 MINOR không chặn.
