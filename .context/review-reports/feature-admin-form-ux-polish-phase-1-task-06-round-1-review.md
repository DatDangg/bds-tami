# Agent: reviewer — feature-admin-form-ux-polish · phase-1-task-06 · round-1

> Report persist bởi primary (hook guard.mjs chặn reviewer Write do đường dẫn worktree lồng `.claude/worktrees/`). Nội dung của reviewer.

- Task: `tasks/feature-admin-form-ux-polish/phase-1-task-06.md` — Khung xem trước SEO cho Danh mục (follow-up BL-058)
- Diff: uncommitted vs HEAD `7ad7d46` — `src/lib/admin/seo.ts`, `src/lib/admin/seo.test.ts`, `src/components/admin/SeoPreview.tsx`, `src/components/admin/SeoPreview.test.tsx`
- Ngoài phạm vi (không review): `src/payload-types.ts`, `.opencode/**`, `.context/**`

## Review level: NORMAL
**Reason:** MODIFY UI admin, chỉ hiển thị (không ghi dữ liệu), không migration, không auth/tenant/API contract. Đụng shared helper `src/lib/admin/seo.ts` + `SeoPreview` dùng chung cho 7 collection + Trang chủ → không FAST; nhưng toàn bộ hành vi cũ được khóa bằng test T05 (giữ PASS) nên không cần STRICT.

