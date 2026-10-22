# feature-admin-form-ux-polish · phase-1-task-05 — Làm rõ tab SEO (CHỜ USER CHỐT PHƯƠNG ÁN)

- Change doc: `spec/changes/2026-10-22-admin-form-ux-polish.md` (BACKLOG BL-058, mục 5)
- Spec: F11 SEO (FR-PUB-15, NFR-03), FR-ADM-19 (ngữ nghĩa chữ admin BL-040: không lộ "canonical"/"noindex"/"OG" trong nhãn)
- Status: approved — **phương án B** (user 2026-10-22) — chưa chạy, sau đợt 2 · Wave 3 (sau T04; chung `importMap.js` / `custom.scss` nếu có component mới)

## Hiện trạng (change-request đã kiểm)
- `src/fields/seo.ts:9-22`: group `seo` (localized, nhãn "SEO") gồm `metaTitle` ("Tiêu đề hiện trên Google", mô tả "Để trống thì dùng tiêu đề bài."),
  `metaDescription` (không mô tả), `ogImage`, `noindex` ("Ẩn trang khỏi Google"), `canonical` ("Đường dẫn gốc…", "Thường để trống.").
- `src/collections/_shared/content-defaults.ts:166-177` `placeSharedFields`: đặt group `seo` vào tab mới nhãn "SEO" ⇒ **tab "SEO" chứa nhóm cũng tên "SEO"** (tiêu đề lặp).
- Global Trang chủ: `src/globals/Homepage.ts:288` tab "SEO & Đa ngôn ngữ" → khối "SEO" → group "SEO".
- SEO công khai ĐÃ đúng: `src/lib/seo/metadata.ts` — ô trống thì lấy Tiêu đề / Tóm tắt (`summary`/`excerpt`) / ảnh đại diện → ảnh mặc định; tên site nối 1 lần; `canonical` chỉ nhận http(s); `noindex` cũng lọc sitemap / llms.txt (`src/lib/seo/llms-txt.ts:4`).
- Đường dẫn dữ liệu `seo.*` dùng ở metadata, sitemap, llms.txt, list-filter ẩn — **phải giữ nguyên** (collapsible/row/ui không đổi path).

## Classification / Risk
- Type: **MODIFY** (UI admin). Không migration với mọi phương án (giữ `seo.*`). Risk: **LOW** (A) / **MEDIUM** (B, C: component client đọc form + mô phỏng quy tắc fallback). Reviewer: NORMAL.

## Phương án (user chọn ở checkpoint — KHÔNG tự chọn)
- **A. Chỉ làm rõ chữ:** bỏ tiêu đề nhóm lặp; dòng giải thích đầu tab "Không bắt buộc. Để trống thì trang tự lấy Tiêu đề, Tóm tắt và Ảnh đại diện"; mô tả "để trống = …" cho từng ô; gom "Ẩn khỏi Google" + "Đường dẫn gốc" vào khối thu gọn "Nâng cao" (đóng mặc định).
- **B. A + xem trước Google + đếm ký tự (khuyến nghị):** thêm khung xem trước kết quả Google (tiêu đề + đường dẫn + mô tả, cắt như Google) tính theo đúng quy tắc fallback của `metadata.ts`
  (đọc Tiêu đề/Tóm tắt khi ô SEO trống), placeholder ô hiện giá trị sẽ dùng, bộ đếm ký tự (gợi ý tiêu đề ≤ 60, mô tả 120–160; dùng lại kiểu `.tami-field-hint`).
- **C. B + xem trước khi chia sẻ (Facebook/Zalo):** thêm thẻ xem trước ảnh chia sẻ (ảnh SEO → ảnh đại diện → ảnh mặc định).
- **D. Thu gọn tối đa:** bỏ tab SEO, chuyển nhóm vào khối thu gọn "Tuỳ chỉnh SEO (không bắt buộc)" ở cuối tab Nội dung hoặc cột phải, đóng mặc định, kèm câu giải thích như A.

## Yêu cầu chung (mọi phương án)
- Giữ `seo.*` + `localized`, không đổi `metadata.ts`/sitemap. Áp đồng nhất cho 7 collection + Trang chủ.
- Nhãn không lộ thuật ngữ dev (BL-040). 390px không tràn. Test cấu hình field (path không đổi, có nhãn) + test component (B/C: fallback đúng như `buildPageMetadata`, đếm ký tự).

## Acceptance (điền theo phương án chốt)
- [ ] Tab/khối SEO không còn tiêu đề lặp; người dùng đọc được "để trống là tự lấy từ nội dung".
- [ ] (B/C) Xem trước khớp kết quả `generateMetadata` thật của trang đó (đối chiếu `<title>`/`<meta description>` trang công khai).
- [ ] Ảnh 1440 trước/sau. `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` PASS.

## Phạm vi cấm
- KHÔNG sửa: `SPECIFICATIONS.md`, `spec/**`, `.context/progress.json`, `src/lib/seo/**` (chỉ đọc/tái dùng hàm thuần nếu có). Không migration.

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`; trình duyệt 1440 + 390; ảnh `.context/review-reports/feature-admin-form-ux-polish/screens/t05-{before,after}-1440-*.png`.
- Report: `.context/review-reports/feature-admin-form-ux-polish-phase-1-task-05-round-<R>-review.md`.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- (change-request) Đưa 4 phương án, khuyến nghị B. Chờ user chốt.
- (user 2026-10-22, checkpoint) Q1 = **B**: bỏ tiêu đề nhóm lặp; câu "để trống = tự lấy từ Tiêu đề / Tóm tắt / Ảnh đại diện"; gom "Ẩn khỏi Google" + "Đường dẫn gốc" vào khối thu gọn "Nâng cao"; khung xem trước kết quả Google theo đúng fallback `metadata.ts` + placeholder giá trị sẽ dùng + đếm ký tự. Không migration, giữ `seo.*`. Không làm phần C.
