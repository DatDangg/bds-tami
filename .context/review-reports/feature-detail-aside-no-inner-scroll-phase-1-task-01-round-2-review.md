Agent: reviewer

# Review — feature-detail-aside-no-inner-scroll · phase-1-task-01 · round 2 (BL-031)

- Review level: **FAST**
- Reason: chỉ review phần đã sửa sau round 1 (PASS NORMAL, 4 MINOR). Phần sửa nhỏ: thêm 1 wrapper `pb-8` có điều kiện trong `RentalDetail`, sửa test, sửa task file. Không đụng shared/API/auth/schema; test của Builder PASS.
- Blast radius: chỉ `/cho-thue/[slug]` và `/en/for-rent/[slug]` khi tin **rented** và có tin tương tự. Tin chưa thuê không đổi: `similarBlock` vẫn render qua `after` (`RentalDetail.tsx:163`).

## Phần đã sửa
- `src/components/rentals/RentalDetail.tsx:156-157` — `{view.rented && similar.length > 0 && <div className="pb-8">{similarBlock}</div>}` kèm comment giải thích lý do.
- `src/components/rentals/rental-detail.test.tsx` — test pb-8 không còn `const { container } =`; test rented assert `nav.previousElementSibling` có `pb-8` và chứa tiêu đề "Căn tương tự đang trống".
- Task file: Verification summary dòng 45/48 và Residual risk dòng 55 đã khớp với số đo và phần sửa.

## Kiểm
- Điều kiện `similar.length > 0`: khớp với `SimilarRentals.tsx:11` (`cards.length === 0` thì return null), nên không sinh `div.pb-8` rỗng khi tin rented không có tin tương tự. Khi đó phần tử ngay trước thanh mục con là khối ảnh (đã có `pb-8`), hoặc banner nếu không có ảnh. Trường hợp không có ảnh đã được chấp nhận ở round 1.
- Tin chưa thuê: `before` không render similar, `after={!view.rented ? similarBlock : null}` giữ nguyên → không đổi hành vi.
- Test rented: thứ tự DOM dùng `previousElementSibling` + `contains`, nên test đúng là wrapper nằm ngay trước thanh mục con. Không tạo cảm giác an toàn giả.
- `pb-8` đặt ngoài `section.bg-bg-alt`, nên khoảng 32px là nền trắng giữa khối xám và thanh mục con. Đúng mục đích "không dính sát".

## Verify commands + result
- `pnpm vitest run src/components/detail src/components/projects src/components/rentals` → **13 files / 166 tests PASS**.
- `pnpm typecheck` → **PASS** (tsc --noEmit, 0 lỗi).
- `pnpm lint` → **0 error, 2 warning**, cả hai có sẵn trong `tools/task-dashboard/server.mjs`. Warning `container` của MINOR-1 đã hết.

## Responsive Checklist Gate (phần sửa đụng UI)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | chỉ thêm padding dọc |
| Mobile-first / min-width | OK | `pb-8` không có prefix → áp ở mọi mốc, đúng yêu cầu D3 |
| Grid / container fixed px | N/A | không đổi |
| Typography rem/clamp | N/A | không đổi |
| Spacing theo scale | OK | token `pb-8` |
| Media | N/A | không đổi |
| Touch target / nav / table | N/A | không thêm control |
| 100vh / reduced-motion / overflow:hidden | N/A | không đổi |
| 375/768/1280 | OK (tính bằng CSS) | 32px dưới khối tin tương tự ở cả 3 mốc; không ảnh hưởng chiều ngang |

## Skill gates
- aislop: skip — không nằm trong verify commands được allow; phần sửa 1 dòng, đọc tay không thấy dấu hiệu slop.
- oxlint (anti-slop): skip, oxlint not configured; ESLint 0 error.
- ocr: skip, ocr not installed.
- AI-readable: OK — 0 indicator; comment nêu lý do (WHY).
- ai-friendly-web: N/A — không đổi route/robots/sitemap.
- blitzstrike: N/A.

## Findings
- MINOR-1: **đã xử lý** (lint hết warning mới).
- MINOR-2: chấp nhận từ round 1, không đổi.
- MINOR-3: **đã xử lý** (có wrapper + test DOM). Số đo trực quan cho tin rented vẫn ghi ở Residual risk vì chưa có dữ liệu.
- MINOR-4: **đã xử lý**.

Không có finding mới. Không có CRITICAL/MAJOR.

## Residual risk
- Tin rented có tin tương tự chưa đo trực quan trên :3000 (đã ghi trong task); hiện chỉ có test DOM.
- Mốc 1280 chưa đo trực tiếp (giống round 1).

## Verdict
**PASS**
