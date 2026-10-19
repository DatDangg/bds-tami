Agent: spec-validator

# Phase review — feature-admin-ui-saas-refresh · phase 1 (BL-015) · round 1

- Mode: **Phase review** (sau 6 task PASS + commit) · Diff: `git diff 1c0554a..fb4d797` (6 commit: 09dd82d, 1f067ac, f2ce643, 6dc791a, 5e24036, fb4d797)
- Nguồn: `spec/changes/2026-10-19-admin-ui-saas-refresh.md` (Acceptance), `SPECIFICATIONS.md:80` (FR-ADM-19, spec 1.11.0), `spec/updates/2026-10-19-admin-ui-saas-refresh.md`, `docs/specs/2026-10-19-admin-ui-saas-design.md` (§2–§7), task `tasks/feature-admin-ui-saas-refresh/phase-1-task-0{1..6}.md`, review reports task 01–06, pre-plan `feature-admin-ui-saas-refresh-spec-validation.md`.
- Ghi chú tên file: theo yêu cầu primary; quy ước AGENTS là `...-phase-1-round-1-review.md` — đây là round 1.

## Verdict: ⚠️ GAPS FOUND

Code đáp ứng đủ FR-ADM-19 về chức năng + ràng buộc (không schema/access/hook/API/frontend; verify xanh). Còn thiếu **bằng chứng trình duyệt + ảnh trước/sau** (Acceptance change doc dòng 32–33, test-scope `acceptance`) và **doc reconcile as-built** chưa làm. Không có gap code — gap là verification/doc, đóng được ở close-out, không cần builder sửa source.

## Verify commands (chạy tại HEAD fb4d797, working tree chỉ dirty file context/spec, không dirty `src/`)
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0 — 255 file / 2658 test PASS (gồm integration `admin-dashboard.test.ts`, `admin-form-layout.test.ts`, unit `admin-labels.test.ts`) |
| `pnpm build` | không chạy (task 01–06 đều ghi build PASS) |

## Ràng buộc phạm vi (kiểm độc lập)
| Ràng buộc | Bằng chứng | Kết quả |
|---|---|---|
| Không đụng frontend / migration | `git diff --stat 1c0554a..fb4d797 -- 'src/app/(frontend)' migrations` → **rỗng** | ✅ |
| Không đổi component/route ngoài admin | `git diff --stat ... -- src/components ':!src/components/admin' src/app src/access src/endpoints src/hooks src/i18n` → chỉ `src/app/(payload)/admin/importMap.js` (sinh) + `src/app/(payload)/custom.scss` | ✅ |
| Không đổi schema/kiểu | `payload-types.ts` diff 2475 dòng nhưng multiset dòng không-comment của 1c0554a và fb4d797 **giống hệt** (sort + diff rỗng) → chỉ đổi thứ tự thuộc tính/collection + JSDoc | ✅ |
| Không đổi access/hook/validate | 71 dòng `-`/71 dòng `+` chứa `access:/hooks:/validate:/endpoints:` trong `src/collections|globals|fields`; bỏ `label: …` rồi so → khác biệt chỉ là thêm label/option labels/`admin.description`, và `Homepage.ctaBanner.title` chuyển thành `{...titleField, validate: validateCtaTitle}` (titleField cục bộ = `{name:"title",type:"text",localized:true}` + label → tương đương) | ✅ |
| Không đổi API | `payload.config.ts` chỉ thêm `views.dashboard` + `adminNavGroupsPlugin` (thứ tự collection/nhóm), bỏ `beforeDashboard` (banner render trong view); không endpoint mới | ✅ |
| Tab không tên | `src/lib/admin/form-layout.ts:14` `formTabs` (không `name`); integration `admin-form-layout.test.ts` kiểm không tab nào có `name` + cột DB giữ path | ✅ |

