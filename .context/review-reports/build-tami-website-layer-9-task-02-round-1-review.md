Agent: reviewer

# Review — build/tami-website · layer-9-task-02 · round 1

- Review level: **STRICT**
- Reason: endpoint công khai nhận PII, chống trùng bằng advisory lock + transaction Payload, tự giao lead, xếp job email; sửa validator dùng chung (`Leads.ts` `assignedTo`, `lead-activity-hooks.ts` `guardManualActivity`).
- Blast radius: `POST /api/public/leads` (mọi form công khai: rental / property_post / project / contact), collection `leads` + `lead-activities` (admin form, `POST /api/admin/leads/:id/assign` của L9-T03, ghi chú tay của L8-T02), `payload-jobs` (`send-notification-email`: `new-lead`, `lead-assigned`), `src/shared/types/api.ts` (`leadInputSchema` dùng chung client/server), `payload.config.ts` (đăng ký endpoint), docs `API_SPEC.md` §3.1 + `ARCHITECTURE.md` §5.2.
- Scope: diff chưa commit trên HEAD 7d1907f (bỏ qua `.claude/launch.json`, `.context/`).

## Verify commands + result

| Lệnh (`.context/project-config.md`) | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (toàn bộ) | PASS — 184 file / 1993 test, exit 0, không có test bị skip (integration chạy DB tạm thật, gồm `tests/integration/leads-public.test.ts`, `leads.test.ts`, `lead-assign.test.ts`) |
| `pnpm build` | PASS (exit 0) |
| `pnpm install --frozen-lockfile` | không chạy (diff không đụng package.json/lockfile) |
| migration | N/A — task không đụng schema, không có migration mới |

