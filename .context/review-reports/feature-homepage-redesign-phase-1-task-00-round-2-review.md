# Agent: reviewer — feature-homepage-redesign · phase-1-task-00 · round-2

- Task: `tasks/feature-homepage-redesign/phase-1-task-00.md` (BL-044 T00 — `rentals.amenities` + bộ lọc Tiện ích + API + seed dev)
- Round 1: `.context/review-reports/feature-homepage-redesign-phase-1-task-00-round-1-review.md` — FAIL (M1 + m2–m5)
- Date: 2026-10-20
- **Review level: STRICT**
- **Reason:** giữ nguyên r1 — contract API công khai `GET /api/public/rentals` (r2 đổi cách đọc query string ở endpoint), shared filter UI, schema/migration, seed ghi DB.
- **Blast radius r2:** `src/endpoints/public/rentals.ts` (mọi client gọi API, count path Sheet); `src/components/rentals/ActiveFilters.tsx` (chip "Đang lọc" `/cho-thue` + `/en`); `src/shared/types/api.ts` (chỉ chữ ký kiểu, không đổi runtime); `scripts/seed-rental-amenities.ts` (DB dev); `docs/API_SPEC.md` §3.3; `.context/decisions.md` Decision 10.

## Verify commands + result (lệnh từ `.context/project-config.md`)

| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run src/lib/search src/lib/rentals src/components/rentals src/shared src/endpoints/public/rentals.test.ts tests/integration/rental-search.test.ts` | 16 files / 233 tests PASS (integration chạy thật trên DB dev) |
| `pnpm typecheck` | PASS |
| `pnpm lint` | 0 error, 2 warning cũ `tools/task-dashboard/server.mjs:64,490` (ngoài scope, có từ trước) |
| `pnpm test` (toàn bộ, gate close-out) | **301 files / 3166 tests PASS**, 140s (< 5 phút) |
| curl `:3000/api/public/rentals?amenities=pool&amenities=gym` | 200, `total: 5` |
| curl `?amenities=pool,gym` | 200, `total: 5` → **bằng khoá lặp** (r1 là 10 ≠ 5) |
| curl `?amenities=pool` | 200, `total: 10` |
| curl `?amenities=pool&amenities=pool&amenities=xx` | 200, `total: 10` (trùng bỏ, lạ bỏ, = `pool`) |

Không chạy `pnpm dev` (server :3000 của session khác đang chạy sẵn, chỉ curl).

## Đóng finding round 1

| # | r1 | Trạng thái r2 | Bằng chứng |
|---|---|---|---|
| M1 | Endpoint HTTP không gộp khoá lặp `amenities` nhưng API_SPEC hứa có | **Đóng** | `src/endpoints/public/rentals.ts:19-22`: `raw: Record<string, string \| string[]>`, sau vòng lặp "lấy giá trị đầu" ghi đè `raw.amenities = searchParams.getAll("amenities")` **chỉ khi khoá có mặt** → khoá khác giữ luật cũ. Unit `rentals.test.ts:82-87` (`gym&pool&gym&khong-co` ≡ `pool,gym`, đúng thứ tự `RENTAL_AMENITIES`); integration `rental-search.test.ts:501-506` (GET khoá lặp `total` == dạng phẩy == 1); curl dev 5 = 5. `docs/API_SPEC.md:113` ghi đúng luật (gộp riêng `amenities`, khoá khác lấy giá trị đầu); `.context/decisions.md` Decision 10 Consequences ghi nhất quán API / parser trang / count path. JSDoc endpoint cập nhật. Task file mục (5) "Lựa chọn thiết kế" tự ghi chú đã lỗi thời — chấp nhận. |
| m2 | Drive-by whitespace `API_SPEC.md:199,207` | **Đóng** | `git diff --stat -- docs/API_SPEC.md` = `1 insertion(+)`, `--ignore-all-space` cũng 1 dòng → chỉ còn dòng `amenities`. |
| m3 | `default: return ""` không thể tới | **Đóng** | `ActiveFilters.tsx:28-53`: `groupName(kind: Exclude<ActiveFilterKind, AmenityFilterKind>)` switch kín (không `default`, typecheck PASS → exhaustive); `nameOf` guard `amenityOfKind(kind) !== null` rồi `groupName(kind as Exclude<…>)`. Cast **chấp nhận được**: `amenityOfKind` (`active-filters.ts:18-20`) trả `null` đúng khi và chỉ khi `!isAmenityKind(kind)` (type predicate `startsWith("amenity:")`), nên sau guard giá trị runtime chắc chắn thuộc tập `Exclude`; cast chỉ bù việc TS không narrow qua hàm trả giá trị. Có cách gọn hơn không cần cast — ghi m6 (tuỳ chọn). |
| m4 | Chú thích kiểu `parseAmenityList` gây hiểu nhầm | **Đóng** | `api.ts:129` `function parseAmenityList(value: unknown): unknown`. |
| m5 | Seed update cả tin xoá mềm | **Đóng** | `scripts/seed-rental-amenities.ts:16-24`: `where: { deletedAt: { exists: false } }`; comment ghi "rentals không bật draft". Kiểm: `payload-types.ts:363` `Rental.deletedAt` tồn tại (soft delete qua `withContentDefaults`), không có `_status` ở bất kỳ interface nào → drafts tắt, comment đúng; `where` hợp lệ. |

**Không hồi quy:** toàn bộ 3166 test PASS; luật "khoá lặp lấy giá trị đầu" cho khoá khác vẫn được test cũ `rentals.test.ts` (case `?q=a&q=b`) bảo vệ; `amenities` vắng → `raw` không có khoá → SQL không đụng `rentals_amenities` (test r1 giữ nguyên PASS).

## Phạm vi diff r2 (yêu cầu 2)

Diff các file builder nêu khớp mô tả, không có thay đổi ngoài finding. Lưu ý working tree còn `scripts/sync-claude.mjs` + 9 file `.claude/agents/*.md` dirty (thêm alias model `fable`, key `spec-init`/`spec-publisher`) — **không thuộc T00**, đã dirty từ trước r1, không phải hồi quy r2; nhắc primary tách khỏi commit T00 (m7).

## Responsive Checklist Gate

Diff r2 đụng UI chỉ ở `ActiveFilters.tsx` (logic đặt tên chip, không đổi markup/class). Kết quả r1 giữ nguyên:
Layout OK · Typography OK · Media N/A · Touch OK (`Chip` `min-h-11 min-w-11`) · Viewport/A11y OK. Không có mục FAIL.

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip — `aislop` không cài (r1); soát tay diff r2: không dead code (đã bỏ `default`), comment giải thích WHY, không `as any` |
| oxlint (anti-slop) | skip, oxlint not configured; `pnpm lint` 0 error |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK — `groupName`/`nameOf` tên rõ, hàm < 50 dòng, doc as-built (API_SPEC, Decision 10) cập nhật theo luồng mới; 0/6 indicator |
| ai-friendly-web | N/A (không đổi llms/robots/sitemap) |
| blitzstrike | skip — không cài; `getAll` vẫn đi qua `z.enum` whitelist + `sql` tagged; số phần tử khoá lặp không giới hạn nhưng `parseAmenityList` dedupe về tối đa 10 EXISTS → không DoS qua query |

## Findings

### [CRITICAL]
Không.

### [MAJOR]
Không.

### [MINOR] (không chặn)
- **m6 — Bỏ hẳn cast** `src/components/rentals/ActiveFilters.tsx:52`: export `isAmenityKind` từ `active-filters.ts:15` và viết `if (isAmenityKind(kind)) return t(...amenityOfKind...); return groupName(kind);` → TS tự narrow, không cần `as Exclude<…>`. Tuỳ chọn, có thể làm ở T01–T03 khi chạm file.
- **m7 — File dirty ngoài scope** `scripts/sync-claude.mjs`, `.claude/agents/*.md` (alias `fable`): không thuộc T00; primary tách khỏi commit T00 (commit riêng/chore hoặc để lại).

## Residual risk
- Chưa chụp màn 375/768/1280 bằng browser (không môi trường); r2 không đổi markup/CSS.
- Không chạy lại `pnpm seed:rental-amenities` sau m5 (reviewer không chạy script ghi DB); `where` đã kiểm đúng kiểu/field, và idempotent nên DB dev hiện tại không đổi.

## Verdict: ✅ PASS
