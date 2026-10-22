Agent: spec-validator

# Spec validation (pre-plan): BL-054 `news-careers-contact-redesign`, round 1

- Mode: **Spec validation** (trước build). Spec 1.47.0, test-scope v61. Ngày: 2026-10-22.
- Nguồn: change doc `spec/changes/2026-10-21-news-careers-contact-redesign.md` (CD), `SPECIFICATIONS.md` khối BL-054 (L39–52) và đánh dấu F5/F6/F7/BL-045 (`git diff`), delta `spec/updates/2026-10-22-news-careers-contact-redesign.md` (UPD), 5 ảnh `docs/specs/listing-detail-redesign/*.webp`, 9 task `tasks/feature-news-careers-contact-redesign/*`, `.context/progress.json` L2359–2453, code đọc chọn lọc (cite bên dưới).
- Không sửa source / spec / task. Không chạy verify command (pre-plan, chưa có code mới).

## Verdict

**FAIL (round 1, theo ngưỡng chính thức: có 3 mục ⚠️ MAJOR, ngưỡng FAIL là ≥ 3 ⚠️).** Không có ❌ (không thiếu requirement nào) và không có mâu thuẫn HIGH với intent docs.
Cả 3 MAJOR đều sửa được bằng **chữ trong spec/task**, không cần đổi kế hoạch. Sau khi vá F1–F3 (cộng MINOR nếu muốn) rồi chạy lại round 2, kết quả dự kiến là PASS.
F1–F3 không đụng phạm vi P1-T01 / P1-T02 (wave A). F1 ảnh hưởng P1-T03, F2 ảnh hưởng P2-T01 / P2-T02, F3 ảnh hưởng P2-T02.

## 1. Ma trận truy vết (yêu cầu ↔ spec ↔ task)

