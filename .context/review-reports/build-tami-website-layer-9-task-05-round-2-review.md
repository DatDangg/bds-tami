Agent: reviewer

# Review — build/tami-website · layer-9-task-05 · round 2

- Worktree: `D:\prj\bds-wt9-t05` (branch `wt/l9-t05`, base d6f08ab, chưa commit)
- Task: `tasks/tami-website/layer-9-task-05.md` — `GET /api/admin/leads/export` + nút `LeadExportButton`; AC: "Admin xuất `.xlsx` theo bộ lọc hiện tại" (dòng 26), "Lọc theo trạng thái, nguồn, sale, khoảng ngày" (dòng 37).
- Round 1: FAIL (MAJOR-1 + MINOR 1–6).

## Review level: STRICT

**Reason:** xuất PII khách hàng hàng loạt (export/report), RBAC admin, rate limit/audit fail-closed, writer OOXML tự viết, component dùng chung list view `leads`, đổi phân trang DB (keyset).

## Blast radius

- API `GET /api/admin/leads/export` (`src/endpoints/admin/leads-export.ts`, đăng ký ở `src/payload.config.ts`).
- `src/lib/leads/export-filters.ts` (where -> query), `src/lib/export/xlsx-stream.ts` (styles.xml + quotePrefix).
- `src/components/admin/LeadExportButton.tsx` (beforeList của `leads`: list view, trash view, list drawer), `importMap.js`.
- `audit_logs` (`lead.export`), Redis `admin-export-excel`, `docs/API_SPEC.md` §4.

## Verify commands + result (cwd `D:\prj\bds-wt9-t05`)

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | Lượt cuối: 2061/2061 test PASS; 1 file FAIL `src/lib/contrast.test.ts` (CRLF `globals.css`, lỗi môi trường đã biết, ngoài scope). Lượt chạy trước đó có 3 file FAIL + 43 skipped (integration, DB dev dùng chung, chạy song song với `D:\prj\bds`) — chạy lại thì sạch → ghi Residual risk flaky. |
| `pnpm build` | PASS (exit 0, không cần xoá `.next` lượt này) |
| Mở xlsx bằng thư viện đọc có sẵn | skip: `node_modules` không có `xlsx`/`exceljs`/`read-excel-file`/`node-xlsx`; không cài mới. |

## Đối chiếu round 1

| Mục round 1 | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-1 shape `{or:[{and}]}` bị bỏ | **Đóng phần lớn** (status/source/assignedTo/search/nhiều nhánh/toán tử lạ). **Còn hở ở khoảng ngày** → MAJOR-1 mới bên dưới | `export-filters.ts:99-154`, `LeadExportButton.tsx:40,72,78-82` |
| MINOR-1 dấu nháy | Đóng | `xlsx-stream.ts:39,55` style xf 2 `quotePrefix="1"` |
| MINOR-2 cắt sau escape | Đóng | `xlsx-stream.ts:22-27,42` cắt trước escape, lùi 1 khi high surrogate |
| MINOR-3 offset | Đóng | keyset `leads-export.ts:107-146`, `pagination:false` |
| MINOR-4 revoke | Đóng | `LeadExportButton.tsx:58` setTimeout 10s |
| MINOR-5 hàm > 50 dòng | Đóng | `checkExportRateLimit` `:156-170`; `handleLeadsExport` ~45 dòng |
| MINOR-6 drive-by API_SPEC | Đóng | `git diff docs/API_SPEC.md` chỉ +2 dòng (as-built T05) |

### Kiểm nút có nhận where hiện tại của list không

- `@payloadcms/next/dist/views/List/index.js:310-` render `ListQueryProvider` bọc `DefaultListView`; `@payloadcms/ui/dist/views/List/index.js:152` render `BeforeList` bên trong → `useListQuery()` lấy được context.
- `ListQueryProvider` (`ui/dist/providers/ListQuery/index.js:46-55,103-107`): `query` = `sanitizeQuery(parseSearchParams(URL))`, cập nhật qua `handleWhereChange({where})` / `handleSearchChange({search})`; preset where được đồng bộ qua `syncPropsToURL`. → `query.where` / `query.search` đúng là bộ lọc đang áp. Test mock `useListQuery: () => ({ query: { where, search } })` khớp shape thật.
- `sanitizeQuery` không biến đổi `where` (chỉ xoá object rỗng). qs-esm parse `or[0]` thành mảng (≤ 20 phần tử; quá thì thành object → `collectConditions` trả false → chặn, an toàn).
- Leads không có `baseListFilter`/query presets → không có điều kiện ẩn ngoài URL.

