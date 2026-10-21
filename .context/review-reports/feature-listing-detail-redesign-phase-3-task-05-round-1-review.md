Agent: reviewer

# Review — feature-listing-detail-redesign · phase-3-task-05 · round 1

- Task: `tasks/feature-listing-detail-redesign/phase-3-task-05.md` (BL-052, backfill Tin BĐS + MINOR P1-T07 r2 N1 `report.ts`)
- Worktree: `D:\prj\bds\.claude\worktrees\agent-a2688a4fbacb121db` (branch `worktree-agent-a2688a4fbacb121db`, base staging 1f51ecd), code chưa commit
- Review level: **STRICT**
- Reason: bulk update dữ liệu (script `--apply` ghi hàng loạt vào `property-posts`), có regex trích dữ liệu có thể điền sai nghĩa, và sửa shared report renderer dùng cho cả `projects`.
- Blast radius: `scripts/backfill-listing-fields.ts` (chỉ đổi comment), `src/lib/backfill/{property-posts.ts (mới), run.ts, report.ts, types.ts}`, test. Dữ liệu: các trường `propertyType, areaM2, bedrooms, bathrooms, houseDirection, frontageM, floors, address` của `property-posts` trên DB dev (locale `vi`). Báo cáo `projects` bị ảnh hưởng qua `report.ts` (N1). Không đụng `src/collections/*`, không migration, không file P3-T02/P3-T04. `src/payload-types.ts` chỉ đổi EOL (bỏ qua).

## Verify commands + result (chạy trong worktree, `.env.local` → `tami_wt52_p1t07`)

| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS (0 error; 2 warning có sẵn ở `tools/task-dashboard/server.mjs`, ngoài diff) |
| `pnpm test` (full) | 379/383 file PASS; 4 file integration FAIL do `beforeAll` timeout 10s khi chạy song song (access, jobs-email, media-upload, session-refresh) |
| Chạy riêng 4 file integration đó | PASS cả 4 (25 + 5 + 20 + 5 test) → lỗi do môi trường, không liên quan diff |
| `pnpm test src/lib/backfill` | 4 file, 48 test PASS |
| `pnpm backfill:listing-fields` (dry-run, DB worktree) | exit 0 — Dự án: quét 61 / sẽ điền 0; Tin BĐS: quét 38 / sẽ điền 0 / lỗi 0 → xác nhận chạy lại sau `--apply` không còn gì để ghi (idempotent). Tạo file dry-run report trong `docs/reports/` (gitignore, đúng thiết kế) |
| `pnpm build` | skip — builder báo PASS; diff không đụng route/UI/config build |
| `--apply` | KHÔNG chạy (theo giới hạn được giao) |

## Kiểm riêng theo yêu cầu

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Guard dev-only | OK | `scripts/backfill-listing-fields.ts` chỉ đổi comment; `checkBackfillEnvironment` giữ nguyên; adapter mới đi qua cùng entry nên vẫn bị chặn khi không phải DB dev. |
| Chỉ ghi ô trống, không đè admin | OK | `property-posts.ts:243,254` — `hasValue` (chuỗi trắng = trống, 0 = đã có); test `property-posts.test.ts:126-130` + `run.test.ts` (p3 đã đủ giữ nguyên). |
| Không đổi `_status` / version publish | OK | `property-posts` không bật drafts (`content-defaults.ts:206` `drafts: false`), `run.ts:53-61` chỉ gửi `data: plan.patch` (không có `status`), giống P1-T07; context `TRANSLATION_JOB_CONTEXT_KEY` chặn job dịch. |
| Dry-run không ghi | OK | `run.ts:49` chỉ `update` khi `apply`; test `run.test.ts` (update not called); dry-run thật trên DB worktree exit 0. |
| Phạm vi `--collection` | OK | `parseBackfillArgs` mặc định = mọi adapter, `--collection property-posts` chỉ một; slug lạ ném lỗi; test cập nhật. |
| N1 (P1-T07 r2) | OK | `report.ts:50` `isWritten` loại tin ghi lỗi khỏi tổng "Đã điền", cột theo trường và bảng chi tiết; tin lỗi chỉ ở "Lỗi khi ghi" + "Cần admin soát"; `noFill` loại tin `skipped`. Test `run.test.ts` "báo cáo --apply khi có tin ghi lỗi". Các dòng tổng cộng lại = số tin quét. |
| Bỏ qua tin voucher | OK | `isOfferPost` (`offer.endAt` / `offer.voucherCode`, chuỗi trắng không tính); báo cáo apply: 1 tin bỏ qua. |
| Nguồn mâu thuẫn → không điền + soát | OK | `uniqueValue`; báo cáo apply: 96m2 "Đông Nam · Tây Bắc", diện tích "200–600 · 200", khoảng "75–120" đều không điền. |
| Không sửa collections / migration / file P3-T02, P3-T04 | OK | `git status --short`: chỉ `scripts/backfill-listing-fields.ts`, `src/lib/backfill/*`, `src/payload-types.ts` (EOL). |

