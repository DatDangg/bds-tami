Agent: spec-validator

# Phase review: BL-054 `news-careers-contact-redesign`, Phase 1 + 2 (9 task), round 1

- **Mode:** Phase review (sau khi phase PASS). Branch `staging`, HEAD `8326e98`, range `1272255..HEAD` (9 feat + 9 merge + 1 docs).
- **Sources:** change doc `spec/changes/2026-10-21-news-careers-contact-redesign.md` (10 quyết định, 8 acceptance); `SPECIFICATIONS.md:63-76` (khối BL-054); `spec/updates/2026-10-22-news-careers-contact-redesign.md`; 9 report reviewer r1 (STRICT PASS); code; docs as-built.
- **Verify:** đọc code + `git` read-only. Không chạy test/build (primary đang chạy full suite nền).
- **Ảnh design / ảnh build:** không so lại pixel. Dựa vào phần "So design" của từng report reviewer (P2-T02 :30, P2-T03 :35, P2-T05 :36) và ảnh `assets/bl054-p2t0*`.

## Verdict: ⚠️ GAPS FOUND (0 CRITICAL, 0 MAJOR, 6 MINOR)

Đã build đủ 10 quyết định và 7/8 acceptance. Acceptance còn lại ("Test + typecheck + lint + build PASS" trên staging đã tích hợp) đang chờ kết quả chạy nền của primary. Các gap còn lại là đồng bộ spec as-built, lệch doc nhỏ, một quyết định cần user chốt, và các việc close-out (vận hành DB dev).

## 1. Ma trận coverage (acceptance + quyết định)

| # | Requirement | Nguồn | Status | Bằng chứng |
|---|---|---|---|---|
| A1 | 5 màn khớp bố cục desktop; responsive (cột phải tin tức xuống dưới, mục lục gập mobile) | change doc :76 | PASS (residual) | Reviewer so ảnh: P2-T01, P2-T02 r1 :30, P2-T03 :35, P2-T04, P2-T05 :36. DESIGN.md :245-250 ghi as-built 5 màn. Mục lục < lg gập (commit 72be45a). Residual: không reviewer nào chạy browser thật; 375/768/1280 dựa vào ảnh + CSS math |
| A2 | Trường/collection mới trong admin (nhãn VI, localized), migration versioned, chỉ ADD | :77 | PASS | `migrations/20261022_022857_news_careers_contact_redesign.ts` (SAFE_ADDITIVE, P1-T01 r1). `migrations/20261022_031905_newsletter_export_audit.ts:6` chỉ `ADD VALUE IF NOT EXISTS`. `tests/unit/admin-labels.test.ts` đã cập nhật |
| A3 | Đếm lượt xem không chậm ISR, bỏ bot, không lưu IP thô | :78 | PASS | `src/endpoints/public/news-views.ts` (HMAC + Redis SET NX, P1-T03 r1). Beacon chỉ ở chi tiết. API_SPEC §3.12 :238 |
| A4 | Bản tin: validate email, chống trùng, consent bắt buộc, Turnstile, thông báo | :79 | PASS | P1-T04 r1. API_SPEC §3.13 :255. Chữ đồng ý `src/i18n/messages/vi.json:1201` nêu mục đích (F10) |
| A5 | Khối mới trình soạn hiển thị đúng ở web, EN dùng được | :80 | PASS | P1-T02 r1 :38 ("đủ (a)(b)(c)", dịch đi qua chữ trong khối, renderer theo danh sách cho phép) |
| A6 | Khối trống ẩn gọn (Đọc nhiều, Quy trình, Giờ làm việc, tab 1 văn phòng) | :81 | PASS | P2-T01 (Đọc nhiều bù nổi bật/mới nhất), P2-T03 (`careersProcess` rỗng thì ẩn), P2-T05 (thẻ thiếu dữ liệu ẩn, tab ẩn khi chỉ 1 văn phòng) |
| A7 | EN như VI (i18n đủ) | :82 | PASS (theo F2) | `/en` ẩn "Chủ đề"/"Thẻ:" và bỏ qua `?tag=` (SPEC :64). `en.json:238`. Thiếu test `/en` cho `q` tuyển dụng (P2-T03 MINOR-1) đã bù ở P2-T04 (commit a2a31a3 "ca /en cho q") |
| A8 | Test + typecheck + lint + build PASS | :83 | **PARTIAL** (G2) | Từng task: typecheck/lint/test liên quan PASS. Nhưng ≥ 6 report ghi "không chạy lại `pnpm build` / full `pnpm test`" (P1-T03 :19, P2-T02 :19, P2-T03 :20, P2-T05 :22…). Chưa có bằng chứng trên HEAD tích hợp |
| Q1 | Đọc nhiều = lượt xem/ngày, top 5/30 ngày, bù | QĐ1 | PASS | `src/lib/news/most-read.ts` (lấy dư 2×, P2-T01 r1 :28) |
| Q2 | Lưu email + consent + version + locale, Turnstile, xuất Excel, chưa gửi mail | QĐ2 | PASS | PERMISSION.md :69. ERD :468. Audit `newsletter.export` |
| Q3 | 3 khối soạn bài; quote/tích/số H2 bằng CSS | QĐ3 | PASS | P1-T02; `.news-prose` trong `globals.css` (P2-T02) |
| Q4 | Nhiều văn phòng, 1 thì ẩn tab, fallback trường cũ | QĐ4 | PASS | P2-T05; script `backfill:offices`; `docs/reports/backfill-offices-2026-10-22-1237-dry-run.md` |
| Q5 | Giờ làm việc localized, trống thì ẩn | QĐ5 | PASS | ERD :632; P2-T05 |
| Q6 | Không chip loại yêu cầu | QĐ6 | PASS | P2-T05 :36 |
| Q7 | `isUrgent` | QĐ7 | PASS | ERD :426; `job-queries.ts:25` |
| Q8 | `careersProcess` trong admin, trống thì ẩn | QĐ8 | PASS | ERD :632; P2-T03 |
| Q9 | N phút đọc tự tính | QĐ9 | PASS | `estimateReadMinutes` (P2-T01/T02) |
| Q10 | Chi tiết tuyển dụng theo design, dùng trường có sẵn | QĐ10 | PASS (G4) | `src/components/careers/JobDetail.tsx:46-135`; P2-T04 r1 |
| F5 | Form "Tư vấn nhu cầu" cuối `/tin-tuc`, không ở trang danh mục | SPEC :64 (6) | PASS | `src/components/news/NewsListPage.tsx:142` (`context ? null : <ConsultSection>`) |
| Doc | Reconcile API_SPEC / ERD / PERMISSION / DESIGN / design-spec | SPEC :76 | PASS (G3) | API_SPEC §3.12–3.15 (:238, :255, :263, :276); ERD :106, :426, :455-468, :559, :632, :654; PERMISSION :69, :81; DESIGN :245-250; design-spec :567, :595, :611, :628, :659 |

