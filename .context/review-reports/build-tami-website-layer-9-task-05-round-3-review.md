Agent: reviewer

# Review — build/tami-website · layer-9-task-05 · round 3

- Worktree: `D:\prj\bds-wt9-t05` (chưa commit). Task: `tasks/tami-website/layer-9-task-05.md` — `GET /api/admin/leads/export` + nút `LeadExportButton`.
- Round 2: FAIL (MAJOR-1 khoảng ngày bị nới cả ngày VN; MINOR 1–3). Builder attempt 3.

## Review level: STRICT

**Reason:** xuất PII khách hàng hàng loạt (export/report), RBAC admin, rate limit + audit fail-closed, writer OOXML tự viết, component dùng chung list view `leads`, phân trang keyset trên DB.

## Blast radius

- API `GET /api/admin/leads/export` (`src/endpoints/admin/leads-export.ts`, đăng ký `src/payload.config.ts`) — contract query đổi `from`/`to` → `createdFrom`/`createdTo` (chưa release, client duy nhất là nút admin).
- `src/lib/leads/export-filters.ts` (parse/where/where→query), `src/lib/export/xlsx-stream.ts`.
- `src/components/admin/LeadExportButton.tsx` (beforeList của `leads`: list view, trash view, list drawer), `importMap.js`, `src/collections/Leads.ts` (export label + beforeList).
- `audit_logs` (`lead.export`), Redis `admin-export-excel`, `docs/API_SPEC.md` §4. `package.json` + lock (`fflate`).

## Verify commands + result (cwd `D:\prj\bds-wt9-t05`)

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | 2070/2070 test PASS; 190/191 file PASS, 1 file FAIL `src/lib/contrast.test.ts` (CRLF `globals.css`, lỗi môi trường đã biết, ngoài scope) |
| `pnpm build` | PASS (exit 0, "Compiled successfully", không cần xoá `.next`) |

## Đối chiếu round 2

| Mục | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-1 khoảng ngày | **Đóng** | `export-filters.ts:65-71` nhận `createdFrom`/`createdTo` ISO có múi giờ (regex `:25` bắt buộc `Z`/`±hh:mm`, `≤40` ký tự, `Date.parse` + `isRealCalendarDay`), chuẩn hoá `toISOString` (cùng thời điểm); `buildLeadExportWhere:83-84` dùng đúng `greater_than_equal`/`less_than_equal`; `applyCondition:134-136` truyền nguyên giá trị where list (không cắt về ngày). Integration `leads-export.test.ts:256-262` so tập mã lead xuất với `payload.find` cùng where, giá trị picker thật `T12:00:00.000Z`, có lead biên 10:00/13:00 nằm ngoài; `:264-267` mốc `+07:00` ≡ UTC. |
| MINOR-1 trash | Đóng | `LeadExportButton.tsx:12,43` + test `LeadExportButton.test.tsx:53-54` |
| MINOR-2 keyset DB thật | Đóng | `leads-export.test.ts:269-280` `pageSize=2`, 5 lead cùng `createdAt`, đủ 5, không trùng, đúng tập |
| MINOR-3 comment | Đóng | `xlsx-stream.ts:64` đã nhắc `needsQuotePrefix`, không còn `escapeSpreadsheetText` |
| Round 1 MAJOR/MINOR 1–6 | Vẫn đóng | quotePrefix xf 2, cắt trước escape, keyset `pagination:false`, revoke 10s, hàm ≤50 dòng, API_SPEC chỉ thêm as-built T05 |

### Toán tử date mà UI cho phép

`@payloadcms/ui/dist/elements/WhereBuilder/field-types.js:21-34,68-70`: field `date` = `equals`, `not_equals`, `in`, `not_in`, `exists`, `greater_than`, `less_than`, `greater_than_equal`, `less_than_equal`, `exists`.
- `greater_than_equal` / `less_than_equal` → ánh xạ 1-1 sang `createdFrom`/`createdTo`.
- Mọi toán tử khác (gồm `greater_than`, `less_than`, `equals`, `exists` giá trị boolean) → `applyCondition` trả `false` → `ok:false`, nút khoá kèm thông báo (fail-closed, không over-export). Có test cho `greater_than` (`export-filters.test.ts:98`). Hai điều kiện cùng phía (vd hai `>=`) → `params.has` → chặn. Không còn đường nào xuất nhiều hơn danh sách qua lọc ngày.

### Dò trash bằng pathname

