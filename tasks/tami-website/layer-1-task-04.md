# Task 04: Nền UI: tokens → Tailwind v4 + shadcn/ui, font, Phosphor, primitive

## Layer
1 — Hạ tầng dùng chung (CI, auth, i18n, UI, thư viện, bảo mật, jobs)

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SHARED_FOUNDATION
- Review level expected: **STRICT** — component dùng chung toàn site
- Blast radius: src/app/(frontend)/globals.css (tokens §11); components.json; src/lib/fonts.ts; …
- Doc impact (dự kiến): docs/DESIGN.md đã khớp (bước /design); nếu lệch tokens thì cập nhật tokens file, không sửa DESIGN intent
- Decision impact: NO

## Requirements
- NFR-07 (focus, contrast AA)
- NFR-01
- skills/react-nodejs/design-tokens.md §1–§11
- .context/design-spec.md §1.4, §8 (Phosphor)

## Description
Chuyển design tokens thành CSS variables + theme Tailwind v4, cấu hình shadcn/ui, font EB Garamond + Montserrat (`next/font`, subset `vietnamese`), icon Phosphor, và các primitive dùng chung đã theme (Button, Input, Select, Checkbox, Badge, Dialog, Sheet, Skeleton).

## Dependencies
- `layer-0-task-01` Scaffold Next.js + Payload 3 + tooling + Docker Compose dev (dùng kết quả của task này)

Mở khoá cho: `layer-2-task-05`, `layer-2-task-08`, `layer-2-task-09`, `layer-5-task-05`, `layer-5-task-06`, `layer-5-task-07`

## Acceptance Criteria
- [ ] Mọi màu/khoảng cách/radius/shadow/z-index/motion lấy từ token (tokens §1–§7), không có mã màu rời trong component
- [ ] Cặp màu chữ/nền dùng cho Button/Input đạt AA theo bảng tokens §9 (gồm 4 giá trị đã sửa: Text Muted `#6B6B6B`, Accent Display `#A07A3F`, Warning `#8A5A0A`, Input Border `#857F79`)
- [ ] Focus `:focus-visible` dùng `--focus-ring`; không có `outline: none` không thay thế
- [ ] `prefers-reduced-motion` tắt chuyển động theo tokens §6
- [ ] Font tự host qua `next/font`, subset `vietnamese`, `display: swap`
- [ ] Icon chỉ từ Phosphor; ESLint chặn `lucide-react`
- [ ] Không làm dark mode (tokens §0)

## Tests cần viết
- Unit/RTL: Button các variant render đúng class; Dialog bẫy focus, Esc đóng, trả focus
- Unit: script kiểm tra tương phản các cặp token chính (≥ 4.5:1 chữ thường, ≥ 3:1 chữ lớn/viền input)

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-1-task-04-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 0
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: pending
- Verify commands + result: pending
- Reviewer verdict: pending
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: pending (dự kiến: docs/DESIGN.md đã khớp (bước /design); nếu lệch tokens thì cập nhật tokens file, không sửa DESIGN intent)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-1): task-04 ui` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-1/task-04` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/app/(frontend)/globals.css (tokens §11)
- components.json
- src/lib/fonts.ts
- src/components/ui/* (button, input, select, checkbox, badge, dialog, sheet, skeleton)
- src/components/icons.ts (re-export Phosphor dùng trong dự án)
- eslint rule cấm import `lucide-react`

## Notes
- Giao diện admin Payload làm ở task admin-branding.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