## 2. Lệch spec do builder chọn (as-built), giao spec-publisher ghi

SPECIFICATIONS / spec update vẫn ghi theo plan. Spec update `:9` còn "Trạng thái: planned". Các điểm cần ghi as-built:

1. **Migration thứ 2** `20261022_031905_newsletter_export_audit` (enum audit `newsletter.export`, `down` no-op). SPEC :75 ghi "1 migration". Không phải HIGH_RISK.
2. **FK `news_views_daily.news_id` là `ON DELETE cascade`** trong migration, trong khi snapshot `.json` vẫn `set null` (P1-T01 MINOR-2). Test `news-views-newsletter.test.ts:137-144` sẽ bắt nếu có migration sau dựng lại FK này. Đã ghi ERD.
3. **Tìm `q` bằng SQL `translate()`** (`src/lib/search/unaccent-sql.ts`), không thêm cột. Trần 1000 id; chỉ xử lý chữ dựng sẵn NFC.
4. **"Xoá lọc" ở trang danh mục quay về chính danh mục** (`NewsListPage.tsx:104` `clearFiltersHref={ownPath}`). SPEC :64 ghi "nút về `/tin-tuc`". Đề xuất ghi as-built là "về trang đang xem".
5. **Nhãn tác giả "Ban biên tập TAMI HOMES" / "TAMI HOMES Editorial Team"** (`vi.json:238`, `en.json:238`). SPEC :67 ghi "TAMI HOMES". Vẫn không lộ `staff`, đúng mục đích F3.
6. **Chi tiết tuyển dụng giữ `DetailLayout`** (nền `primary-subtle`, header ẩn khi cuộn) — `JobDetail.tsx:8,63`.
7. **Bỏ khối tóm tắt workplace / số lượng** ở chi tiết tuyển dụng (design không vẽ; chỉ còn hàng thông tin icon).
8. **"Vị trí khác" hiện cả ở trang tin đã hết hạn**, ưu tiên cùng danh mục rồi tới tin còn hạn khác (`job-queries.ts:161-177`).
9. **Nút "Tìm" trong bộ lọc tuyển dụng** + placeholder "Tìm theo tên vị trí…" (design không có nút).
10. **Thẻ Hotline / Zalo ở `/lien-he` không ghi click-events.** Hiện chỉ `FloatingContact` ghi; `src/components/contact/*` không có tracking. Spec không yêu cầu; ghi as-built để analytics biết.
11. **Mô tả ngắn ở hero tuyển dụng = khối đầu `description` và lặp lại ngay trong "Mô tả công việc"** (P2-T04 MINOR-2). Đúng chữ SPEC :72 nhưng lệch design. Cần user chốt, xem NEEDS_USER-1.
12. Lệch nhỏ khác đã ghi trong design-spec: banner "Gửi CV" dùng lại ảnh hero Tuyển dụng; thẻ tư vấn chi tiết tin không có ảnh; avatar tác giả là logo.

