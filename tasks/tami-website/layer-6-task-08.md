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
- [x] Danh sách lọc `deadline ≥ hôm nay (giờ VN)`
- [x] Chi tiết hết hạn: băng thông báo, ẩn vùng form, `noindex`, không JSON-LD
- [x] Còn hạn: JSON-LD `JobPosting` (lương min/max nếu có, `validThrough`, `inLanguage`); vùng `ApplyFormSlot`
- [x] Job `close-job-postings` chỉ revalidate, **không** đổi `status` (để URL vẫn mở theo spec)

## Tests cần viết
- Integration render: tin hết hạn không ở danh sách; chi tiết có noindex
- Unit: so sánh deadline theo múi giờ VN ở biên 23:59/00:00

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-6-task-08-round-<R>-review.md`

## Migration
- As-built: `migrations/20261017_175237_close_job_postings_task.ts` — chỉ `ALTER TYPE … ADD VALUE 'close-job-postings'` trên enum `task_slug` của `payload_jobs` (additive, không HIGH_RISK). `down` cần xoá job `close-job-postings` đang xếp hàng trước (MINOR M1 → L15-T01). `category` vốn nullable nên G25 không cần migration.

## Retry / Error Memory
- Attempt: 1
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 4/4 PASS + follow-up L5-T04 (lọc deadline, chi tiết hết hạn), G25 (category tuỳ chọn), L6-T09 (helper deadline chung `src/lib/careers/deadline.ts`; date picker dayOnly lưu `YYYY-MM-DDT12:00:00.000Z`), L6-T03 (404 có nội dung)
- Verify commands + result: pnpm install --frozen-lockfile / lint / typecheck = PASS; pnpm test 141 file 1.530 PASS; pnpm build PASS. next start :3228 (APP_ENV=production): `/tuyen-dung` 200 `public, s-maxage=60, stale-while-revalidate=300`, 3 tin mở (bỏ tin hết hạn); lọc → `noindex, follow` + canonical; tin hết hạn 200 + banner, `noindex, follow`, 0 JSON-LD, không form ứng tuyển; tin mở có JobPosting (`validThrough …T23:59:59+07:00`, baseSalary, jobLocation, inLanguage); slug lạ / EN thiếu → 404 có h1/header/footer, no-store; ISR HIT; 375/768/1280 không cuộn ngang, touch ≥44
- Reviewer verdict: STRICT PASS round 1 — `.context/review-reports/build-tami-website-layer-6-task-08-round-1-review.md`
- Residual risk: job `close-job-postings` revalidate không có tác dụng ngoài tiến trình Next (giữ theo task; trang vẫn đúng nhờ ISR 60 s + list dynamic) → chọn cơ chế revalidate liên tiến trình khi làm `expire-offers` (L7-T01). Cron viết UTC (00:10 VN). Ngay sau nửa đêm VN trang chi tiết cache có thể còn "mở" ~1 phút (endpoint vẫn chặn). MINOR M1, M4–M6 → L15-T01
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: `docs/ARCHITECTURE.md` §5.4 + as-built layer-6-task-08, `docs/ERD.md` §4.10, `docs/API_SPEC.md` §3.2
- Decision log: G25 category tuỳ chọn (user); tin hết hạn bỏ toàn bộ JSON-LD (SPEC F6); cron UTC (reviewer chấp nhận)

## Commit / Tracking
- Commit gợi ý: `feat(layer-6): task-08 pubcareers` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-6/task-08` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức NORMAL)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/tuyen-dung/page.tsx, [slug]/page.tsx
- src/jobs/close-job-postings.ts (00:10 hằng ngày: revalidate danh sách/sitemap)
- src/components/careers/JobCard.tsx

## Notes
- Lệch nhỏ giữa ARCHITECTURE ("ẩn tin") và SPEC F6 ("mở URL trực tiếp thì hiện băng") — theo SPEC: ẩn khỏi danh sách bằng truy vấn, không đổi status.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-5-task-04
- [x] Danh sách tuyển dụng lọc `deadline >= hôm nay` (access chưa lọc); trang chi tiết tin hết hạn vẫn mở, hiện trạng thái "Hết hạn" + noindex, follow (DESIGN.md:305).

## Quyết định user 2026-10-18
- [x] G25: `job-postings.category` chuyển thành tuỳ chọn (đúng ERD §4.10); cập nhật test + migration nếu đổi NOT NULL.

## Follow-up từ review layer-6-task-03
- [x] Slug không tồn tại / bản ghi chưa có EN (`notFound()` trong page) trả 404 **có nội dung trong HTML server** (h1 đúng ngôn ngữ, header/footer), không phải shell `__next_error__` (giới hạn Next 16 — ARCH §5.1): kiểm tra ở proxy trước khi vào page, hoặc cách khác đã ghi ở ARCH §5.1; curl bằng chứng.

## Follow-up từ review layer-6-task-09
- [x] Chuyển `isPastDeadline` (`src/endpoints/public/job-applications.ts:42`, mở hết ngày deadline theo giờ VN, giả định date picker lưu 12:00) sang `src/lib/` và dùng chung cho bộ lọc danh sách + nhãn "Hết hạn"; kiểm giá trị thật date picker lưu.
