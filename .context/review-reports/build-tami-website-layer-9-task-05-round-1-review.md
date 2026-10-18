Agent: reviewer

# Review — build/tami-website · layer-9-task-05 · round 1

- Worktree: `D:\prj\bds-wt9-t05` (branch `wt/l9-t05`, base d6f08ab, chưa commit)
- Task: `tasks/tami-website/layer-9-task-05.md` — `GET /api/admin/leads/export` (xlsx stream) + audit `lead.export` + nút `LeadExportButton`

## Review level: STRICT

**Reason:** xuất PII khách hàng hàng loạt (export/report), RBAC chỉ admin, rate limit/Redis fail-closed, audit fail-closed, dependency mới (`fflate`), writer OOXML tự viết, component admin dùng chung list view của `leads`.

## Blast radius

- API mới `GET /api/admin/leads/export` (đăng ký trong `src/payload.config.ts` endpoints).
- `src/collections/Leads.ts`: export `SOURCE_LABELS`/`STATUS_LABELS` + `admin.components.beforeList` (ảnh hưởng trang danh sách lead cho mọi role; sale thấy `null`).
- `src/app/(payload)/admin/importMap.js` (+1 entry), `package.json`/`pnpm-lock.yaml` (+`fflate@0.8.3`).
- `audit_logs` (bản ghi `lead.export`), Redis key `admin-export-excel`.
- `docs/API_SPEC.md` §4 (as-built mới + 1 dòng L9-T03 chỉ đổi whitespace).

## Verify commands + result (chạy trong worktree)

| Lệnh | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile` | PASS (lockfile hợp lệ, `fflate@0.8.3` có integrity) |
| `pnpm lint` | PASS (0 lỗi) |
| `pnpm typecheck` | PASS |
| `pnpm test` | 2046/2046 test PASS; 1 file FAIL `src/lib/contrast.test.ts` (đọc `globals.css` CRLF — lỗi môi trường đã biết, ngoài scope, không liên quan diff) |
| `pnpm build` | Lần 1 FAIL `next/font/google` (Montserrat, cache `.next`); xoá `.next` rồi build lại → **PASS** (route table đầy đủ) |

## Responsive Checklist Gate (diff đụng UI admin: `LeadExportButton`)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Layout / no horizontal scroll | OK | container `display:flex; flex-wrap:wrap`, không width cố định (`LeadExportButton.tsx:63`) |
| Mobile-first / grid | N/A | không có grid/media query; nằm trong layout list của Payload |
| Typography rem / heading fluid | OK / N/A | không set font-size; dùng class Payload `btn`, `field-description` |
| Spacing | OK (ghi chú) | `gap:12`, `marginBottom:12` px inline — chấp nhận trong admin Payload, không ảnh hưởng tràn |
| Media | N/A | không có ảnh/video |
| Touch target ≥44px | OK | `minHeight: 44` (`:67`) |
| Nav mobile / table | N/A | không đụng nav/table |
| 100vh / reduced-motion / overflow hidden | N/A | không dùng |

Không có browser: xác minh bằng CSS; render thực ở 375/768/1280 chưa kiểm → Residual risk.

## Skill gates

- aislop: skip, `aislop` chưa cài.
- oxlint (anti-slop): skip, oxlint not configured (eslint PASS thay thế).
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — 2 indicator nhẹ (`handleLeadsExport` ~56 dòng `leads-export.ts:146-201` > 50; `createXlsxStream` 51 dòng) < ngưỡng 3. Tên rõ, comment giải thích WHY, API_SPEC cập nhật.
- ai-friendly-web: N/A (endpoint/admin nội bộ).
- blitzstrike: skip, không cài/không có môi trường được phép.

## Kiểm đặc biệt (theo yêu cầu)

- **RBAC/BOLA:** OK. `leads-export.ts:151-152` 401 (chưa login / `active !== true`) → 403 không phải admin, trước parse/rate-limit; mọi `find`/`count` dùng `user` + `overrideAccess:false`. Integration test khách 401 / sale 403 / admin bị khoá 401.
- **Rate limit trước mọi truy vấn lead:** OK (`:157-170` trước `count` `:173`); Redis lỗi → 503; 429 có `Retry-After` + `no-store`. Bộ đếm `rate-limit.ts:15` = 10/3600s. Lưu ý: 422 vẫn tiêu 1 lượt (chấp nhận).
- **Audit không PII:** OK — `meta {filters, rowCount}`; filters chỉ enum/UUID/ngày; fail-closed → 500 trước khi tạo stream (`:178-190`).
- **Formula injection:** OK theo AC cho `= + - @ \t \r \n`. Ô là `inlineStr` nên Excel không tính công thức khi mở; SĐT thô (`phone`, không phải `phoneNormalized`) dạng `+84…` sẽ hiện **dấu nháy thấy được** `'+84…` (xlsx không ẩn `'` như khi gõ tay) → xem MINOR-1.
- **XML escape / unicode:** `& < >` escape, ký tự điều khiển + U+FFFE/FFFF bị bỏ; UTF-8 qua `strToU8` (TextEncoder → lone surrogate thành U+FFFD, emoji/tiếng Việt hợp lệ). Test chỉ parse bằng regex, chưa có case emoji/surrogate và chưa mở bằng Excel/LibreOffice thật → Residual risk.
- **Stream thật:** OK — pull-based, mỗi `pull` đọc tới khi deflate nhả chunk (fflate gom ~64KB), DB đọc 500 dòng/trang, `cancel` → `zip.terminate()` + `iterator.return()`. Không gom toàn bộ buffer phía server. (Phía client, nút gom `blob()` toàn file — ≤20k dòng, chấp nhận.)
- **Lead đổi giữa count và đọc:** dừng đúng `total`; lead mới (createdAt mới) nằm cuối nên không lọt. Offset pagination có thể bỏ sót/nhân đôi 1 dòng nếu lead bị xoá mềm/đổi status giữa các trang → MINOR-3.
- **Content-Disposition:** tên file ASCII `tami-leads-YYYYMMDDHHmm.xlsx` qua `buildAttachmentDisposition` — an toàn.
- **fflate:** 0.8.3, MIT, 0 runtime dependency, tác giả 101arrowz (thư viện phổ biến); lockfile frozen OK.
- **importMap:** khớp path `/components/admin/LeadExportButton#LeadExportButton` trong `Leads.ts`.

