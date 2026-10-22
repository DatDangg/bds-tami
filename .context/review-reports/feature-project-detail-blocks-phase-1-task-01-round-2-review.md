Agent: reviewer

# Review: feature-project-detail-blocks · phase-1-task-01 · round 2 (BL-058)

> Primary lưu nguyên văn (hook guard chặn reviewer Write trong worktree, cả đường dẫn tương đối).

- **Review level:** STRICT
- **Reason:** `LazyMap` dùng chung (4 màn), `SimilarCarousel` dùng chung 3 màn chi tiết; vòng kiểm lại sau round 1 FAIL.
- **Blast radius:** `LazyMap` → ProjectLocation, RentalDetail, PostDetail, `lien-he/page`; `SimilarCarousel` → ProjectDetail, SimilarRentals, RelatedPosts; `docs/DESIGN.md` (as-built). Không API/schema/auth/data.

## Kiểm các finding round 1
| Finding | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-1 DESIGN.md sửa nhầm đoạn lịch sử | Đã đóng | `git diff --word-diff` chỉ còn 3 thay đổi trong As-built BL-052 ("Dự án tương tự" / "Căn tương tự" / "Tin liên quan" → nền `--color-primary-subtle` (BL-058)); đoạn BL-045 nguyên. |
| MINOR-1 comment LazyMap | Đã đóng | `LazyMap.tsx:202` nêu đúng: maplibre-gl.css không layer đè utility `absolute` Tailwind v4 trên container. |
| MINOR-2 không band → dính nền | Đã đóng | `SimilarCarousel.tsx:28` thêm `border-t border-border`. |
| MINOR-3 docstring | Đã đóng | `SimilarRentals.tsx:12`, `RelatedPosts.tsx:12`, `SimilarCarousel.tsx:21` ghi `primary-subtle` (BL-058). |

Không regression mới; test đúng contract (`project-detail.test.tsx:325`, `PostDetail.test.tsx:211`, test mới `LazyMap.test.tsx`). `lien-he/page.tsx` `[&>[role=region]]` vẫn trúng con trực tiếp.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS — 0 lỗi, 2 warning có sẵn (`tools/task-dashboard/server.mjs`) |
| `pnpm test` full (1 lần) | Không lấy được dòng tổng (lọc output) — primary chạy lại, xem task file § Verification summary |
| `pnpm test` file liên quan (LazyMap, PostDetail, project-detail, rentals, detail, src/app) | PASS 28 file / 295 test |
| `pnpm build` | PASS |

## Responsive gate
Không tràn ngang (wrapper trong region `relative w-full overflow-hidden` + `aspectRatio`); không `100vh`; contrast AA (round 1). Chưa kiểm trình duyệt 375/768.

## Skill gates
aislop/oxlint/ocr skip (không cấu hình); AI-readable OK; ai-friendly-web, blitzstrike N/A.

## Findings
- **[MINOR-1]** `docs/DESIGN.md:240/242/244` chưa ghi viền trên mới của `SimilarCarousel` — tuỳ chọn, không chặn.

## Residual risk
- Full `pnpm test` round này chưa có dòng tổng (primary chạy lại).
- Bản đồ Cho thuê / Tin BĐS / Liên hệ + 375/768 chưa kiểm trình duyệt (không dữ liệu).

## Verdict: PASS