| # | Requirement (CD) | Spec delta | Task | Status | Note |
|---|---|---|---|---|---|
| R1 | 5 màn theo design; header/footer/banner tư vấn giữ | SPEC L39 "Giữ nguyên" | P2-T01..T05 | ✅ / ⚠️ | Banner tư vấn ở 2 màn tuyển dụng lệch design (F6) |
| R2 | Tin tức: hero + ô tìm "TÌM" | L40 (1) `q` | P2-T01 §1, §6 | ✅ | |
| R3 | Chip danh mục | L40 (2) | P2-T01 §2 | ✅ | |
| R4 | Khối nổi bật 1 lớn + 3 nhỏ | L40 (3) | P2-T01 §3 | ✅ | "tác giả" xem F3 |
| R5 | "Bài viết mới nhất" + sắp xếp + lưới 3 cột + phân trang số | L40 (4) `sort` | P2-T01 §4 | ✅ | |
| R6 | Cột phải Đọc nhiều / Bản tin / Chủ đề | L40 (5) | P2-T01 §5 | ⚠️ | "Chủ đề" ở `/en`: `tags` không localized (F2) |
| R7 | Chi tiết tin: badge, h1, sapo, tác giả · ngày · phút đọc, chia sẻ | L43 | P2-T02 §1 | ⚠️ | "tác giả bài" = quan hệ `staff` (F3) |
| R8 | Ảnh bìa + chú thích; đoạn mở đầu đóng khung | L43 | P2-T02 §2 | ✅ | `media.caption` có sẵn (`RichText.tsx:113-120`) |
| R9 | Cột trái dính Mục lục + "Tư vấn miễn phí" | L43 | P2-T02 §3 | ✅ | Thay BL-045 Q3 đúng cách (đoạn "Bài viết" đánh dấu) |
| R10 | H2 số 01/02, trích dẫn, dấu tích, "Thẻ:" | L43 | P2-T02 §4–5 | ⚠️ | "Thẻ:" ở `/en` cùng vấn đề F2 |
| R11 | "Bài viết liên quan" 3 thẻ + "Xem tất cả" | L43 | P2-T02 §5 | ✅ | |
| R12 | Tuyển dụng: hero + nút cuộn | L45 | P2-T03 §1 | ✅ | Design có breadcrumb, spec không nhắc (MINOR F12) |
| R13 | 4 phúc lợi `careersPerks` | L45 | P2-T03 §2 | ✅ | |
| R14 | Vị trí đang tuyển: chip phòng ban, khu vực, tìm, hàng việc | L45 | P2-T03 §3 | ✅ | Khớp `job-filters.ts:4-33` (`category`/`province`) + `q` mới |
| R15 | Quy trình ứng tuyển N bước | L47 | P1-T01 §4, P2-T03 §4 | ✅ | |
| R16 | Banner "Gửi CV ngay" (hành vi cũ) | L45 | P2-T03 §5 | ✅ | |
| R17 | Chi tiết tuyển dụng: hero nhạt, 3 thẻ, form dính, Vị trí khác | L48 | P2-T04 | ✅ / ⚠️ | Không nói rõ còn banner tư vấn cuối trang hay không (F6) |
| R18 | Form ứng tuyển giữ "Lời nhắn" | L48 | P2-T04 §3 | ✅ | Payload không đổi (`job-application-body.ts:76-78`) |
| R19 | Liên hệ: hero, 4 thẻ nổi, form không chip, văn phòng, banner Gia nhập | L49 | P2-T05 | ✅ | Giá trị thẻ Zalo OA chưa định nghĩa (F8) |
| D1 | Đọc nhiều = lượt xem/ngày, chống trùng, không PII, top 5/30 ngày, bù | L41 | P1-T01 §1, P1-T03 | ⚠️ | "Redis lỗi vẫn đếm" mâu thuẫn với pipeline fail-closed (F1) |
| D2 | Bản tin: lưu email + consent + version + locale, Turnstile, Excel, chưa gửi mail | L42 | P1-T01 §2, P1-T04 | ✅ | Mục đích consent / chính sách xem F10 |
| D3 | 3 khối trình soạn; quote/tích/số H2 bằng style | L44, L43 | P1-T02, P2-T02 §4 | ✅ | Rủi ro dịch khối (F4) |
| D4 | Nhiều văn phòng, hiện 1, ẩn tab; dữ liệu từ trường cũ | L50 | P1-T01 §4, P2-T05 §4, §6 | ✅ | |
| D5 | Giờ làm việc localized, trống ẩn | L50 | P1-T01 §4, P2-T05 §2 | ✅ | |
| D6 | Không chip loại yêu cầu | L49 | P2-T05 §3 | ✅ | |
| D7 | Công tắc "Tuyển gấp" | L46 | P1-T01 §3, P2-T03/T04 | ✅ | |
| D8 | Quy trình sửa trong admin, trống ẩn | L47 | P1-T01 §4, P2-T03 §4 | ✅ | |
| D9 | "N phút đọc" tự tính | L43 | P1-T02 §3 (đếm chữ khối), P2-T01/T02 | ✅ | `src/lib/news/read-time.ts` có sẵn |
| D10 | Chi tiết tuyển dụng dùng trường hiện có | L48 | P2-T04 | ✅ | |
| A1 | Bố cục desktop + responsive (cột phải xuống, mục lục gập) | L39 | mọi P2 task §Responsive | ✅ | |
| A2 | Trường mới có nhãn VI, localized, migration chỉ ADD | L51 | P1-T01 §5–6 | ✅ | Chỉ P1-T01 tạo migration; P1-T02 có lệnh DỪNG nếu sinh schema |
| A3 | Đếm lượt xem không chậm ISR, bỏ bot, không IP thô | L41 | P1-T03 | ✅ | |
| A4 | Bản tin: validate, chống trùng, consent, Turnstile, thông báo | L42 | P1-T04 | ✅ | |
| A5 | Khối mới hiển thị web + EN dùng được | L44 | P1-T02 | ⚠️ | Xem F4 (file cần sửa là `lexical.ts`) |
| A6 | Khối trống ẩn gọn | L40–50 | từng task | ✅ | |
| A7 | EN như VI | L39 BR-07 | từng task | ⚠️ | Tags (F2) |
| A8 | test/typecheck/lint/build | — | mọi task Acceptance | ✅ | P1-T01/T03/T04 không ghi `pnpm build` (MINOR, primary build ở merge) |
| M1 | auto proceed, dừng khi BLOCKED / HIGH_RISK_MIGRATION | UPD L9 | Retry/Escalation mọi task | ✅ | |
| M2 | builder-strong mọi task | UPD L9 | progress | ✅ | |
| M3 | Chỉ commit `staging`, không push | UPD L9 | progress L2368 | ✅ | |
| M4 | BL-052 trước, song song theo worktree | UPD L9 | progress dependsOn | ✅ | |
| M5 | Backfill bằng script, dev, báo cáo | L50 | P2-T05 §6 | ✅ | Chỉ áp cho `offices`; vế "trích tổng quan dự án / nội dung tin" là của BL-052 (F7) |
| M6 | Chip "Tìm nhanh" hero, sửa trong admin | — | P2-T01 §1 (ẩn) | ⚠️ (MINOR) | Spec không ghi N/A (F7) |
| M7 | Loại sản phẩm / Tiện ích nổi bật cố định | — | — | N/A | Kế thừa BL-052, không áp cho 5 màn (F7) |
| M8 | Form ứng tuyển giữ "Lời nhắn" | L48 | P2-T04 | ✅ | |
| M9 | Mobile theo style hiện có | L39 | P2 tasks | ✅ | |

