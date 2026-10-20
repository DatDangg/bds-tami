Agent: spec-validator

# Phase review — feature-site-redesign-homepage-style (BL-045) · phase 1 · round 1

- Mode: **Phase review** (sau T00–T08 PASS, đã commit trên `staging`; diff phase `9e96cbf..HEAD`)
- Nguồn đối chiếu: `spec/changes/2026-10-21-site-redesign-homepage-style.md` (Acceptance), khối BL-045 `SPECIFICATIONS.md:23-36` (working tree, chưa publish), `spec/updates/2026-10-21-site-redesign-homepage-style.md`, `docs/specs/site-redesign-mockup/{index.html,DECISIONS.md}`, task files T00–T08, review reports T00–T08, ảnh `.context/review-reports/assets/site-redesign-t08-*`.
- Ghi chú tên file: theo yêu cầu primary (`...-phase-1.md`); đây là **round 1**.

## Verdict: ⚠️ GAPS FOUND

Không có gap CRITICAL/HIGH. Có **2 gap MEDIUM** là lệch thật giữa code và spec/mockup mà không có quyết định của user: (1) trang danh mục Tin tức thiếu bài nổi bật, (2) lưới Tin tức / Tin BĐS chỉ 3 cột ở 1440. Mỗi gap cần **sửa code** hoặc **user duyệt lệch rồi ghi as-built**. Còn lại là các ghi chú as-built cần đưa vào SPECIFICATIONS khi publish, cùng việc dọn sổ sách close-out.

## Ma trận coverage (Acceptance của change doc)

| # | Requirement | Nguồn | Status | Evidence / note |
|---|---|---|---|---|
| A1 | Mỗi loại trang khớp bố cục mockup ở 1440 + 390 | change doc Acceptance #1 | ⚠️ PARTIAL | Có ảnh đặt cạnh mockup cho đủ 9 view, cộng Dịch vụ, chi tiết tuyển dụng, `/tin-bds` danh sách + chi tiết, danh mục cho thuê (`assets/site-redesign-t08-*`). Reviewer T08 chỉ mở 5/15 view (r1:56-61). Tôi spot-check thêm news-1440, article-1440, careers-1440: thứ tự/vị trí khớp, **trừ lưới tin 3 cột vs mockup 4 cột** (GAP-2). |
| A2 | Không màu/kiểu mới ngoài token (trừ token breadcrumb) | Acceptance #2 | ✅ | `no-raw-colors.test` là gate trong mọi task. `.crumb-glass` dùng `--blur-breadcrumb` + `--color-banner-scrim` (T08 r1:140). |
| A3 | Không còn icon tim, kể cả trang chủ | Acceptance #3, DECISIONS #2 | ✅ | Grep `Heart`/`heart` trong `src`: chỉ còn assertion phủ định trong test (`ProjectsSlider.test.tsx:146-147`, `RentalCard.test.tsx:67`, `project-components.test.tsx:41`). |
| A4 | Không đầu khối canh giữa ở Tin tức / Bài viết / Tuyển dụng / "tương tự" | Acceptance #4, DECISIONS #3/#6 | ✅ | Không có `text-center` trong `news/posts/careers/detail` ngoài empty state (`JobListPage.tsx:113`). Test khoá: `news-components.test.tsx:100`, `NewsDetailPage.test.tsx:85`, `post-components.test.tsx:96`. |
| A5 | Giữ hành vi: lọc/query/phân trang, form lead, bản đồ, subnav, SEO 1 `h1`, JSON-LD, i18n | Acceptance #5 | ✅ / ⚠️ | Lọc `/du-an` + `/cho-thue`: integration `projects.test.ts` 31/31, review T00/T03. Subnav: reviews T04/T05. 1 `h1`/trang + BreadcrumbList: T08 summary:40. **i18n:** vi/en có cùng số key mới (9/9); messages-check PASS. **`/en` không có evidence xem thật** (T08:40 "không chụp thêm"): residual risk, xem GAP-4. |
| A6 | Ảnh + chữ hero sửa được trong admin, có EN; fallback hợp lý | Acceptance #6 | ✅ | T01: schema `pageHeroes` localized, `careersPerks`, ảnh contact/legal, migration additive `20261020_183923_site_redesign_page_heroes`. `globals.test.ts` 30/30 (vi/en). Thiếu ảnh → nền `bg-dark-deep` (`PageHero.tsx:35-43`). |
| A7 | AA (kể cả breadcrumb trên ảnh sáng); tests/typecheck/build PASS | Acceptance #7 | ⚠️ PARTIAL | AA: đo trên ảnh thật, median ≥ 9.9:1, p95 ≥ 7.6:1 (T08:39; `design-spec.md:125`). typecheck/lint/vitest PASS (T08 r2). **`pnpm build` không được chạy lại sau T08 round 2** (reviewer bỏ qua vì dev server giữ `.next`; builder báo PASS ở round 1). Xem GAP-4. |

