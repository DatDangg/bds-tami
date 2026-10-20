# Spec Update — 2026-10-21 admin-form-non-tech-friendly (form admin dễ dùng cho người không rành công nghệ)

**spec_version:** 1.37.0 → 1.38.0 (MINOR — đổi cách form tạo/sửa admin hiển thị và hoạt động ở mọi collection + global, Lead, Cho thuê, Tuyển dụng, Cấu hình chung, tải ảnh; không đổi schema, slug, URL, access control, endpoint)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-042**, MODIFY). Change doc `spec/changes/2026-10-20-admin-form-non-tech-friendly.md` (archive ở close-out → `spec/changes/archive/2026-10-20-admin-form-non-tech-friendly.md`). Task `tasks/feature-admin-form-non-tech-friendly/phase-1-task-01.md` (nền chung mọi form, `865ee10`) · `phase-1-task-02.md` (Dự án + ô giá, `a0aaa2c`) · `phase-1-task-03.md` (form Lead, `f4437c3`) · `phase-1-task-04.md` (Cho thuê / Tuyển dụng / Cấu hình chung / alt ảnh, `bfa5d5f`) · `phase-1-task-05.md` (sửa 16 test bộ đầy đủ sau phase review, `2f59c9b`). Review: T01 STRICT r1 FAIL (M1 vùng bấm/rem) → r2 PASS; T02 STRICT r1 PASS (5 MINOR không chặn); T03 STRICT r1 PASS; T04 STRICT r1 PASS; T05 NORMAL r1 PASS. Phase review: `.context/review-reports/spec-validation-feature-admin-form-non-tech-friendly-phase-1.md` — r1 FAIL (R1 thiếu `label` 3 trường `ui`, R2 test media cũ mong 400, R3 test media chọn "mới nhất" toàn DB) → sửa ở T05 (`pnpm test` 333 file / 3422 test, 0 fail); câu chữ spec W1–W5 + doc reconcile G12 xử lý ở close-out.

## Requirements (SPECIFICATIONS.md)

- **FR-ADM-19 — Giao diện quản trị (ĐỔI):** thêm câu "**Form dễ dùng cho người không rành công nghệ (BL-042)**":
  - Mọi form: nhãn không còn đuôi ngôn ngữ (ngôn ngữ đang sửa chỉ ở ô chọn ngôn ngữ thanh trên); richText có thanh công cụ cố định (đậm, nghiêng, tiêu đề, danh sách, liên kết, chèn ảnh, hoàn tác/làm lại), khung viền, chữ gợi ý tiếng Việt, không "nhấn '/'"/"+"/tay kéo; dấu `*` cho mọi trường bắt buộc (kể cả theo ngôn ngữ, danh mục bắt buộc; hiện cả ở bản tiếng Anh, ở đó chỉ bắt buộc khi bật "Có bản tiếng Anh"); lỗi tại ô (khung báo đỏ Payload) bằng câu tiếng Việt; chữ gợi ý ví dụ; "Người tạo" tự điền người đăng nhập (chỉ admin đổi); "Đường dẫn trang" trong khối thu gọn "Nâng cao" cột phải (vẫn tự sinh); "Có bản tiếng Anh" có câu giải thích; nhóm bản dịch chỉ 1 dòng tóm tắt + "Dịch lại bằng AI"; thanh nút màn tạo mới "Thêm <tên mục> mới" (tiêu đề lớn trống vẫn "[Chưa đặt tên]"); nút thêm nhanh cạnh ô quan hệ có chữ "Thêm mới"; "Ngày xuất bản" có mô tả tự điền.
  - Mô tả ngắn / Tóm tắt (Dự án, Dịch vụ, Tin tức, Tin BĐS) có bộ đếm ký tự (gợi ý 150–200); Pháp lý / Chính sách bán hàng chỉ có chữ gợi ý mẫu; ô tiền VNĐ (Dự án, Cho thuê, Tin BĐS, bảng giá, lương) có dòng đọc bằng chữ "≈ 3,5 tỷ đồng"; "Ngày cập nhật bảng giá" có nút "Hôm nay"; ô Danh mục chỉ liệt kê đúng loại (đã có `filterOptions`).
  - **Lead:** UTM + Trang gửi/đến trong khối thu gọn "Dữ liệu chiến dịch marketing" (mặc định đóng, URL rút gọn, chỉ http(s) bấm được); đồng ý chính sách cuối tab Nguồn chỉ đọc; mốc liên hệ đầu / hoạt động gần nhất / số lần gửi lại gom 1 dòng tóm tắt (Ngày phân công giữ ô riêng); các trường mốc + `anonymizedAt` không hiện ở form nhưng vẫn chọn được làm cột/bộ lọc; nút Gọi (`tel:`) / Zalo (`https://zalo.me/<0xxxxxxxxx>`) / Gửi email (`mailto:`); ngôn ngữ khách là nhãn chỉ đọc.
  - **Cho thuê:** mã `CT-…` to đầu form + nút sao chép. **Tin tuyển dụng:** badge "Đã quá hạn" ở form + cột danh sách khi hạn nộp trước hôm nay (giờ VN, `startOfVietnamDay`). **Cấu hình chung:** phiên bản chính sách là nhãn nhỏ; mô tả mã GA chỉ chỗ lấy; ví dụ thuật ngữ dịch.
  - **Ảnh:** tải file mới trống alt → alt tự điền từ tên file gốc đã làm sạch (UUID/toàn số → "Hình ảnh"), không chặn lưu; sửa ảnh cũ để trống alt vẫn báo lỗi; ảnh có alt không đổi.