### Keyset

- Sort `["createdAt","id"]` tăng dần; cursor `createdAt > x OR (createdAt = x AND id > y)` (`leads-export.ts:107-111`) đúng thứ tự từ điển → không bỏ/trùng dòng khi `createdAt` trùng.
- `created_at timestamp(3) with time zone` (`migrations/20261018_094454_leads.ts:46`) → giá trị ISO ms Payload trả về so `equals` chính xác; `id uuid` so sánh `>` và `ORDER BY` cùng thứ tự uuid. Operator `greater_than` hợp lệ toàn cục (`payload/dist/types/constants.js`).
- Dừng đúng `total`, trang ngắn thì dừng. Unit test (`leads-export.test.ts:65-87`) kiểm where trang 2 bằng `find` giả; **chưa có integration test nhiều trang trên Postgres thật** (integration không truyền `pageSize`, < 500 dòng) → MINOR-2.

### OOXML styles.xml

- `cellXfs count="3"` = 3 `<xf>`; `quotePrefix="1"` là thuộc tính hợp lệ của `CT_Xf`; fonts 2/fills 2/borders 1/cellStyleXfs 1 đếm đúng; `[Content_Types]` + `workbook.xml.rels` có styles. Header dùng xf 1, ô công thức dùng xf 2. Hợp lệ theo schema; chưa mở bằng Excel/LibreOffice/thư viện → Residual risk.

## Responsive Checklist Gate (diff đụng UI admin `LeadExportButton`)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Layout / no horizontal scroll | OK | flex + `flexWrap: "wrap"`, không width cố định (`LeadExportButton.tsx:67`); thông báo `<p>` xuống dòng tự nhiên |
| Mobile-first / grid | N/A | không grid/media query |
| Typography rem / heading fluid | OK / N/A | không set font-size; class Payload `btn`, `field-description` |
| Spacing | OK (ghi chú) | `gap:12`, `marginBottom:12` px inline trong admin Payload |
| Media | N/A | không ảnh/video |
| Touch target ≥44px | OK | `minHeight: 44` (`:71`) |
| Nav mobile / table | N/A | không đụng |
| 100vh / reduced-motion / overflow hidden | N/A | không dùng |

Không có browser: xác minh bằng CSS; render thật ở 375/768/1280 chưa kiểm → Residual risk.

## Skill gates

- aislop: skip, `aislop` chưa cài.
- oxlint (anti-slop): skip, oxlint not configured (eslint PASS).
- ocr: skip, ocr not installed.
- AI-readable: OK — 1 indicator (comment lỗi thời `xlsx-stream.ts:64`), < 3.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: skip, không cài/không có môi trường được phép.

## Findings

### [MAJOR-1] Bộ lọc "Ngày tạo" trong list không ánh xạ 1-1: file xuất chứa nhiều lead hơn danh sách đang thấy (AC "theo bộ lọc hiện tại"); test dùng giá trị UI không bao giờ sinh

