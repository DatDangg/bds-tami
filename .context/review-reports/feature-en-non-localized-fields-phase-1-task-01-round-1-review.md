Agent: reviewer

# Review — feature-en-non-localized-fields · phase-1-task-01 · round 1 (BL-065)

- Review level: **STRICT**
- Reason: DB/schema + versioned migration có backfill dữ liệu trên 4 bảng (2 collection có versions/drafts); shape REST/GraphQL `rentals` + `projects` thêm trường; view type dùng chung (`RentalDetailView.floor`, `NearbyItemView.distance`) đổi từ `string` sang union.
- Blast radius: bảng `rentals`, `_rentals_v`, `projects_nearby_amenities`, `_projects_v_version_nearby_amenities` (+4 enum mới); admin form Rentals (tab thông tin) + Projects (`nearbyAmenities`); trang chi tiết cho thuê vi/en (`RentalDetail`), trang chi tiết dự án vi/en (`ProjectLocation` → `DetailDistanceList`); seed `scripts/seed-scraped.ts`; script mới `report:legacy-units`; `docs/ERD.md`. Không đụng search text, JSON-LD, export, translation leaves (Grep `src/` + `scripts/`: không còn chỗ đọc `floor`/`distance` ngoài các file trong diff).

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit sạch) |
| `npx eslint src/lib/units src/collections/Rentals.ts src/collections/projects/market-blocks.ts src/hooks/rentals/field-validators.ts src/lib/rentals/rental-view.ts src/lib/projects/project-detail-view.ts src/components/rentals/RentalDetail.tsx src/components/projects/ProjectLocation.tsx src/collections/rentals-floor.test.ts scripts/... migrations/...` | 0 error (3 warning "file ignored" cho migrations/scripts — ignore sẵn của repo) |
| `npx vitest run src/lib/units src/collections src/lib/rentals src/lib/projects src/components/rentals src/components/projects src/components/detail src/lib/admin src/app/(frontend)/[locale]/cho-thue` | 68 files / 731 tests PASS |
| DB dev (SELECT only) | `payload_migrations`: `20261023_030506_floor_distance_normalized` batch 43. `rentals`: cột cũ `floor` nguyên vẹn (Tầng cao 11, Tầng 2/3/4/7, Tầng thấp/trung, "3.4.5.6" 1, NULL 13); mới: high 11/low 1/mid 1, number 2/3×2/4/7; "3.4.5.6" → cả hai cột mới NULL (không đoán). `_rentals_v` tương tự (3.4.5.6 ×5 NULL). `projects_nearby_amenities` 8 giá trị × 61 đều chuyển đúng (1,2 km→1.2 km, 15 phút→15 min…), `distance` cũ nguyên. `_projects_v_version_nearby_amenities` 1672 dòng, 0 dòng có cũ mà thiếu mới. 4 enum mới tồn tại. |
| curl dev server `/en/projects/sample-da-nang-beachfront-villas` | 200; có "1.2 km", "15 min"; 0 "phút", 0 "Tầng" |

## STRICT focus — kết luận

1. **Migration additive?** Có. `up` = 4 `CREATE TYPE` + 8 `ADD COLUMN` nullable; backfill chỉ `UPDATE` cột mới, `WHERE` chọn dòng có cũ NOT NULL **và** cột mới đều NULL → idempotent, không đè giá trị admin nhập sau; cột cũ không bị UPDATE/DROP (DB xác nhận). `down` chỉ DROP 8 cột mới + 4 enum mới (thứ tự đúng: cột trước, type sau); hệ quả mất dữ liệu nhập mới sau migration đã ghi trong comment. Không có `IF EXISTS` ở `down` — chấp nhận được (cùng style generator).
   - Import parser từ `src/lib/units/legacy-parse.ts`: chạy được ở staging/prod vì `docker/Dockerfile:73-75` copy `src/` + `migrations/` và `migrate` nạp TS; parser không có import nào khác. Rủi ro: migration versioned không còn bất biến — đổi regex/chữ ký parser sau này sẽ đổi hành vi migration trên DB mới (CI G21 chạy toàn bộ migration trên DB trống). Mức **MINOR** (xem m1).
   - **HIGH_RISK_MIGRATION: CÓ, phải gắn.** `.context/project-config.md:68-71` và `AGENTS.md` § Non-negotiables liệt kê rõ "bulk transform/backfill" là điều kiện gắn `HIGH_RISK_MIGRATION`. Migration này có backfill dữ liệu trên 4 bảng (dev: 18 + 89 + 488 + 1672 dòng). Không phá huỷ (chỉ ghi cột mới), nhưng theo policy vẫn phải gắn nhãn + báo backfill/rollback/verify staging, không promote production trước khi verify staging. Builder ghi "không HIGH_RISK" trong `docs/ERD.md` → **MAJOR** (M1).
