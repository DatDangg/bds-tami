Agent: reviewer

# Review — feature-listing-detail-redesign · phase-3-task-01 · round 1

- Task: `tasks/feature-listing-detail-redesign/phase-3-task-01.md` (BL-052, schema Tin BĐS trường có cấu trúc)
- Code: worktree `D:\prj\bds\.claude\worktrees\agent-a162565e94c21661c`, branch `worktree-agent-a162565e94c21661c`, base staging `31e5f30`, chưa commit
- Review level: **STRICT**
- Reason: có DB schema/migration (6 enum, 20 cột, 4 index trên `property_posts` + `_property_posts_v`), thêm field công khai (`address`/`location`), chuyển hằng shared `DIRECTIONS` mà `rentals` cũng dùng.

## Blast radius
- DB: `property_posts`, `_property_posts_v` (chỉ ADD), 6 enum type mới.
- `src/collections/PropertyPosts.ts` (admin form, "Thêm bộ lọc"), `src/collections/Rentals.ts` (chỉ đổi nguồn import `DIRECTIONS` + nhãn).
- `src/shared/listing-options.ts` (thêm `DIRECTIONS`, `DIRECTION_ADMIN_LABELS`, `HANDOVER_CONDITIONS`, `HANDOVER_CONDITION_ADMIN_LABELS`).
- `src/payload-types.ts` (sinh lại), i18n `listingOptions.handoverCondition` (vi/en), `docs/ERD.md`.
- Public API: `property-posts` đọc công khai tin `published`; nay trả thêm 10 trường (đúng spec, `address`/`location` công khai).

## Verify commands + result (chạy trong worktree, DB `tami_wt52_p2t03`)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS (0 error, 2 warning cũ ở `tools/task-dashboard/server.mjs`, không thuộc diff) |
| `pnpm test` (toàn bộ) | 380/382 file PASS, 3784 test PASS. 2 file FAIL vì `beforeAll` timeout 10s (`media-upload`, `session-refresh`), đều do môi trường chạy tải nặng |
| `pnpm test` riêng `media-upload`, `session-refresh`, `property-posts` (integration), `property-posts-specs`, `listing-options` | 5/5 file, 59/59 test PASS. Test integration BL-052 có chạy thật, không bị skip |
| Kiểm drift: `pnpm payload migrate:create drift_check --skip-empty` | Sinh UP/DOWN xong, **không tạo file mới** (`git status migrations` giữ nguyên, `index.ts` vẫn diff 7+/1-). Schema config khớp snapshot `20261021_173246_property_post_specs.json` sau khi sửa `index: false`. Không để lại file |
| `pnpm build` | bỏ qua theo yêu cầu của primary (builder báo PASS), reviewer không tự chạy |
| Migration up/down/up | reviewer không chạy lại (migrate không nằm trong lệnh được allow). Dựa vào lời builder + đọc SQL + integration test (DB test migrate lên được, test kiểm index có trong `pg_indexes`) |

## Migration safety (đọc từng dòng `migrations/20261021_173246_property_post_specs.ts`)
- **up** (dòng 5–34): 6 `CREATE TYPE`, 20 `ALTER TABLE … ADD COLUMN`, tất cả nullable, không DEFAULT, 4 `CREATE INDEX … USING btree`. Không có DROP, đổi kiểu, `SET NOT NULL`, UNIQUE, FK hay backfill. **Không cần gắn HIGH_RISK_MIGRATION.**
- **down** (dòng 39–68): DROP đúng 4 index, đúng 20 cột, đúng 6 type theo thứ tự ngược (index → cột → type). Đây là ngược chính xác của up. Chỉ xoá dữ liệu của các cột mới, chấp nhận được với rollback.
- Giá trị enum: `property_type` khớp `PROPERTY_TYPES`, `house_direction` = `N…NW` khớp `DIRECTIONS`, `handover_condition` = `raw/basic/full`.
- Snapshot JSON: chỉ có 4 index `property_type`/`area_m2` (+ bản `_v`). Không có index thừa cho `bedrooms`/`floors`…, khớp SQL.
- `geometry(Point)`: các migration trước đã dùng (`projects`/`rentals.location`, ví dụ trong snapshot `20261021_135620`, `20261020_183923`). Image Postgres dev/staging/prod/CI đều có PostGIS (`.context/decisions.md`: `postgis/postgis:17-3.5` → bookworm + PostGIS 3.5.2; `tests/integration/smoke.test.ts` kiểm extension `postgis`). OK.

