Agent: spec-validator

# Spec validation (pre-plan) — feature-projects-category-page (BL-090, MODIFY) — round 1

- Mode: **Spec validation** (trước khi builder chạy task)
- Spec: SPECIFICATIONS.md 1.60.0 (delta chưa commit) · design-spec S05 · spec/updates/2026-10-28-projects-category-page.md · CHANGELOG 1.60.0 · test-scope v91
- Task: tasks/feature-projects-category-page/phase-1-task-01.md
- Change doc: spec/changes/2026-10-27-projects-category-breadcrumb-title.md (Acceptance + "Quyết định user" cách B)

## Verdict: PASS (có điều kiện)

Delta phủ đủ 8/8 acceptance của change doc, không có ❌, không có conflict HIGH, chỉ 1 ⚠️ (MEDIUM). Plan/builder chạy được.
**Điều kiện:** sửa C-1 (câu "Dự án … không có trang danh mục công khai" ở SPECIFICATIONS.md:214) trong spec delta **trước commit close-out**. Gap as-built (mục 4) để change-request reconcile ở close-out.

## 1. Ma trận coverage (acceptance change doc → spec delta → task)

| # | Requirement (change doc) | SPECIFICATIONS 1.60.0 | design-spec | update / test-scope v91 | Task | Status | Note |
|---|---|---|---|---|---|---|---|
| A1 | Route `/du-an/danh-muc/[category]` · `/en/projects/category/[category]`, khai `routing.ts`, danh mục khoá gồm con | :59 khối BL-090 | S05 Routes :457, bullet Dự án :467 | update :12; acceptance[0] | Hướng làm 1–2 | ✅ | |
| A2 | `<title>` "<Danh mục> – Dự án \| TAMI", breadcrumb Trang chủ › Dự án › (cha) › Danh mục, H1, mô tả, VI/EN | :59 | :467 | update :12; acceptance[1] | 2, 5 | ✅ | Khác Cho thuê S05 as-built (`rental-list-metadata.ts:79` title = chỉ tên danh mục → "<Tên> \| TAMI"). Khác biệt này là yêu cầu rõ của change doc → hợp lệ; không cần đồng bộ ngược Cho thuê |
| A3 | Tab là link, `aria-current`, "Tất cả" → `/du-an`; lọc/sort/page/`q` giữ danh mục | :43, :59 | :467 | update :13; acceptance[2,3] | 3, 2 | ✅ | |
| A4 | `/du-an?category=` → 308, giữ tham số khác; slug lạ bỏ | :59 (ví dụ `?category=x&status=selling`) | :467 | update :14; acceptance[4] | 4 | ✅ | Xem mục 3 (đánh giá quyết định) |
| A5 | Slug không tồn tại → 404 | :59 (cả xoá mềm / scope khác / EN chưa dịch / vượt trang) | S05 generic "EN không hasEnglish → 404" | acceptance[5] | 2, 7 (`MISSING_PAGE_RULES`) | ✅ | |
| A6 | Sitemap VI/EN, canonical + hreflang | :59 (+ noindex khi lọc, FAQ JSON-LD chỉ `/du-an` sạch) | :467 | acceptance[6] | 5, 6 | ✅ | |
| A7 | Chặn slug dự án `danh-muc` (vi) / `category` (en) | :59 ("hook slug tự thêm hậu tố `danh-muc-2`") | — | acceptance[7] | 8 (`src/fields/slug.ts`) | ✅ | Đặt ở hook dùng chung `makeSlugHook` (`src/fields/slug.ts:53`), không đụng `Projects.ts` (dirty BL-077) — hợp lý |
| A8 | Spec delta (design-spec S05, DESIGN.md, API_SPEC) + spec-publish | ✅ 1.60.0 | ✅ S05 | ✅ CHANGELOG :85, update, test-scope v91 | Doc impact | ⚠️ | SPECIFICATIONS còn câu mâu thuẫn :214 (C-1). DESIGN.md / API_SPEC là as-built → close-out (mục 4), đúng luật AGENTS |
| — | "TAMI phân phối" | :59 ("bản ghi danh mục scope = project … cũng có trang danh mục riêng") | — | — | Hiện trạng (staging có `tami-phan-phoi`) | ✅ | Nhất quán spec / task / change doc (mặc định = danh mục). Câu hỏi mở với user trong change doc vẫn chưa có trả lời → residual R-3 |