## Hành vi bị thay thế

| Trước | Sau (BL-042) |
|---|---|
| Nhãn "Tiêu đề — Tiếng Việt" | "Tiêu đề" (đuôi `.localized` ẩn bằng CSS) |
| richText không thanh công cụ, "nhấn '/' để gọi lệnh", nút "+"/tay kéo, không viền | `createRichTextEditor()` toàn cục: FixedToolbar + Hoàn tác/Làm lại (`tamiHistory`), ẩn gutter/+/tay kéo, placeholder "Nhập nội dung tại đây…", viền như input |
| Trường `requiredByLocale` / danh mục bắt buộc không có `*` | `markRequired` → có `*` |
| "Người tạo *" phải tự chọn | Mặc định = người đăng nhập (hàm `defaultValue`, không default DB) |
| "Đường dẫn (slug)" ở cột phải | Trong khối thu gọn "Nâng cao" cột phải |
| Tab Bản dịch đầy trường hệ thống (hash nguồn, mô hình AI, lỗi…) | Trường hệ thống `admin.hidden` (dữ liệu giữ); 1 dòng "Tình trạng bản tiếng Anh" + nút "Dịch lại bằng AI" |
| "Đang tạo mới Dự án" | Thanh nút "Thêm Dự án mới" |
| Form Lead phơi UTM/URL, 5 mốc thời gian, `anonymizedAt`, SĐT/email chữ trơn, ô `locale` | Khối marketing thu gọn, 1 dòng tóm tắt, ẩn `anonymizedAt`, nút Gọi/Zalo/Gửi email, nhãn ngôn ngữ |
| Mã `CT-…` nhỏ ở cột phải | Banner mã to + Sao chép (ô `code` giữ dữ liệu/cột/tìm kiếm) |
| Tin tuyển dụng quá hạn không báo trong admin | Badge "Đã quá hạn" form + cột Hạn nộp |
| `privacyPolicyVersion` ô text to chỉ đọc | Nhãn thông tin nhỏ |
| Ảnh trống alt bị chặn lưu (400) | Ảnh mới: tự điền alt, 201; sửa ảnh cũ trống alt: vẫn 400 |

Không đổi: schema/DB (`payload-types.ts` chỉ đổi thứ tự `consentAt`/`consentVersion` + comment, không thêm/bớt trường; không migration), access control, endpoint, URL/slug, dữ liệu đã có, danh sách/cột BL-039 (trừ Cell badge cột Hạn nộp Tuyển dụng).

## Code (as-built)

