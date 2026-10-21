Agent: reviewer

# Review — feature-listing-detail-redesign · phase-1-task-07 · round 1

- Worktree: `D:\prj\bds\.claude\worktrees\agent-a62860a763ac97eb3` (branch `worktree-agent-a62860a763ac97eb3`, base 6fa7d26, chưa commit)
- Scope diff: `package.json` (+1 script), `scripts/backfill-listing-fields.ts`, `src/lib/backfill/{guard,projects,run,report,text,types}.ts` + 3 test, `docs/reports/backfill-listing-fields-2026-10-21.md`, task file. `src/payload-types.ts` chỉ EOL — bỏ qua.

## Review level
**STRICT**

## Reason
Bulk update dữ liệu (ghi hàng loạt qua Local API, `overrideAccess`), guard môi trường staging/prod, artifact báo cáo được commit vào repo; module thiết kế để mở rộng cho `property-posts` (P3-T05).

## Blast radius
- Dữ liệu collection `projects` (các ô `productTypes`, `featuredAmenities`, `products`) trên DB nơi script chạy.
- Hook `afterChange` của Projects (`reindexRentalsOnProjectRename` — chỉ khi đổi title; `revalidateHomepage` — ngoài Next chỉ log), hook dịch (`enqueue-translation`, `detect-manual-en`, `approve-english`) bị bỏ qua qua context `translationJob`.
- `docs/reports/` (file báo cáo, không bị gitignore → sẽ vào git).
- Không đụng API/UI/schema/migration/i18n.

## Verify commands + result (chạy trong worktree, DB `tami_wt52_p1t07`)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS — 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (ngoài diff) |
| `pnpm test src/lib/backfill` | PASS — 3 file, 24 test |
| `pnpm backfill:listing-fields` (dry-run, DB worktree — không chạy DB `tami`) | Chạy OK: `Dự án: quét 61, sẽ điền 0, lỗi 0` → xác nhận idempotent sau lần `--apply` của builder. **Tác dụng phụ:** lần dry-run này đã GHI ĐÈ báo cáo mẫu `docs/reports/backfill-listing-fields-2026-10-21.md` (bản `--apply` của builder) bằng bản dry-run "sẽ điền 0" — chính là lỗi F1 bên dưới. File untracked, builder cần sinh lại. |
| `pnpm test` (full) | không chạy lại (builder báo 371/373, 2 file integration lỗi hạ tầng, chạy riêng PASS); không có file nào import `src/lib/backfill` |

## Responsive Checklist Gate
N/A — diff không đụng UI (script CLI + lib thuần).

## Skill gates
- aislop: skip — `aislop` không có trong verify commands được phép của reviewer.
- oxlint (anti-slop): skip, oxlint not configured (không có trong `package.json`); `pnpm lint` (eslint) PASS.
- ocr (open-code-review): skip, ocr not installed / không trong lệnh được phép.
- AI-readable: OK — 1 indicator (`planProject` ~62 dòng > 50, `projects.ts:154-215`); regex `COUNT_TYPE` phức tạp nhưng có comment mô tả mẫu. < 3 indicators.
- ai-friendly-web: N/A — script nội bộ, không public.
- blitzstrike: N/A — không phải surface auth/API public/input.

## Kiểm theo trọng tâm STRICT
- **Guard** (`src/lib/backfill/guard.ts:18-35`): đủ 4 tầng NODE_ENV / APP_ENV allowlist / so khớp `DATABASE_URL_STAGING|PROD` / host allowlist (`localhost`, `127.0.0.1`, `::1`, `[::1]`). Không có cờ mở, không env bypass. Guard chạy trước `getPayload` (`scripts/backfill-listing-fields.ts:15-19`); `payload.config.ts:96` dùng đúng `env.DATABASE_URL` nên guard và kết nối thật cùng một biến. Lý do từ chối không in connection string. OK (xem F3 về tunnel).
- **Dry-run không ghi**: `run.ts:48` chỉ gọi `update` khi `apply`; test `run.test.ts:35-40`. OK.
- **`--apply` chỉ ô trống, không status/publish, không dịch AI**: patch chỉ chứa ô `isEmpty` (`projects.ts:170-208`); không gửi `status`; Projects không bật Payload versions/drafts (không có rủi ro publish bản nháp); context `translationJob: true` bỏ qua enqueue dịch (`enqueue-translation.ts:104`). OK.
- **Idempotent**: test + dry-run thực tế "sẽ điền 0". OK.
- **Quy tắc trích**: loại trừ cụm dễ nhầm hợp lý; nguồn mô tả/tổng quan = "trung bình" → vào "Cần admin soát"; `products` luôn "trung bình". OK.
- **Mở rộng P3-T05**: `BackfillAdapter` + `BACKFILL_ADAPTERS` — runner/report/CLI không cần sửa. OK.
- **package.json**: `"backfill:listing-fields": "payload run scripts/backfill-listing-fields.ts --"` — đã chứng minh chạy được; tham số lạ bị từ chối. OK.