## 3. Gaps

- **G1 [MINOR] Spec as-built chưa đồng bộ.** Các mục §2.1–2.10 chưa có trong `SPECIFICATIONS.md:63-76` / `spec/updates/2026-10-22-…md`; trạng thái còn `planned`. Việc: spec-publisher ghi as-built + đổi trạng thái lúc close-out.
- **G2 [MINOR, chặn close-out] A8 chưa có bằng chứng trên HEAD tích hợp.** 9 nhánh merge vào staging và nhiều task chạm chung file (`vi/en.json`, `icons.ts`, `globals.css`), nhưng chưa có `pnpm build` + full `pnpm test` trên `8326e98`. Việc: dùng kết quả chạy nền của primary. FAIL thì xử lý trước close-out.
- **G3 [MINOR] Doc lệch code:** `.context/design-spec.md` S15 ghi icon "56px", còn `src/components/contact/ContactCards.tsx:17` dùng `size-12` = 48px (P2-T05 MINOR-1). Việc: sửa doc (as-built), trừ khi user muốn đúng design.
- **G4 [MINOR] Đoạn đầu mô tả bị lặp ở chi tiết tuyển dụng** (§2.11). Chờ NEEDS_USER-1.
- **G5 [MINOR] A11y touch target:** nút "Chọn tệp" trong `src/components/careers/CvPicker.tsx` từ md trở lên chỉ cao khoảng 20px (< 44px) (P2-T04 MINOR-1).
- **G6 [MINOR] Vận hành DB dev chưa xong:** (a) DB dev `tami` cần chạy 2 migration mới, nếu không 4 integration suite cũ sẽ fail (P1-T01 MINOR-3, P1-T03 MINOR-3). (b) `backfill:offices` mới có báo cáo dry-run (`docs/reports/backfill-offices-2026-10-22-1237-dry-run.md`). Change doc :96 yêu cầu chạy trên DB dev và xuất báo cáo cho admin soát; 2 báo cáo apply của DB worktree không commit (P2-T05 MINOR-4).

## 4. MINOR còn mở, gom lại cho close-out

**Làm ngay trong 1 task P3 dọn dẹp** (nhỏ, ít rủi ro, cùng blast radius):

| # | Nguồn | Việc |
|---|---|---|
| C1 | P2-T04 MINOR-1 (G5) | `CvPicker` giữ `md:min-h-11`, hoặc cho cả vùng thả mở hộp chọn tệp |
| C2 | P2-T05 MINOR-1 (G3) | Sửa design-spec S15 thành 48px |
| C3 | P2-T05 MINOR-2 | Thay `md:-mt-[88px]` ở `lien-he/page.tsx:232` bằng biến chung với `PageHero overlap`, hoặc comment ghép cặp giá trị |
| C4 | P2-T05 MINOR-3 | Backfill: thêm dòng "nhập EN tay trong admin" vào báo cáo khi bước EN lỗi |
| C5 | P2-T04 MINOR-3 | `ApplyFormSlot` đưa subtitle vào header cùng `h2`, bỏ `-mt-3 mb-2` |
| C6 | P2-T01 MINOR-4 | Xoá key chết `page.news.readArticle` (vi/en :205) |
| C7 | P2-T03 MINOR-3 | Rà các key `page.careers.*` cũ còn sót sau khi xoá `JobCard`. P2-T04 đã dọn một phần, cần xác nhận còn key nào không |
| C8 | P1-T04 MINOR-1/2 | `NewsletterSubscribers.ts:17` thêm khoảng trắng `= {`; export `LOCALE_LABELS` để dùng lại trong `newsletter-export.ts:23` |
| C9 | P1-T02 MINOR-1 | Sửa comment `src/blocks/news/index.ts:6` trỏ đúng `NEWS_BLOCK_TEXT_FIELDS` trong `text-fields.ts` |
| C10 | P2-T01 MINOR-1 | Truyền `categoryIds` vào `findFilteredNewsIds` (`news-search.ts:31-46`), để trang danh mục không bị trần 1000 id toàn site cắt mất bài |
| C11 | P2-T04 MINOR-2 (G4) | Làm theo quyết định của user ở NEEDS_USER-1 |

