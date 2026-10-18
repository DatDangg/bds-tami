Agent: reviewer

# Review — feature-layer9-minor-export-reminder · phase-1-task-01 · round 1

- Task: `tasks/feature-layer9-minor-export-reminder/phase-1-task-01.md`
- Branch: `staging` (chưa commit)
- Review level: **STRICT**
- Reason: luồng xuất PII (fail-closed), component admin dùng chung list/trash/drawer của `leads`, đổi slot `beforeList` + importMap admin (shared navigation/admin UI). Thuộc nhóm risk đỏ "export/report" + "shared component".
- Blast radius: `src/lib/leads/export-filters.ts` (dùng bởi endpoint `GET /api/admin/leads/export` + nút client), `src/components/admin/LeadExportButton.tsx`, mới `src/components/admin/LeadExportSlot.tsx`, `src/collections/Leads.ts` (`admin.components.beforeList`), `src/app/(payload)/admin/importMap.js`, `docs/API_SPEC.md` §4. Không đổi contract API, schema, access control.

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | 2529 passed / 1 failed (241 files) — fail duy nhất `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn … -> 400" (fail sẵn, ngoài scope, không tính) |
| `pnpm vitest run --project integration tests/integration/leads-export.test.ts` | 12/12 PASS |
| `pnpm build` | PASS (exit 0) |

## Kiểm theo trọng tâm

1. **Nhãn toán tử vi** — OK. `@payloadcms/translations` 3.91 `vi.js:458,462,465`: `equals: 'bằng'`, `isGreaterThanOrEqualTo: 'lớn hơn hoặc bằng'`, `isLessThanOrEqualTo: 'nhỏ hơn hoặc bằng'` khớp đúng chuỗi trong `UNSUPPORTED_FILTER_MESSAGE` (`export-filters.ts:96-98`). Test assert từng nhãn (`export-filters.test.ts` + `LeadExportButton.test.tsx:102`). Lưu ý tên field xem MINOR-1.
2. **`Date.parse` ca biên** — OK. So sánh chạy trên giá trị đã chuẩn hoá `toISOString()` (đã qua validate nên không thể là NaN); JS parse được năm mở rộng `+010000-…`. Test: cùng thời điểm khác múi giờ → OK, `+07:00` vs `Z` chuỗi lớn hơn nhưng thời điểm nhỏ hơn → OK, ngược → 400 path `createdFrom`, năm 9999 `-05:00` cuộn sang `+010000` → 400. Giới hạn 40 ký tự vẫn đủ cho dạng mở rộng.
3. **Trash phía server qua `params.segments`** — OK, đã đối chiếu Payload 3.91:
   - `views/Root/index.js:40-48` await `params`, `segments` tương đối với admin route (không chứa `routes.admin`) → `routes.admin` tuỳ biến không làm lệch index; `:295` truyền `params` xuống view.
   - `getRouteData.js:244-251` `/collections/:slug/trash` → `TrashView`; `views/CollectionTrash/index.js` gọi `renderListView({...args, trash: true})` giữ nguyên `params`.
   - `views/List/index.js:274-301` `serverProps` có `params`; `renderListViewSlots.js:39-44` render `beforeList` qua `RenderServerComponent` với `serverProps` → slot (RSC, không `"use client"`) nhận `params`.
   - Payload tự dùng đúng mẫu `segments[2] === 'trash'` (`views/Versions/index.js:42`).
   - `/collections/leads/trash/:id` là Document view, không render `beforeList` → không lọt.
   - Drawer: `views/List/handleServerFunction.js:115-116` truyền `segments: ['collections', collectionSlug]` → slot render, client ẩn.
   - Slot chỉ render `<LeadExportButton />` không truyền prop → không serialize `payload`/`user`/`i18n` sang client.
4. **Drawer** — OK. `ListDrawer/Provider.js:3` `createContext({})`; `useListDrawerContext` chỉ throw khi context falsy → ngoài drawer trả `{}`, `isInDrawer` undefined. Provider đặt `isInDrawer: Boolean(drawerSlug)`. Hook gọi trước return sớm (`LeadExportButton.tsx:35-42`), đúng rules-of-hooks. Export có trong `@payloadcms/ui` client index (`index.d.ts:252`).
5. **Fail-closed / RBAC** — OK. `leadExportQueryFromWhere` không đổi logic (chỉ đổi message); test "-> chặn, không bỏ lặng lẽ" vẫn PASS; ô tìm kiếm vẫn khoá. Client vẫn `user?.role !== "admin"` → null; endpoint `leads-export.ts` không đổi (401/403 integration PASS). Không bỏ check nào.
6. **importMap** — OK: chỉ 2 dòng thật (import + key `LeadExportButton` → `LeadExportSlot`); `LeadExportButton` không còn được tham chiếu bằng path nên bỏ khỏi map là đúng. **Doc as-built** — nội dung đúng code (slot server `segments[2]`, drawer `isInDrawer`, nhãn vi, `Date.parse`). Xem MINOR-2 về whitespace.

## Responsive Checklist Gate

Diff chỉ thêm/bỏ điều kiện render nút có sẵn (không đổi markup/CSS/layout); trang là admin Payload.
- Layout: N/A (không đổi CSS/grid/container)
- Typography/Spacing: N/A
- Media: N/A
- Touch/Interaction: N/A (nút giữ nguyên markup cũ)
- Viewport/A11y: N/A (thông báo khoá vẫn ở `role="status"` như cũ)

## Skill gates

- aislop: skip — không nằm trong danh sách verify command được allow cho reviewer.
- oxlint (anti-slop): skip, oxlint not configured (repo dùng eslint; `pnpm lint` PASS).
- ocr (open-code-review): skip, ocr not installed / không được allow.
- AI-readable: OK — tên rõ (`LeadExportSlot`, `TRASH_SEGMENT_INDEX` thay magic number), hàm ngắn, comment nêu WHY (không WHAT), indirection 1 bước, doc as-built cập nhật. 0 indicator.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: N/A (không đổi auth/API public/input surface; endpoint không đổi).

## Findings

- **[MINOR-1]** `src/lib/leads/export-filters.ts:97` — thông báo dùng tên field nghiệp vụ "Trạng thái", "Nguồn", "Sale phụ trách", nhưng `src/collections/Leads.ts:52,84,119` không khai `label` nên bộ lọc Payload hiển thị tên humanize ("Status", "Source", "Assigned To"; chỉ `createdAt` có nhãn dịch sẵn). Nhãn toán tử khớp nhưng tên field có thể không khớp những gì admin thấy. Đề xuất (task sau/tuỳ chọn): khai `label` tiếng Việt cho các field này, hoặc ghi tên field kèm nhãn hiển thị trong ngoặc. Không chặn: yêu cầu trọng tâm là toán tử.
- **[MINOR-2]** `docs/API_SPEC.md:198` và dòng as-built layer-9-task-03 (`~:206`) — thay đổi chỉ whitespace/line-ending (`git diff -w --stat` còn 1 dòng thay vì 3), không thuộc task. Đề xuất: hoàn nguyên 2 dòng đó trước commit để diff surgical (không ảnh hưởng nội dung).

Không có CRITICAL/MAJOR.

## Residual risk

- Chưa xác minh tương tác thật trong admin (trash view / list drawer) bằng browser — reviewer không chạy app; đã xác minh bằng đọc source Payload 3.91 (đường dẫn ở trên) + unit test với shape `params`/context khớp source.
- Nâng cấp Payload có thể đổi shape `params.segments` hoặc `ListDrawerContext`; unit test đang mock, không bắt được — cần kiểm lại khi bump `@payloadcms/*`.

## Verdict

**PASS** — không còn CRITICAL/MAJOR; 2 MINOR không chặn (MINOR-2 nên dọn trước commit).