- `src/lib/leads/export-filters.ts:80-84,132-134`: `vietnamDateOf` cắt ISO về ngày `YYYY-MM-DD`, rồi server mở rộng thành `00:00:00.000+07:00` .. `23:59:59.999+07:00` (`:75-76`).
- `createdAt` (timestamp mặc định, `payload/dist/collections/config/sanitize.js:133-141`) không đặt `pickerAppearance` → `default`. `ui/dist/elements/DatePicker/DatePicker.js:63-71`: chọn ngày → `setHours(12 - tzOffset, 0)` + `setMilliseconds(0)` → where luôn là `YYYY-MM-DDT12:00:00.000Z` (= 19:00 giờ VN).
- Hệ quả: list lọc `Ngày tạo ≥ 01/10` và `≤ 05/10` hiện lead từ 01/10 19:00 tới 05/10 19:00 (giờ VN); file xuất gồm 01/10 00:00 → 05/10 23:59:59 — dư tới ~24 giờ dữ liệu khách, lặng lẽ, `rowCount` audit lệch số dòng admin thấy. Đây đúng loại lỗi MAJOR-1 round 1 đã nêu ("file chứa nhiều lead hơn danh sách đang thấy"), trong khi doc/API_SPEC khẳng định ánh xạ "1-1".
- False-confidence: `export-filters.test.ts:62-63` dùng `2026-01-01T00:00:00.000+07:00` / `2026-01-31T16:59:59.999Z` (mốc đầu/cuối ngày VN) — DatePicker của Payload không bao giờ sinh giá trị này.
- **Fix đề xuất (chọn 1):**
  1. (khuyến nghị) Chuyển nguyên mốc thời gian: endpoint nhận thêm/đổi sang tham số ISO datetime (vd `createdAtGte`/`createdAtLte`, validate `Date.parse` + giới hạn độ dài) và dùng đúng `greater_than_equal`/`less_than_equal` như list → file = danh sách.
  2. Chỉ chấp nhận giá trị đúng mốc biên ngày VN (`T17:00:00.000Z` cho `>=`, `T16:59:59.999Z` cho `<=`), khác → `ok:false` (chặn kèm thông báo). Đúng nhưng khiến lọc ngày từ UI luôn bị chặn.
  3. Nếu product chọn ngữ nghĩa "cả ngày theo giờ VN": phải ghi rõ trong task/API_SPEC và hiển thị chú thích cạnh nút (vd "Khoảng ngày được xuất theo trọn ngày giờ Việt Nam") — cần user duyệt, không tự quyết.
  - Kèm test dùng giá trị thật `2026-10-01T12:00:00.000Z` (và một giá trị có giờ khác 12:00 nếu admin đổi `pickerAppearance`).

### [MINOR-1] Nút cũng hiện ở trash view nhưng xuất lead đang hoạt động

`Leads.ts:178,181` (`beforeList` + `trash: true`): trang thùng rác dùng cùng list view, điều kiện `deletedAt exists` do server thêm (`next/dist/views/List/index.js:127-128`), không có trong `query.where` → bấm "Xuất Excel" ở thùng rác ra file lead **chưa** xoá. Không vượt quyền admin nhưng sai "danh sách đang thấy". Đề xuất: ẩn/khoá nút khi đang ở trash view (vd kiểm `usePathname()` kết thúc `/trash` hoặc prop `viewType` nếu Payload truyền), kèm test.

### [MINOR-2] Keyset chưa được kiểm trên DB thật

`tests/integration/leads-export.test.ts` không truyền `pageSize` → chỉ 1 trang; `id greater_than` uuid + `sort` mảng + `{and:[{}, cursor]}` qua drizzle chưa chạy thật. Đề xuất 1 integration case `pageSize=2`, ≥ 5 lead có `createdAt` trùng nhau, khẳng định đủ dòng, không trùng, đúng thứ tự.

### [MINOR-3] Comment lỗi thời

`src/lib/export/xlsx-stream.ts:64`: "văn bản đi qua `escapeSpreadsheetText`" — hàm không còn (đã thay bằng `needsQuotePrefix` + style). Sửa comment.

## Residual risk

- Chưa mở file bằng Excel/LibreOffice/Sheets hay thư viện đọc xlsx (không có sẵn trong `node_modules`).
- Render nút ở 375/768/1280 chưa kiểm bằng browser.
- Integration test flaky trên DB dev dùng chung (1 lượt 3 file FAIL/43 skipped, lượt sau sạch).

## Verdict: ❌ FAIL

1 MAJOR (MAJOR-1: lọc khoảng ngày từ list không khớp 1-1 → xuất dư lead, test dùng giá trị giả). Các mục round 1 còn lại đã đóng; keyset logic và OOXML styles đúng. Sửa MAJOR-1 (khuyến nghị phương án 1) + test giá trị DatePicker thật; MINOR 1–3 nên làm cùng.