Tổng: 8 ✅ · 1 ⚠️ · 0 ❌.

## 2. Cross-doc conflict / contradiction

| ID | Mức | Vị trí | Mâu thuẫn | Xử lý |
|---|---|---|---|---|
| C-1 | **MEDIUM** | `SPECIFICATIONS.md:214` (Tab SEO admin BL-058) | Vẫn ghi "loại Dự án / Tuyển dụng không có trang danh mục công khai → thay khung xem trước bằng câu 'Danh mục … không có trang riêng…'" — trái với khối BL-090 (:59) "Admin: xem trước SEO danh mục scope Dự án trỏ trang danh mục" và task bước 7 (`CATEGORY_PAGE_ROUTES.project`). Hướng đúng đã rõ (khối mới + task), nên không chặn plan | change-request sửa câu :214 trong delta 1.60.0 (thêm Dự án vào nhóm có trang danh mục `/du-an/danh-muc/[slug]`, chỉ Tuyển dụng không có) **trước commit** — intent doc, đã có user duyệt cách B |
| C-2 | LOW | `.context/design-spec.md:374` (S02 gốc) | "URL: `?category=&province=&status=&page=`" — `category` không còn trên URL `/du-an` | Đã bị as-built BL-052/BL-045 ghi "ưu tiên hơn chi tiết cũ bên dưới" che; nên thêm ghi chú "(BL-090: `category` → trang danh mục)" khi reconcile, không bắt buộc |
| C-3 | LOW | `SPECIFICATIONS.md:26` (BL-045 lịch sử) | "có `q`/`developer`/`sort` → noindex + canonical `/du-an`" — trên trang danh mục canonical là trang danh mục | Đoạn đánh dấu "bố cục thay bởi BL-052"; khối BL-090 nói rõ canonical trang danh mục sạch → không cần sửa |
| C-4 | LOW | design-spec S05 generic :463 "Danh mục có con: hàng chip danh mục con" | Bullet Dự án (:467) không nói có/không hàng chip con. Cho thuê as-built cũng không render (không có `children` trong `RentalListPage.tsx`) | Builder theo mẫu Cho thuê (không hàng chip con; danh mục con → đánh dấu tab cha như spec). Ghi rõ trong builder log |
| C-5 | LOW | Mô tả meta | Spec chỉ nói hero mô tả = `categories.description`; task bước 5 thêm fallback meta description = mô tả `/du-an` (Cho thuê không fallback, `rental-list-metadata.ts:80`) | Chấp nhận (cải thiện SEO, không đổi hành vi hiển thị); ghi vào API_SPEC as-built |

Không thấy mâu thuẫn ở: `docs/API_SPEC.md` §3.9 và `docs/DESIGN.md` "Danh sách dự án" — đây là doc as-built mô tả **hiện trạng** (`category` là bộ lọc), sẽ reconcile ở close-out, không phải conflict intent.

## 3. Đánh giá quyết định "308 luôn, giữ tham số khác" (khác BL-055)

- BL-055 (`src/lib/content/legacy-category.ts:17`, `spec/changes/archive/2026-10-22-listing-followups.md:15,27`) chỉ 308 khi URL **chỉ có** `category` — cách thận trọng cho Cho thuê/Tin BĐS, nơi ô tìm kiếm trang chủ gửi `/cho-thue?category=…&q=…` (`HeroSearch.tsx:55-60`).
- Dự án: ô tìm kiếm trang chủ chỉ gửi `/du-an?province=&status=` (không `category`), không còn nguồn nội bộ nào tạo `/du-an?category=` (Grep `src/**` ngoài test: 0). Trang danh mục dự án nhận **đủ** bộ lọc của `/du-an` với cùng ngữ nghĩa (danh mục cấp 1 gồm con) → tập kết quả sau redirect **y hệt** trước redirect, kể cả `page`. → 308 luôn **hợp lý**, tránh tình trạng 2 URL cùng nội dung.
- Được ghi rõ ở: SPECIFICATIONS :59 (kèm ví dụ), design-spec :467, update :14, task Hiện trạng + Decision impact (ghi `.context/decisions.md` ở close-out). ✅
- Chi tiết builder cần giữ (không phải gap): redirect chỉ khi slug có thật **đúng scope `project` + locale đang xem**; `category` rỗng → không redirect; `?category=a&category=b` → lấy giá trị đầu (như `firstText`); chỉ bỏ khoá `category`, giữ thô phần còn lại (`utm_*`).