**Đưa vào backlog / residual** (không gấp, phụ thuộc thay đổi sau):

- P2-T01 MINOR-2: SQL tag "Chủ đề" và `buildPublicWhere` phải đồng bộ khi làm hẹn giờ (FR-ADM-16). Ghi chú chéo trong `publishedOnly.ts`.
- P1-T03 MINOR-1 (phần SQL xếp hạng) có cùng điều kiện đồng bộ hẹn giờ.
- P1-T03 MINOR-2: `SET NX` trước `addView` nên DB lỗi thì mất lượt đó (chỉ đếm thiếu).
- P2-T01 MINOR-5: chữ NFD không khớp tìm không dấu. Có thể chuẩn hoá NFC trong `beforeChange`.
- P2-T03 MINOR-2: quét ≤ 10 truy vấn khi có `q` tuyển dụng. Chuyển sang cột `searchText` nếu số tin tăng mạnh.
- P2-T02 MINOR-1: `aside` dính ở màn lg thấp, bài có nhiều heading thì thẻ tư vấn bị khuất.
- P1-T02 MINOR-2: bản EN của khối "Số liệu nổi bật" vượt `maxLength` thì cả job dịch fail.
- P1-T04 MINOR-3: chưa có double opt-in, xem R3.
- Chấp nhận, không làm: P1-T02 MINOR-3, P2-T02 MINOR-2/3, P2-T03 MINOR-4, P2-T04 MINOR-4, P1-T04 MINOR-4.

## 5. Rủi ro còn lại

- **R1 Postgres quá tải khi test song song:** nhiều report bỏ full suite / build vì Postgres dùng chung bị crash-recovery (P1-T03 :19, :58). 5 file timeout ở builder P1-T03 PASS khi tăng `hookTimeout`. Đề xuất chạy suite tuần tự trên DB riêng trước close-out (G2).
- **R2 `TRUST_CF_CONNECTING_IP`:** cấu hình sai trên staging/prod thì mọi khách dùng chung 1 bucket rate limit 30/phút, nên news-views đếm thiếu nặng và newsletter rate limit bị chung. Kiểm env trước khi promote.
- **R3 Double opt-in bản tin:** người thứ ba bật lại được bản `unsubscribed` bằng email của người khác. Đúng spec hiện tại, nhưng phải có xác nhận qua email trước khi gửi mail thật (change request sau).
- **R4 Tag EN:** `/en` ẩn "Chủ đề" và "Thẻ:" vì `news.tags` chưa localized. Muốn có tag EN phải mở change request.
- **R5 Chính sách bảo mật chưa nhắc bản tin:** trong repo không có nội dung chính sách nào nhắc bản tin/newsletter (nội dung nằm ở CMS, chưa xác minh được). Form đã dẫn link Chính sách bảo mật nên nội dung trang cần nêu mục đích, thời hạn lưu và cách huỷ. Ngoài ra `newsletter-subscribers` chưa nằm trong job `data-retention` (ERD :466).
- **R6 Migrate staging/prod:** 2 migration additive. Cần verify trên staging trước khi promote. `ADD VALUE` enum không rollback được (đã có chủ đích).
- **R7 Kiểm trên trình duyệt thật:** bản đồ và đổi tab văn phòng, toolbar "Chèn khối" ở admin, mốc 768px chưa được xem trên browser thật.
- **R8 Dữ liệu ghi trước khi commit:** `spec/changes/2026-10-21-news-careers-contact-redesign.md` vẫn untracked. Cần commit hoặc archive lúc close-out. `src/payload-types.ts` modified chỉ do khác CRLF, không có diff nội dung.

## 6. NEEDS_USER

1. **Hero chi tiết tuyển dụng (G4 / P2-T04 MINOR-2):** đoạn đầu `description` đang hiện ở hero và lặp lại trong "Mô tả công việc". Chọn một: (a) bỏ đoạn đó khỏi thân khi đã dùng ở hero (giống design); (b) giữ như hiện tại và ghi as-built; (c) hero không hiện mô tả ngắn.
2. **Chính sách bảo mật (R5):** cập nhật nội dung trang trên CMS để nêu việc thu email bản tin (mục đích, lưu bao lâu, cách huỷ)? Có đưa `newsletter-subscribers` vào `data-retention` không?
3. **Chạy `backfill:offices --apply` trên DB dev `tami`** để có báo cáo thật cho admin soát (G6b). Change doc cho phép trên dev; staging/prod chỉ chạy khi user bảo.
4. (Tuỳ chọn) Xác nhận as-built §2.4 ("Xoá lọc" ở trang danh mục về lại danh mục) và §2.5 (nhãn "Ban biên tập TAMI HOMES").