## Ma trận coverage
| # | Requirement | Nguồn | Implementation / bằng chứng | Status |
|---|---|---|---|---|
| 1 | Style chung trung tính, nhấn TAMI `#8C6733`/tối `#E0BF89`, AA chữ ≥4.5 / UI ≥3, sáng+tối | CR Acc-1; FR-ADM-19 | `src/components/admin/admin-tokens.ts` + `styles/_tokens.scss` …; `admin-tokens.test.ts` (contrast + SCSS↔TS); T01 đo contrast thật bằng trình duyệt (task-01 §Đo contrast) | ✅ |
| 2 | Select admin cùng một style (gộp phần admin BL-016) | FR-ADM-19; design §8 | `styles/_controls.scss` react-select (T01 task :42) | ✅ |
| 3 | Sidebar 7 nhóm tiếng Việt, không icon, quyền xem giữ nguyên | CR Acc-3; FR-ADM-19; design §2, Q3/Q4 | `src/components/admin/admin-groups.ts` (`ADMIN_NAV_GROUPS` + plugin cuối), `admin-groups.test.ts`; không đổi `hidden` | ✅ (lệch đã ghi: Website = collection trước global, design §2:168 as-built) |
| 4 | Việt hoá toàn bộ nhãn (collection/global/field/option/array row, redirects, Media/PrivateFiles) + test quét | CR Acc-4; FR-ADM-19 | T02; `tests/unit/admin-labels.test.ts`, `src/lib/admin/collection-labels.ts`, `src/components/admin/row-labels/TextRowLabel.tsx`, `redirects-plugin.ts` | ✅ |
| 5 | Dashboard: thẻ đếm admin (lead mới, chưa phân công, hồ sơ mới, nội dung đang hiển thị) / sale (lead mới được giao, đang xử lý, bản nháp của mình, tin đang đăng), không so sánh ngày | FR-ADM-19; design §3.2/Q1 | `dashboard-queries.ts:67-145` (sale lọc `author` rõ ràng — N1; `buildPublicWhere` — N2) | ✅ |
| 6 | Đếm Local API `overrideAccess:false`; không quyền read/create → không thẻ/lối tắt | CR Acc-2; FR-ADM-19 | `dashboard-data.ts`; lối tắt allowlist ∩ `create` (`dashboard-queries.ts:13`, N3); integration `admin-dashboard.test.ts` admin vs sale | ✅ |
| 7 | Lối tắt tạo nội dung + lead mới nhất + "bản sửa gần đây" | FR-ADM-19 | `RecentLists.tsx` — "Bài của bạn cập nhật gần đây" (theo `author`, 4 loại) | ✅ (lệch đã ghi — task-04 :42(2), không có field người sửa cuối) |
| 8 | Giữ banner dịch lỗi | design §3.1 | `DashboardView.tsx` render `TranslationFailedBanner` | ✅ |
| 9 | Card nhóm nghiệp vụ "kèm số bản ghi" | design §3.1:191 (không có trong FR-ADM-19) | `NavGroupCards.tsx` — không số đếm | ✅ (lệch đã ghi — task-04 :42(5)) — design chưa có note as-built |
| 10 | List: badge trạng thái có chữ, thumbnail 40px (projects/rentals = gallery[0], posts/news = cover), dòng 48px, defaultColumns | CR Acc-5; FR-ADM-19; Q5/Q6 | `StatusBadge.tsx`, `status-tones.ts`(+test), `ThumbnailCell.tsx`(+test fallback N8), `TitleLinkCell.tsx`, `AssigneeCell.tsx`; `_lists.scss:38` height 48px | ✅ |
| 11 | Header bảng dính khi cuộn | design §4:218 (không có trong FR-ADM-19) | `_lists.scss:3` — bỏ sticky (`.table` overflow:auto) | ✅ lệch đã ghi task-01 Residual :71 — design §4 chưa có note as-built |
| 12 | Form tab không tên/row/collapsible, sidebar phải (projects, rentals, property-posts, news, job-postings, services, leads, homepage, site-settings) | CR Acc-6; FR-ADM-19; design §5 | `form-layout.ts`, `content-defaults.ts:142-143`, `Projects.ts:122`, `Leads.ts:221-224`, `SiteSettings.ts:78`, `Homepage.ts:230`; integration lưu/đọc giữ shape | ✅ |
| 13 | Không đổi schema/DB/access/API | CR Acc-7; FR-ADM-19 | xem bảng Ràng buộc | ✅ |
| 14 | Responsive không vỡ 390px (mobile/tablet) | CR Acc-8; FR-ADM-19; NFR-07 | T01 đo trình duyệt 1440/390 (login, list, form **trước T06**); T04/T05/T06 chỉ CSS math — reviewer T04 r1/r2 + T06 r1 ghi "chưa kiểm trình duyệt" | ⚠️ PARTIAL |
| 15 | Ảnh trước/sau các màn chính (Tổng quan, DS Dự án, DS Lead, form Dự án, form Lead, Cấu hình chung — sáng+tối, 1440 & 390) | CR Acc-9; design §6:265; test-scope `acceptance` | Không tìm thấy ảnh nào (`docs/**` chỉ có mock HTML + design md) | ❌ MISSING |
| 16 | Form Projects/Leads/Site settings lưu được qua UI | task-06 Acceptance 3 | Integration Local API PASS; UI chưa kiểm (task-06 :46, review T06 :89) | ⚠️ PARTIAL |

## Gaps
- **[MISSING] G1 — Ảnh trước/sau** (CR Acceptance "Ảnh chụp trước/sau các màn chính để user duyệt"; test-scope acceptance). Task liên quan: T01–T06 (không task nào sở hữu); design §6:265 liệt kê 6 màn × sáng/tối × 1440/390. Cần primary/user chạy app chụp trước khi đóng BL-015.
- **[PARTIAL] G2 — Kiểm trình duyệt responsive + lưu form** cho màn sau T04/T05/T06 (dashboard 1440/768/390; list thumbnail/badge; form tab cuộn ngang, `row` xuống dòng < 768, cột phải xuống dưới, lưu được). Task: T04 (:63), T06 (:46, Acceptance 3). Có thể gộp với G1 (cùng phiên chụp).
- **[PARTIAL] G3 — Doc reconcile as-built chưa làm** (xem danh sách dưới). Task: T04 :44 "Chưa làm (primary/close-out)".

