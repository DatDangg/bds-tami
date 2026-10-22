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
1. **Đăng ký collection** ở `src/collections/admin-collections.ts` (`ADMIN_COLLECTIONS`) — `payload.config.ts` lấy từ đây nên không sửa. Menu (`admin-groups.ts`): `newsletter-subscribers` cuối nhóm "Khách hàng" (sau `lead-activities`); `news-views-daily` trong nhóm "Nâng cao" ngay sau `click-stats-daily` (nhóm kỹ thuật của thống kê). Nhãn: "Lượt xem tin tức (theo ngày)", "Đăng ký bản tin" (`collection-labels.ts`).
2. **`news-views-daily`**: `day` = mốc 00:00 giờ VN của ngày (P1-T03 tính; ô admin `dayOnly`), `views` R ≥ 0 mặc định 0, `defaultSort: -day`. Unique bằng `indexes: [{ fields: ["news", "day"], unique: true }]` → `news_day_idx` (Payload 3.91 không cho đặt tên compound index). Access `read: isAdmin`, create/update/delete `denyAll`, `disableDuplicate`, `admin.hidden` với non-admin.
3. **FK `news_id` ON DELETE CASCADE (SQL tuỳ biến trong migration)**: drizzle của Payload luôn sinh `ON DELETE set null` cho relationship, nhưng `news` bắt buộc → cột NOT NULL → **xoá hẳn một tin có lượt xem sẽ lỗi 23502**. Lượt xem của tin đã xoá hẳn vô nghĩa → sửa đúng 1 dòng FK sang `cascade` trong UP (có comment); snapshot `.json` giữ `set null` (mã Payload sinh) nên `migrate:create` sau đó vẫn "No schema changes". Test integration khoá: `confdeltype = 'c'` + xoá hẳn tin kéo theo dòng lượt xem. Trade-off: migration sau này nếu tạo lại FK này sẽ sinh `set null` → test bắt được.
4. **`newsletter-subscribers`**: `email` R/U/I + hook `normalizeEmail` (trim + chữ thường, `beforeValidate` nên unique so trên bản đã chuẩn hoá); `locale` R mặc định `vi`; `status` R/I mặc định `active`; `consentAt` / `privacyPolicyVersion` / `sourcePath` tuỳ chọn. Access `read/update/delete: isAdmin`, `create: denyAll` (P1-T04 dùng Local API `overrideAccess`). Form admin **chỉ sửa `status`** (trường còn lại `admin.readOnly` — bằng chứng đồng ý; spec "sửa trạng thái"); không khoá bằng field access (admin PATCH qua API vẫn được) để giữ đơn giản. Tìm theo email (`LIST_SEARCHABLE_FIELDS`).
5. **`job-postings.isUrgent`**: checkbox "Tuyển gấp" `defaultValue: false`, cuối tab "Thông tin tuyển dụng" (sau Hạn nộp), lọc được trong admin (thêm mẫu vào `list-filter.test`). Không index (spec: không ảnh hưởng sắp xếp).
6. **`site-settings`**: `workingHours` + `offices` (file mới `contact-offices.ts`) cuối tab "Liên hệ & mạng xã hội" (Giờ làm việc trước, Hệ thống văn phòng sau); `phone`/`email` văn phòng và `hours`/`days` dùng `formRow` (vỏ không tên, không đổi dữ liệu). `careersProcess` ngay sau `careersPerks` (tab "Ảnh banner"); `icon` **bắt buộc** như `careersPerks` (spec không nói — chọn giống khối anh em để front-end khỏi cần icon dự phòng), không `minRows` (0 bước → ẩn khối). Tên bảng đều < 63 ký tự → **không cần `dbName`**. Ba trường vào `TRANSLATABLE_FIELDS["site-settings"]`.
7. **Down migration**: bản Payload sinh lỗi khi chạy (DROP TABLE … CASCADE đã gỡ FK của `payload_locked_documents_rels`, rồi `DROP CONSTRAINT` không `IF EXISTS`) → viết lại down theo mẫu `20261018_094454_leads` (IF EXISTS mọi lệnh, bảng con trước). `up`/`down` bỏ tham số không dùng.
8. **i18n**: task này không thêm key i18n (không có namespace).
9. **Test trên DB dùng chung**: `.env.local` của worktree để `DATABASE_URL_TEST` = DB `tami` gốc (chưa có migration này) → 4 file integration chạy thẳng trên DB đó (`access`, `admin-dashboard`, `session-refresh`, `media-upload`) lỗi "column newsletter_subscribers_id does not exist" (`payload_locked_documents_rels`). **Không migrate DB `tami`** (cấm đụng); chạy lại cả bộ với `DATABASE_URL_TEST` trỏ DB worktree `tami_wt54_p1t01` (override env của lệnh) → PASS. Primary cần migrate DB dev `tami` sau khi merge (hoặc chạy test như trên).