## Ma trận coverage (spec delta BL-045 ↔ task ↔ code)

| Requirement (SPECIFICATIONS) | Task | Status | Note |
|---|---|---|---|
| Breadcrumb trên ảnh / trơn (`:24`) | T01 | ✅ | Bài viết thêm mắt xích tiêu đề bài: lệch đã ghi (T06:56), xem AB-4 |
| Hero trang con 2 cỡ "chiều cao cố định" (`:25`) | T01 | ✅ lệch đã ghi | Code dùng `min-h` (`PageHero.tsx:26`); design-spec `:129` đã ghi. SPECIFICATIONS vẫn ghi "cố định": AB-1 |
| Danh sách Dự án/Cho thuê + Q1 `q`/`developer`/`sort` (`:26`) | T00, T03 | ✅ | `API_SPEC.md:190-200` as-built, có ghi trần quét 1000. Sort cần JS: AB-5 |
| Thẻ dùng chung, bỏ tim (`:27`) | T02 | ✅ | Thẻ dự án bỏ giá: đúng "thẻ Dự án nổi bật" |
| Chi tiết Dự án / Cho thuê / Tin BĐS (`:28`) | T04, T05 | ✅ | Q6/Q7/Q8 đúng. `#description` bỏ (design-spec `:229`): AB-3. Tương tự ≤ 3 → lưới (T08:43). CTA chi tiết cho thuê / tin BĐS → `#lead-form` + `tel:`: AB-7 |
| Tin tức danh sách **+ danh mục**: chip → **bài nổi bật ngang** → lưới (`:29`) | T06 | ❌ PARTIAL | Danh mục không có bài nổi bật: **GAP-1** |
| `/tin-bds` + danh mục theo cùng bố cục (`:29`) | T06 | ⚠️ | Bỏ "Có N kết quả": AB-2. Danh mục `/tin-bds` cũng không có bài nổi bật (`post-listing.ts:39`): GAP-1 |
| Lưới 1/2/3/**4 cột (≥ xl)** cho trang danh sách (`:21`, lưới không bị BL-045 thay) + mockup `.grid` auto-fill 260px (4 cột ở 1440) | T06 | ❌ PARTIAL | `NewsListBody.tsx:19`, `PostListBody.tsx:19` dừng ở `lg:grid-cols-3`: **GAP-2** |
| Bài viết rời DetailLayout, Q3 (`:30`) | T06 | ✅ | Ảnh article-1440 khớp |
| Tuyển dụng + Q5 + Q9 (`:31`) | T07 | ✅ | Giữ bộ lọc (lệch đã ghi trong spec) |
| Liên hệ / Chính sách / Dịch vụ (`:32-34`) | T07 | ✅ | Không có ConsultBanner ở Liên hệ / Chính sách (grep đúng) |
| Banner tư vấn + footer (`:35`) | T01 | ✅ lệch nhỏ | Cặp tiêu đề + mô tả: AB-6 |
| Doc impact (`:36`) | T08 | ✅ | design-spec §1.6/§2.6/§2.7/S01/As-built `:229`; `DESIGN.md` (r2 MINOR-4); `ERD.md` +2; `API_SPEC.md` §3.9; `design-tokens.md` |

## Gaps

### GAP-1 [MISSING · MEDIUM] Trang danh mục Tin tức (và danh mục `/tin-bds`) không có bài nổi bật ngang
- Requirement: `SPECIFICATIONS.md:29` "**Tin tức (danh sách + danh mục):** hero thấp → chip → **bài nổi bật ngang** → lưới…". Change doc mục 3. T06 scope (`phase-1-task-06.md:20`): "bài nổi bật chỉ trang 1 `/tin-tuc` **và trang 1 danh mục**".
- Code: `src/lib/news/news-listing.ts:30-38` trả `featured: null` khi có `categoryIds`. Builder ghi ở T06:48 là "spec giữ truy vấn hiện tại", tức đã hiểu sai scope. Reviewer T06 không bắt được. `src/lib/posts/post-listing.ts:39`: danh mục `/tin-bds` cũng `null`; đây là hành vi BL-032 cũ, nhưng `:29` nói "/tin-bds + danh mục theo cùng bố cục (… bài nổi bật ngang …)".
- Không có quyết định user, và không ghi trong "Lệch so với mockup".
- Đề xuất: **sửa code** (task fix nhỏ, T06 follow-up). Trang 1 danh mục lấy bài nổi bật = `isFeatured` mới nhất trong danh mục, fallback bài mới nhất; loại bài đó khỏi lưới ở mọi trang như `/tin-tuc`. Với tin BĐS chỉ lấy `isFeatured` còn hạn, giống loader hiện có. Nếu user không muốn → hỏi user duyệt rồi ghi as-built. **Không** tự sửa `:29` cho khớp code.

### GAP-2 [PARTIAL · MEDIUM] Lưới Tin tức / Tin BĐS 3 cột ở ≥ xl, mockup và spec là 4
- Mockup `index.html:108`: `.grid{grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}` cho 4 thẻ/hàng ở 1440. Ảnh `site-redesign-t08-news-1440.png`: mockup trái 4 cột, thật phải 3 cột.
- Spec `:21`: trang danh sách (gồm Tin tức, Đăng tin BĐS) có lưới "1 / 2 / 3 / **4 cột (≥ xl)**". BL-045 chỉ thay banner và bố cục chi tiết, không thay số cột. Dự án và Cho thuê vẫn có `xl:grid-cols-4` (`ProjectListPage.tsx:177`, `RentalListPage.tsx:171`).
- Code: `NewsListBody.tsx:19` và `PostListBody.tsx:19` dừng ở `lg:grid-cols-3`. Nguồn gốc lệch là T06 scope ("lưới 3 cột ≥ lg"), tức task đã mâu thuẫn spec + mockup. Lệch này không có trong "Lệch so với mockup" của T06/T08. Acceptance #1 nói "Reviewer FAIL nếu lệch bố cục thấy bằng mắt".
- Đề xuất: thêm `xl:grid-cols-4` và `data-grid-max-cols="4"` cho 2 lưới, cập nhật test liên quan, chụp lại news/posts 1440. Hoặc user duyệt giữ 3 cột rồi ghi as-built.

### GAP-3 [LOW] Sổ sách close-out chưa đồng bộ
- Header task files (đã commit) vẫn ghi `Trạng thái: pending` (T03–T08) hoặc `built — chờ review` (T00–T02). Dòng `Reviewer verdict:` trống hoặc "(chờ round 2)" (vd `phase-1-task-08.md:6,46`, `phase-1-task-00.md:6,36`). Trong khi đó `progress.json` ghi cả 9 task `done` + STRICT PASS.
- `progress.json` feature `note` vẫn là "chưa build — implement qua /resume…". `spec/test-scope/current.json` vẫn `status: planned` (scope v45). `spec/updates/...md:3` vẫn ghi "planned — chưa build".
- Đề xuất: ở close-out phase, cập nhật trạng thái + verdict trong task files, note của progress, test-scope (scopeVersion +1, trigger close-out, commit/report thật) và dòng trạng thái của spec update.

### GAP-4 [LOW · residual] Evidence chưa đủ cho `/en` và build cuối
- `/en` các trang con không được xem thật (T08:40). Hiện chỉ dựa vào messages-check, unit test và integration.
- `pnpm build` chưa chạy lại sau T08 round 2, vì sửa `RentalTerms`, `RentalDetails`, `RentalAmenities`, `ConsultBanner` (T08 r2:21,103).
- Đề xuất: trước commit close-out / publish, chạy `pnpm build` khi dev server không giữ `.next` (hoặc trong worktree). Mở nhanh `/en/projects`, `/en/news`, chi tiết `/en`, `/en/careers` ở 1440 + 390 để xác nhận hero fallback chữ EN và breadcrumb.

## Lệch cần ghi as-built vào SPECIFICATIONS khi publish (không phải gap code)

Các lệch dưới đây hợp lý, đã có lý do trong task hoặc design-spec, và không hạ cấp intent. Khi publish 1.35.0, spec-publisher nên thêm một dòng "As-built (close-out)" vào khối BL-045, **không xoá** câu gốc:

| ID | Lệch | Nguồn ghi hiện tại | Ghi vào |
|---|---|---|---|
| AB-1 | Hero dùng `min-h` (360/440, 280/340) thay chiều cao cố định; chữ SSR nên không CLS; chữ dài làm hero cao thêm | `PageHero.tsx:25-26`, `design-spec.md:129`, T08:43 | `SPECIFICATIONS.md:25` |
| AB-2 | `/tin-bds` + danh mục bỏ hàng "Có N kết quả" (theo bố cục Tin tức) | T06:49, `design-spec.md:229` | `:29` (+ F4 `:110` đã đánh dấu "thay bởi BL-045") |
| AB-3 | Chi tiết cho thuê bỏ neo `#description`; link cũ rơi về đầu trang | T05 review r1:99, `design-spec.md:229` | `:28` |
| AB-4 | Breadcrumb Bài viết có thêm mắt xích cuối = tiêu đề bài (mockup dừng ở danh mục); JSON-LD không đổi | T06:52,56 | `:30` |
| AB-5 | `/du-an` `q` / sắp theo giá chạy quét bộ nhớ, tối đa 1000 dự án công khai (chạm trần → log cảnh báo; cần cột `searchText` + migration khi vượt). Ô sắp xếp cần JS (form không JS vẫn lọc `q` / tỉnh / tình trạng / chủ đầu tư) | T00:40,48, `API_SPEC.md:200`, T08:42, `project-queries.ts:85-128` | `:26` (câu p95 ≤ 500ms → thêm điều kiện "≤ 1000 dự án công khai") |
| AB-6 | ConsultBanner: tiêu đề và mô tả đi theo cặp. Admin có tiêu đề nhưng không mô tả → không hiện mô tả mặc định | `ConsultBanner.tsx:19,31`, T08 r2 MINOR-6 | `:35` |
| AB-7 | Banner tư vấn cuối chi tiết **cho thuê và tin BĐS** cũng trỏ `#lead-form` + nút `tel:` (spec chỉ nói chi tiết dự án; còn lại → `/lien-he`) | T05:51, `cho-thue/[slug]/page.tsx:142`, `tin-bds/[slug]/page.tsx:117` | `:35` |
| AB-8 | "Dự án/Căn tương tự" là lưới khi ≤ 3 thẻ (slider khi nhiều hơn); phân trang trang hiện tại nền `--color-primary` (mockup nền tối); breadcrumb overlay cao 44px (vùng chạm) | T08:43, T01:60-61 | `:24`, `:26`, `:28` (ngắn) |
| AB-9 | Tuyển dụng giữ bộ lọc hiện có trên danh sách vị trí | đã có trong `:31` | không cần thêm |

Lưu ý: nếu user duyệt giữ nguyên GAP-1 / GAP-2 thay vì sửa code, chúng cũng chuyển thành dòng as-built ở đây, **với ghi rõ user duyệt**.

## Intent docs / doc reconcile

- Không hạ cấp intent. Phase commits `9e96cbf..HEAD` không đụng `SPECIFICATIONS.md`, BRD, PRD, USER_FLOW: diff chỉ có `docs/API_SPEC.md` (+12), `docs/DESIGN.md` (+12/−11, các hàng cũ giữ dạng "Trước BL-045"), `docs/ERD.md` (+2). Spec delta trong working tree chỉ thêm khối BL-045 và đánh dấu "(bố cục thay bởi BL-045)" ở đoạn cũ, không xoá yêu cầu dữ liệu/quyền.
- Doc impact (`:36`) đã reconcile đủ: design-spec, DESIGN, ERD, API_SPEC, design-tokens. Còn thiếu: dòng trạng thái `spec/updates/...` + test-scope (GAP-3) và các dòng as-built AB-1..8 khi publish.
- i18n vi/en: số key mới bằng nhau, messages-check PASS. Key thừa đã dọn (T08:41). Xem GAP-4 về evidence `/en`.

## Đề xuất thứ tự xử lý

1. Hỏi user về GAP-1 và GAP-2: sửa code (khuyến nghị, vì cả hai là chữ trong spec/mockup đã duyệt) hay duyệt lệch.
2. Nếu sửa: 1 task fix (`phase-1-task-09` hoặc follow-up T06) → builder → reviewer → chụp lại news/posts/danh mục 1440 + 390.
3. Chạy `pnpm build` + xem `/en` (GAP-4).
4. Close-out phase: dọn GAP-3, publish 1.35.0 kèm AB-1..8, test-scope scopeVersion +1.
5. Spec-validator chạy lại round 2 (chỉ GAP-1/2/4).