Không có gap code. Không có ❌ requirement chức năng.

## Lệch so với design — trạng thái ghi nhận
| Lệch | Ghi ở | Cần bổ sung |
|---|---|---|
| Nhóm Website: collection (Chuyển hướng 301) trước globals | design §2:168 as-built | — |
| Card nhóm dashboard không có số bản ghi | task-04 :42(5) | note as-built vào design §3.1:191 |
| "Bài của bạn cập nhật gần đây" thay "Bạn sửa gần đây" | task-04 :42(2) | note as-built design §3.1; FR-ADM-19 + spec/updates:14 ghi "bản sửa gần đây" — cách hiểu hợp lệ (bản của mình, sắp theo cập nhật), **không** sửa intent; nếu muốn chữ chính xác → Change Request |
| Header bảng không dính | task-01 Residual :71 | note as-built design §4:218 |
| `importMap.js` bỏ entry `TranslationFailedBanner` | task-04 :41 | — (đã regenerate, CI kiểm lệch) |

## Doc reconcile list (KHÔNG tự sửa — primary làm ở close-out)
1. `docs/ARCHITECTURE.md:128` — cây thư mục `components/ … admin/ (logo, icon, keepalive)` → bổ sung: `dashboard/` (DashboardView — view Tổng quan, thẻ đếm theo quyền), `StatusBadge`/`status-tones`, `ThumbnailCell`/`TitleLinkCell`/`LinkedCell`/`AssigneeCell`, `row-labels/`, `admin-groups.ts` (ADMIN_NAV_GROUPS + plugin), `admin-tokens.ts` + `styles/` (SCSS token/partials, `custom.scss` `@use`).
2. `docs/ARCHITECTURE.md` cây `lib/` (quanh `:114`) — thêm `lib/admin/` (`collection-labels.ts` nguồn nhãn chung, `form-layout.ts` formTabs/formRow tab không tên, `row-label.ts`). Tuỳ chọn: 1 dòng `As-built (BL-015)` ghi `admin.components.views.dashboard` thay `beforeDashboard`, plugin `adminNavGroupsPlugin` chạy cuối `plugins`.
3. `docs/specs/2026-10-19-admin-ui-saas-design.md` §3.1 (:191) và §4 (:218) — note as-built 3 lệch ở bảng trên (design doc là spec của change, không phải intent BRD → được ghi as-built như §2:168).
4. `tasks/tami-website/layer-13-task-01.md:16,83` — blast radius còn `src/components/admin/Dashboard.tsx (admin.components.views / beforeDashboard)`; thêm ghi chú FR-ADM-14 cắm vào `DashboardView` (BL-015, design §3.3/Q2) — task-04 :44 đã liệt kê, chưa làm (Grep `BL-015|DashboardView` = 0).
5. `.context/decisions.md` — chưa có mục BL-015 (Grep = 0): ghi quyết định Q1–Q7 + dashboard view thay beforeDashboard (task-04 :44).
6. `spec/test-scope/current.json` (scope v12) — `changed.filesNote: "dự kiến — chốt theo diff thật ở close-out"`: chốt lại `files` theo diff thật (thêm `src/lib/admin/**`, `src/lib/translation/admin-ui.ts`, `src/lib/click-stats/click-types.ts`, `src/payload-types.ts` (chỉ thứ tự/JSDoc), `tests/integration/admin-*.test.ts`, `tests/unit/admin-labels.test.ts`) — không bump scope (không đổi behavior).
7. `docs/PERMISSION.md`, `docs/DESIGN.md`, `docs/API_SPEC.md`, `docs/ERD.md` — **no doc impact** (không đổi quyền/endpoint/schema; DESIGN.md chỉ mô tả site public; API_SPEC:196 `/api/admin/dashboard` vẫn là kế hoạch FR-ADM-14, chưa build).

## Test-scope (v12) coverage
`spec/test-scope/current.json` scopeVersion 12 / spec 1.11.0, `specRefs` FR-ADM-19 (+FR-ADM-14, NFR-07), `impact.direct` phủ đủ 6 màn (style, sidebar, nhãn, Tổng quan theo vai trò, list, form), `regression` có quyền sale/lưu-đọc/nút dịch/xuất Excel/CV/site public, `acceptance` = 9 mục CR, `viewports [390,768,1280]`, `uiTests: true`. ✅ phủ đủ; chỉ cần chốt `changed.files` (mục 6). Chữ "bản sửa gần đây" trong `impact.direct` nên đồng bộ "Bài của bạn cập nhật gần đây" để template test không tìm sai nhãn.

## Residual risk
- Field hiếm (code/json/point), drawer/bulk upload chưa soi style (task-01 Residual :73-74).
- Header bảng không dính theo cuộn trang (chấp nhận, design lệch).
- `pnpm build` không chạy lại ở phase review (dựa vào task log).