- `@payloadcms/next/dist/views/Root/getRouteData.js:224-251`: trash view = segment `collections/:slug/trash` (không có id); segment `collections` cố định, chỉ prefix admin đổi được qua `routes.admin`.
- Regex `/\/collections\/leads\/trash\/?$/` không neo đầu → đúng với `routes.admin` tuỳ biến; `usePathname()` của Next không gồm `basePath`; i18n prefix (`/en`) không áp cho admin; trang doc trong trash (`/trash/:id`) không render list nên không liên quan. → Đủ chắc cho cấu hình hiện tại.
- Cách bền hơn (tuỳ chọn, không chặn): `beforeList` là server slot nhận `serverProps.params` (`next/dist/views/List/index.js:274-301`) → bọc bằng server component kiểm `params.segments[2] === "trash"` rồi mới render nút client; không phụ thuộc chuỗi URL client. Lưu ý `viewType` **không** được truyền vào slot `beforeList` (chỉ truyền cho DefaultListView `:335`), đúng như comment của builder.

## Responsive Checklist Gate (diff đụng UI admin `LeadExportButton`; markup không đổi so với round 2 ngoài nhánh `return null`)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Layout / no horizontal scroll | OK | flex + `flexWrap: "wrap"`, không width cố định (`LeadExportButton.tsx:71`) |
| Mobile-first / grid auto-fit | N/A | không grid/media query |
| Typography rem / heading fluid | OK / N/A | không set font-size; class Payload `btn`, `field-description` |
| Spacing | OK (ghi chú) | `gap:12`, `marginBottom:12` inline trong admin Payload |
| Media | N/A | không ảnh/video |
| Touch target ≥44px | OK | `minHeight: 44` (`:75`) |
| Nav mobile / table | N/A | không đụng |
| 100vh / reduced-motion / overflow hidden | N/A | không dùng |

Không có browser: xác minh bằng CSS; render thật 375/768/1280 chưa kiểm → Residual risk.

## Skill gates

- aislop: skip, `aislop` chưa cài.
- oxlint (anti-slop): skip, oxlint not configured (eslint PASS).
- ocr: skip, ocr not installed.
- AI-readable: OK — 0 indicator mới (hàm ngắn, hằng có tên `MAX_TIMESTAMP_LENGTH`/`TRASH_VIEW_PATH`/`REVOKE_DELAY_MS`, comment nêu WHY, API_SPEC cập nhật).
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: skip, không cài/không có môi trường được phép. Rà tay: tham số validate theo whitelist/regex, không ghép chuỗi vào truy vấn, RBAC 401→403 trước validate, rate limit trước truy vấn lead, audit fail-closed — không thấy lỗ.

## Findings

Không có CRITICAL / MAJOR.

### [MINOR-1] Thông báo khoá nút dễ hiểu sai với "lớn hơn"/"nhỏ hơn" ngày tạo

`export-filters.ts:94-95`: `UNSUPPORTED_FILTER_MESSAGE` nói chặn "toán tử khác "bằng"/khoảng ngày", nhưng với admin `greater_than`/`less_than` trên Ngày tạo cũng là "khoảng ngày" → bị khoá mà không rõ lý do. An toàn (fail-closed), chỉ UX. Đề xuất: ghi rõ "ngày tạo chỉ hỗ trợ 'lớn hơn hoặc bằng' / 'nhỏ hơn hoặc bằng'", hoặc hỗ trợ thêm 2 tham số loại trừ đầu mút.

### [MINOR-2] (nit) So sánh chuỗi `createdFrom > createdTo` sai khi chuẩn hoá vượt năm 9999

`export-filters.ts:72`: `9999-12-31T23:00-05:00` → `toISOString()` = `+010000-…`, so chuỗi với mốc 4 chữ số bị đảo. Hệ quả chỉ là không trả 400 cho khoảng ngược (kết quả rỗng), không rò dữ liệu. Có thể so `Date.parse` thay vì chuỗi nếu muốn chặt.

## Residual risk

- Chưa mở file bằng Excel/LibreOffice/thư viện đọc xlsx (không có sẵn trong `node_modules`) — kế thừa round 2.
- Render nút ở 375/768/1280 chưa kiểm bằng browser.
- Trong list drawer (quan hệ tới `leads` từ collection khác) nút vẫn hiện; `filterOptions` của drawer (nếu sau này cấu hình) không nằm trong `query.where` → có thể xuất rộng hơn drawer. Hiện không có field quan hệ tới leads có `filterOptions` được rà trong diff; đề xuất ẩn nút khi trong drawer nếu bổ sung sau.
- Integration `payload.find` overrideAccess trong khoảng 2025-10 trên DB dev dùng chung — có thể flaky nếu worktree khác tạo lead cùng khoảng (khó xảy ra).
- `src/payload-types.ts` chỉ khác EOL — primary không stage.

## Verdict: ✅ PASS

MAJOR-1 round 2 đóng thật (ánh xạ 1-1 toán tử `>=`/`<=` với giá trị nguyên của DatePicker, mọi toán tử date khác bị chặn fail-closed, integration so với `payload.find` cùng where). MINOR round 1/2 vẫn đóng; lint/typecheck/build PASS, test 2070/2070 (chỉ `contrast.test.ts` CRLF đã biết). 2 MINOR mới không chặn.