## Kiểm tra theo yêu cầu đặc biệt

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Thứ tự rate limit → Turnstile → zod → nguồn công khai | OK | `public-pipeline.ts:58-93`; body chỉ đọc trong `readToken` (sau rate limit); test `leads.test.ts:97-112` (429 không gọi Turnstile, captcha sai không chạm `find`) |
| Rate limit trước mọi truy vấn DB | OK | Truy vấn đầu tiên là `isPublicSource` trong `processLead` (`leads.ts:122`), sau pipeline |
| Validate độ dài/định dạng, chặn trường lạ | OK | `api.ts` `leadInputSchema`: tên 2-100, SĐT VN qua `normalizePhone` → E.164, email ≤254, message ≤1000, `source` enum, `sourceId` uuid; trường lạ bị zod strip, `data` lead dựng tường minh (không mass-assignment); body >16k → 400 |
| Consent bắt buộc + version | OK | `z.literal(true)`; `consentAt` + `consentVersion` = `privacyPolicyVersion` (fallback `unknown` + warn) |
| ipHash không lưu IP thô | OK | HMAC từ pipeline; integration `leads-public.test.ts:263-265` |
| PII không vào log/error/response | OK | log chỉ `errorName` / `leadId`; `details` chỉ tên trường; test `leads.test.ts:139-144, 194-201` |
| Không lộ tồn tại lead qua response/mã lỗi | OK | 200 byte-identical (integration `:335-343`, đồng thời `:412-422`); nguồn nháp/xoá/không có/sai loại → cùng 400 (`:437-445`) |
| Không lộ qua thời gian phản hồi | Residual (MINOR #1) | nhánh tạo làm thêm ~4-6 truy vấn so với nhánh gộp |
| Advisory lock | OK | `pg_advisory_xact_lock` trên `session.db` của chính transaction (`create-or-merge.ts:27-33`), tự nhả khi commit/rollback; key là BigInt từ SHA-256 (không chứa SĐT, không injection); va chạm hash chỉ làm xếp hàng thừa, không sai dữ liệu; mỗi request giữ 1 khoá → không deadlock giữa advisory lock; test 5 request đồng thời → 1 lead, mergedCount 4 |
| Transaction bao job queue + hook | OK | `createLocalReq` + `initTransaction`; `payload.jobs.queue({ req })` (`create-or-merge.ts:103-118`) và hook `on-assignment-change.ts:39-52, 71-89` đều truyền `req`; rollback test `:318-331` |
| Dedupe | OK | `dedupe.ts:28-39`: phoneNormalized + source + ref nguồn + `createdAt ≥ now-7d` + status ∉ won/lost/spam; trash mặc định loại; test ngày 6/8, won/lost/spam/trashed, contacted/consulting |
| Merge | OK | `mergedCount` đọc dưới khoá rồi +1; activity `merged` trong `asSystemActivity`; không lead mới, không email |
| Tự giao | OK | `assign.ts`: chỉ `rental`/`property_post`, `isAssignableSale(author)`; sale khoá / project / contact → trống (integration `:288-303`); `rented` vẫn nhận + tự giao (`:269-286`) |
| N+1 | OK | Số truy vấn cố định/request, không vòng lặp DB |
| Follow-up L8-T02 (lead non-UUID) | OK | `lead-activity-hooks.ts`: sale → 403, admin chuỗi sai → 400; test `leads.test.ts:357-366` |
| Follow-up L9-T03 (`assignedTo` non-UUID, sale khoá giữ nguyên, object `{id}`) | OK | `Leads.ts:110-111` `isUuid` trước `findByID`; test `lead-assign.test.ts:242-279` |
| Không phá L8-T02/L9-T03 | OK | Full suite PASS |
| Lỗi theo locale, giữ chữ "captcha" vi/en (G3) | OK | `localizePipelineFailure`; test `leads.test.ts:114-126` |
| Docs | OK | `API_SPEC.md` §3.1 (thêm `referrer`, cắt 2000, as-built), `ARCHITECTURE.md` §5.2 as-built; không hạ cấp intent |

## Responsive Checklist Gate

N/A — diff không đụng UI (chỉ endpoint/lib/hook/collection/test/docs).

## Skill gates

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| aislop | skip, aislop not installed | `which aislop` không có |
| oxlint (anti-slop) | skip, oxlint not configured | không có `.oxlintrc*`; ESLint + tsc PASS |
| ocr (open-code-review) | skip, ocr not installed | `which ocr` không có |
| AI-readable | OK (0 indicator) | file ≤174 dòng, hàm ≤35 dòng; hằng số có tên (`MAX_BODY_CHARS`, `DEDUPE_WINDOW_MS`…); comment giải thích WHY; docs as-built cập nhật luồng chính |
| ai-friendly-web | N/A | endpoint API, không phải trang public |
| blitzstrike | skip, không có MCP/môi trường pentest được phép | — |

## Findings

Không có CRITICAL / MAJOR.

- **[MINOR] #1 Timing side channel tạo vs gộp** — `src/lib/leads/create-or-merge.ts:144-150`: nhánh tạo chạy thêm 2 `findByID` (tin + staff), create lead kèm hook (activity assignment + job `lead-assigned`) và job `new-lead`; nhánh gộp chỉ update + 1 activity. Về lý thuyết có thể đoán "SĐT X đã gửi cho tin Y trong 7 ngày" qua độ trễ. Đã được giảm mạnh bởi Turnstile + rate limit 5/10 phút/IP, và mỗi lần dò tự tạo/gộp lead (để lại dấu vết). Đề xuất (tuỳ chọn): ghi residual risk vào task; hoặc đệm thời gian phản hồi tối thiểu cố định (vd ≥ p95 nhánh tạo).
- **[MINOR] #2 Test rollback không đi qua job `new-lead`** — `tests/integration/leads-public.test.ts:318-331`: `body()` mặc định là `rental` của saleA nên lần `jobs.queue` đầu tiên (bị mock lỗi) là `lead-assigned` trong hook, không phải `new-lead` ở `queueNewLeadEmail`. Kết quả rollback vẫn đúng, nhưng nhánh lỗi của `new-lead` chưa được kiểm trực tiếp. Fix: thêm 1 case `source: "project"` (hoặc `contact`) để lỗi rơi vào `queueNewLeadEmail`.
- **[MINOR] #3 Admin gửi `lead` dạng object/số sai dạng** — `src/hooks/leads/lead-activity-hooks.ts:42-46`: nhánh admin chỉ chặn chuỗi non-UUID; `{ id: "bad" }` hoặc số rơi về validator relationship mặc định của Payload (chưa có test xác nhận 400 thay vì 500). Fix: dùng cùng helper trích id như `assigneeId` rồi `isUuid`, thêm test admin với object.
- **[MINOR] #4 Giới hạn body khi không có `Content-Length`** — `src/endpoints/public/leads.ts:44-47`: request chunked bị đọc hết vào bộ nhớ trước khi so `MAX_BODY_CHARS`. Nginx `client_max_body_size` ở hạ tầng giảm thiểu; ghi nhận residual hoặc đọc stream có giới hạn.

## Residual risk

- Timing side channel (#1) chỉ đánh giá bằng đọc code, không đo được trong quyền reviewer.
- Pipeline/rate-limit/Turnstile thật (Redis, Cloudflare) được giả lập trong test; thứ tự đã kiểm qua code + unit test.

## Verdict

**PASS** — không còn CRITICAL/MAJOR; 4 MINOR chuyển builder xử lý tuỳ chọn / ghi follow-up.