## 2. Findings

### MAJOR

**F1. Hành vi khi Redis lỗi ở `news-views` mâu thuẫn với pipeline dùng chung.** (Spec L41, UPD L40, P1-T03 §1)
Spec/task ghi "Redis lỗi → vẫn đếm, không 5xx" và đồng thời "pipeline công khai sẵn có (rate limit như click-events)". Nhưng `runPublicPipeline` **fail-closed**: Redis lỗi thì trả 503 (`src/endpoints/_middleware/public-pipeline.ts:60-68`; `src/lib/security/rate-limit.ts:25` "người gọi phải trả 503… không được bỏ qua rate limit").
Như vậy test "Redis lỗi vẫn cộng" và "dùng pipeline" không thể cùng PASS. Nếu tự mở fail-open cho cả rate limit lẫn dedupe thì lúc Redis sập, lượt xem bị bơm không giới hạn.
**Đề xuất (chọn 1, ghi vào spec L41 + UPD L40 + P1-T03 §1/§4):**
- (a) **Khuyến nghị:** Redis lỗi → **không đếm**, trả 204 (beacon, khách không thấy). Giữ fail-closed nhất quán với PERMISSION §5, bỏ câu "vẫn đếm".
- (b) Giữ "vẫn đếm" nhưng ghi rõ endpoint này **không** đi qua `runPublicPipeline`, tự bắt `RateLimitUnavailableError`, và chấp nhận bị bơm trong lúc Redis lỗi (residual risk ghi trong spec).

**F2. `news.tags` không localized → "Chủ đề", "Thẻ:", `?tag=` ở `/en` hiện chữ tiếng Việt (vi phạm BR-07).** (Spec L40 (5), L43; P2-T01 §5–6; P2-T02 §5)
`src/collections/News.ts:43` `{ name: "tags", type: "text", hasMany: true }` không có `localized`. Spec viết "≤ 12 tag … cùng ngôn ngữ" như thể tag có theo ngôn ngữ, nhưng dữ liệu chỉ có một bộ chung. Spec cũng cấm đổi schema News ngoài khối trình soạn. Đổi `tags` sang localized là chuyển dữ liệu giữa bảng, không phải "chỉ ADD", nên không hợp với gate migration của BL-054.
**Đề xuất mặc định (không cần migration):** ở `/en`, ẩn khối "Chủ đề", dòng "Thẻ:" và bỏ qua `?tag=`; ở `/vi`, top tag tính trên bài đã xuất bản có bản VI. Ghi rõ vào spec L40/L43 và P2-T01 §5–6, P2-T02 §5. Tag tiếng Anh thật để làm Change Request sau.
**NEEDS_USER (không chặn, đã có mặc định):** user có muốn tag tiếng Anh riêng không. Nếu có, cần một CR schema riêng.

