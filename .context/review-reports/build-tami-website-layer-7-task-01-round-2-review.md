Agent: reviewer

# Review: build/tami-website · layer-7-task-01 (property-posts + expire-offers) · round 2

- **Review level:** STRICT
- **Reason:** giống round 1: schema/migration (bảng mới + `ALTER TYPE` enum jobs, `down` có `DELETE` dữ liệu jobs), RBAC sale/admin, cron/background job, endpoint nội bộ có xác thực, nginx/compose dùng chung, validator ảnh bìa dùng chung.
- **Blast radius:** như round 1 (PropertyPosts, `src/fields/cover-image.ts` dùng chung News/Services/PropertyPosts, ward/province guards, jobs `expire-offers`/`close-job-postings`, route `/api/internal/revalidate` + client, env, allowlist public-queries, migration `20261018_075627_property_posts`, 3 nginx conf, compose staging/prod, docs API_SPEC/ARCHITECTURE/ERD). Round 2 thêm: `down` của migration xoá dòng `payload_jobs`/`payload_jobs_log` có `task_slug='expire-offers'`; test mới `tests/integration/property-posts-migration.test.ts` (DB tạm riêng).
- **Diff scope:** `git status` HEAD `0368b5d`, cùng tập file với round 1, chỉ thêm `tests/integration/property-posts-migration.test.ts` (bỏ qua `.claude/launch.json`, `.context/`).

## Verify commands + result (từ `.context/project-config.md`)

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 147 file, 1.582 test, 0 skip (so với round 1: +1 file migration, +3 test = migration up/down/up + warn 500/499) |
| `pnpm build` | PASS; còn route `ƒ /api/internal/revalidate` |
| `pnpm payload migrate` | không chạy (reviewer không chạy migration trên DB dev); `down` được kiểm bằng test integration chạy SQL thật trên DB tạm |

## Đóng finding round 1

| Finding | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-1 `DROP CONSTRAINT` thiếu `IF EXISTS` sau `DROP TABLE ... CASCADE` | **Đã đóng** | `migrations/20261018_075627_property_posts.ts:223` giờ là `DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_property_posts_fk"` (cùng quy ước với `20261017_143212_rentals.ts`). `DROP INDEX ...property_posts_id_idx` (`:236`) vẫn không có IF EXISTS nhưng đúng: index nằm trên `payload_locked_documents_rels`, CASCADE không xoá nó; test chạy `down` thật qua đến cuối. |
| MINOR-1 dựng lại enum jobs lỗi khi còn dòng `expire-offers` | **Đã đóng** | `:225-227` xoá `payload_jobs_log` rồi `payload_jobs` với `task_slug::text = 'expire-offers'` trước khi đổi kiểu cột/dựng lại enum. Test chèn một job `expire-offers` pending rồi gọi `down` → pass, enum không còn nhãn `expire-offers`. |
| MINOR-2 job cắt im lặng ở trần 500 | **Đã đóng** | `src/jobs/expire-offers.ts:43-45` `logger.warn` khi `docs.length >= MAX_EXPIRED_PER_RUN`, vẫn revalidate phần đã lấy; `src/jobs/expire-offers.test.ts:25-37` có test 500 (warn 1 lần) và 499 (không warn). |
| MINOR-3 lỡ một lần chạy thì dựa ISR | Chấp nhận (round 1 đã ghi là không chặn) | không đổi |

## `DELETE` trong `down` có an toàn không

- Chỉ đụng dòng có `task_slug = 'expire-offers'` = task mà migration này thêm vào enum; job/log của task khác không bị đụng. Xoá log trước rồi mới xoá job (log là bảng con của `payload_jobs`), nên log của job khác loại mà mang slug này (trường hợp workflow) cũng được xoá, cast enum không thể lỗi.
- Hậu quả: mất lịch sử chạy và job pending đã lên lịch của `expire-offers`. Chấp nhận được, vì rollback migration nghĩa là gỡ cả task khỏi code; task chỉ revalidate cache, không ghi dữ liệu nghiệp vụ. Hậu quả đã ghi ở comment SQL `:225`. Không phải `HIGH_RISK_MIGRATION`: `up` vẫn additive, `down` chỉ chạy khi rollback có chủ đích.