## Findings

### [MAJOR] F1 — Báo cáo `--apply` bị ghi đè bởi mọi lần chạy sau cùng ngày → mất danh sách "Cần admin soát" của giá trị đã ghi
- `scripts/backfill-listing-fields.ts:30,37,39` — tên file chỉ theo ngày (`backfill-listing-fields-<YYYY-MM-DD>.md`), ghi đè vô điều kiện, cả dry-run.
- Hệ quả: sau `--apply`, một lần dry-run kiểm tra (hoặc `--apply` lại để xác nhận idempotent — đúng quy trình builder mô tả) thay báo cáo bằng bản "0 tin". Vì lần chạy sau bỏ qua ô đã có giá trị, các giá trị độ tin cậy "trung bình" đã ghi vào DB (false-positive tiềm năng) **không còn được liệt kê ở đâu** → admin không còn cách soát. Đã tái hiện thật: dry-run của reviewer đã xoá báo cáo mẫu apply trong worktree.
- Đây là artifact bắt buộc của spec ("xuất báo cáo cho admin soát") cho một thao tác bulk update.
- Fix đề xuất: tách tên theo chế độ + thời điểm (vd `backfill-listing-fields-<YYYY-MM-DD>-<HHmm>-apply.md` / `...-dry-run.md`), hoặc tối thiểu: dry-run ghi file riêng và `--apply` không bao giờ ghi đè một báo cáo apply đã tồn tại (thêm hậu tố). Cập nhật test/ghi chú task + sinh lại báo cáo mẫu.

### [MINOR] F2 — Báo cáo có thể chứa tên + đoạn nội dung của tin nháp, trong khi acceptance yêu cầu "đoạn nội dung công khai", và `docs/reports/` không bị gitignore
- `src/lib/backfill/projects.ts:213` (đánh dấu "(nháp)" nhưng vẫn đưa vào), `report.ts:40,44-47`.
- Dữ liệu hiện tại cả 61 dự án published nên chưa phát sinh; khi chạy trên DB có nháp, nội dung chưa công bố sẽ vào git.
- Fix: bỏ snippet (hoặc cả tin) nháp khỏi báo cáo, hoặc gitignore `docs/reports/backfill-*` và chỉ commit báo cáo mẫu đã soát.

### [MINOR] F3 — Guard không phân biệt port-forward/SSH tunnel tới DB xa qua `localhost`
- `guard.ts:24-33` — `DATABASE_URL=postgres://...@localhost:15432/tami_prod` (tunnel) qua được nếu chuỗi không trùng tuyệt đối `DATABASE_URL_PROD`. Task scope nêu "host/tên DB"; guard chỉ kiểm host.
- Fix (tuỳ chọn): so thêm tên DB (pathname) với tên DB trong `DATABASE_URL_STAGING/PROD` khi các biến này có mặt. Residual risk thấp (cần thao tác cố ý).

### [MINOR] F4 — Nhãn "Bỏ qua — không trích được gì cho ô trống" sai nghĩa khi tin có ô đã có giá trị + ô còn lại không trích được
- `report.ts:26` — trong báo cáo dry-run lần 2: 59 tin bị đếm "không trích được gì" dù 52 tin đã có `productTypes`. Fix: đổi nhãn thành "Không có gì để điền" hoặc tách hai dòng.

### [MINOR] F5 — `planProject` dài ~62 dòng (> 50)
- `projects.ts:154-215` — tách 3 nhánh (`planProductTypes`, `planFeaturedAmenities`, `planProducts`).

## Verdict
**FAIL** — còn 1 MAJOR (F1). Sửa F1 (bắt buộc), nên xử lý F2/F4 luôn; sinh lại báo cáo mẫu (bản cũ đã bị dry-run của reviewer ghi đè).
