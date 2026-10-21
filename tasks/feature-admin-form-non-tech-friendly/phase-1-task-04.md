# feature-admin-form-non-tech-friendly · phase-1-task-04 — Cho thuê · Tuyển dụng · Cấu hình chung · Ảnh (BL-042 #13–#16)

- Change doc: BL-042 bảng điểm #13–#16. Phụ thuộc: T01. Trạng thái: `pending`.

## Classification / Risk
- Type: **MODIFY**. Risk: **MEDIUM** — hook media `beforeValidate` (đổi hành vi lưu ảnh: không còn chặn alt trống) trên đường upload → review **STRICT** (upload/file).
- Blast radius: `src/collections/{Rentals,JobPostings,Media}.ts`, `src/globals/SiteSettings.ts`, component mới `src/components/admin/*`, tái dùng mốc ngày của chip "Hết hạn" (`src/lib/admin/collection-quick-filters.ts` / `startOfVietnamDay`), CSS admin.

## Quyết định (auto proceed)
- D1 **Mã CT**: field `ui` đầu form Cho thuê (cấp gốc, trước tab) hiện "Mã tin: CT-000123" chữ to + nút "Sao chép" (Clipboard API, báo "Đã sao chép", lỗi thì chọn sẵn chữ); tạo mới: "Mã tin tự tạo khi lưu". Field `code` giữ dữ liệu/cột (có thể ẩn khỏi sidebar form nếu trùng — không mất cột/tìm kiếm).
- D2 **Quá hạn tuyển dụng**: helper thuần `isJobPostingExpired(deadline, now)` cùng mốc `startOfVietnamDay` với chip "Hết hạn" BL-039 → badge "Đã quá hạn" (tone cảnh báo `status-tones.ts`) ở form (cạnh/ dưới `deadline`, kèm câu "Tin đã tự ẩn khỏi website") và danh sách (Cell của `deadline`: ngày `dd/MM/yyyy` + badge khi quá hạn). Không đổi query/lọc.
- D3 **Cấu hình chung**: `privacyPolicyVersion` → component Field chỉ đọc dạng chữ nhỏ "Phiên bản chính sách bảo mật hiện tại: <v> (tự cập nhật khi xuất bản trang chính sách)" (access/dữ liệu giữ). `gaMeasurementId`: description "Lấy ở Google Analytics → Quản trị → Luồng dữ liệu → chọn luồng web → Mã đo lường (dạng G-XXXXXXXXXX)." + placeholder "G-XXXXXXXXXX". `translationGlossary`: description có ví dụ "VD: \"Căn hộ dịch vụ\" → \"Serviced Apartment\". AI luôn dịch đúng từ này." + placeholder ô vi/en.
- D4 **Alt ảnh**: hook `beforeValidate` collection Media: nếu `mimeType` ảnh và `alt` trống (sau trim) → `alt` = tên file gốc đã làm sạch (bỏ đuôi, `-`/`_`/`.` → khoảng trắng, gộp khoảng trắng; ưu tiên tên gốc người dùng tải (`req.file?.name`) vì `createUploadGuard` đổi tên ngẫu nhiên — kiểm thứ tự hook; tên đã ngẫu nhiên/không có nghĩa → "Hình ảnh"). Validator alt giữ (lưới an toàn). Ảnh đã có alt không đổi; PDF/video không điền. Áp locale đang lưu (vi). Builder grep component ảnh web công khai dùng `alt` thế nào và ghi xác nhận a11y/SEO vào task (alt không bao giờ rỗng; trước đây không có ảnh thiếu alt).
- D5 Test: unit test helper quá hạn (biên giờ VN), sanitize tên file → alt, hook media (ảnh trống alt → điền; có alt → giữ; PDF → không điền); config Rentals/JobPostings/SiteSettings gắn component; test cũ (upload guard, SiteSettings, JobPostings quick filter) PASS.

## Acceptance
- [ ] Cho thuê: mã tin to đầu form + nút sao chép.
- [ ] Tuyển dụng: badge "Đã quá hạn" ở form + danh sách khi hạn < hôm nay (giờ VN).
- [ ] Cấu hình chung: phiên bản chính sách là nhãn nhỏ; GA có chỉ dẫn; thuật ngữ có ví dụ.
- [ ] Ảnh trống alt → tự điền; vẫn sửa được; ảnh có alt không đổi; xác nhận a11y/SEO web công khai.
- [ ] Không schema/migration; test cũ PASS.

