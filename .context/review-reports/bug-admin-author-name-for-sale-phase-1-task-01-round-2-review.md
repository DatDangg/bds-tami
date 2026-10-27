Agent: reviewer

# Review — bug-admin-author-name-for-sale · phase-1-task-01 · round 2 (BL-082)

- Review level: **STRICT** (giữ như round 1: auth/RBAC, lộ dữ liệu staff, shared `authorField()`, API công khai).
- Reason: round 2 chỉ sửa `src/fields/author.ts` (cache) + test, nhưng hook vẫn là chốt bảo mật của field ảo trên 5 collection có API công khai.
- Blast radius: như round 1 — REST/Local API của rentals, projects, property-posts, news, job-postings; admin list/edit (AuthorCell/AuthorField). Thay đổi round 2 nằm trong `computeAuthorName` + `tests/integration/author-name.test.ts`.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm vitest run src/components/admin src/fields src/lib/admin src/collections` | PASS — 95 files / 800 tests |
| `pnpm vitest run tests/integration/author-name.test.ts tests/integration/access.test.ts` | PASS — 2 files / 33 tests (round 1: 31; thêm khoá + đếm truy vấn, GraphQL đổi thành kiểm config) |
| `pnpm eslint` 8 file đổi/mới | PASS (exit 0) |
| `pnpm build` | PASS (exit 0) |
| Migration | Builder báo `pnpm payload migrate:create` không tạo file; reviewer xác nhận `git status --short src/migrations` rỗng (không có file migration mới/dở). Field `virtual: true` không sinh cột. |

## Xác minh các finding round 1
- **MAJOR-1 (N+1) — ĐÃ SỬA.** `src/fields/author.ts`: Map giờ lưu `Promise<string | null>`. Hook đầu tiên cho mỗi author `set` Promise **đồng bộ** trước `await` nào → các doc chạy song song (`find.js:233` Promise.all) dùng chung Promise. `pending.catch(() => cache.delete(author))` xoá mục khi lỗi; Promise gốc vẫn reject về caller đang `await` → không có unhandled rejection, lỗi vẫn nổi lên. Test `danh sách nhiều dòng…` (admin, depth 0 nên author là ID, ≥5 tin của 2 author) spy `payload.findByID` khẳng định đúng **2** lần gọi staff — test có ý nghĩa: code round 1 sẽ fail test này.
- **MINOR-2 (GraphQL) — ĐÃ GIẢI QUYẾT.** `src/payload.config.ts:80` `graphQL: { disable: true }` → không có bề mặt GraphQL. Test đọc config thật và assert `graphQL.disable === true` — chặn hồi quy nếu ai bật lại GraphQL.
- **MINOR-3 (staff khoá) — ĐÃ SỬA.** Test staff `active: false` + Local API `overrideAccess: true` → `authorName` null (kiểm đúng nhánh hook, nơi field access bị bỏ qua).
- **MINOR-4 (migration) — ĐÃ GIẢI QUYẾT** (xem bảng verify).

## Kiểm bảo mật lại (sau khi đổi hook)
Chốt `req.user?.active !== true → undefined` vẫn đứng **đầu** hook, trước khi chạm cache/DB → khách và Local API không user không bao giờ tra staff hay nhận tên. Cache vẫn theo `req.context` (theo request), giá trị không phụ thuộc người gọi → không rò giữa user. `Staff.read` không đổi. Các test REST khách / Sale 403-404 hồ sơ staff khác / admin populate vẫn PASS.

## Responsive Checklist Gate
Round 2 không đổi UI. Kết quả round 1 giữ nguyên: Layout N/A · Typography/Spacing N/A · Media N/A · Touch/Interaction N/A · Viewport/A11y N/A (chỉ đổi chữ trong cell/ô có sẵn, dùng lại `tami-readonly-field`). Residual: reviewer không chạy browser.

## Skill gates
- aislop: skip, chưa cài.
- oxlint (anti-slop): skip, oxlint not configured; eslint PASS.
- ocr: skip, ocr not installed.
- AI-readable: OK — hook ~18 dòng, comment nêu WHY (vì sao lưu Promise, vì sao xoá khi lỗi). 0 indicator.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: skip, chưa cài/không môi trường pentest; đường REST/Local API đã kiểm bằng integration test.

## Findings
### [MINOR-1] JSDoc của hook vẫn ghi "chỉ tốn 1 truy vấn" theo nghĩa cũ — không sai
`src/fields/author.ts` khối JSDoc đầu `computeAuthorName` giờ đã đúng với hành vi. Không cần sửa.

### [MINOR-2] Repro Verification trong task file còn ghi "6 PASS"
`tasks/bug-admin-author-name-for-sale/phase-1-task-01.md` mục Repro Verification / Evidence vẫn ghi "6 PASS" và nhắc GraphQL theo query. Lúc close-out nên cập nhật evidence (author-name 8 test; GraphQL tắt trong config). Không chặn PASS.

Không còn CRITICAL/MAJOR.

## Repro closure
Status `PASS`; reviewer chạy lại integration evidence và PASS. Chấp nhận.

## Verdict: PASS
