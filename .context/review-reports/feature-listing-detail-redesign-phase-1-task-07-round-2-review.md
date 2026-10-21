Agent: reviewer

# Review — feature-listing-detail-redesign · phase-1-task-07 · round 2

- Worktree: `D:\prj\bds\.claude\worktrees\agent-a62860a763ac97eb3` (chưa commit, base 6fa7d26). `src/payload-types.ts` chỉ EOL — bỏ qua.
- Scope diff: `.gitignore` (+1 rule), `package.json` (+1 script), `scripts/backfill-listing-fields.ts`, `src/lib/backfill/{guard,projects,report,run,text,types}.ts` + 3 test, `docs/reports/backfill-listing-fields-2026-10-21-2233-apply.md`, task file (mục Attempt 2).
- Round 1: FAIL (F1 MAJOR, F2–F5 MINOR).

## Review level
**STRICT**

## Reason
Ghi hàng loạt dữ liệu qua Local API (`overrideAccess`), guard môi trường staging/prod, artifact báo cáo được commit vào repo, module dùng lại cho `property-posts` (P3-T05).

## Blast radius
- Dữ liệu collection `projects` (`productTypes`, `featuredAmenities`, `products`) trên DB nơi script chạy; hook afterChange của Projects (dịch bị bỏ qua qua context `translationJob`).
- `docs/reports/` (báo cáo apply vào git; dry-run bị gitignore) + `.gitignore`.
- Không đụng API/UI/schema/migration/i18n.

## Verify commands + result (trong worktree, `.env.local` DB `tami_wt52_p1t07`)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS — 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (ngoài diff) |
| `pnpm vitest run src/lib/backfill` | PASS — 3 file, 29 test |
| `git check-ignore -v` | `...-2233-dry-run.md` và `...-dry-run-2.md` bị ignore bởi `.gitignore:34`; `...-2233-apply.md` KHÔNG bị ignore (exit 1) — đúng ý |
| `pnpm backfill:listing-fields` (dry-run) | Không chạy lại: reviewer không có lệnh xoá file trong danh sách được phép, mà yêu cầu không để lại file dry-run. Thay bằng test `run.test.ts:128-144` (dry-run sau apply cùng phút không đè, apply lần 2 → `-2`) + bằng chứng md5 của builder. Báo cáo mẫu apply còn nguyên (md5 `525dd378a3c9a8aa41076da35f469b29`, header "Ghi thật (`--apply`)", 22:33 giờ VN). |

## Responsive Checklist Gate
N/A — diff không đụng UI (script CLI + lib thuần).

## Skill gates
- aislop: skip — không có trong danh sách verify command reviewer được phép chạy.
- oxlint (anti-slop): skip, oxlint not configured; `pnpm lint` (eslint) PASS.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — `planProject` còn 18 dòng (`projects.ts:212-229`); các hàm mới đều < 50 dòng; `MAX_SAME_MINUTE` có tên; comment nêu lý do (WHY). 0 indicator đáng kể.
- ai-friendly-web: N/A — script nội bộ.
- blitzstrike: N/A — không có surface auth/API public/input.