## Verify
`pnpm vitest run src/lib/admin src/collections src/components/admin src/globals src/hooks src/lib/upload`, `pnpm typecheck`, `pnpm lint`, importmap + generate:types không đổi trường.

## Verification summary
- Làm: D1 `RentalCodeBanner` (ui `codeBanner` sau `code`, trước tab; `code` giữ dữ liệu/cột/tìm kiếm, Field = `RentalCodeHiddenField` null); Sao chép dùng `lib/admin/clipboard.ts` (Clipboard API → `execCommand` → chọn sẵn chữ + thông báo). D2 `lib/admin/job-deadline.ts` (`isJobPostingExpired` bọc `isPastDeadline`/`startOfVietnamDay` có sẵn, cùng mốc chip "Hết hạn"), `JobDeadlineNotice` (afterInput) + `JobDeadlineCell` (`dd/MM/yyyy` + badge); badge dùng `StatusBadge tone="warning"` trực tiếp, KHÔNG thêm key vào `STATUS_TONES` (test "không khai giá trị thừa" cấm: "quá hạn" không phải giá trị trạng thái lưu DB). D3 `PrivacyPolicyVersionField` + description/placeholder GA + ví dụ thuật ngữ. D4 hook `fillImageAlt` (`beforeValidate` Media) + `altFromFilename`.
- G1: `createUploadGuard` ghi `req.context.originalUploadName` (khoá `ORIGINAL_UPLOAD_NAME_KEY` ở `lib/upload/alt-from-filename.ts`) ngay trước khi đổi tên UUID; hook alt đọc từ đó. Chỉ điền khi có file vừa tải (create/thay file); sửa metadata ảnh cũ để trống alt vẫn bị validator báo lỗi. Chính sách MIME/tên ngẫu nhiên không đổi. Hook chạy sau bước Payload điền `mimeType` (generateFileData trước beforeValidate).
- Alt trên web công khai: `ResponsiveImage` dùng `alt ?? media.alt ?? ""`; view-model (`post-view`, `rental-view`, `project-detail-view`) đều `media.alt?.trim() || "<tiêu đề> - n"`; `Lightbox` hiện `alt`; `seo/metadata.ts` chỉ gắn `alt` OG khi có. Tự điền chỉ biến alt rỗng thành chữ có nghĩa (tên file làm sạch hoặc "Hình ảnh") → không làm yếu a11y/SEO; ảnh có alt không đổi; trước đó không có ảnh thiếu alt nên không có dữ liệu cũ bị đổi. Nhược điểm nhỏ: alt từ tên file kém chất lượng hơn alt viết tay → vẫn sửa được trong form Media.
- Test mới: `alt-from-filename.test.ts`, `default-alt.test.ts`, `original-name-context.test.ts` (guard), `job-deadline.test.ts` (biên 23:59/00:00 giờ VN), `RentalJobSettingsDisplay.test.tsx` (banner/copy/fallback/badge/cell/privacy), `form-friendly-ops.test.ts` (config Rentals/JobPostings/SiteSettings/Media).
- Verify: vitest (lib/admin collections components/admin fields globals hooks lib/upload lib/careers) 80 file / 597 test PASS; `pnpm typecheck` PASS; `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard); `generate:importmap` thêm 3 component; `generate:types` chỉ đổi comment mô tả (không đổi trường). Không schema/migration/access/endpoint.
- Residual: chưa kiểm tay trên trình duyệt (banner copy, badge ở ≤767px) — nút `.tami-contact-action` min-height 44px ở ≤767px; Cell `deadline` mới không còn là link ở cột đầu (deadline không phải cột đầu nên không ảnh hưởng).

## Bổ sung sau spec-validation plan r1
- G5: phụ thuộc thêm T02 (cùng sửa `Rentals.ts`/`JobPostings.ts`) — chạy sau T02.
- G1 → D4: `createUploadGuard` (`src/lib/upload/validate-file.ts:86`) đổi tên file thành UUID TRƯỚC hook media → lưu tên gốc vào `req.context` (vd `req.context.originalUploadName`) ngay trước khi đổi tên; hook alt đọc từ đó; không có thì "Hình ảnh". Không đổi chính sách kiểm MIME/tên ngẫu nhiên.