## 4. Gap list

### 4a. Chặn plan
- Không có.

### 4b. Phải sửa trong spec delta trước commit (intent)
- [PARTIAL] **C-1** `SPECIFICATIONS.md:214` câu admin SEO "Dự án / Tuyển dụng không có trang danh mục" → chỉ còn Tuyển dụng; thêm `/du-an/danh-muc/[slug]` vào danh sách đường dẫn xem trước. (Req A8; task bước 7.)

### 4c. Close-out (as-built reconcile — change-request)
1. `docs/API_SPEC.md` §3.9 (:195–212): dòng `category` → "link cũ, chỉ ở `/du-an`: slug có thật (scope project, locale) → **308** sang trang danh mục, giữ mọi tham số khác; slug lạ → bỏ"; thêm route trang danh mục (`?category=` bị bỏ qua ở đó); câu canonical "→ canonical `/du-an`" thêm "hoặc trang danh mục sạch"; FAQ JSON-LD chỉ `/du-an` sạch; fallback meta description (C-5).
2. `docs/DESIGN.md` hàng "Danh sách dự án" (:239): thêm `/du-an/danh-muc/[category]` · `/en/projects/category/[category]`, tab là link + `aria-current`, hero/breadcrumb theo danh mục.
3. `docs/ARCHITECTURE.md`: mục as-built mới (như layer-9-task-08 :187 của Cho thuê) — route, `MISSING_PAGE_RULES`, `LIST_FALLBACK`, `CATEGORY_PAGE_ROUTES.project`, `revalidate-category`, nhóm sitemap `categories-projects` (danh sách nhóm ở :177), slug dành riêng trong `src/fields/slug.ts`.
4. `.context/decisions.md`: quyết định 308 luôn cho Dự án (khác BL-055) + lý do mục 3.
5. design-spec S05 bullet Dự án: ghi as-built nếu builder lệch (vd hàng chip con C-4, thông điệp trống); tuỳ chọn ghi chú C-2 ở :374.
6. Test-scope v91 `changed.files` nếu builder đụng thêm file (`src/app/sitemaps/[file]/route.ts`, `messages/*.json` key trống mới, `page.test.tsx`).
7. BACKLOG BL-090 done + archive change doc.

## 5. Residual risk
- R-1: Dữ liệu staging/prod đã có dự án slug `danh-muc` (vi) / `category` (en) từ trước — hook chỉ chạy khi lưu; ở tầng router không đè nhau (`/du-an/danh-muc` 2 đoạn vẫn là chi tiết), nên chỉ là vấn đề "URL trông như trang danh mục". Đề xuất kiểm read-only khi deploy, không chặn.
- R-2: `/du-an?category=x&page=N` 308 → trang danh mục trang N; tập kết quả không đổi nên số trang không đổi, nhưng cần test trang vượt số → 404 sau redirect (đã có trong acceptance task).
- R-3: Câu hỏi mở "TAMI phân phối là danh mục hay nhãn" chưa có trả lời — spec mặc định là danh mục; nếu sau này user nói "nhãn" thì là change mới. `tami-phan-phoi` chỉ có trên staging → Playwright dev không kiểm được trang này.
- R-4: Danh mục có `seo.title` ghi đè: cần xác minh `buildPageMetadata` không gắn hậu tố site 2 lần / không mất "– Dự án" ngoài ý muốn (task bước 5 đã ghi).