## Findings

### [MAJOR-1] Nút "Xuất Excel" bỏ qua toàn bộ bộ lọc đặt từ giao diện Payload → xuất TẤT CẢ lead (vi phạm AC "xuất theo bộ lọc hiện tại", over-export PII)

- `src/lib/leads/export-filters.ts:86-93` `collectConditions` chỉ đi vào `and`, bỏ qua `or`.
- Payload WhereBuilder luôn ghi bộ lọc dạng `{ or: [ { and: [...] } ] }` (`node_modules/@payloadcms/ui/dist/elements/WhereBuilder/index.js:57-66, 99-101`: `conditions = where.or`, `handleWhereChange({ or: newConditions })`; `transformWhereQuery` chuẩn hoá mọi where về `or/and`). URL thật: `?where[or][0][and][0][status][equals]=new`.
- Hệ quả: admin lọc "trạng thái = Mới" trong danh sách rồi bấm Xuất → `leadExportQueryFromWhere` trả `""` → endpoint xuất toàn bộ lead (tới 20.000) không cảnh báo. Test `export-filters.test.ts:68` còn khẳng định `{or:[...]}` → `""`, và test dùng shape `{and:[...]}` mà UI Payload không bao giờ sinh → false-confidence.
- Cùng nhóm: điều kiện không chuyển được (ô tìm kiếm `query.search`, operator `in`/`not_equals`/`exists`, field khác như `assigneeInactive`, nhiều nhánh `or`) bị **bỏ lặng lẽ** → file chứa nhiều lead hơn danh sách đang thấy.
- **Fix đề xuất:** (1) hỗ trợ shape `or` có đúng 1 nhánh → duyệt `or[0].and`; (2) nếu `or` > 1 nhánh, có search, hoặc có điều kiện không map được → KHÔNG xuất lặng lẽ: hiện thông báo (vd "Bộ lọc hiện tại có điều kiện chưa hỗ trợ xuất…") và chặn hoặc bắt xác nhận; (3) test với where thật của Payload (`{or:[{and:[{status:{equals:"new"}}]}]}`) + case search/`in` → phải báo không chuyển được.