**F3. "Tác giả bài" đẩy tên nhân viên (`staff`) ra trang công khai.** (Spec L40 (3), L43; P2-T01 §3; P2-T02 §1)
`author` là trường quan hệ dùng chung tới `staff` (`src/collections/_shared/content-defaults.ts:4,97`). Hiện web không hiện tác giả ở đâu (grep `author` trong `src/components/news`, `src/lib/news`, `app/**/tin-tuc` không ra kết quả). Hiện tên tác giả cần đọc `staff` trong ngữ cảnh công khai (`overrideAccess`/populate). Đó là dữ liệu nhân sự và dễ lộ thêm trường. Design chỉ vẽ nhãn thương hiệu "Ban biên tập TAMI HOMES" và "TAMI HOMES".
**Đề xuất:** đổi spec L40/L43 và task P2-T01 §3, P2-T02 §1 thành **nhãn thương hiệu cố định theo i18n** ("Ban biên tập TAMI HOMES" / "TAMI HOMES Editorial"), **không** populate `staff` ở query công khai. Muốn hiện tên người viết thì để CR sau (thêm trường "Tên hiển thị tác giả" localized, không dùng `staff`).

### MINOR

**F4. Dịch tự động không duyệt chữ trong block, và file cần sửa ghi sai trong P1-T02.**
`src/lib/translation/lexical.ts:26` ghi rõ "`fields` của link/upload/block KHÔNG được duyệt". `applyTextNodes` so khung cây bằng `skeletonOf` (L53-55, L69). Tức là:
- Chữ trong khối giữ nguyên tiếng Việt ở `/en`.
- Nếu chỉ dịch `value`/`label` mà không sửa `skeletonOf`, khung cây lệch → `invalid_output` → **hỏng bản dịch của cả bài**.
- Riêng `imageText.text` tình cờ bị che vì key trùng `"text"`.

P1-T02 liệt kê `src/lib/translation/leaves.ts`, nhưng chỗ phải sửa là `lexical.ts` (`walkTextNodes`/`extractTextNodes`/`applyTextNodes`/`skeletonOf` chỉ cho whitelist `blockType` → field chữ) cùng `lexical.test.ts`.
Đề xuất: thêm 2 file này vào "Files to Create/Modify". Thêm acceptance: "dịch bài có cả 3 khối không ra `invalid_output`; `blockType`/`id`/`project`/`image`/`imagePosition` giữ nguyên". `MAX_TEXT_NODES` đếm cả chữ trong khối.

**F5. Hai task song song wave B (P1-T03 ‖ P1-T04) sửa chung file không khai báo.**
Cả hai phải thêm khoá vào `RATE_LIMITS`/`RateLimitedEndpoint` (`src/lib/security/rate-limit.ts:10-19`). Cả hai phải đăng ký endpoint vào **cùng một dòng** `src/payload.config.ts:68`, nên chắc chắn xung đột khi merge. Cả hai cũng sửa `docs/API_SPEC.md`. P1-T04 còn cần regen importmap (nút admin).
Đề xuất: ghi 2 file đầu vào "Files" của cả hai task kèm quy ước "thêm khoá/endpoint ở cuối, primary gộp". Hoặc primary tạo sẵn khoá `news-views`, `newsletter` và slot endpoint trước wave B.
Wave A pha 2 (P2-T01 ‖ T03 ‖ T05) cùng sửa `.context/design-spec.md`, `docs/DESIGN.md`. Quy ước "primary gộp" đã có, nhưng nên nói rõ quy ước này áp cả cho doc.