- T01 (`865ee10`): `src/lib/admin/rich-text-editor.ts` (+test), `src/components/admin/lexical/HistoryFeatureClient.tsx`, `src/payload.config.ts`, `src/fields/{author,published-at,required-by-locale,scoped-category,slug,title,translation}.ts`, `src/collections/_shared/content-defaults.ts` (+test, `advancedSidebarBlock`), `src/components/admin/TranslationSummary.tsx` (+test), `src/lib/translation/admin-ui.ts`, `src/lib/admin/payload-vi-overrides.ts` (+test), `src/components/admin/styles/_forms.scss`, `src/app/(payload)/custom.scss`, `src/collections/{News,Pages,Projects,PropertyPosts,Rentals,Services}.ts`, `src/collections/form-friendly.test.ts`, `src/fields/form-friendly.test.ts`.
- T02 (`a0aaa2c`): `src/fields/form-hints.ts`, `src/lib/admin/form-hints.ts` (+test), `src/components/admin/{SummaryCounter(+test),PriceInWords,TodayButton}.tsx`, `src/lib/admin/list-summary.ts` (`formatPriceInWords`), `src/collections/projects/market-blocks.ts`, `src/lib/careers/deadline.ts` (export `vietnamDate`), `src/collections/{Projects,Services,News,PropertyPosts,Rentals,JobPostings}.ts`.
- T03 (`f4437c3`): `src/collections/Leads.ts`, `src/lib/admin/lead-contact.ts` (+test), `src/components/admin/{LeadContactButtons,LeadFormDisplay(+test)}.tsx`, `src/collections/leads-form.test.ts`, `src/payload-types.ts`.
- T04 (`bfa5d5f`): `src/components/admin/{RentalCodeDisplay,JobDeadlineDisplay,SiteSettingsDisplay}.tsx` + `RentalJobSettingsDisplay.test.tsx`, `src/lib/admin/{clipboard,job-deadline(+test)}.ts`, `src/globals/SiteSettings.ts`, `src/collections/{Rentals,JobPostings,Media}.ts`, `src/hooks/media/default-alt.ts` (+test), `src/lib/upload/{alt-from-filename(+test),validate-file}.ts`, `src/lib/upload/original-name-context.test.ts`, `src/collections/form-friendly-ops.test.ts`, `importMap.js`.
- T05 (`2f59c9b`): `label` cho `translationSummary`/`activitySummary`/`codeBanner`; `tests/integration/media-upload.test.ts` viết lại theo alt tự điền + ghim id media thay "mới nhất".

## Ảnh hưởng

- **Trực tiếp:** form tạo/sửa mọi collection nội dung + globals (nhãn, richText, `*`, placeholder, Người tạo, Nâng cao, bản dịch, "Thêm … mới", nút "Thêm mới"); form Dự án (bộ đếm, giá bằng chữ, Hôm nay, gợi ý Pháp lý/Chính sách); form Lead; form Cho thuê; form + cột Tuyển dụng; Cấu hình chung; tải ảnh Media.
- **Phụ thuộc:** hook dịch (trường `translation.*` ẩn nhưng job dịch vẫn ghi/đọc); `defaultToCreator` + quyền đổi tác giả; validator alt (lưới an toàn khi sửa ảnh cũ); upload guard đổi tên UUID (ghi tên gốc vào `req.context` trước); `hideTechnicalListFields` BL-039 (mốc Lead dùng Field null thay `admin.hidden` để giữ cột/lọc); `startOfVietnamDay` dùng chung với chip Tuyển dụng BL-039 + trang công khai.
- **Hồi quy:** danh sách/cột/chip BL-039, Lọc dịch, xuất Excel lead, chip Lead/Cho thuê, sidebar BL-041, nhãn tiếng Việt (test quét nhãn), alt ảnh trên web công khai (`ResponsiveImage`, view-model, Lightbox, OG), trang tuyển dụng công khai ẩn tin hết hạn, frontend `/en`.
- Không migration, không đổi quyền, không endpoint mới.

## Ngoài phạm vi / gap

- Tiêu đề lớn (H1) màn tạo mới vẫn "[Chưa đặt tên]" — phải thay view Payload (residual G2/G11, tên mục giữ hoa chữ đầu).
- Không có thanh "Đang sửa: Tiếng Việt" riêng (dùng ô ngôn ngữ sẵn có, Q1).
- Lỗi bắt buộc hiện bằng khung báo đỏ của Payload, không phải dòng chữ dưới ô (G8).
- Alt không lấy theo tiêu đề bài khi tải từ form bài (Q3).
- Bản đồ chọn vị trí, bộ chọn icon, lý do "Không thành" dạng danh sách, quý/năm bàn giao, gợi ý tag, cắt ảnh bìa, Lead dạng dòng thời gian… (cần đổi schema/component lớn — hoãn).
