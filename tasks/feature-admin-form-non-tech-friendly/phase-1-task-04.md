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
(builder điền)

## Bổ sung sau spec-validation plan r1
- G5: phụ thuộc thêm T02 (cùng sửa `Rentals.ts`/`JobPostings.ts`) — chạy sau T02.
- G1 → D4: `createUploadGuard` (`src/lib/upload/validate-file.ts:86`) đổi tên file thành UUID TRƯỚC hook media → lưu tên gốc vào `req.context` (vd `req.context.originalUploadName`) ngay trước khi đổi tên; hook alt đọc từ đó; không có thì "Hình ảnh". Không đổi chính sách kiểm MIME/tên ngẫu nhiên.
