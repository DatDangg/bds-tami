Agent: reviewer

# Review — build-tami-website layer-2-task-08, round 1

- Review level: **STRICT**
- Reason: component dùng chung nhiều trang (unlock layer-6/7/8/9/14), ảnh hưởng CWV (NFR-01), nhúng iframe bên thứ ba (URL do nhân viên nhập), dữ liệu vị trí tin ẩn địa chỉ (privacy), thêm dependency mới.
- Blast radius: `src/components/media/*` (Gallery, Lightbox, ResponsiveImage, LazyMap, map-geometry, VideoFacade, video-url); `src/components/icons.ts` (export dùng chung); `src/i18n/messages/{vi,en}.json` (namespace `media`); `package.json` + `pnpm-lock.yaml` (maplibre-gl@6.11.2). Mọi trang chi tiết dự án / cho thuê / Đăng tin BĐS / liên hệ sau này. Chưa có trang nào dùng component (chưa có client thực tế).

## Verify commands + result

| Lệnh (project-config) | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile` | OK (lockfile khớp) |
| `pnpm lint` | OK (exit 0) |
| `pnpm typecheck` | OK (exit 0) |
| `pnpm test` | OK — 49 file / 481 test PASS (gồm integration với Docker dev) |
| `pnpm build` | OK (exit 0). **Lưu ý:** chưa route nào import `src/components/media/*` nên build KHÔNG biên dịch các component này qua bundler Next; `.next/static/chunks` không có `maplibre` (0 match) → chưa kiểm được việc tách chunk động / dynamic import CSS. Ghi Residual risk. |
| `pnpm audit` | không chạy (không nằm trong verify commands được allow); dựa vào ghi chú builder. maplibre-gl giấy phép BSD-3-Clause. |

## Findings

### [CRITICAL] C1 — LazyMap gỡ bản đồ ngay sau khi tải xong
`src/components/media/LazyMap.tsx:108-145`. Effect dựng bản đồ có deps `[phase, …]`. Khi promise resolve: `dispose = cleanup` (dòng 134) rồi `setPhase("ready")` (dòng 135) → re-render với `phase` mới → React chạy cleanup của effect cũ (dòng 141-144): `cancelled = true; dispose?.()` → **`map.remove()` được gọi ngay**. Effect mới thoát sớm vì `phase !== "loading"`. Trên trình duyệt thật, người dùng thấy khung trống sau khi bản đồ vừa hiện. Acceptance "LazyMap" coi như không đạt.
Test không phát hiện: `LazyMap.test.tsx:142-148` chỉ kiểm `remove` **đã** được gọi sau unmount — vẫn PASS dù `remove` đã chạy từ trước unmount.
Fix đề xuất: tách vòng đời map khỏi `phase` — vd effect mount phụ thuộc cờ `shouldLoad` (boolean chỉ bật một lần, không đổi khi ready) hoặc giữ `dispose` trong `useRef` và chỉ gọi khi unmount / đổi toạ độ; `setPhase("ready")` không được làm đổi deps của effect mount. Thêm test: sau khi ready, `expect(maplibre.remove).not.toHaveBeenCalled()`, rồi unmount → gọi đúng 1 lần.

### [MAJOR] M1 — Tin ẩn địa chỉ vẫn lộ toạ độ chính xác
`src/components/media/LazyMap.tsx:24, 58, 71, 92`. Chế độ `approximate` vẫn dùng toạ độ thật: tâm bản đồ (`center`, dòng 58) và **tâm vòng tròn 300 m** (dòng 71) = điểm chính xác → ai cũng suy ra được vị trí (tâm vòng tròn). Ngoài ra `LazyMap` là Client Component nên prop `location` (toạ độ thật) bị serialize vào RSC payload/HTML trang công khai. Chỉ link Google Maps được làm tròn (dòng 46-49) → không nhất quán. Mâu thuẫn mục đích `showExactAddress = false` (ERD `rentals`, API_SPEC không trả `address` khi ẩn).
Fix đề xuất: thêm helper thuần (vd `approximateLocation()` trong `map-geometry.ts`, làm tròn 3 chữ số hoặc snap lưới) và áp cho cả center + circle + link khi `approximate`; ghi rõ trong JSDoc contract rằng nơi gọi (Server Component/API) **phải truyền toạ độ đã làm tròn** khi ẩn địa chỉ (client chỉ làm tròn lần hai để phòng thủ). Test: circle/center không bằng toạ độ gốc.

### [MAJOR] M2 — ResponsiveImage đưa ảnh gốc (không phải cỡ đã sinh) vào srcset
`src/components/media/ResponsiveImage.tsx:22`. Ảnh gốc `media.url` luôn là candidate. `Media.ts:47-51` không có `resizeOptions` → ảnh gốc giữ nguyên kích thước/định dạng upload. Với `sizes="100vw"` (Lightbox, `Lightbox.tsx:68`) trên màn 1920px (deviceSizes 1920/2048/3840) loader trả **ảnh gốc** (có thể nhiều MB, JPEG/PNG chưa nén WebP). Vi phạm design-spec §1.3 "mọi ảnh từ cỡ đã sinh thumb/card/large" và ảnh hưởng NFR-01.
Fix đề xuất: chỉ dùng ảnh gốc làm fallback khi **không có** cỡ đã sinh nào (hoặc khi ảnh gốc nhỏ hơn `large`, tức Payload bỏ qua cỡ lớn hơn). Test `pickGeneratedSize`/`listCandidates` với width 1920 → trả `large`.

### [MAJOR] M3 — Carousel mobile thiếu ngữ nghĩa carousel bắt buộc (design-spec §1.4)
`src/components/media/Gallery.tsx:44-58`. §1.4 quy định carousel: `role="region"` + `aria-roledescription="carousel"`, slide `role="group"` + `aria-label="2 / 5"`. Hiện chỉ có `section aria-label`, slide là `button` không có group/roledescription. NFR-07 (AA) là yêu cầu chung của mọi trang chính.
Fix đề xuất: thêm `aria-roledescription="carousel"` cho vùng (khi < md; hoặc luôn, chấp nhận được), bọc mỗi `button` trong phần tử `role="group"` `aria-roledescription="slide"` `aria-label="{n} / {total}"` (giữ một DOM, CLS không đổi). Nút Trước/Sau trên mobile: tuỳ chọn (swipe + Tab vẫn thao tác được) — ghi quyết định vào task.

### [MINOR]
- m1 `Gallery.tsx:34, 49` — Bento kích hoạt từ 3 ảnh nhưng lưới cố định 4×2 (hero 2×2 + 4 ô): 3 ảnh để trống 2 ô, 4 ảnh trống 1 ô ở ≥ md. Đề xuất bento chỉ khi ≥ 5 ảnh, hoặc bố cục rút gọn cho 3–4 ảnh.
- m2 `Gallery.tsx:35` — 2 ảnh: chỉ hiện ảnh đầu (khung 4:3 full width cả desktop), ảnh 2 chỉ xem được qua lightbox; không có gợi ý số ảnh. Chấp nhận nếu coi là dữ liệu lỗi, nên hiện counter.
- m3 `Lightbox.tsx:55-58` — `preventDefault()` luôn chạy; nếu nơi dùng không truyền `returnFocusRef`, focus rơi về `body`. Đề xuất chỉ `preventDefault` khi có ref.
- m4 `LazyMap.tsx:66` — nút Zoom của MapLibre `NavigationControl` mặc định 29×29px (< 44px trên mobile, design-spec §1.4). Đề xuất CSS override `.maplibregl-ctrl-group button { width/height: 44px }` ở mobile.
- m5 `VideoFacade.tsx:74-83` — thumbnail `i.ytimg.com` là request bên thứ ba trước khi bấm (lộ IP cho Google, không cookie). Hợp với mẫu facade §1.5; ghi nhận để chính sách cookie/privacy biết.
- m6 `LazyMap.test.tsx:142-148` — xem C1: test unmount là false-confidence.

## Kiểm các quyết định builder (theo yêu cầu)

1. ResponsiveImage: media bucket public cấu hình `s3Storage({ collections: { media: true } })` (`payload.config.ts:74-79`, không `disablePayloadAccessControl`/`generateFileURL`) → URL là `/api/media/file/...` cùng origin qua Payload proxy → custom loader + không `remotePatterns` là **đúng**. `preload` + `fetchPriority="high"` đúng API Next 16 (`get-img-props.js:236` `isLazy = !priority && !preload …`; ném lỗi nếu `preload` + `loading="lazy"` — code đã tránh bằng `loading={undefined}`). `sizes` hero/ô nhỏ hợp lý. Vấn đề: M2. Residual: ảnh qua Payload proxy không có cache CDN/Next optimizer → phụ thuộc cache Nginx/Cloudflare.
2. Gallery: một DOM cho bento + carousel → ảnh LCP tải 1 lần (đúng). `aspect-4/3` (mobile) và `md:aspect-2/1` + `grid-rows-2` (bento) → chỗ giữ cố định, CLS 0. Thiếu ngữ nghĩa carousel → M3.
3. Lightbox: Radix Dialog → focus trap + Esc + `aria-modal`; ←/→ vòng hai đầu; `onCloseAutoFocus` trả focus (test PASS). Reduced motion: `globals.css:246` tắt animation/transition toàn cục → OK. m3.
4. LazyMap: `import("maplibre-gl")` + CSS chỉ trong `mountMap` sau intersect/bấm (test xác nhận không import trước); attribution OSM + `compact: false`; `cooperativeGestures: true`; không API key. Lỗi: C1 (cleanup), M1 (lộ toạ độ). IntersectionObserver disconnect đúng.
5. VideoFacade: whitelist host chặt (so khớp `hostname` chính xác, chặn `http`, userinfo, port), ID regex, `embedUrl` dựng lại từ ID; `youtube-nocookie`; iframe chỉ tạo sau bấm; sandbox `allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox` cho iframe **cross-origin** là đủ cho YouTube/TikTok và không mở quyền với origin của site; `allow` có autoplay/encrypted-media/fullscreen/pip. Save-Data: không tải thumbnail YouTube, SSR `null` → không tải gì trước hydrate. OK (m5).
6. a11y: nút icon đều có `aria-label` theo locale (vi/en test); Lightbox `size-11`, Button `md` `h-11`, link Google `min-h-11` → ≥ 44px (trừ m4). Contrast: chữ `on-dark` trên `dark-deep/60–70`, lỗi `text-error` trên `bg-surface` — theo token, không thấy vi phạm.
7. Dependency: maplibre-gl pin exact `6.11.2`, BSD-3-Clause, lockfile chỉ thêm cây phụ thuộc của nó. Tách chunk: chưa kiểm được (chưa có trang dùng) → Residual risk.
8. Test: hành vi thật (RTL user-event, bàn phím, focus, Save-Data, whitelist URL độc hại, mock IO) — tốt; riêng test unmount LazyMap không bắt được C1.

## Responsive Checklist Gate (375 / 640 / 768 / 1024 / 1280 / 1536)

Không có môi trường browser; xác minh bằng đọc class Tailwind.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang 375 | OK | Carousel `overflow-x-auto` trong khung (cuộn nội bộ), slot `w-full shrink-0`; Lightbox `fixed inset-0`; LazyMap/VideoFacade `w-full` + aspect-ratio; TikTok `max-w-[325px]` + `w-full` |
| Mobile-first (`md:`) | OK | Mọi biến thể dùng tiền tố `md:` |
| Grid không cột cố định | OK (ngoại lệ có lý do) | Bento `md:grid-cols-4` là bố cục cố định theo §3.7, chỉ ≥ md |
| Container không fixed px | OK | Chỉ `max-w-[325px]` (chiều rộng embed TikTok) |
| Typography rem / token | OK | `text-small`, `text-h3` token |
| Media aspect-ratio + max-width | OK | `aspect-4/3`, `md:aspect-2/1`, style `aspectRatio` cho map/video; `fill` + `object-cover/contain` |
| srcset/sizes | OK (xem M2) | `sizes` theo cột; srcset từ loader |
| Touch target ≥ 44px | OK (trừ m4, control bên thứ ba) | `size-11`, `h-11`, `min-h-11` |
| Nav/table | N/A | Không có |
| 100vh | OK | Không dùng; Lightbox `fixed inset-0` |
| prefers-reduced-motion | OK | `globals.css:246`; MapLibre `fadeDuration: 0` khi reduce |
| Không che lỗi bằng overflow:hidden | OK | `overflow-hidden` chỉ ở khung ảnh để cắt ảnh/zoom hover |

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip — không nằm trong verify commands được allow / chưa cấu hình |
| oxlint (anti-slop) | skip, oxlint not configured (không có `.oxlintrc*`); ESLint PASS |
| ocr (open-code-review) | skip, ocr not installed / không được allow |
| AI-readable | OK — tên rõ, file ≤ 200 dòng, hàm ≤ 50 dòng (LazyMap component ~108 dòng tính cả JSX, effect tách riêng; chấp nhận), comment giải thích WHY; 0–1 indicator |
| ai-friendly-web | N/A — component, không phải trang public mới |
| blitzstrike | skip — không có môi trường được phép; đánh giá tĩnh video-url whitelist: không thấy bypass |
| impeccable / frontend-checklist | OK với token/hover/focus; findings M3, m1, m4 |
| security (iframe/URL) | OK cho VideoFacade; FAIL privacy ở LazyMap (M1) |

## Doc impact đề xuất

- no doc impact cho API/ERD/DESIGN. Khi fix M1: ghi contract "toạ độ truyền cho LazyMap khi `showExactAddress = false` phải được làm tròn ở server" vào JSDoc + task layer-8 (chi tiết tin cho thuê) để nơi gọi tuân thủ.

## Residual risk

- Build chưa biên dịch component qua bundler Next (không có route dùng) → dynamic import CSS MapLibre, tách chunk, hydrate chưa được kiểm; cần kiểm ở task đầu tiên dùng component (layer-6-task-05) + đo bundle.
- OSM tile policy: traffic lớn cần tile server khác (ghi chú task).
- Ảnh qua Payload proxy: hiệu năng phụ thuộc cache Nginx/Cloudflare.
- Không kiểm trực quan 375/768/1280.

## Verdict

**FAIL** — 1 CRITICAL (C1), 3 MAJOR (M1, M2, M3). Builder sửa C1, M1, M2, M3 (+ test cho C1/M1/M2), MINOR tuỳ chọn; review lại round 2.
