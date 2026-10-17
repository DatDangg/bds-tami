# Task 02: Kiểm tra CWV, WCAG AA, responsive trên các trang chính và sửa lỗi nhỏ

## Layer
14 — Hardening: header bảo mật, CWV/a11y

Checkpoint: ⏸ **Mốc M5** — dừng chờ user duyệt sau layer này (Trước deploy production: hardening xong; user duyệt production)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **NORMAL** — audit + sửa nhỏ, phạm vi hẹp từng lỗi
- Blast radius: scripts/audit/lighthouse.mjs, axe.mjs (hoặc lighthouserc); docs/smoke-tests/cwv-a11y-<ngày>.md (kết quả); các file component có lỗi nhỏ
- Doc impact (dự kiến): docs/smoke-tests (kết quả đo)
- Decision impact: NO

## Requirements
- NFR-01 (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 p75 mobile)
- NFR-07 (AA trang chính)
- NFR-08
- design-spec §5

## Description
Đo Lighthouse mobile + axe trên trang chủ, danh sách/chi tiết dự án và cho thuê, liên hệ (VI + EN) ở staging; sửa lỗi nhỏ; lỗi lớn tách task qua `/change`.

## Dependencies
- `layer-10-task-01` Ráp form lead vào chi tiết Cho thuê, Đăng tin BĐS, Dự án, Liên hệ (dùng kết quả của task này)
- `layer-10-task-03` Hoàn thiện bản EN công khai: `en.json`, chuyển ngôn ngữ đúng trang tương ứng, hreflang toàn site (dùng kết quả của task này)
- `layer-9-task-01` Trang chủ (S01): hero slide, Về TAMI, dự án nổi bật, dịch vụ, ưu đãi, CTA (dùng kết quả của task này)
- `layer-12-task-01` Redeploy staging bản đủ Must + bật giám sát/backup + chạy E2E smoke trên staging (cần staging đủ Must để đo/kiểm)
- `layer-13-task-01` Dashboard admin (FR-ADM-14): lead, nội dung, lượt bấm, cảnh báo dịch, chi phí dịch (thứ tự: làm sau khi Should xong)
- `layer-13-task-02` Quản lý chuyển hướng 301 trong admin (FR-ADM-15): kiểm tra hợp lệ, chống vòng/chuỗi (thứ tự: làm sau khi Should xong)
- `layer-13-task-03` Trang đích khu vực Cho thuê (FR-PUB-16, S06) (thứ tự: làm sau khi Should xong)
- `layer-13-task-04` Khối Đối tác / chủ đầu tư trên trang chủ (FR-PUB-17) (thứ tự: làm sau khi Should xong)

Mở khoá cho: `layer-15-task-01`

## Acceptance Criteria
- [ ] Esc đóng được menu con DesktopNav mở bằng hover khi focus ở chỗ khác (listener Esc cấp document, `DesktopNav.tsx:26-33`, WCAG 1.4.13); dùng index của map thay `items.indexOf` (`:42`); thử disclosure với screen reader thật + đo 768/1024 trên trình duyệt (MINOR-1/4) (review L5-T05 round 2)
- [ ] Lighthouse mobile: LCP ≤ 2.5s, CLS ≤ 0.1, TBT thấp (proxy INP) trên 5 trang chính; ghi số đo
- [ ] axe: 0 lỗi mức A/AA trên 5 trang chính
- [ ] Responsive 375/768/1280: không cuộn ngang, touch target ≥ 44px
- [ ] Lỗi không sửa trong phạm vi nhỏ → ghi backlog, không mở rộng scope

## Tests cần viết
- Script audit chạy được với URL staging

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-14-task-02-round-<R>-review.md`

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
- Doc impact result: pending (dự kiến: docs/smoke-tests (kết quả đo))
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-14): task-02 cwv` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-14/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức NORMAL)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- scripts/audit/lighthouse.mjs, axe.mjs (hoặc lighthouserc)
- docs/smoke-tests/cwv-a11y-<ngày>.md (kết quả)
- các file component có lỗi nhỏ

## Notes
- Đo sau Should để số liệu phản ánh bản sẽ lên production.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
