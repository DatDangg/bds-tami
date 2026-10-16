Agent: reviewer

# Review — build-tami-website layer-2-task-08, round 2

- Review level: **STRICT**
- Reason: component dùng chung nhiều trang sau này (layer-6/7/8/9/14), ảnh hưởng CWV (NFR-01), iframe bên thứ ba từ URL nhân viên nhập, dữ liệu vị trí của tin ẩn địa chỉ (privacy), dependency mới (maplibre-gl). Round 1 có CRITICAL.
- Blast radius: `src/components/media/*` (LazyMap, map-geometry, ResponsiveImage, Gallery, Lightbox, VideoFacade, video-url + test); `src/app/(frontend)/globals.css` (thêm 1 rule `@media (pointer: coarse)` chỉ nhắm class `.maplibregl-ctrl-*`); `src/components/icons.ts` (thêm export); `src/i18n/messages/{vi,en}.json` (namespace `media`); `package.json`/`pnpm-lock.yaml` (maplibre-gl@6.11.2). Chưa route nào dùng component. Bỏ qua `src/payload-types.ts` (CRLF, ngoài scope).

## Verify commands + result

| Lệnh (project-config) | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile` | OK (exit 0) |
| `pnpm lint` | OK (exit 0, không warning) |
| `pnpm typecheck` | OK (exit 0) |
| `pnpm test` | OK — 49 file / 491 test PASS (gồm integration, Docker dev đang chạy) |
| `pnpm build` | OK (exit 0). Vẫn chưa route nào import `src/components/media/*` → bundler Next chưa biên dịch component (residual như round 1) |

## Kiểm từng finding round 1

### C1 — LazyMap gỡ map sau khi ready: ĐÃ SỬA
- `LazyMap.tsx:127-165`: effect dựng map có deps `[loadAttempt, lat, lng, approximate]`; `phase` không còn trong deps → `setPhase("ready")` (dòng 155) không kích hoạt cleanup. `t` đọc qua `translateRef` (dòng 101-104, 130) nên đổi hàm dịch cũng không gỡ map.
- `requestLoad` (dòng 106-109) set `phase="loading"` + tăng `loadAttempt` cùng một batch → lần commit đó render `mapRef` div trước khi effect chạy → `container` có thật.
- Retry sau lỗi: `phase=error` gỡ div map (lúc này không có map nào, `dispose` undefined); bấm Thử lại → `loadAttempt` 2 → mount mới. OK.
- StrictMode dev: setup+cleanup+setup chỉ xảy ra lúc mount, khi đó `loadAttempt === 0` → effect thoát sớm, không dựng map. Khi `loadAttempt` đổi, effect chạy một lần. Không double-mount.
- Unmount giữa lúc `import()` chưa xong: `cancelled = true` → khi promise resolve gọi `cleanup()` ngay (dòng 150-152) → map dựng vào container đã tách rồi bị `remove()`, không leak, không `setState` sau unmount. Lỗi sau unmount: guard `!cancelled` (dòng 158). OK.
- Test `LazyMap.test.tsx:174-184`: chờ ready (status biến mất) rồi `expect(remove).not.toHaveBeenCalled()` + dựng đúng 1 lần, unmount → `remove` đúng 1 lần. Suy luận: nếu đưa `phase` trở lại deps, commit ready sẽ chạy cleanup → `remove` được gọi trước dòng 180 → test FAIL. Test bắt được bug cũ.

### M1 — lộ toạ độ thật khi ẩn địa chỉ: ĐÃ SỬA
- `map-geometry.ts:20-23` `approximateLocation` làm tròn lưới 0,001°; `LazyMap.tsx:99` áp cho `shown` → dùng cho center (dòng 63), tâm vòng 300 m (dòng 76) và link Google Maps (dòng 205). Không còn chỗ nào trong LazyMap dùng `location` gốc khi `approximate` (chỉ `isValidLocation(location)`).
- Vòng 300 m chứa vị trí thật: lệch tối đa ±0,0005° mỗi trục ≈ 55 m (vĩ độ) × ≤ 55 m (kinh độ) → ≤ ~79 m < 300 m. Test `media-helpers.test.ts:78-93` kiểm cả điểm biên và vĩ độ khác.
- Test `LazyMap.test.tsx:135-156` kiểm không số chính xác nào trong center/vòng/link.
- Contract JSDoc rõ (`map-geometry.ts:12-19`, `LazyMap.tsx:24-27`): server phải truyền toạ độ đã làm tròn vì props Client Component bị serialize. Đúng như đề xuất round 1. Spec (`design-spec.md:185`) chỉ yêu cầu "vòng tròn bán kính 300m thay vì ghim chính xác" → đạt. Mức làm tròn còn thô hơn được nữa, xem n1.

### M2 — srcset luôn có ảnh gốc: ĐÃ SỬA
- `ResponsiveImage.tsx:21-25`: có cỡ đã sinh thì chỉ dùng thumb/card/large; ảnh gốc chỉ là phương án cuối khi không có cỡ nào. Loader `pickGeneratedSize` với width 1920/3840 → `large` (`media-helpers.test.ts:64-69`). `src={largest.url}` = `large`. OK.

### M3 — ngữ nghĩa carousel: ĐÃ SỬA
- `Gallery.tsx:73`: `section` + `aria-label` (role region ngầm định) + `aria-roledescription="carousel"` dưới md; slide là `div role="group" aria-roledescription="slide" aria-label="n / total"` (dòng 84-89) bọc nút. Từ md (bento) không gắn carousel/slide. Test `Gallery.test.tsx:85-100` kiểm cả hai chiều.
- Hydration: `useSyncExternalStore(subscribe, getSnapshot, () => true)` — khi hydrate React dùng `getServerSnapshot` (true) nên markup client khớp HTML server (không warning mismatch); sau hydrate React so `getSnapshot` và re-render nếu desktop. Đúng cách. Chỉ đổi thuộc tính ARIA, không đổi DOM/class → CLS không đổi. `subscribeBelowMd` có guard `matchMedia` không tồn tại.

### MINOR round 1
- m1 bento 3–4 ảnh: `bentoSpanClass` (`Gallery.tsx:43-47`) — 3 ảnh: hero 2×2 + 2 ô col-span-2; 4 ảnh: hero + ô 2 col-span-2 + 2 ô đơn → phủ kín lưới 4×2. OK.
- m2 (2 ảnh): giữ nguyên, có lý do ghi trong task. Chấp nhận.
- m3 Lightbox fallback focus: `Lightbox.tsx:57-64` lưu `activeElement` ở `onOpenAutoFocus` (bắn trước khi Radix chuyển focus) và trả về khi không có `returnFocusRef`. OK.
- m4 zoom 44px: `globals.css:257-264` — `@media (pointer: coarse)`, selector `.maplibregl-ctrl-group button.maplibregl-ctrl-zoom-in/out` chỉ khớp control của MapLibre; specificity (0,2,1) > rule gốc `.maplibregl-ctrl-group button` (0,1,1), rule nằm ngoài `@layer` → thắng chắc. Không ảnh hưởng phần khác.
- m5 ytimg: ghi nhận residual trong task. OK.
- m6 test false-confidence: thay bằng test mới (xem C1). OK.

### Không regression
- VideoFacade/video-url: whitelist host `Set` + so khớp `hostname` chính xác (`video-url.ts:10-16`), `embedUrl` dựng lại từ ID trên `youtube-nocookie` (dòng 48), sandbox giữ nguyên (`VideoFacade.tsx:62`), Save-Data qua `useSyncExternalStore` với server snapshot `null` (dòng 41, 70). OK.
- Lightbox: Radix Dialog (focus trap, Esc, aria-modal), ←/→ vòng hai đầu, Title/Description sr-only, nút `size-11`. OK.
- LCP: `preload` + `fetchPriority="high"` chỉ ảnh đầu khi `priorityFirst` (`Gallery.tsx:102`, `ResponsiveImage.tsx:87-89`). CLS: `aspect-4/3` / `md:aspect-2/1` + `grid-rows-2`; LazyMap/VideoFacade `aspectRatio`. OK.

## Findings round 2

### [CRITICAL]
Không có.

### [MAJOR]
Không có.

### [MINOR]
- n1 `map-geometry.ts:10` — lưới 0,001° làm vị trí thật luôn nằm trong ~79 m quanh tâm vòng tròn, trong khi vòng vẽ 300 m: ai cũng thu hẹp được còn khoảng ~110 m × 110 m (vài toà nhà), chi tiết hơn ERD `rentals.showExactAddress` muốn ("chỉ hiện đường + phường"). Spec vẫn đạt nên không chặn. Đề xuất: lưới 0,002° (lệch tối đa ~157 m, vòng 300 m vẫn chứa vị trí thật), hoặc dùng làm tròn có định của server (hash theo id tin) ở task layer-7-task-03.
- n2 Bàn giao contract — task file ghi "cần ghi vào task layer-8 tin cho thuê" nhưng trang chi tiết tin cho thuê là `tasks/tami-website/layer-7-task-03.md:41`, và file đó chưa có tiêu chí "truyền `approximateLocation(location)` cho LazyMap khi `showExactAddress=false`". Nếu không ghi, builder sau truyền toạ độ thật → lộ trong HTML. **Primary phải thêm tiêu chí này vào layer-7-task-03 lúc close-out** (xem Doc impact). Sửa luôn chữ "layer-8" trong `layer-2-task-08.md:65`.
- n3 `Gallery.tsx:63-64, 73, 86-88` — với 1–2 ảnh (không bento) dưới md vẫn gắn carousel + một slide "1 / 2" trong khi chỉ hiện một ảnh. Đề xuất chỉ gắn ngữ nghĩa carousel khi `isCarousel && isBento`.
- n4 `LazyMap.tsx:165` — đổi `lat/lng/approximate` sau khi ready thì map được dựng lại nhưng `phase` vẫn `ready` (không có trạng thái "Đang tải"). Hiếm xảy ra trên trang chi tiết; chấp nhận được.
- n5 `Gallery.tsx:67-70` — `setSlideIndex` chạy mỗi sự kiện scroll (React bỏ qua khi giá trị không đổi, nhưng vẫn tính lại). Có từ round 1, không đáng kể.

## Responsive Checklist Gate (375 / 640 / 768 / 1024 / 1280 / 1536)

Không có môi trường browser; xác minh bằng đọc class Tailwind/CSS. Thay đổi UI round 2: ARIA Gallery, bố cục bento 3–4 ảnh, CSS control zoom.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang 375 | OK | Carousel `overflow-x-auto` trong khung, slot `w-full shrink-0`; CSS zoom 44px chỉ là control trong khung map `overflow-hidden` |
| Mobile-first | OK | biến thể `md:`; `(pointer: coarse)` thay vì max-width cho touch target |
| Grid không cột cố định | OK (ngoại lệ có lý do) | Bento `md:grid-cols-4` theo design-spec §3.7; 3–4 ảnh phủ kín lưới |
| Container không fixed px | OK | Không thêm width cố định mới |
| Typography rem/token | OK | Không đổi |
| Media aspect-ratio/srcset/sizes | OK | srcset chỉ từ cỡ đã sinh (M2); `sizes` theo cột |
| Touch target ≥ 44px | OK | Nút `size-11`/`h-11`/`min-h-11`; zoom MapLibre 44px trên thiết bị cảm ứng (m4) |
| Nav/table | N/A | Không có |
| 100vh | OK | Không dùng |
| prefers-reduced-motion | OK | `globals.css:246` + `fadeDuration: 0` |
| Không che lỗi bằng overflow:hidden | OK | `overflow-hidden` chỉ ở khung ảnh/map |

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip — không nằm trong verify commands được allow |
| oxlint (anti-slop) | skip, oxlint not configured; ESLint PASS không warning |
| ocr (open-code-review) | skip, ocr not installed / không được allow |
| AI-readable | OK — tên rõ (`loadAttempt`, `approximateLocation`, `useIsCarousel`), file ≤ 215 dòng, comment giải thích WHY (deps effect, contract serialize). Component `LazyMap` ~120 dòng tính JSX, effect tách riêng → 1 indicator, dưới ngưỡng 3 |
| ai-friendly-web | N/A — component, không phải trang public mới |
| blitzstrike | skip — không có môi trường được phép; đọc tĩnh video-url không thấy bypass |
| security (privacy/iframe) | OK; n1/n2 là hardening + bàn giao |

## Doc impact

- no doc impact cho `docs/API_SPEC.md` / `docs/ERD.md` / `docs/DESIGN.md` (không đổi contract/schema/flow).
- Bắt buộc lúc close-out: thêm vào `tasks/tami-website/layer-7-task-03.md` tiêu chí "toạ độ truyền cho `LazyMap` khi `showExactAddress=false` phải qua `approximateLocation()` ở server; không serialize `location` gốc" (n2).

## Residual risk

- Build chưa biên dịch component qua bundler Next (chưa có route dùng) → tách chunk maplibre, dynamic import CSS, hydrate thật của `useSyncExternalStore` chưa được kiểm; kiểm ở task đầu tiên dùng component (layer-6-task-05) + đo bundle.
- Bảo vệ toạ độ chính phụ thuộc nơi gọi phía server (n2).
- OSM tile policy; ảnh qua Payload proxy phụ thuộc cache Nginx/Cloudflare; không kiểm trực quan 375/768/1280.

## Verdict

**PASS** — C1, M1, M2, M3 đã sửa đúng và có test bắt được bug cũ; không còn CRITICAL/MAJOR. 5 MINOR (n1–n5) không chặn; n2 phải xử lý trong close-out (ghi contract vào layer-7-task-03).