## Blast radius
- `src/lib/admin/seo.ts`: `SEO_DESCRIPTION_SOURCE` (+`categories`), `seoPagePathKey` (+nhánh `categories`), `publicPageUrl` (thay `"[slug]"` bằng regex `DYNAMIC_SEGMENT`), `resolveDescriptionValue` (string `description` không còn qua `flattenMetaDescription`), thêm `seoTitleSource`, `CATEGORY_PAGE_ROUTES`, `seoNoPublicPageNote`.
- `src/components/admin/SeoPreview.tsx`: dùng chung cho mọi collection có `seoField()` + global Trang chủ → ảnh hưởng tab SEO của 7 collection + Danh mục + Trang chủ.
- Import mới: `src/hooks/categories/scope-collections.ts` (`CATEGORY_SCOPE_LABELS`) — chỉ đọc hằng.
- Không đụng metadata công khai, `src/lib/seo/**`, `spec/**`.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm exec eslint src tests` | exit 0, không lỗi |
| `pnpm typecheck` (`tsc --noEmit`) | exit 0 |
| `pnpm exec vitest run --project unit --project ui` | 344 files / 3365 tests PASS (139s) |
| `pnpm build` (acceptance task) | không chạy — không nằm trong verify command được phép của reviewer → Residual risk (builder báo PASS) |

## Đối chiếu với metadata thật (trọng tâm)
Ba hàm metadata danh mục (đã đọc trực tiếp):
- Cho thuê `src/components/rentals/rental-list-metadata.ts:75-83`
- Tin BĐS `src/components/posts/post-list-metadata.ts:78-85`
- Tin tức `src/components/news/NewsListPage.tsx:129-136`

| Quy tắc | Metadata thật | Preview | Khớp |
|---|---|---|---|
| Tiêu đề | `seo.metaTitle` trống → `category.name`; nối ` \| siteName` (`metadata.ts:68-71`) | `seoTitleSource("categories")="name"` → `buildSeoPreview` | OK |
| Mô tả | `seo.metaDescription` trống → `nonEmpty(category.description)` nguyên văn (`metadata.ts:113`), `description` là textarea (`Categories.ts:65`) | `resolveDescriptionValue("description", string)` → `nonEmptySeo` nguyên văn, KHÔNG cắt 160 (`seo.ts:105-108`) | OK |
| URL vi | `publicPath("/<scope>/danh-muc/[category]","vi",{category: slug.vi})` | `CATEGORY_PAGE_ROUTES[scope]` → `pathnames[...].vi` + slug (`routing.ts:16,26,32`) | OK |
| URL en | posts/news: `paths.en` chỉ khi `hasEnglish && slugs.en`; canonical en = `paths.en ?? paths.vi` (`metadata.ts:77`) | `hasEnglish !== true` → đường dẫn vi, không tiền tố `/en` | OK |
| Scope không có trang (project/job) | không có route/metadata nào | `seoPagePathKey` → `undefined`; `seoNoPublicPageNote` → câu báo thay khung | OK |

Test parity `seo.test.ts` "Danh mục: preview khớp buildPageMetadata…" chạy `buildPageMetadata` thật với đúng bộ tham số của 3 hàm (3 scope × 2 locale × 2 hasEnglish = 12 case + case SEO thắng) và so `title/description/alternates.canonical`, kèm giá trị cụ thể — không false-confidence.

**Khác biệt rentals (Builder ghi nhận):** `rental-list-metadata.ts:81` đưa `paths.en` chỉ cần `slugs.en` có (không cần `category.hasEnglish`), trong khi posts/news yêu cầu cả hai. `findLocalizedSlugs` (`src/lib/news/news-queries.ts:92-98`) trả slug EN đã lưu bất kể `hasEnglish`. Hệ quả: với danh mục Cho thuê có slug EN lưu sẵn nhưng `hasEnglish=false`, canonical ở locale `en` của trang công khai sẽ là đường dẫn EN còn preview hiện đường dẫn VI. Đánh giá: **không phải lỗi preview** — preview theo đúng quy tắc tài liệu hoá (`metadata.ts:32` "`en` chỉ truyền khi bản EN thật sự tồn tại") và khớp 2/3 trang; điểm lệch nằm ở metadata công khai (ngoài phạm vi cấm sửa của task). Trường hợp này cũng chỉ xảy ra nếu trang `/en/for-rent/category/<slug-en>` được render khi `hasEnglish=false` (chưa xác minh loader → Residual risk). Đề xuất task riêng: sửa `rental-list-metadata.ts:81` thành `hasEnglish && slugs.en` cho đồng bộ.

**Ô SEO ở scope Dự án / Tuyển dụng có tác dụng không (acceptance #2):** `category.seo` chỉ được đọc ở đúng 3 hàm metadata trên (grep `category.seo` toàn `src`, trừ test) → scope project/job: `seo.*` của Danh mục **không có tác dụng** ở bất kỳ trang công khai nào. Câu báo "Danh mục Dự án không có trang riêng trên website, nên phần này không cần điền." là đúng thực tế, không lộ thuật ngữ dev (test chặn `/scope|slug|route|seo/i`).

**Không hồi quy 7 collection + Trang chủ:** `seoTitleSource` trả `"title"` cho mọi slug ≠ categories; nhánh `CONTENT_ROUTES` trong `seoPagePathKey` giữ nguyên; `resolveDescriptionValue` chỉ đổi nhánh khi `description` là string (rentals/job-postings là object Lexical → vẫn flatten + cắt 160, test cập nhật dùng object); `publicPageUrl` regex `/\[[a-z]+\]/` tương đương `"[slug]"` cho mọi route chi tiết (mỗi khoá đúng một tham số). Toàn bộ test T05 (tên website, URL theo route, `/en` chỉ khi `hasEnglish`, fallback Trang chủ, chưa có dữ liệu) giữ PASS.

## Responsive Checklist Gate
Diff đụng component admin nhưng **không đổi CSS/layout**: nhánh mới chỉ render lại `<section className="tami-seo-preview">` + `<p className="tami-seo-preview__note">` đã có từ T05, không thêm class/inline style/media/table/nav.
- Layout: N/A (không đổi) · Typography/Spacing: N/A · Media: N/A · Touch/Interaction: N/A · Viewport/A11y: OK — `aria-label` riêng cho nhánh câu báo ("Trang này không có trên website"), không `100vh`, không `overflow:hidden` mới.
- Không có môi trường browser; không có CSS mới để tính → không có mục nào FAIL.

## Skill gates
- aislop: `skip, aislop not installed`.
- oxlint (anti-slop): `skip, oxlint not configured`. ESLint PASS thay thế.
- ocr (open-code-review): `skip, ocr not installed`.
- AI-readable: **OK** — tên rõ (`seoTitleSource`, `CATEGORY_PAGE_ROUTES`, `seoNoPublicPageNote`), hàm ≤ 10 dòng, indirection 1–2 bước, không magic number, comment WHY; không đổi luồng chính.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: N/A.

## Findings
- **[MINOR]** `src/components/admin/SeoPreview.tsx:22,89` — `SEO_NOTE` "Để trống thì trang tự lấy từ Tiêu đề, Tóm tắt và Ảnh đại diện." vẫn hiện cho Danh mục, trong khi ô dự phòng của Danh mục là **Tên** và **Mô tả**, và trang danh mục không lấy ảnh đại diện từ bản ghi. Fix đề xuất: tách note theo collection (categories → "Để trống thì trang tự lấy từ Tên và Mô tả danh mục."), thêm 1 assertion trong test Danh mục.
- **[MINOR — ngoài scope, đề xuất task riêng]** `src/components/rentals/rental-list-metadata.ts:81` — `paths.en` không gate theo `category.hasEnglish` (khác posts/news).

Không có CRITICAL / MAJOR. Security: component chỉ đọc form state + global site-settings (đã có từ T05), `encodeURIComponent(slug)` cho URL, không ghi dữ liệu.

## Residual risk
- `scope` có `access.update: denyAll` (`Categories.ts:52`) — chưa kiểm chứng trong browser rằng `fields["scope"].value` có trong form state khi sửa bản ghi. Nếu trống → khung hiện "Đường dẫn sẽ có sau khi lưu trang" (không sai dữ liệu, chỉ kém). Smoke một lần trên admin khi có Postgres.
- `pnpm build` chưa chạy bởi reviewer.
- Loader trang `/en` danh mục Cho thuê khi `hasEnglish=false` chưa đọc.

## Verdict: ✅ PASS
Không còn CRITICAL/MAJOR; acceptance #1–#3 có evidence (test parity với `buildPageMetadata` thật + đối chiếu file:line), #4 PASS 3/4 lệnh (build: builder báo PASS). MINOR về `SEO_NOTE` → follow-up.
