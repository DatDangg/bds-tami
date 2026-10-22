Agent: reviewer

# Review: feature-project-detail-blocks · phase-1-task-01 · round 1 (BL-058)

> Report do reviewer viết; primary lưu nguyên văn tóm tắt (hook guard chặn Write của reviewer trong path worktree — `.context/review-reports/**` không khớp đường dẫn tuyệt đối worktree).

- **Review level:** STRICT
- **Reason:** `LazyMap` dùng ở 4 màn, `SimilarCarousel` ở 3 màn chi tiết; task BUG cần kiểm root cause.
- **Blast radius:** `LazyMap` → ProjectLocation, RentalDetail, PostDetail, lien-he/page; `SimilarCarousel` → ProjectDetail, SimilarRentals, RelatedPosts; `docs/DESIGN.md`. Không API/schema/auth/data.

## Root cause
- Xác nhận: `.maplibregl-map { position: relative }` gắn lên container truyền cho `new Map()`; container cũ có `absolute inset-0` → mất định vị, cao 0px.
- Comment sai cơ chế: Tailwind v4 đặt utilities trong `@layer utilities`, CSS maplibre không layer nên luôn thắng — không phải do thứ tự nạp.
- Fix vững: wrapper `absolute inset-0` không bị gắn class maplibre; container `h-full w-full` có cha cao xác định. Caller không ảnh hưởng (`lien-he/page.tsx:98` `[&>[role=region]]` vẫn là con trực tiếp).
- Ảnh `du-an-crown-vi-1440-map-after-fix.jpg`: bản đồ phủ khung, control + attribution trong khung, bo góc đúng.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS (0 lỗi; 2 warning cũ ngoài diff) |
| `pnpm test` (full) | exit 1: 8 file / 2 test fail — timeout (integration `access`, `admin-form-layout`, `content-defaults`, `jobs-email`, `media-upload`, `session-refresh`; UI `HeroSearch`, `Header` 5000ms) khi máy tải nặng, không đụng diff; test LazyMap/PostDetail/BL-058 PASS |
| `pnpm build` | PASS |

## Contrast
accent-text / primary-subtle 4.63:1 AA; text-muted 4.82, text-secondary 6.75 AA; thẻ giữ trắng, mũi tên `bg-surface`.

## Findings
- **[MAJOR-1] `docs/DESIGN.md:240`** — sửa nhầm đoạn lịch sử "Trước BL-052 (BL-045)" (khi đó nền thật là trắng); phần As-built BL-052 chưa ghi nền mới; hàng chi tiết Cho thuê (Căn tương tự) + Tin BĐS (Tin liên quan) chưa cập nhật. Fix: trả "nền trắng" ở BL-045, thêm "`SimilarCarousel` nền `primary-subtle` (BL-058)" vào As-built 3 hàng.
- **[MINOR-1] `src/components/media/LazyMap.tsx:202`** — comment sai lý do; đề xuất: "maplibre-gl.css (không layer) đè utility Tailwind (trong layer) trên container → định vị bằng wrapper".
- **[MINOR-2]** Không có band nào → "… tương tự" dính cùng nền `primary-subtle` với lưới trên (`DetailLayout.tsx:52`, Tin BĐS không toạ độ + < 2 ảnh, `PostDetail.tsx:195`). Không hỏng chức năng; không chặn task.
- **[MINOR-3]** Docstring cũ "dải nền trắng": `src/components/rentals/SimilarRentals.tsx:12`, `src/components/posts/RelatedPosts.tsx:12`.

## Residual risk
- `pnpm test` chưa xanh do timeout tải máy — chạy lại lúc rảnh.
- Bản đồ chưa kiểm trình duyệt 375/768 và Cho thuê/Tin BĐS/Liên hệ (không dữ liệu) — chỉ vitest + suy luận CSS; rủi ro thấp.

## Verdict: FAIL (MAJOR-1). Code đúng.
