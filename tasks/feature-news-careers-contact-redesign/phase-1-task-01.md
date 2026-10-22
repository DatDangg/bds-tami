# feature-news-careers-contact-redesign · phase-1-task-01 — Schema + migration (collection mới, trường site-settings, Tuyển gấp)

- Nguồn: `spec/changes/2026-10-21-news-careers-contact-redesign.md` (BL-054, MODIFY). Spec: `SPECIFICATIONS.md` 1.47.0 khối "Redesign Tin tức / … (BL-054)" mục "Đọc nhiều", "Bản tin thị trường", "Tuyển gấp", "Quy trình ứng tuyển", "Văn phòng + giờ làm việc", "Schema / migration".
- Plan: phase 1 wave A (song song P1-T02). **Task duy nhất của BL-054 tạo migration.**
- Phụ thuộc: không.

## Classification / Risk
- Type: **ADDITIVE** (schema) trong change MODIFY. Risk: **HIGH** — DB/migration, global `site-settings`, PII (email). Review: **STRICT**.
- Blast radius: `src/collections/NewsViewsDaily.ts` (mới), `src/collections/NewsletterSubscribers.ts` (mới), `src/collections/JobPostings.ts`, `src/globals/SiteSettings.ts`, `src/globals/site-settings/*`, `src/payload.config.ts` (đăng ký collection), nhãn / nhóm menu admin, access, `TRANSLATABLE_FIELDS`, `migrations/*`, `src/payload-types.ts`, `docs/ERD.md`, `docs/PERMISSION.md`.
- Doc impact: `docs/ERD.md`, `docs/PERMISSION.md`.

## Files to Create/Modify
- `src/collections/NewsViewsDaily.ts`
- `src/collections/NewsletterSubscribers.ts`
- `src/collections/JobPostings.ts`
- `src/globals/SiteSettings.ts`
- `src/globals/site-settings/contact-offices.ts`
- `src/globals/site-settings/page-heroes.ts`
- `src/payload.config.ts`
- `migrations/`
- `docs/ERD.md`

## Scope
1. **`news-views-daily`** (nhãn "Lượt xem tin tức (theo ngày)"): `news` relationship → `news` (bắt buộc, index), `day` date (ngày theo giờ VN, chỉ ngày, bắt buộc, index), `views` number ≥ 0 mặc định 0. Unique `(news, day)` (Payload `indexes` của collection hoặc SQL trong migration). Access: chỉ admin đọc; create/update/delete = deny (ghi qua Local API / SQL ở P1-T03); ẩn khỏi admin với sale; `disableDuplicate`. Theo mẫu `ClickEvents.ts`.
2. **`newsletter-subscribers`** (nhãn "Đăng ký bản tin"): `email` (type email, bắt buộc, `unique`, index, hook chuẩn hoá trim + chữ thường), `locale` select `vi`/`en`, `status` select `active` "Đang nhận" / `unsubscribed` "Đã huỷ" (mặc định `active`), `consentAt` date, `privacyPolicyVersion` text, `sourcePath` text. Access: admin đọc / sửa / xoá; sale không thấy; create qua REST công khai = deny (endpoint P1-T04 dùng Local API). `defaultColumns` email · locale · status · createdAt. Nút "Xuất Excel" là việc của P1-T04.
3. **`job-postings.isUrgent`** checkbox "Tuyển gấp", mặc định `false`, tab "Thông tin tuyển dụng"; lọc được trong admin.
4. **`site-settings`**:
   - tab "Liên hệ & mạng xã hội": `offices` array ≤ 10 "Hệ thống văn phòng" — `name` text localized (bắt buộc trong hàng), `address` text localized (bắt buộc trong hàng), `image` upload ảnh (chỉ image), `location` point, `phone` text, `email` email; RowLabel theo `name`; mô tả admin: "Để trống thì website dùng Địa chỉ / Toạ độ / Hotline / Email ở trên". `workingHours` group "Giờ làm việc" — `hours` text localized (vd "8:00 – 18:00"), `days` text localized (vd "Thứ 2 – Chủ nhật"). Field đặt trong file mới `src/globals/site-settings/contact-offices.ts`.
   - cạnh `careersPerks` (file `page-heroes.ts`): `careersProcess` array ≤ 6 "Quy trình ứng tuyển" — `icon` select (cùng danh sách icon như `careersPerks`), `title` text localized bắt buộc trong hàng, `description` textarea localized.
   - Thêm `offices`, `workingHours`, `careersProcess` vào `TRANSLATABLE_FIELDS["site-settings"]` (cách `pageHeroes` / `careersPerks` đang làm).
   - `dbName` ngắn nếu tên bảng > 63 ký tự (như BL-052).
5. **Migration** `pnpm payload migrate:create news_careers_contact_redesign` — chỉ ADD (bảng mới + bảng con + locales + cột nullable / `is_urgent DEFAULT false` + index/unique trên bảng mới). Inspect: không DROP / đổi kiểu / SET NOT NULL trên bảng cũ. `migrate` → `migrate:down` → `migrate` trên DB worktree. Regen `src/payload-types.ts`; `pnpm generate:importmap` nếu thêm component admin. Sau đó `migrate:create` chạy thử phải "No schema changes".
6. Nhãn admin tiếng Việt dễ hiểu (chuẩn BL-051, `admin-labels.test`), nhóm menu admin hợp lý (bản tin cạnh Khách hàng; lượt xem cạnh thống kê/hệ thống).
7. `docs/ERD.md` + `docs/PERMISSION.md` cập nhật.

## Acceptance
- [ ] Admin: 2 collection mới đúng quyền (admin thấy; sale không thấy), nhãn tiếng Việt; tin tuyển dụng có "Tuyển gấp"; Cài đặt website có "Hệ thống văn phòng", "Giờ làm việc", "Quy trình ứng tuyển"; lưu VI + EN được; dữ liệu cũ (để trống trường mới) vẫn lưu / xuất bản.
- [ ] Unique `(news, day)` và unique `email` có trong DB; test integration ghi trùng bị chặn.
- [ ] Migration SAFE_ADDITIVE, up/down/up PASS, không HIGH_RISK; `payload-types.ts` khớp.
- [ ] Test schema / access (sale không đọc 2 collection mới; REST công khai không tạo được), `admin-labels`, `translatable-fields` PASS.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Quy ước song song
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- `src/payload-types.ts` là file sinh: regen bằng `pnpm generate:types` (primary regen lại khi merge nếu xung đột).
- Không sửa file thuộc task song song cùng wave; cần thì ghi vào báo cáo để primary chuyển.
- Tái dùng component BL-052 (`src/components/listing/*`, `src/components/detail/*`, `Pagination`, `ConsultBanner`, `SectionHeading`, Button/Badge/chip sẵn có); token màu theo `no-raw-colors.test`; không thêm màu / kiểu nút mới.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`. Migration phát sinh thao tác phá huỷ → DỪNG, gắn `HIGH_RISK_MIGRATION`, báo primary.

## Quyết định (builder)

## Verification summary (Builder)

## Review

## Doc impact