## Kiểm riêng theo yêu cầu
- **Rentals không đổi schema:** `DIRECTIONS` chuyển nguyên giá trị và thứ tự (`N, NE, E, SE, S, SW, W, NW`), nhãn admin giữ nguyên. Không còn file nào import `DIRECTIONS` từ `collections/Rentals`. Drift check không sinh migration nên enum `rentals` không đổi. OK.
- **Tin cũ lưu/xuất bản được khi để trống:** cả 10 trường tuỳ chọn, không nằm trong `englishRequiredFields`. Integration test tạo tin `published` để trống rồi kiểm mọi trường là null. Dữ liệu cũ sau migrate là NULL. OK.
- **Access công khai `address`/`location`:** không có field-level `access`, đúng spec ("công khai — tin BĐS không có cơ chế ẩn địa chỉ như cho thuê"). Integration test đọc với `overrideAccess: false` thấy đủ. OK.
- **Validation:** select chặn giá trị lạ (400), số âm bị chặn (400) với cả 5 trường số. Đã có test cho cả hai.
- **ERD:** `docs/ERD.md` §property-posts có thêm 8 dòng trường và 1 đoạn as-built (migration, enum, index, additive, collapsible không tên, nhãn i18n). OK.
- **Spec coverage:** đủ 10 trường, đúng nhãn và mô tả spec 1.46.0 khối BL-052. Các trường nằm ở tab "Thông tin tin đăng", có ghi chú voucher. OK.
- **i18n:** chỉ thêm `listingOptions.handoverCondition` vào cuối namespace ở vi/en, không format lại file. Đúng quy ước song song.

## Responsive Checklist Gate
N/A. Diff chỉ đụng admin collection config, schema, i18n, không có route/component/CSS công khai.

## Skill gates
- aislop: skip, chưa cài `aislop`.
- oxlint (anti-slop): skip, repo chưa cấu hình oxlint (không có `.oxlintrc*`). ESLint PASS thay.
- ocr (open-code-review): skip, chưa cài `ocr`.
- AI-readable: OK. Tên rõ, hàm ngắn, comment nói lý do (WHY), không có magic number. ERD đã cập nhật. Có 1 indicator nhỏ là lặp helper (xem MINOR-1), dưới ngưỡng 3.
- ai-friendly-web: N/A (thay đổi schema/admin, không phải trang public mới).
- blitzstrike: N/A. Không đụng auth/input surface mới ngoài field có validation chuẩn của Payload.

## Findings
- **[CRITICAL]** không có.
- **[MAJOR]** không có.
- **[MINOR-1] DRY:** `selectOptions` và `nonNegativeNumber` bị lặp ở `src/collections/PropertyPosts.ts:55-56` và `src/collections/Rentals.ts:64-68`. Cách sửa đề xuất: khi có task dọn dẹp thì gom vào `src/lib/admin/form-layout.ts` hoặc `src/shared/listing-options.ts`. Không chặn task này (surgical).
- **[MINOR-2] Coupling nhãn:** nhãn công khai hướng nhà của tin BĐS dùng lại namespace `page.rentalDetail.direction` (ghi ở ERD và comment `listing-options.ts:35`). Chạy đúng, nhưng tên namespace gắn với trang cho thuê. Cách sửa đề xuất: sau này có thể chuyển sang `listingOptions.direction`. Không chặn.
- **[MINOR-3] Thông tin:** `location` không có index GIST (ERD ghi rõ). Nếu phase sau lọc theo bán kính hoặc bản đồ thì cần thêm index trong migration riêng.

## Residual risk
- Reviewer không tự chạy up/down/up migration. Phần đó dựa vào báo cáo của builder, việc đọc SQL (ngược chính xác) và integration test trên DB đã migrate.
- Full suite có 2 file timeout ở `beforeAll`. Chạy lại riêng thì PASS, nên coi là flaky do tải, không phải regression.
- Build không chạy lại theo yêu cầu.

## Verdict
**PASS.** Không có CRITICAL/MAJOR. Migration chỉ additive, không HIGH_RISK, không drift snapshot.