## Verification summary (Builder)
- DB worktree `tami_wt54_p1t01` (bản sao dev), Redis db 11. Không ghi vào DB `tami` (chỉ dùng làm DB nền cho `CREATE DATABASE` tạm của test integration như các test khác).
- Migration `migrations/20261022_022857_news_careers_contact_redesign.ts` (+ `.json`, `index.ts`): UP chỉ CREATE TYPE (3 enum mới) / CREATE TABLE (6 bảng mới: `newsletter_subscribers`, `news_views_daily`, `site_settings_offices` + `_locales`, `site_settings_careers_process` + `_locales`) / ADD COLUMN nullable (`job_postings.is_urgent` + `_job_postings_v.version_is_urgent` boolean `DEFAULT false`, `site_settings_locales.working_hours_hours` / `_days`, `payload_locked_documents_rels.newsletter_subscribers_id` / `news_views_daily_id`) / FK + index (gồm UNIQUE `(news_id, day)`, UNIQUE `email`) chỉ trên bảng / cột mới. Không DROP / đổi kiểu / SET NOT NULL / UNIQUE-FK trên dữ liệu cũ / backfill → **SAFE_ADDITIVE, không HIGH_RISK_MIGRATION**. DOWN chỉ gỡ đúng phần đã thêm (IF EXISTS).
- `pnpm payload migrate` → `migrate:down` → `migrate` PASS (lần down đầu với bản Payload sinh FAIL → đã sửa, Quyết định 7). Kiểm DB: FK `news_views_daily_news_id_news_id_fk` `confdeltype = c`; `news_day_idx` UNIQUE `(news_id, day)`; `newsletter_subscribers_email_idx` UNIQUE `(email)`; `job_postings.is_urgent` default false, nullable, 0 dòng khác false. `migrate:create` chạy thử sau đó: "No schema changes detected" (không tạo file).
- `pnpm generate:types`: `src/payload-types.ts` +144 dòng, không xoá dòng nào. `pnpm generate:importmap`: nội dung không đổi (không thêm component admin).
- Test mới / sửa: `tests/integration/news-views-newsletter.test.ts` (mới; migration THẬT + config app thật: unique `(news, day)` chặn ghi trùng, khác ngày được, views mặc định 0 / âm → 400, xoá hẳn tin → cascade; admin đọc 200, sale + khách 403, POST / PATCH / DELETE REST 403 kể cả admin; email trim + chữ thường, trùng khác hoa thường → 400, UNIQUE có trong DB; REST create 403 với khách / sale / admin; sale đọc / sửa / xoá 403; admin đổi status + xoá 200, status lạ 400; cột `is_urgent`), `globals.test` (+2: offices / workingHours / careersProcess lưu VI + EN riêng, `/en` không rơi về VI, để trống hợp lệ; thiếu tên / địa chỉ / tiêu đề, email sai, > 10 văn phòng, > 6 bước → 400; sale ghi → 403), `job-postings.test` (isUrgent trong config, mặc định false, lưu true), `admin-hidden.test` (2 collection ẩn với sale / khách), `admin-groups.test` (Nâng cao 7 mục), `list-filter.test` (isUrgent lọc được; 23 collection), `admin-labels.test` (23 collection, nhãn VI 2 collection mới tự được quét), `translatable-fields.test` (khớp tự động).
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 lỗi, 2 warning sẵn có ở `tools/task-dashboard/server.mjs`) · `pnpm test` (với `DATABASE_URL_TEST` = DB worktree, Quyết định 9) **388 file / 3918 test PASS** · `pnpm build` PASS.
- Không mở trình duyệt admin (không thêm component; hành vi admin khoá bằng test cấu hình + integration REST / Local API).

## Review

## Doc impact
- `docs/ERD.md`: §3 danh sách collection (Khách hàng + `newsletter-subscribers`, Hệ thống + `news-views-daily`); §4.10 `job-postings.isUrgent` + bảng `newsletter-subscribers`; §4.13 `news-views-daily` (unique, FK cascade tuỳ biến); §4.15 as-built `site-settings` (`workingHours`, `offices`, `careersProcess`); §5 index `news_day_idx`.
- `docs/PERMISSION.md`: §3.3 `newsletter-subscribers`, §3.4 `news-views-daily`.
- `docs/API_SPEC.md`: no doc impact ở task này (endpoint thuộc P1-T03 / P1-T04).