### [MINOR-1] Dấu nháy hiển thị trong ô SĐT/tên bắt đầu bằng `+`/`-`
`src/lib/export/xlsx-stream.ts:16-18,28`. Trong xlsx, `'` literal trong inline string hiển thị thật (`'+84901…`), làm bẩn dữ liệu SĐT (field `phone` thô, `Leads.ts:67`). Ô `inlineStr` vốn không bị tính công thức khi mở. Đề xuất: giữ chống injection nhưng dùng style `quotePrefix="1"` (thêm `xf` vào `styles.xml`) thay cho ký tự `'`, hoặc chấp nhận và ghi rõ trong API_SPEC. Không chặn PASS.

### [MINOR-2] Cắt 32.767 sau khi escape XML có thể cắt giữa entity
`xlsx-stream.ts:28`: `escapeXml(...).slice(0, MAX_CELL_CHARS)` → chuỗi dài chứa `&` gần mốc cắt sinh `&am` → XML hỏng; và giới hạn tính trên chuỗi đã escape. Hiện không chạm được (field lead max 2000 ký tự), nhưng là lib dùng chung. Đề xuất: cắt trước khi escape (`escapeXml(escapeSpreadsheetText(value).slice(0, MAX))`), tránh cắt giữa surrogate pair.

### [MINOR-3] Offset pagination không snapshot
`leads-export.ts:110-121`: lead bị xoá mềm/đổi status (ra khỏi filter) giữa các trang làm lệch offset → bỏ sót 1 dòng, số dòng thực < `rowCount` đã audit. Đề xuất: keyset pagination theo `(createdAt, id)` hoặc ghi chú residual. Ngoài ra mỗi trang `find` có `pagination` mặc định → thêm 1 `COUNT` mỗi trang (40 query thừa ở 20k dòng); có thể dùng keyset + `pagination:false`.

### [MINOR-4] `URL.revokeObjectURL` ngay sau `link.click()`
`LeadExportButton.tsx:49-54`: một số trình duyệt (Safari/Firefox cũ) có thể huỷ tải khi revoke đồng bộ; link không gắn vào DOM. Đề xuất `setTimeout(() => URL.revokeObjectURL(url), 0)` (hoặc vài giây).

### [MINOR-5] Hàm vượt 50 dòng
`handleLeadsExport` (`leads-export.ts:146-201`, ~56 dòng). Có thể tách bước rate-limit → helper `checkExportRateLimit` trả `Response | null`.

### [MINOR-6] Drive-by whitespace
`docs/API_SPEC.md`: dòng as-built L9-T03 bị xoá/ghi lại nguyên văn (`git diff -w` không đổi) — revert để diff surgical.

## Merge risk với staging (c0f20ce)

- `src/collections/Leads.ts`: staging thêm `remindedAt` (~dòng 157), T05 sửa dòng 16-17 và `admin.components` (~dòng 177) → khác hunk, auto-merge được. Sau merge chạy lại `pnpm payload generate:types`/`generate:importmap` để chắc chắn.
- `src/payload.config.ts`, `importMap.js`, `docs/API_SPEC.md`, `package.json`, `pnpm-lock.yaml`: staging không đổi so với base → không xung đột. Nếu L9-T06 (đang làm ở `D:\prj\bds`) cũng thêm dependency/endpoint/importMap → xung đột lockfile/endpoints array; resolve bằng `pnpm install` lại, không sửa tay lockfile.
- `src/payload-types.ts` chỉ khác line-ending (git diff trống) — không stage file này để tránh xung đột với `remindedAt` của staging.

## Residual risk

- Chưa mở file xlsx bằng Excel/LibreOffice/Google Sheets thật (test parse regex); không có case emoji/surrogate.
- Render nút ở 375/768/1280 chưa kiểm bằng browser.
- Postgres dev chung: integration test chạy PASS trong lượt này.

## Verdict: ❌ FAIL

1 MAJOR (MAJOR-1: bộ lọc UI không được chuyển → xuất toàn bộ lead). Backend endpoint (RBAC, rate limit, audit, stream, ẩn danh) đạt yêu cầu; sửa `leadExportQueryFromWhere` + nút để xử lý shape `or/and` của Payload và chặn/cảnh báo khi có điều kiện không chuyển được, kèm test với where thật. MINOR tuỳ builder.
