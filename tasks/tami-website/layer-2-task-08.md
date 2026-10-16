# Task 08: Component media: thư viện ảnh + lightbox, bản đồ MapLibre lười, video facade

## Layer
2 — Upload, địa giới, audit, phiên đăng nhập, health, component media/form

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SHARED_FOUNDATION
- Review level expected: **STRICT** — component dùng chung nhiều trang, ảnh hưởng CWV
- Blast radius: src/components/media/Gallery.tsx, Lightbox.tsx; src/components/media/LazyMap.tsx (MapLibre + OSM tiles, tải khi vào viewport); src/components/media/VideoFacade.tsx (YouTube/TikTok: ảnh + nút phát); …
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-03, FR-PUB-05 (thư viện ảnh, bản đồ, video)
- NFR-01
- NFR-07
- design-spec §1.3, §1.5, §3.7, §3.8

## Description
Ba client component dùng lại ở chi tiết dự án, cho thuê, Đăng tin BĐS, liên hệ.

## Dependencies
- `layer-1-task-04` Nền UI: tokens → Tailwind v4 + shadcn/ui, font, Phosphor, primitive (dùng kết quả của task này)
- `layer-1-task-03` Định tuyến song ngữ `next-intl` (vi mặc định, `/en`) + định dạng Intl (dùng kết quả của task này)

Mở khoá cho: `layer-6-task-05`, `layer-6-task-07`, `layer-7-task-03`, `layer-8-task-04`, `layer-9-task-01`, `layer-14-task-01`

## Acceptance Criteria
- [ ] Gallery: ảnh đầu `priority` nếu là LCP, còn lại lazy; tỉ lệ cố định (CLS 0); lightbox bàn phím (←/→/Esc), bẫy focus, trả focus
- [ ] LazyMap: trước khi vào viewport chỉ hiện ảnh tĩnh + nút "Xem bản đồ / View map"; MapLibre import động; không cần API key
- [ ] VideoFacade: chỉ nhúng iframe khi bấm; không tải trên Save-Data
- [ ] Mọi nút chỉ icon có `aria-label` theo locale; touch target ≥ 44px
- [ ] Không cuộn ngang ở 375px

## Tests cần viết
- RTL: lightbox mở/đóng/điều hướng bàn phím
- RTL: LazyMap chưa import maplibre khi chưa intersect (mock IntersectionObserver)
- RTL: VideoFacade không render iframe trước khi bấm

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-2-task-08-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 2 (builder sửa theo review round 1, chờ reviewer round 2)
- Last failure type: reviewer FAIL round 1 (C1 LazyMap tự gỡ map khi ready; M1 lộ toạ độ tin ẩn địa chỉ; M2 srcset chứa ảnh gốc; M3 thiếu ngữ nghĩa carousel)
- Error memory entry: none (lỗi logic của attempt 1, không phải pattern lặp)
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: builder tự kiểm đủ 5 mục (Gallery/lightbox, LazyMap, VideoFacade, aria-label + touch target 44px, không cuộn ngang) bằng RTL + class layout; chưa kiểm trực quan 375px (chưa có trang dùng component)
- Verify commands + result: `pnpm install --frozen-lockfile` OK · `pnpm lint` OK · `pnpm typecheck` OK · `pnpm test` 49 file / 481 test PASS trước khi sửa kiểu test (sau đó chạy lại riêng src/components/media: 5 file / 61 test PASS) · `pnpm build` OK · `pnpm audit`: không thêm lỗ hổng từ maplibre-gl@6.11.2 (còn 1 high đã ignore sẵn trong package.json + 1 moderate/2 low có từ trước ở drizzle-kit/dompurify)
- Attempt 2 (fix review round 1):
  - C1: effect dựng map phụ thuộc `loadAttempt` (đếm lần yêu cầu tải), không còn phụ thuộc `phase`; `setPhase("ready")` không đổi deps nên không gỡ map. `t` đọc qua ref. Test: sau ready `remove` chưa được gọi và map chỉ dựng 1 lần; unmount thì `remove` đúng 1 lần.
  - M1: `approximateLocation()` (map-geometry.ts) làm tròn lưới 0,001° (~110 m, lệch tối đa ~80 m nên vòng 300 m vẫn chứa vị trí thật); áp cho tâm bản đồ, tâm vòng 300 m và link Google Maps. JSDoc ghi contract: nơi gọi phía server phải truyền toạ độ đã làm tròn khi ẩn địa chỉ (đã ghi vào acceptance `layer-7-task-03` tin cho thuê). Test: không toạ độ chính xác nào trong center/vòng/link.
  - M2: `listCandidates` chỉ dùng ảnh gốc khi không có cỡ đã sinh nào; test width 1920 -> large, srcset không có ảnh gốc.
  - M3: một DOM; `aria-roledescription="carousel"` trên vùng và `role="group"` + `aria-roledescription="slide"` + `aria-label="n / total"` trên ô bọc nút chỉ khi dưới md (matchMedia qua useSyncExternalStore, mặc định mobile-first khi SSR). Từ md là lưới bento nên không gắn "slide" (sai ngữ nghĩa). Không thêm nút Trước/Sau mobile (vuốt + Tab đủ thao tác). Chỉ đổi thuộc tính ARIA nên CLS không đổi.
  - m1: bento 3 ảnh (2 ô rộng 2 cột) và 4 ảnh (ô 2 rộng 2 cột) phủ kín lưới 4x2. m3: Lightbox không có returnFocusRef thì trả focus về phần tử đang focus lúc mở. m4: CSS `pointer: coarse` đặt control zoom MapLibre 44px (globals.css). m2 giữ nguyên (2 ảnh coi là dữ liệu lỗi). m5: thumbnail i.ytimg.com là request bên thứ ba trước khi bấm, ghi nhận cho chính sách privacy (residual).
  - Verify attempt 2: `pnpm lint` OK · `pnpm typecheck` OK · `pnpm test` 49 file / 491 test PASS (gồm integration Docker dev) · `pnpm build` OK
- Reviewer verdict: STRICT PASS round 2 (.context/review-reports/build-tami-website-layer-2-task-08-round-2-review.md); round 1 FAIL (C1 map bị remove sau ready, M1 lộ toạ độ, M2 srcset ảnh gốc, M3 aria carousel). MINOR còn lại không chặn: n1 cân nhắc lưới 0,002° cho ẩn địa chỉ, n3 carousel attrs khi 1–2 ảnh, n4 không hiện loading khi đổi toạ độ, n5 setSlideIndex mỗi scroll. Residual: chưa route nào dùng nên chưa kiểm bundling MapLibre/CSS động + trực quan 375/768/1280 — kiểm khi layer 6/7 gắn component; tile OSM không hợp traffic lớn; thumbnail i.ytimg.com là request bên thứ ba trước khi bấm.
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: no doc impact (API/ERD/DESIGN); thêm acceptance contract approximateLocation vào tasks/tami-website/layer-7-task-03.md
- Decision log: none

## Commit / Tracking
- Commit gợi ý: `feat(layer-2): task-08 mediacomp` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-2/task-08` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/components/media/Gallery.tsx, Lightbox.tsx
- src/components/media/LazyMap.tsx (MapLibre + OSM tiles, tải khi vào viewport)
- src/components/media/VideoFacade.tsx (YouTube/TikTok: ảnh + nút phát)
- src/components/media/ResponsiveImage.tsx (next/image + sizes theo cỡ ERD §4.12)

## Notes
- Tile OSM dùng theo chính sách sử dụng của OSM; nếu traffic lớn cần tile server khác (ghi residual risk).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
