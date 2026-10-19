Agent: reviewer

# Review — BL-015 · feature-admin-ui-saas-refresh · phase-1-task-06 · round 1

- Scope: uncommitted diff vs HEAD `5e24036` (branch `staging`), bỏ qua `.context/**` + `spec/changes/BACKLOG.md` (session khác).
- Task: `tasks/feature-admin-ui-saas-refresh/phase-1-task-06.md` · Design §5–§6 `docs/specs/2026-10-19-admin-ui-saas-design.md`.

## Review level: STRICT

**Reason:** bọc field schema vào tab/row (rủi ro đổi data path → migration/mất dữ liệu), sửa field factory dùng chung (`content-defaults.ts`, `scoped-category.ts`, `status.ts`), hook/validate dùng `siblingData`, shared component `StatusBadge` (thêm prop).

## Blast radius

- Collections: projects, rentals, property-posts, news, job-postings, services, leads; mọi collection dùng `withContentDefaults` (kể cả không có tab, vd pages) — đổi thứ tự field dùng chung (slug xuống sau isFeatured).
- Globals: homepage, site-settings.
- `scopedCategoryField` — chỉ dùng ở 5 collection trên (Grep), cả 5 đã đặt category vào tab Nội dung → bỏ `position: sidebar` không ảnh hưởng collection khác.
- Duyệt field: `collectLeaves` (`src/lib/translation/leaves.ts:95-105` đã xử lý row/collapsible/tab không tên), `slug.ts:42` dùng `flattenedFields`. Không có walker cấp gốc nào khác trong `src` (Grep `.fields.find|filter|map`, `type === "tabs"`).
- Dashboard admin (`RecentLists`, `StatCards`) → `StatusBadge`; xoá `DashboardBadge.tsx` + `.tami-dash-badge`.
- `src/payload-types.ts` (regenerate).

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm lint` | PASS (eslint, 0 output lỗi) |
| `pnpm typecheck` | PASS (`tsc --noEmit`) |
| `pnpm test` | PASS — 255 files / 2658 tests (gồm integration DB tạm, có `tests/integration/admin-form-layout.test.ts`) |
| `pnpm build` | PASS |
| `payload-types.ts` sort-compare (git show HEAD vs working, CR stripped, `sort` + `diff`) | **giống hệt** → chỉ đổi thứ tự dòng, không đổi kiểu/path |
| `migrations/` | 57 file, `git status migrations` sạch |
| `pnpm payload migrate:create --skip-empty` | skip — không thuộc verify commands của reviewer (ghi file). Dựa vào: log builder (không sinh file) + types sort-identical + integration test chạy migration THẬT đã commit rồi lưu/đọc projects/leads/site-settings/homepage thành công + kiểm cột DB giữ path cũ (`price_from_vnd`, `scale_total_units`, `seo_meta_title`, `utm_source`, `rental_terms_min_lease_months`, `cta_banner_enabled`…). Đủ bằng chứng thay thế. |

## Kiểm theo trọng tâm

- Không tab nào có `name`: `formTabs` (`src/lib/admin/form-layout.ts:14-16`) chỉ map `{label, fields}`; Homepage/SiteSettings/Leads cũng dùng `formTabs`; `placeSharedFields` thêm tab `{label, fields}` không name. Test `namedTabs` đệ quy toàn cây cho 7 collection + 2 global = `[]`. OK.
- Không đổi path/field name: diff chỉ di chuyển field vào tab/row; group có tên (`seo`, `translation`, `scale`, `rentalTerms`, `offer`, `utm`, khối homepage) giữ nguyên. OK.
- `siblingData`/`data`: tab không tên/row không thêm cấp. `scope-slug.ts:12` (`siblingData.slug`) vẫn đứng ngay sau slug. `lostReason` validate/condition theo `data.status` (root) — integration test xác nhận validate còn chạy. `validateCtaTitle` (ctaBanner) test xác nhận. OK.
- content-defaults dùng chung: collection không có tab → `[...own, ...shared]` như cũ (chỉ khác thứ tự slug trong sidebar). OK.
- Dịch tự động: `collectLeaves` duyệt tab không tên; `translatable-fields.test` vẫn so khớp `TRANSLATABLE_FIELDS` sau khi trải phẳng. OK.
- 3 test cũ đổi sang `findLayoutField`/`flattenLayoutFields`: assert giữ nguyên (cùng danh sách con `offer`/`rentalTerms`, cùng so khớp leaves). Không nới. OK.
- `LeadAssigneeWarning`: field `assigneeInactive` vẫn ở root, thêm `position: "sidebar"`, component giữ nguyên. OK.
- Dashboard StatusBadge: tone `status-tones.ts:8-18` khớp 1-1 bảng `DashboardBadge` cũ; nhãn lấy `CONTENT_STATUS_LABELS` + Leads `STATUS_LABELS` (không trùng key) khớp nhãn cũ; "Chưa phân công"/"Cần giao" giữ tone `warning` qua prop `tone`. OK.
- Leads §5.2: tab Khách hàng · Nguồn (source, bài liên quan, utm, pageUrl, referrer) · Lịch sử chăm sóc (join); sidebar: code, status, lostReason, assignedTo/assignedAt + warning, mốc thời gian. Đúng design.
- §5.1/§5.3: tab đúng tên/thứ tự; sidebar phải: status · publishedAt · author · isFeatured · slug · hasEnglish. Đúng design.
- File ≤ 300 dòng: max Leads 230, Homepage 246. OK.
- Hàm > 50 dòng: `createProjects` 58→78, `createRentals` 69→91, `createSiteSettings` 80→108 dòng — **đã vượt từ trước** (HEAD), phần lớn là config literal → ghi MINOR, không chặn.

## Responsive Checklist Gate (diff đụng CSS admin `_lists.scss`, `_dashboard-lists.scss`, form layout)

Không có môi trường browser cho reviewer → xác minh bằng CSS/config.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll document | OK (CSS) | Tab bar cuộn ngang trong `.tabs-field__tabs-wrap` của Payload (không phải document); `row` của Payload tự xuống dòng ở mobile — chưa đo bằng browser → Residual risk |
| Mobile-first media query | OK (theo convention) | `@media (max-width: 767px)` — override CSS desktop-first của Payload, nhất quán với T01–T05 (`_controls.scss:248`, `_surfaces.scss:194`, `_lists.scss:185`) |
| Grid auto-fit / không cột cố định | N/A | Không thêm grid |
| Font rem / heading clamp / spacing | N/A | Không thêm typography; xoá `.tami-dash-badge` (px) thay bằng `.admin-badge` sẵn có |
| Media max-width/aspect-ratio/srcset | N/A | Không thêm media |
| Touch target ≥ 44px | OK | `.tabs-field__tab-button { min-height: 44px }` < 768 (`_lists.scss:143-149`) |
| Nav hamburger / table scroll | N/A | Không đổi nav/bảng ở task này |
| Sidebar phải xuống dưới < 768 | OK (Payload mặc định) | Field `position: sidebar` ở root → Payload render cột phải, tự xếp dưới ở mobile |
| 100vh / reduced-motion / overflow:hidden che lỗi | OK | Không dùng `100vh`, không thêm animation, không `overflow:hidden` |

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip — `aislop` không thuộc verify commands được allow cho reviewer |
| oxlint (anti-slop) | skip, oxlint not configured (không có `.oxlintrc.json`); eslint PASS |
| ocr (open-code-review) | skip, ocr not installed / không trong allowlist |
| AI-readable | OK — tên rõ (`formTabs`, `formRow`, `placeSharedFields`, `flattenLayoutFields`), không magic number, indirection ≤ 2; indicators: hàm >50 dòng (có từ trước) + 1 JSDoc lệch (MINOR-1) → < 3 |
| ai-friendly-web | N/A — chỉ `/admin` nội bộ |
| blitzstrike | N/A — không đụng auth/API public/input |

## Findings

**CRITICAL:** không có.

**MAJOR:** không có.

**MINOR**
1. `src/lib/admin/form-layout.ts:25` — JSDoc nói tab CÓ tên "không trải ra (giữ nguyên như field có tên)" nhưng code dòng 31 trả `[]` (bỏ hẳn). Sửa comment thành "bỏ qua (là một cấp dữ liệu riêng)" hoặc trả nguyên tab nếu muốn đúng mô tả.
2. `src/components/admin/dashboard/DashboardParts.test.tsx:4-5` — phải `vi.mock("@payloadcms/ui")` vì `StatusBadge.tsx` import `LinkedCell` (client, `@payloadcms/ui`) nên dashboard kéo theo dependency đó. Đề xuất (task sau): tách `StatusBadge` thuần ra file riêng không import `LinkedCell`, `StatusBadgeCell` giữ ở file hiện tại.
3. `src/components/admin/dashboard/RecentLists.tsx:42`, `StatCards.tsx:16` — truyền `value="unassigned"`/`"needs-assignment"` giả chỉ để thoả prop bắt buộc khi đã có `tone`. Có thể cho `value` optional khi có `tone`. Thêm: status lạ trước đây `DashboardBadge` trả `null`, nay hiện giá trị thô với tone mặc định — chấp nhận được.
4. `createProjects`/`createRentals`/`createSiteSettings` > 50 dòng (đã vượt từ HEAD, nay dài thêm) — config literal; có thể tách mảng field từng tab ra const như Leads nếu muốn đúng giới hạn.

## Residual risk

- Acceptance 3 (form Projects/Leads/Site settings 1440/390 sáng+tối, lưu qua UI) **chưa xác minh bằng trình duyệt** — builder và reviewer đều không chạy được app. Cần primary/phase review chụp ảnh theo design §6 (tab cuộn ngang, `row` xuống dòng < 768, cột phải xuống dưới, gạch chân tab active sau `padding-bottom: 0`).
- `migrate:create` không do reviewer chạy lại; dựa vào log builder + bằng chứng thay thế nêu trên.

## Verdict: PASS

Không CRITICAL/MAJOR. Data path, types, migration, hook/validate, dịch tự động đều có bằng chứng kiểm chứng được; lint/typecheck/test/build PASS. MINOR có thể xử lý ở task sau; kiểm trình duyệt chuyển sang phase review.
