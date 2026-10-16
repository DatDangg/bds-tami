# Task 08: Component media: thư viện ảnh + lightbox, bản đồ MapLibre lười, video facade

## Layer
2 — Upload, địa giới, audit, phiên đăng nhập, health, component media/form

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SHARED_FOUNDATION
- Review level expected: **STRICT** — component dùng chung nhiều trang, ảnh hưởng CWV
- Blast radius: src/components/media/Gallery.tsx, Lightbox.tsx; src/components/media/LazyMap.tsx (MapLibre + OSM tiles, tải khi vào viewport); src/components/media/VideoFacade.tsx (YouTube/TikTok: ảnh + nút phát); …
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-03, FR-PUB-05 (thư viện ảnh, bản đồ, video)
- NFR-01
- NFR-07
- design-spec §1.3, §1.5, §3.7, §3.8

## Description
Ba client component dùng lại ở chi tiết dự án, cho thuê, Đăng tin BĐS, liên hệ.

## Dependencies
- `layer-1-task-04` Nền UI: tokens → Tailwind v4 + shadcn/ui, font, Phosphor, primitive (dùng kết quả của task này)
- `layer-1-task-03` Định tuyến song ngữ `next-intl` (vi mặc định, `/en`) + định dạng Intl (dùng kết quả của task này)

Mở khoá cho: `layer-6-task-05`, `layer-6-task-07`, `layer-7-task-03`, `layer-8-task-04`, `layer-9-task-01`, `layer-14-task-01`

## Acceptance Criteria
- [ ] Gallery: ảnh đầu `priority` nếu là LCP, còn lại lazy; tỉ lệ cố định (CLS 0); lightbox bàn phím (←/→/Esc), bẫy focus, trả focus
- [ ] LazyMap: trước khi vào viewport chỉ hiện ảnh tĩnh + nút "Xem bản đồ / View map"; MapLibre import động; không cần API key
- [ ] VideoFacade: chỉ nhúng iframe khi bấm; không tải trên Save-Data
- [ ] Mọi nút chỉ icon có `aria-label` theo locale; touch target ≥ 44px
- [ ] Không cuộn ngang ở 375px

## Tests cần viết
- RTL: lightbox mở/đóng/điều hướng bàn phím
- RTL: LazyMap chưa import maplibre khi chưa intersect (mock IntersectionObserver)
- RTL: VideoFacade không render iframe trước khi bấm

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-2-task-08-round-<R>-review.md`

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
- Doc impact result: pending (dự kiến: no doc impact)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-2): task-08 mediacomp` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-2/task-08` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/components/media/Gallery.tsx, Lightbox.tsx
- src/components/media/LazyMap.tsx (MapLibre + OSM tiles, tải khi vào viewport)
- src/components/media/VideoFacade.tsx (YouTube/TikTok: ảnh + nút phát)
- src/components/media/ResponsiveImage.tsx (next/image + sizes theo cỡ ERD §4.12)

## Notes
- Tile OSM dùng theo chính sách sử dụng của OSM; nếu traffic lớn cần tile server khác (ghi residual risk).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