**F6. Banner tư vấn ở 2 màn tuyển dụng.** Design `tuyen-dung.webp` (banner "Gửi CV ngay" rồi tới footer) và `chi-tiet-tuyen-dung.webp` ("Vị trí khác" rồi tới footer) **không** có banner tư vấn, giống tiền lệ trang Liên hệ.
Spec L45 vẫn ghi "→ banner tư vấn" ở `/tuyen-dung`, thành hai băng tối liền nhau. L48 / P2-T04 thì **không nói** có hay không.
CD L18 "giữ nguyên" nói về component dùng chung, không bắt buộc phải có trên mọi trang. Đề xuất: ghi quyết định rõ cho cả 2 màn (khuyến nghị theo design: bỏ banner tư vấn ở 2 màn tuyển dụng như Liên hệ), cập nhật L45/L48 + P2-T03 §5 + P2-T04.

**F7. Một số dòng "Chế độ chạy" của CD (L96–99) kế thừa nguyên văn từ BL-052** (chip "Tìm nhanh", danh sách Loại sản phẩm / Tiện ích, backfill "trích tổng quan dự án / nội dung tin"). Spec delta không ghi các dòng này áp hay không áp.
Đề xuất thêm 1 câu ở L39: "chip Tìm nhanh / danh sách Loại sản phẩm – Tiện ích / backfill nội dung của BL-052 không áp cho 5 màn này (design không có); backfill BL-054 = `backfill:offices`". P2-T03 §1 và P2-T05 §1 thêm "không hàng Tìm nhanh" như P2-T01 §1.

**F8. Thẻ Zalo OA**: design hiện giá trị "TAMI HOMES" (tên OA), nhưng `site-settings` chỉ có `zaloUrl` (`src/globals/SiteSettings.ts:122`). Đề xuất: giá trị = `siteName` (localized), không thêm trường; ghi vào L49 / P2-T05 §2.

**F9. `q` tìm tin không dấu chưa nói cách làm.** "theo cách `unaccent` sẵn có" có thể bị hiểu là cột `searchText` như rentals (`src/hooks/rentals/build-search-text.ts`, `src/lib/search/rental-search-sql.ts`). Cách đó cần migration, mà pha 2 không được tạo migration.
Đề xuất ghi rõ ở L40 / P2-T01 §6: **không thêm cột**; SQL `unaccent(lower(...)) ILIKE` trên bảng locales của `news` (hoặc lọc trong bộ nhớ có trần như `/du-an` BL-045), kèm mục tiêu p95. `/tuyen-dung` `q` (P2-T03) cũng vậy.

**F10. Consent bản tin.** Ô đồng ý (P1-T04 §2) chỉ ghi "đồng ý chính sách". Theo NĐ 13/2023, chữ đồng ý nên nêu **mục đích** ("nhận bản tin thị trường qua email"). Đề xuất thêm vào L42 / P1-T04 §2.
**NEEDS_USER (nội dung, không chặn build):** trang Chính sách bảo mật hiện có đã nêu mục đích "gửi bản tin" chưa. Nếu chưa, admin cập nhật trang đó và tăng `privacyPolicyVersion`.

**F11. Acceptance `pnpm build`** thiếu ở P1-T01, P1-T03, P1-T04. P1-T01 đổi schema/global, `payload.config` và `payload-types`, rất dễ vỡ build. Đề xuất thêm `pnpm build` vào acceptance P1-T01, hoặc ghi rõ primary build sau merge wave.

**F12. Breadcrumb hero `/tuyen-dung`** có trong design nhưng không có trong L45 / P2-T03 §1. Đề xuất thêm vào (dùng hero sẵn có).

### Đánh giá các điểm primary hỏi

