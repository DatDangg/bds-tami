Agent: reviewer

# Review — feature-listing-followups · phase-1-task-03 · round-1 (BL-055: đo LCP bản build 6 trang)

- **Review level:** FAST
- **Reason:** task đo lường/QA evidence, builder không đổi source (đã xác nhận bằng `git status`); không đụng shared/API/auth/schema. Scope chỉ là task file + 6 ảnh JPEG + builder journal.
- **Blast radius:** `tasks/feature-listing-followups/phase-1-task-03.md` (số đo), `.context/review-reports/assets/bl055-p1t03-*-1440.jpg` (6 file), `.context/runs/feature-listing-followups-phase-1-task-03.builder.md`. Không ảnh hưởng runtime/code/data.

## Verify commands + result
- `skip, no code change` — `git status --short src tests migrations vitest.config.ts package.json` chỉ ra `src/app/(payload)/admin/importMap.js` + `src/payload-types.ts` (dirty CRLF có sẵn trước task, ngoài scope); không có file source nào đổi bởi task này.
- Builder `pnpm build` exit 0 tại commit `e0a61b3` (theo task file + journal) — chỉ dùng để tạo bản đo, không phải verify gate.

## Kiểm chứng
1. **Source không đổi:** OK (xem trên).
2. **Verification summary:** bảng LCP đủ 6 trang × 2 viewport (1440/390) × 2 lần × 2 cách đo (Lighthouse 12.8.2 headless không throttle + Browser pane PerformanceObserver); cách đo, điều kiện (local, không throttle, DB dev, port 3100), nguồn slug, TTFB đều ghi rõ. Max 420 ms (`/du-an` 390 LH lần 2) < 2 500 ms.
3. **Element LCP có `priority`:** OK — đối chiếu source:
   - `src/components/media/ResponsiveImage.tsx:87-89`: `preload={priority}`, `fetchPriority={priority ? "high" : undefined}`, `loading={priority ? undefined : "lazy"}` → đúng là preload + fetchpriority=high.
   - `src/components/layout/PageHero.tsx:38`: `<ResponsiveImage ... priority decorative>` (3 trang danh sách).
   - `src/components/detail/DetailHeroMosaic.tsx:46`: `<ResponsiveImage media={cover} sizes="100vw" priority>` (3 trang chi tiết).
   Khớp với element `img fetchpriority="high" data-nimg="fill" class="object-cover"` ghi trong bảng.
4. **Acceptance:** 3 tick hợp lệ (có số đo + element + cách đo; không trang > 2.5 s; không đổi code).
5. **Residual trung thực:** ghi rõ local không throttle, Lighthouse lần 1 đã ấm server (chưa cold start), chưa `/en`, Lighthouse mobile mặc định sẽ cao hơn — đúng và đủ.
6. **Ảnh:** 6 file JPEG 1440 (26–33 KB, 21:38). Đã mở `bl055-p1t03-du-an-1440.jpg` (trang `/du-an` thật: hero "Dự án đang phân phối", tab loại hình, bộ lọc, card Sun Festo Town Hạ Long) và `bl055-p1t03-tin-bds-detail-1440.jpg` (trang chi tiết tin shophouse Elegant Park Thạch Bàn: hero mosaic, breadcrumb, thanh giá) → là trang thật ở 1440. Khác đuôi `.jpg` thay vì `.png` gợi ý — builder có ghi lý do (Lighthouse xuất JPEG), chấp nhận.
7. **Port 3100:** không còn socket `LISTENING`; `tasklist PID 8864` trống (process đã kill). Chỉ còn vài socket `FIN_WAIT_2`/`CLOSE_WAIT` rớt lại của PID 8864 ↔ 17432 — OS sẽ tự dọn, không phải server còn chạy.

## Responsive Checklist Gate
N/A — diff không đụng UI (không đổi code); task chỉ đo.

## Skill gates
- aislop: `N/A, no code change`.
- oxlint (anti-slop): `N/A, no TS/JS diff`.
- ocr (open-code-review): `skip, no code change`.
- AI-readable: OK — task file rõ ràng, không indicator chaos; không đổi luồng chính nên không cần cập nhật README/ARCHITECTURE.
- ai-friendly-web: `N/A` (không đổi web asset/robots/sitemap).
- blitzstrike: `N/A` (FAST, không đụng auth/input).

## Findings
- Không có CRITICAL / MAJOR.
- [MINOR] (ghi nhận, không chặn) Task file dòng 56/58: ảnh hero `/tin-bds` và tin chi tiết chỉ có bản 800 px (nguồn upload nhỏ) → bị phóng ở 1440. Builder đã phân loại đúng là vấn đề nội dung CMS, không phải LCP; đề xuất nhắc editor upload ảnh ≥ 1600 px, không cần task code.
- [MINOR] Socket `FIN_WAIT_2`/`CLOSE_WAIT` còn treo trên :3100 — hệ quả kill process, tự hết; không cần hành động.

## Verdict
✅ PASS
