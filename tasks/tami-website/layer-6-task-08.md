# Task 08: Trang Tuyển dụng: danh sách + chi tiết, hết hạn, JSON-LD JobPosting (S12, S13)

## Layer
6 — Deploy staging sớm + Cho thuê (dữ liệu), redirect slug, trang công khai đợt 1, endpoint ứng tuyển/tải CV

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **NORMAL** — trang đọc công khai + job revalidate nhẹ
- Blast radius: src/app/(frontend)/[locale]/tuyen-dung/page.tsx, [slug]/page.tsx; src/jobs/close-job-postings.ts (00:10 hằng ngày: revalidate danh sách/sitemap); src/components/careers/JobCard.tsx
- Doc impact (dự kiến): ARCHITECTURE §5.4: ghi rõ `close-job-postings` chỉ revalidate (khớp spec F6) nếu cần
- Decision impact: NO

## Requirements
- FR-PUB-09
- FR-PUB-15 (JobPosting)
- SPECIFICATIONS F6 (hết hạn: băng, ẩn form, noindex, bỏ JSON-LD)
- ARCHITECTURE §5.4 (`close-job-postings`)
- design-spec S12, S13

## Description
Danh sách chỉ vị trí còn hạn; chi tiết vị trí hết hạn vẫn mở nhưng có băng "đã hết hạn".

## Dependencies
- `layer-5-task-04` Collection `job-postings` + `job-applications` (quản lý hồ sơ) (dùng kết quả của task này)
- `layer-5-task-05` Khung trang công khai: header, menu toàn màn hình, footer, chuyển ngôn ngữ (dùng kết quả của task này)
- `layer-5-task-06` Thành phần trang dùng chung: nút liên hệ nổi, breadcrumb, page banner, phân trang, template danh mục, trạng thái trống/lỗi, 404/500 (dùng kết quả của task này)
- `layer-5-task-08` Nền SEO: metadata, Open Graph, canonical, hreflang, JSON-LD builders (dùng kết quả của task này)
- `layer-4-task-03` Truy vấn công khai dùng chung + chính sách cache (dùng kết quả của task này)
- `layer-1-task-07` Payload Jobs Queue + email Brevo SMTP + job `send-notification-email` (dùng kết quả của task này)

Mở khoá cho: `layer-7-task-04`, `layer-10-task-03`

## Acceptance Criteria
- [ ] Danh sách lọc `deadline ≥ hôm nay (giờ VN)`
- [ ] Chi tiết hết hạn: băng thông báo, ẩn vùng form, `noindex`, không JSON-LD
- [ ] Còn hạn: JSON-LD `JobPosting` (lương min/max nếu có, `validThrough`, `inLanguage`); vùng `ApplyFormSlot`
- [ ] Job `close-job-postings` chỉ revalidate, **không** đổi `status` (để URL vẫn mở theo spec)

## Tests cần viết
- Integration render: tin hết hạn không ở danh sách; chi tiết có noindex
- Unit: so sánh deadline theo múi giờ VN ở biên 23:59/00:00

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-6-task-08-round-<R>-review.md`

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
- Doc impact result: pending (dự kiến: ARCHITECTURE §5.4: ghi rõ `close-job-postings` chỉ revalidate (khớp spec F6) nếu cần)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-6): task-08 pubcareers` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-6/task-08` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức NORMAL)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/tuyen-dung/page.tsx, [slug]/page.tsx
- src/jobs/close-job-postings.ts (00:10 hằng ngày: revalidate danh sách/sitemap)
- src/components/careers/JobCard.tsx

## Notes
- Lệch nhỏ giữa ARCHITECTURE ("ẩn tin") và SPEC F6 ("mở URL trực tiếp thì hiện băng") — theo SPEC: ẩn khỏi danh sách bằng truy vấn, không đổi status.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-5-task-04
- [ ] Danh sách tuyển dụng lọc `deadline >= hôm nay` (access chưa lọc); trang chi tiết tin hết hạn vẫn mở, hiện trạng thái "Hết hạn" + noindex, follow (DESIGN.md:305).