- **Form "Tư vấn nhu cầu" cuối `/tin-tuc` (giữ dù design không vẽ):** hợp lý. Đây là requirement thu lead F5 (`SPECIFICATIONS.md` F5 "Thu lead"). Bỏ nó là REMOVE, cần user duyệt, mà CD không yêu cầu bỏ. Spec đã ghi lý do ở L39. Không phải gap. Lưu ý trang sẽ có 2 widget Turnstile (form này + Bản tin): nên render Turnstile của Bản tin khi người dùng chạm vào ô email (xem Rủi ro).
- **Banner tư vấn ở Liên hệ:** spec giữ "không banner tư vấn" (L49), khớp `lien-he.webp` và BL-045. OK. Vấn đề còn lại ở 2 màn tuyển dụng (F6).
- **Tham số mới `q`/`tag`/`sort` (`/tin-tuc`), `q` (`/tuyen-dung`):** nhất quán với quy tắc BL-052 (có tham số → `noindex,follow` + canonical sạch; giá trị lạ bỏ qua; ngoài sitemap theo test-scope L110). Còn hở cách làm `q` (F9) và `tag` ở EN (F2).
- **Thay BL-045:** 4 đoạn BL-045 + F5/F6/F7 đã đánh dấu "(bố cục thay bởi BL-054)". Riêng mục lục trái dính (BL-045 Q3 đã bỏ) được BL-054 khôi phục, có ghi ở L43. Không mâu thuẫn.

## 3. Plan: phụ thuộc, song song, risk, PII

- **Phụ thuộc** (`progress.json` L2371–2453) khớp nội dung task: T03/T04 ← T01; P2-T01 ← T03, T04; P2-T02 ← P1-T02, P1-T03, P2-T01; P2-T03/T05 ← T01; P2-T04 ← T01, P2-T03. Không vòng. P2-T01 không cần P1-T02 (`read-time` chỉ đếm thêm chữ khối, không chặn).
- **Migration:** chỉ P1-T01 tạo (P1-T01 L4, L32). P1-T02 có lệnh DỪNG nếu Payload sinh schema (P1-T02 §5). Mọi task có nhánh `HIGH_RISK_MIGRATION`. Đạt.
- **Song song:** xem F5. Ngoài ra P2-T02 ‖ P2-T04 có thể cùng sửa `src/app/(frontend)/globals.css` (style dấu chấm tròn ở chi tiết tuyển dụng). Nên khuyên P2-T04 dùng class Tailwind cục bộ, không đụng `globals.css`.
- **Risk / review level:** mọi task STRICT, risk HIGH / MEDIUM–HIGH. Hợp lý với quy tắc reviewer (endpoint công khai, PII, schema, `RichText` dùng chung, LeadForm/ApplyForm).
- **Acceptance đo được:** phần lớn đo được (+1/ngày, bot = 0, top 5, unique, 403 cho sale). Câu "Bố cục khớp ảnh" thì đo bằng ảnh chụp 1440/390 ghi vào `assets/bl054-*` (đã quy định).
- **PII / security:**
  - IP không lưu thô: có (HMAC, Redis TTL; `ipHash` sẵn có `src/lib/security/ip-hash.ts:38-44`).
  - Turnstile + consent + rate limit cho bản tin: có.
  - Export chỉ admin, có audit log, chống formula injection: có (tái dùng `xlsx-stream`, `src/lib/export/xlsx-stream.ts:8-13`; rate limit `admin-export-excel`).
  - Sale không thấy 2 collection mới: có.
  - Còn hở: F1 (Redis), F3 (tên staff), F10 (mục đích consent).

## 4. Rủi ro kỹ thuật cho builder (không phải gap)

