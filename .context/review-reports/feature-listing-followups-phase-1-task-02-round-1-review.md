Agent: reviewer

# Review — feature-listing-followups · phase-1-task-02 · round-1 (BL-055: C-5 / C-6 / C-7 / C-8)

- **Review level:** NORMAL
- **Reason:** không migration (kiểm `git status` + `migrations/` sạch — file mới nhất vẫn là `20261022_110146_project_detail_blocks`), không đổi API contract/schema/auth. C-8 đụng helper backfill nội bộ (script, không phải runtime public) nhưng hành vi đổi có chủ ý đã ghi + test; C-7 chỉ config vitest; C-5 EN chỉ thêm test. Không có risk đỏ → không cần STRICT.
- **Blast radius:** `vitest.config.ts` (project `integration`, hookTimeout), `src/lib/backfill/property-posts.ts` (+ `.test.ts`; caller duy nhất là `planPropertyPosts` cùng file :102 qua `toPropertyPostSource` — grep `src/scripts/tests` không có caller khác của `isOfferPost`/`planPropertyPost`), `tests/integration/rental-search.test.ts` (describe số đếm Tiện ích), task file (số đo C-5, quyết định không index).

## Verify commands + result (từ `.context/project-config.md`)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `npx eslint vitest.config.ts src/lib/backfill/property-posts.ts src/lib/backfill/property-posts.test.ts tests/integration/rental-search.test.ts` | PASS (0 lỗi) |
| `pnpm vitest run --project unit src/lib/backfill/property-posts.test.ts` | PASS 21/21 (gồm ca mới "endAt không parse được") |
| `pnpm vitest run --project integration tests/integration/rental-search.test.ts` | PASS 48/48 (gồm ca EN mới), 10,2 s |
| `pnpm test` full ×2 / `pnpm build` | không chạy lại (builder báo 419 file / 4.391 test PASS ×2, build PASS) — chấp nhận vì scope test đã tự chạy PASS; ghi residual |
| `git status --short migrations/` | sạch — không file migration lạ |

## Findings

### Kiểm theo yêu cầu
1. **C-8 (`property-posts.ts`)**: `isOfferPost` + `hasValue(endAt)` bỏ hẳn, `planPropertyPost` gọi `hasPostOffer(post)` (`post-kind.ts:18`). `PropertyPostSource.offer?: PropertyPost["offer"]` khớp `Pick<PropertyPost,"offer">` — không `as any`, typecheck PASS. `toPropertyPostSource` truyền `doc.offer` thẳng (bỏ `?? null`, đúng vì `PropertyPost.offer` không nhận `null`). Khác biệt có chủ ý "endAt rác không còn bị bỏ qua" ghi ở doc comment hàm + task § Verification summary + test `:169-173`. Không còn logic trùng. Caller khác: chỉ `planPropertyPosts` cùng file (:102) → kiểu đúng. OK.
2. **C-5 EN test (`rental-search.test.ts:704-714`)**: ngữ nghĩa đúng — tin b (fixture `:165`, chỉ `gym`, không có bản EN) chèn tạm `pool` order=2 → `/vi` đếm `pool 2, gym 2`; `/en` chỉ tin a (`:177-183` hasEnglish) → `pool 1, gym 1, elevator 1, kitchen 0`. Dọn ở `finally` theo `parent_id + order = 2` (b chỉ có 1 tiện ích gốc order 0 → không xoá nhầm). Ca kế tiếp (`:715`) không phụ thuộc amenities. OK.
3. **C-7 (`vitest.config.ts:39-40`)**: `hookTimeout: 60_000` chỉ trong project `integration` (unit/ui không đổi), kèm comment WHY. `testTimeout` giữ 30 s → hook timeout 60 s chỉ nới cho `beforeAll` (getPayload + tạo DB + seed), không che lỗi của từng test. File rental-search vẫn đặt `180_000` riêng cho `beforeAll` (`:184`) — không mâu thuẫn. OK.
4. **C-5 đo**: bảng số đo nhất quán và lập luận hợp lý — truy vấn không có predicate trên `value`, đọc toàn bộ `rentals_amenities` → Hash Join trên Seq Scan rẻ hơn index; chi phí ở Sort external merge (temp 930 blocks) cho `count(DISTINCT r.id)` mà index gộp không chạm; ca `province` đã dùng `parent_idx` và < 50 ms. Kết luận KHÔNG index đúng ngưỡng task. Không có migration còn sót. C-6 bỏ qua có căn cứ (không có lọc bản đồ).
5. **Surgical diff**: mọi hunk trace về C-5/C-7/C-8; không drive-by refactor.

### Issues
- Không có CRITICAL / MAJOR.
- **[MINOR]** `tests/integration/rental-search.test.ts:707` — assert `/vi` dùng `toMatchObject({ pool: 2, gym: 2 })` không khẳng định `elevator: 1` như ca `/en`; không sai nhưng nếu muốn đối xứng có thể thêm. Không chặn.

## Skill gates
- aislop: `skip, aislop not installed` (không có trên PATH).
- oxlint (anti-slop): `skip, oxlint not configured` (không có `.oxlintrc.json`); thay bằng eslint scope 0 lỗi.
- ocr (open-code-review): `skip, ocr not installed`.
- AI-readable: OK — 0 indicator (tên rõ, hàm < 50 dòng, comment WHY, không magic number mới ngoài `60_000` có comment).
- ai-friendly-web: N/A (không public-facing).
- blitzstrike: N/A (NORMAL, không auth/input public).
- Responsive Checklist Gate: N/A — diff không đụng UI.

## Residual risk
- Không kiểm trực tiếp DB dev (`count(*) BENCH-%` = 0, index tạm đã DROP): Bash chỉ được chạy verify commands; tin theo báo cáo builder (BENCH=0, amenities=122, index tạm 0). Nếu còn index tạm trên dev thì chỉ ảnh hưởng máy dev, không ảnh hưởng code/migration commit.
- Không chạy lại `pnpm test` full ×2 và `pnpm build` (builder báo PASS); test trong scope tự chạy PASS.

## Verdict: ✅ PASS