### Đối chiếu giá trị đã điền trong báo cáo apply (37 tin / 0 lỗi)
Đọc hết bảng "Chi tiết giá trị đã điền": các giá trị khớp tiêu đề/nội dung, không thấy giá trị sai nghĩa. Ca dễ sai đều xử lý đúng: "hướng Tây tứ trạch" không thành hướng; "ban công hướng …" không thành hướng nhà (chỉ điền khi nội dung ghi "Hướng: …", độ tin cậy trung bình, có ghi soát); căn hộ không trích số tầng; hướng đứng trần ("- Tây Nam") chỉ gợi ý; "Phòng ngủ: 3⏎Phòng tắm: 2" không đọc nhầm (`richTextToPlain` nối block bằng `\n`, `H` không gồm xuống dòng).

### Hai lựa chọn số tầng
- **Lưu 3.5 tầng:** chấp nhận. `floors` là `nonNegativeNumber` (cho số thập phân; apply 0 lỗi), đúng cách người bán viết và hiển thị `{count} tầng` vẫn đọc được.
- **"3 tầng 1 tum" → 3:** chấp nhận (tum không phải tầng đủ, cùng quy tắc "lửng không tính"). Lưu ý: "3.5 tầng" và "3 tầng 1 tum" thường cùng mô tả một kiểu nhà nhưng nhận 3.5 và 3 → nếu sau này lọc/so sánh theo số tầng sẽ lệch. Xem N2.

## Responsive Checklist Gate
N/A — diff không đụng UI (chỉ script/lib backfill + test).

## Skill gates
- aislop: skip, `aislop` chưa cài (`command -v aislop` không có).
- oxlint (anti-slop): skip, oxlint chưa cấu hình (không có `.oxlintrc*`); ESLint `pnpm lint` 0 error.
- ocr (open-code-review): skip, `ocr` chưa cài.
- AI-readable: OK — 1 indicator (`property-posts.ts` 307 dòng, hơi quá 300); hàm đều ≤ 50 dòng; ngưỡng/magic number đặt tên (`MAX_AREA`, `MAX_FLOORS_FILL`…); regex có comment nói lý do. < 3 indicator.
- ai-friendly-web: N/A (script nội bộ, không public).
- blitzstrike: N/A (không phải auth/API public/input; script dev-only).

## Findings

**[CRITICAL]** — không có.

**[MAJOR]** — không có.

**[MINOR]**
- **N1 — Regex hướng nhà không loại địa danh** (`src/lib/backfill/property-posts.ts:147`). `DIRECTION_RE` có lookahead `END` chỉ chặn chữ dính liền, nên "view hướng Tây Hồ" → `W`, "đường hướng Bắc Ninh" → `N`, độ tin cậy "cao" (không ghi soát) nếu nằm ở tiêu đề. `BARE_DIRECTION_RE` (dòng 150-152) đã có danh sách loại địa danh nhưng regex chính thì không. Dữ liệu dev hiện tại không có ca này (đã soát 20 giá trị hướng đã điền). Cách sửa: dùng chung negative lookahead địa danh cho `DIRECTION_RE`/`BALCONY_RE`, thêm test "hướng Tây Hồ". Tương tự mặt tiền: `FRONTAGE_RES[1]` (dòng 174) nhận "cách 50m mặt tiền đường …" thành `frontageM = 50`; nên yêu cầu ngữ cảnh không có "cách" đi trước, hoặc đưa vào mục soát.
- **N2 — Số tầng nửa tầng / tum không có ghi chú soát** (`property-posts.ts:178-186`). "3.5 tầng" → 3.5 và "3 tầng 1 tum" → 3 đều điền với độ tin cậy "cao" mà không có ghi chú, dù cùng kiểu nhà có thể nhận hai giá trị. Đề xuất: thêm ghi chú soát khi giá trị có ".5" hoặc theo sau là "tum", để admin chuẩn hoá theo một quy ước.
- **N3 — Bỏ mất ngữ cảnh "ban công" khi hướng ban công trùng hướng trong nội dung** (`property-posts.ts:165-166`). Tiêu đề Starlake ghi "ban công hướng Tây Nam", nội dung ghi "Hướng: Tây Nam" → điền SW; ghi chú "Hướng ban công …" bị ẩn vì cùng giá trị, nên người soát chỉ thấy "Soát: Tây Nam (trích từ nội dung)" mà không biết tiêu đề nói đó là hướng ban công. Đề xuất: khi trùng, thêm vào ghi chú soát rằng tiêu đề mô tả hướng ban công.
- **N4 — File dài 307 dòng** (`src/lib/backfill/property-posts.ts`), quá chuẩn ≤ 300. Đề xuất: tách phần regex + `plan*` (diện tích/phòng/hướng/tầng) sang `property-posts-extract.ts`.

## Residual risk
- `--apply` trên DB dev chính (`tami`) do primary chạy sau merge; reviewer chỉ đối chiếu được báo cáo apply của DB worktree + dry-run DB worktree. Nếu dữ liệu `tami` khác bản clone, nên chạy dry-run trên `tami` trước và soát nhanh bảng chi tiết (đặc biệt hướng nhà/mặt tiền theo N1).
- Việc "trạng thái bài không đổi, không sinh job dịch" sau apply dựa trên code (`run.ts` không gửi `status`, collection không bật drafts, có context chặn job dịch) + báo cáo builder; reviewer không truy vấn DB trực tiếp.
- `pnpm build` không chạy lại (builder báo PASS; diff không đụng phần build).

## Verdict
**PASS** — không có CRITICAL/MAJOR. 4 MINOR (N1-N4) chuyển thành follow-up, không chặn merge.