2. **Parser / hiển thị:** Parser chỉ nhận `^tầng\s+(cao|trung|thấp)$`, `^tầng\s+(\d+)$`, `^(\d+(?:[.,]\d+)?)\s*(km|m|phút)$` (flag `iu`), còn lại `unparsed` — không đoán ("3.4.5.6", "12" trần, "Tầng trệt" đều unparsed). View: số tầng ưu tiên hơn mức; fallback chuỗi cũ chỉ `vi` (`legacyText` kiểm `locale === "vi"`); khoảng cách thiếu số hoặc đơn vị → `null` (không chip). Nhãn từ i18n (`floorValue.*`, `distanceUnit.*`), số qua `Intl.NumberFormat(locale)`. Đúng 3 dòng BL-065 của `SPECIFICATIONS.md`.
3. **Admin: field cũ ẩn bởi `condition` có bị mất khi lưu không?** **Không mất.** Đã đọc Payload 3.91: `@payloadcms/ui/dist/forms/fieldSchemasToFormState/addFieldStatePromise.js:80-84` vẫn đặt `value`/`initialValue` cho field `passesCondition === false`; `forms/Form/index.js:154` chỉ bỏ **validate** field ẩn, không lọc khỏi data submit (`dist/utilities` không có lọc `passesCondition`); server `payload/dist/fields/hooks/beforeChange/promise.js:37-44` chỉ `skipValidation` khi condition false, không xoá giá trị. ⇒ giá trị `floor`/`distance` cũ được gửi lại nguyên vẹn khi admin lưu. Residual note của builder ("có thể khiến Payload bỏ giá trị cũ") là sai — cần sửa ghi chú (m2).
4. **Chỗ khác đọc `floor`/`distance`:** Grep `src/` (trừ test) + `scripts/`: chỉ còn `Rentals.ts`, `market-blocks.ts`, `floor-distance-view.ts`, `rental-view.ts`, `project-detail-view.ts`, `RentalDetail.tsx`, `ProjectLocation.tsx`, `DetailDistanceList.tsx` (nhận chuỗi đã format), seed + report script. Không có search text / JSON-LD / export / translation leaves dùng 2 trường này. `TRANSLATABLE_FIELDS` không đổi (test khẳng định trường mới không localized). REST/GraphQL: chỉ thêm trường (additive), trường cũ vẫn trả.

## Responsive Checklist Gate
Diff đụng component UI (`RentalDetail.tsx`, `ProjectLocation.tsx`) nhưng **chỉ đổi chuỗi giá trị** truyền vào item có sẵn (không đổi markup/class/CSS/layout).
- Layout (horizontal scroll, mobile-first, grid, container): **N/A** — không đổi CSS/markup; chip dùng class sẵn `shrink-0 … tabular-nums` (`DetailDistanceList.tsx:45`), độ dài chuỗi mới ≈ cũ ("15 min" ≤ "15 phút", "High floor" ≈ "Tầng cao").
- Typography/Spacing: **N/A** — không đổi.
- Media: **N/A**.
- Touch/Interaction: **N/A** — không thêm control.
- Viewport/A11y: **N/A** — không đổi.
- Kiểm chứng: curl HTML dev server (/en dự án) 200, nội dung đúng. Không có browser để đo 375/768/1280 → Residual risk (thấp, chỉ đổi text).

## Skill gates
- aislop: **skip, aislop not installed** (`command -v aislop` rỗng).
- oxlint (anti-slop): **skip, oxlint not configured** (không có `.oxlintrc.json`/`oxlint.json`); eslint 0 error.
- open-code-review (ocr): **skip, ocr not installed**.
- AI-readable: **OK** — tên rõ (`parseLegacyFloor`, `toFloorView`, `formatDistance`), hàm ngắn (<50 dòng), indirection ≤ 2, comment nêu WHY, `docs/ERD.md` cập nhật. 0–1 indicator (dòng dài trong migration SQL builder) < 3.
- ai-friendly-web: **N/A** — không đổi robots/sitemap/llms, chỉ nội dung trang.
- blitzstrike: **N/A** — không đụng auth/input công khai.