## Kiểm đóng findings round 1
| # | Kết quả | Bằng chứng |
|---|---|---|
| F1 MAJOR — báo cáo apply bị ghi đè | **Đóng** | `report.ts:17-25` tên theo `<YYYY-MM-DD>-<HHmm>-<apply\|dry-run>[-N]` (giờ VN, `hourCycle: h23`); `report.ts:30-42` ghi bằng `flag: "wx"`, `EEXIST` → hậu tố kế tiếp, lỗi khác ném lên, quá 50 lần → lỗi (không bao giờ ghi đè). Script dùng chung `now` cho tên file + `ranAt` (`backfill-listing-fields.ts:28-35`). Test tên file (kể cả qua nửa đêm UTC→VN) + không đè `run.test.ts:122-144`. |
| F2 — tin chưa xuất bản lộ tên/đoạn | **Đóng** | `DocPlan.isPublic` (`types.ts:30`, set `projects.ts:213` = `status === "published"`); `report.ts:45-46` chỉ `id` + "(ẩn — tin chưa xuất bản)" ở cả bảng chi tiết (`:80`) lẫn mục cần soát/lỗi (`:82-83`). Test `run.test.ts:110-116` (`not.toContain("bí mật")`). Dry-run gitignore `.gitignore:34`. Báo cáo mẫu: 0 dòng tin chưa xuất bản (61 dự án đều published). |
| F3 — guard tunnel | **Đóng** | `guard.ts:28-37` chuẩn hoá host lowercase, port mặc định 5432, tên DB decode + lowercase; `:47-54` trùng tên DB hoặc host:port với `DATABASE_URL_STAGING/PROD` → chặn; biến có mặt mà không parse được → chặn (`:51`). Thứ tự: so env guarded trước, rồi allowlist host (`:55`). Lý do không chứa chuỗi kết nối. Test `guard.test.ts:25-32`. |
| F4 — nhãn đếm sai nghĩa | **Đóng** | `report.ts:52-62` tách "mọi ô đã có giá trị" / "có ô trống nhưng không trích được"; cột trường "Ô trống, không trích được". Test `run.test.ts:101-108`. |
| F5 — `planProject` > 50 dòng | **Đóng** | `projects.ts:169-229` tách `planProductTypes` / `planFeaturedAmenities` / `planProducts` + `FIELD_PLANNERS`; test cũ vẫn PASS. |

## Kiểm hồi quy
- Dry-run không ghi DB: `run.ts:46` chỉ `update` khi `options.apply`; test `run.test.ts:39-44`. OK.
- Apply chỉ ô trống: `planProject` bỏ qua ô `!isEmpty` (`projects.ts:215-218`), patch chỉ chứa ô "fill"; test `run.test.ts:46-60` (keys đúng 3 ô, tin "b" giữ nguyên, chạy lại 0 update). OK.
- Không status/publish: patch không có `status`, test `:53`. OK.
- Không dịch AI: `context: { [TRANSLATION_JOB_CONTEXT_KEY]: true }` (`run.ts:55`), test `:51`. OK.
- Guard trước `getPayload` (`backfill-listing-fields.ts:14-18`). OK.

## Findings

### [MINOR] N1 — Khi `--apply` có tin ghi lỗi, bảng "Chi tiết giá trị đã điền" và cột "Đã điền" theo trường vẫn tính tin đó
- `report.ts:66-68` (đếm `fieldStates === "fill"` không trừ `p.error`), `report.ts:78-80` (rows lấy mọi `hasPatch`, kể cả `p.error`).
- Dòng tổng `filledCount` (`:54`) đã trừ lỗi và lỗi được liệt kê ở "Cần admin soát", nên admin vẫn biết — nhưng bảng chi tiết ghi "Đã điền" cho giá trị chưa ghi. Báo cáo mẫu hiện tại "lỗi 0" nên không ảnh hưởng.
- Fix đề xuất: ở chế độ apply loại `p.error` khỏi rows/đếm theo trường (hoặc thêm cột/ghi chú "chưa ghi — lỗi").

### [MINOR] N2 — Guard chặn DB dev `tami` nếu dev chép `DATABASE_URL_STAGING/PROD` từ `.env.example` vào `.env.local`
- `.env.example:95-96` đặt tên DB `tami` cho staging/prod, trùng tên DB dev `tami` (`.env.example:6`) → `guard.ts:52` chặn. Builder đã ghi rõ đây là đánh đổi cố ý (an toàn hơn), lý do in rõ; `.env.local` gốc hiện không khai 2 biến này nên không vướng. Chỉ ghi nhận — không cần sửa; có thể thêm 1 dòng hướng dẫn trong header script.

## Residual risk
- Reviewer không tự chạy dry-run thật (ràng buộc không để lại file + không có lệnh xoá được phép); dựa vào unit test cờ `wx` và md5 do builder báo.
- Guard vẫn dựa vào env của chính tiến trình (để trống biến staging/prod là bỏ qua bước so) — chấp nhận được vì vẫn còn allowlist host cục bộ + chặn NODE_ENV/APP_ENV, và việc vượt cần thao tác cố ý.

## Verdict
**PASS** — F1 (MAJOR) và F2–F5 đã đóng có test; không hồi quy; typecheck/lint/vitest PASS. Còn 2 MINOR (N1, N2) không chặn.