1. **Lexical BlocksFeature (P1-T02):** dùng editor riêng cho field `news.content` (field-level `editor`), giữ `hideAddBlockButton`. BlocksFeature có mục trong dropdown "chèn" của FixedToolbar, cần kiểm bằng mắt. Lấy dự án trong `projectMention`: `RichText` hiện là component đồng bộ (`src/components/content/RichText.tsx:260`). Muốn tải dự án thì tách thành async Server Component con, và bảo đảm `RichText` không bị import từ client component. Hoặc truyền sẵn map dự án đã tải từ trang. Populate theo depth (news → block → project → cover) làm phình payload, nên ưu tiên tải riêng bằng public-queries theo `locale`.
2. **Dịch khối (F4):** sửa `lexical.ts`, chỉ duyệt whitelist field chữ của 3 `blockType`. Không dịch `id`/quan hệ/select. Cập nhật `skeletonOf` để che đúng các field đó.
3. **Upsert drizzle (P1-T03):** `ON CONFLICT (news_id, day)` phải khớp **đúng** unique index do migration tạo (khai `indexes: [{ fields: ['news','day'], unique: true }]` ở collection hoặc SQL trong migration). Khi INSERT raw, cột `id` (UUID) và `created_at`/`updated_at` phải có DB default, nếu không thì tự sinh. Chuẩn hoá `day` = 00:00 giờ VN (hoặc lưu chuỗi `YYYY-MM-DD`) để không lệch ngày quanh 17:00 UTC.
4. **FK khi xoá hẳn bài:** `news` bắt buộc + FK tới `news`. Payload mặc định `ON DELETE SET NULL` có thể va NOT NULL và chặn admin xoá hẳn bài. Kiểm migration và chọn `CASCADE` hoặc hook `afterDelete` dọn `news-views-daily`. Có test xoá hẳn bài có lượt xem.
5. **Redis dedupe:** `SET key 1 NX EX <giây tới 24:00 VN>` trong một lệnh. Khoá chỉ là HMAC, không chứa id bài thô cộng IP. Log cảnh báo không chứa IP/UA. Beacon gửi `text/plain`: đọc `request.text()` như `click-events.ts:32-48`.
6. **Bản tin:** chuẩn hoá email trước khi kiểm unique. Bắt lỗi unique khi 2 request đua (Postgres 23505) → trả thành công. Phản hồi cùng thời gian, cùng thân cho email mới / đã có (không lộ email tồn tại). Nạp Turnstile lười để `/tin-tuc` không nạp 2 widget ngay từ đầu.
7. **`offices.location` (point) trong array:** Postgres adapter hỗ trợ, nhưng kiểm migration sinh cột geometry ở bảng `site_settings_offices` và `migrate:down` sạch. Bản đồ đổi theo tab phải giữ lazy-load.
8. **Top tag (P2-T01):** `tags` hasMany text nằm ở bảng con (`news_texts`), nên cần aggregate SQL join bài published. Cache cùng tag `news`.

## 5. Gap list cho builder / loop

| ID | Mức | Sửa ở | Task liên quan |
|---|---|---|---|
| F1 | MAJOR | SPEC L41, UPD L40, P1-T03 §1/§4 | P1-T03 |
| F2 | MAJOR (+NEEDS_USER, có mặc định) | SPEC L40/L43, P2-T01 §5–6, P2-T02 §5 | P2-T01, P2-T02 |
| F3 | MAJOR | SPEC L40/L43, P2-T01 §3, P2-T02 §1 | P2-T01, P2-T02 |
| F4 | MINOR | P1-T02 Files + Acceptance | P1-T02 |
| F5 | MINOR | P1-T03/T04 Files + quy ước | P1-T03, P1-T04 |
| F6 | MINOR | SPEC L45/L48, P2-T03 §5, P2-T04 | P2-T03, P2-T04 |
| F7 | MINOR | SPEC L39, P2-T03 §1, P2-T05 §1 | P2-T03, P2-T05 |
| F8 | MINOR | SPEC L49, P2-T05 §2 | P2-T05 |
| F9 | MINOR | SPEC L40/L45, P2-T01 §6, P2-T03 §3 | P2-T01, P2-T03 |
| F10 | MINOR (+NEEDS_USER nội dung) | SPEC L42, P1-T04 §2 | P1-T04 |
| F11 | MINOR | P1-T01/T03/T04 Acceptance | P1-T01, P1-T03, P1-T04 |
| F12 | MINOR | SPEC L45, P2-T03 §1 | P2-T03 |

Residual risk: không chạy verify command (pre-plan). Không đọc toàn bộ `src/components/{listing,detail}` (BL-052) để xác nhận `ListingHero` có sẵn ô tìm GET cho tin tức; P2-T01 nên kiểm trước khi tái dùng.