## Findings

### [MAJOR]
- **M1 — Migration có backfill nhưng không gắn `HIGH_RISK_MIGRATION`, doc còn ghi ngược lại.** `docs/ERD.md` (đoạn as-built BL-065, dòng ~250: "…không DROP/ALTER dữ liệu cũ; không HIGH_RISK") và Verification summary của task không gắn nhãn, trong khi `.context/project-config.md:68-71` + `AGENTS.md` § Non-negotiables quy định "bulk transform/backfill → gắn `HIGH_RISK_MIGRATION`, không promote production, báo … backfill, rollback, kết quả verify staging". Migration `migrations/20261023_030506_floor_distance_normalized.ts:76-79` backfill 4 bảng.
  - Fix: (a) sửa đoạn ERD thành "**HIGH_RISK_MIGRATION** (backfill non-destructive: chỉ ghi cột mới khi NULL; cột cũ nguyên)"; (b) thêm vào task file mục migration risk: bảng/cột bị backfill, idempotent, rollback = `down` (DROP cột/enum mới, cột cũ nguyên), yêu cầu chạy + verify trên staging (đếm cột mới vs cũ như query ở trên, chạy `pnpm report:legacy-units`) trước khi promote prod; (c) trailer commit ghi `HIGH_RISK_MIGRATION`. Không cần đổi code.

### [MINOR]
- **m1 — Migration versioned phụ thuộc code sống** `migrations/20261023_030506_floor_distance_normalized.ts:3` import `../src/lib/units/legacy-parse`. Đề xuất: chép 2 regex + map vào chính file migration (đóng băng), hoặc thêm comment ở đầu `src/lib/units/legacy-parse.ts` "được migration 20261023_030506 dùng — không đổi ngữ nghĩa/chữ ký; cần đổi thì tách bản mới". Chọn 1.
- **m2 — Residual note sai về Payload xoá giá trị field ẩn** (task file § Verification summary, dòng "Residual"). Payload 3.91 giữ giá trị (bằng chứng ở mục 3). Sửa ghi chú để không gây hiểu lầm cho người đọc sau.
- **m3 — Mô tả ô cũ hướng dẫn không làm được:** `src/collections/Rentals.ts:79` / `src/collections/projects/market-blocks.ts:107` "chọn Mức tầng / nhập Số tầng rồi xoá ô này" — ngay khi admin chọn mức/số, `condition` ẩn ô cũ nên không xoá được. Không mất dữ liệu (cũ chỉ là tham chiếu, view ưu tiên mới) nhưng chữ gây lúng túng. Đề xuất bỏ vế "rồi xoá ô này" (hoặc "ô này tự ẩn khi đã nhập").
- **m4 — Backfill từng dòng** (`…normalized.ts:22-35, 46-57`: 1 `UPDATE` / dòng). Dev ~2.3k round-trip, chấp nhận được; nếu prod nhiều version hơn nhiều bậc thì chậm. Không bắt buộc sửa; ghi vào residual khi verify staging (đo thời gian chạy).

## Residual risk
- Chưa chạy `migrate:down` (reviewer không được chạy migration); review `down` bằng đọc SQL.
- Không có browser để đo responsive 375/768/1280 (thay đổi chỉ là text).
- REST `/api/rentals` không truy vấn được ẩn danh nên chưa xem shape JSON trực tiếp; xác nhận qua `src/payload-types.ts` + typecheck.
- Không có integration test chạm DB cho migration (đã kiểm kết quả trên DB dev bằng SELECT).

## Verdict
**FAIL** — 1 MAJOR (M1: thiếu nhãn `HIGH_RISK_MIGRATION` cho migration có backfill, doc ghi "không HIGH_RISK"). Code, migration SQL, parser, view, admin, seed đều đúng hợp đồng; fix M1 chỉ là doc/task/commit trailer (không đổi code). Đề xuất xử lý luôn m1–m3 trong vòng 2.
