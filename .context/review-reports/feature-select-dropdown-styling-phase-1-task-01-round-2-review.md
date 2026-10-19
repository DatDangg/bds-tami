Agent: reviewer

# Review: feature-select-dropdown-styling · phase-1-task-01 · round 2

> Ghi bởi primary: guard hook chặn reviewer `Write` vào `.context/review-reports/**` trong worktree. Nội dung từ report reviewer.

- Task: `tasks/feature-select-dropdown-styling/phase-1-task-01.md` (BL-016). Round 1 FAIL vì MAJOR-1.
- Diff: working tree (`git diff` + untracked `src/components/ui/option-select.tsx`, `src/components/careers/JobFilters.test.tsx`). `src/payload-types.ts` bỏ qua (chỉ EOL).

## Review level
**STRICT**

## Reason
Đổi building block UI dùng chung (`ui/select.tsx`, `ui/option-select.tsx` mới, `FormField`) + hành vi lọc và no-JS fallback ở 3 trang danh sách public → risk-red "shared component".

## Blast radius
- `ui/select.tsx`: class trigger/content, `collisionPadding`, `max-w-(--radix-select-content-available-width)`.
- `ui/option-select.tsx` dùng bởi: ProjectFilters, JobFilters; rentals FilterFields + SortSelect (thanh desktop + Sheet mobile); FloorPlans (< md, ≥ 6 mặt bằng); FormField `as:"select"` (chỉ test dùng).
- Không đổi API/schema/query-param/i18n/migration. File cấm không bị đụng (`git status --short -- SPECIFICATIONS.md spec .context/progress.json src/lib/translation/admin-ui.ts src/components/layout src/components/admin` rỗng).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm vitest run --project ui --project unit` | PASS: 202 files, 1972 tests |
| integration | Không chạy (primary: 55/56 file PASS; jobs-email PASS 5/5 khi chạy riêng — timeout `beforeAll` do tải song song) |
| `pnpm build` | Không chạy |

## Round-1 findings status
| Finding | Status | Evidence |
|---|---|---|
| MAJOR-1 placeholder không hiện | **FIXED** | `option-select.tsx:68` truyền `""` cho Radix khi current `""` và không có option `""` → placeholder + `data-placeholder`. Test `FormField.test.tsx` "không có mục rỗng: hiện placeholder (data-placeholder) và FormData là chuỗi rỗng". |
| MINOR-1 giá trị không khớp option | FIXED | `option-select.tsx:66` coi như `""`; input ẩn gửi `current` (`:103`). Test "giá trị không khớp mục nào coi như rỗng". |
| MINOR-2 pick trước hydrate bị mất | Còn (MINOR) | Nhánh native dùng `defaultValue` khi uncontrolled (`:77`) nhưng sau hydrate `inner = defaultValue` (`:59,61-62`). Cửa sổ rất ngắn, chấp nhận. |
| MINOR-3 list không max-width | FIXED | `select.tsx:48`. |
| MINOR-4 không có hydration test | Còn (MINOR) | Đọc code: server snapshot `false` khi hydrate → markup khớp. |

## Regression checks
| Check | Result | Evidence |
|---|---|---|
| Sentinel không lộ | OK | Sentinel chỉ dùng khi có option `""` (`:68`); `fromRadix` map về `""` (`:91`). Test SSR ProjectFilters/JobFilters không chứa `__tami_empty__`; rentals chọn "Tất cả tỉnh" → URL `/cho-thue`. |
| No-JS ProjectFilters/JobFilters | OK | SSR `<select id name>` có `<option selected>` (renderToString tests). |
| Hydration mismatch | OK (đọc code) | `useSyncExternalStore(..., () => false)`; native select và input ẩn không cùng render. |
| Rentals tỉnh → phường | OK | `onChange({ province, ward: "" }, "now")`, `disabled={wardDisabled}`; test ward reset/disabled/Sheet PASS. Ward URL không khớp → "Tất cả phường" (như native fallback option đầu). |
| FormField aria + submit | OK | Trigger giữ id/aria-invalid/aria-describedby/aria-required; input ẩn `name`; disabled → không submit (như native). |
| Không auto-submit | OK | Submit spy ProjectFilters không được gọi. |

## Responsive Checklist Gate (không browser, kiểm CSS)
- No horizontal scroll: OK (`w-full min-w-0`, `[&>span]:truncate`, icon `shrink-0`, list max-w theo màn).
- Grid/container: OK (không đổi grid cha; chỉ `lg:w-56`/`lg:w-48` có sẵn). Typography token: OK.
- Touch target ≥ 44px: OK (trigger/native `h-12`, item `min-h-11`).
- Media/Nav/Table/100vh/reduced-motion: N/A. Không `overflow:hidden` che nội dung: OK.

## Skill gates
- aislop / oxlint / ocr: skip (không cài/không cấu hình); ESLint + tsc PASS.
- AI-readable: OK (0–1 indicator). ai-friendly-web, blitzstrike: N/A.

## Findings
### [MINOR-1] Pick trước hydrate vẫn bị bỏ (round-1 MINOR-2)
- `src/components/ui/option-select.tsx:59,61-62,77`. Tuỳ chọn: ref nhánh native, set `inner` từ `ref.current.value` trước khi chuyển Radix. Không chặn.

### [MINOR-2] Chưa có hydration test (round-1 MINOR-4)
- Tuỳ chọn: `hydrateRoot` lên output `renderToString` của ProjectFilters với spy `onRecoverableError`.

### [MINOR-3] FormField bỏ qua `value`/`defaultValue` không phải string
- `src/components/forms/FormField.tsx:66-67`. `SelectProps` vẫn nhận `number`/`readonly string[]` nhưng thành `undefined`. Tuỳ chọn: thu hẹp type về `string`.

## Residual risk
- Chưa xem trên trình duyệt thật: typeahead + Esc, cuộn list 375px, Select trong Sheet mobile rentals (z-index/focus trap), tương phản dark mode.
- Reviewer không chạy integration.

## Verdict
**✅ PASS** — MAJOR-1 đã sửa + có test; không còn CRITICAL/MAJOR; chỉ MINOR tuỳ chọn.