## Test migration có chạy thật và cô lập không

- `describe.skipIf(!DATABASE_URL_TEST)`: lần chạy này báo 0 skip, 147/147 file pass, nên test có chạy.
- Cô lập: tạo DB riêng `tami_pp_mig_<timestamp base36>`, trỏ `DATABASE_URL` vào DB đó trước khi import config (vitest cách ly theo file mặc định, repo không cấu hình `isolate`/`pool`), chạy toàn bộ migrations, rồi `DROP DATABASE ... WITH (FORCE)` ở `afterAll`. Theo đúng mẫu `news-migration.test.ts`.
- Test có ý nghĩa: chèn job `expire-offers` → `down` (bắt được cả MAJOR-1 lẫn MINOR-1 nếu bị gỡ) → kiểm `property_posts` mất + nhãn enum mất → `up` lại → bảng có lại.

## Responsive Checklist Gate

N/A: diff không đụng UI (không route/component/CSS công khai).

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip, `aislop` chưa cài (giống round 1) |
| oxlint (anti-slop) | skip, oxlint chưa cấu hình; ESLint + tsc PASS |
| ocr (open-code-review) | skip, ocr chưa cài |
| AI-readable | OK: `expire-offers.ts` 72 dòng, test migration 68 dòng, hàm ≤ 50 dòng, hằng số có tên, comment ghi WHY (`:42`, migration `:225`). 0 indicator |
| ai-friendly-web | N/A (không có thay đổi web public) |
| blitzstrike | skip, không cài; route nội bộ đã review thủ công ở round 1, round 2 không đổi |

## Findings

Không còn CRITICAL hay MAJOR.

### [MINOR-1] Test migration chưa phủ nhánh `payload_jobs_log`
- `tests/integration/property-posts-migration.test.ts:58` chỉ chèn `payload_jobs`, không chèn dòng `payload_jobs_log` có `task_slug='expire-offers'`, nên chưa có test nào bắt được việc `DELETE FROM "payload_jobs_log"` (`migration :226`) bị gỡ. Hiện vẫn đúng vì có xoá log trước. Đề xuất (không chặn): chèn thêm một dòng log cho một job khác loại có `task_slug='expire-offers'`, và assert cột `payload_locked_documents_rels.property_posts_id` đã bị bỏ sau `down`.

### [MINOR-2] Hậu quả của `DELETE` chỉ ghi ở comment SQL
- Task file `tasks/tami-website/layer-7-task-01.md` (Notes/Doc impact) chưa ghi rằng rollback migration này xoá lịch sử và job pending của `expire-offers`. Đề xuất ghi một dòng ở close-out (residual/rollback note) để người chạy runbook rollback biết.

## Residual risk
- Reviewer không chạy `migrate:down`/`migrate` trên DB dev; builder báo đã chạy OK. Bằng chứng kiểm được là test integration chạy SQL `down`/`up` thật trên DB tạm, và test này pass.
- Migration trước (`close_job_postings_task`) có thể còn mẫu dựng lại enum mà không xoá dòng `close-job-postings` trước. Chưa kiểm vì ngoài scope; đề xuất task riêng nếu cần rollback sâu hơn L7.
- Các residual của round 1 vẫn còn: e2e `jobs → app:3000` trong Docker, dữ liệu `services.coverImage` do admin nhập trên staging, các tool aislop/ocr/oxlint/blitzstrike chưa có.

## Verdict
**PASS**: MAJOR-1, MINOR-1 và MINOR-2 của round 1 đã đóng đúng, có test chạy thật chứng minh. Không có lỗi mới mức CRITICAL/MAJOR. lint/typecheck/test (1.582, 0 skip)/build PASS. Hai MINOR mới không chặn, có thể xử lý ở close-out.
