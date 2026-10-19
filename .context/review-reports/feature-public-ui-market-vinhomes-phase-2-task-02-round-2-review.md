Agent: reviewer

# Review: feature-public-ui-market-vinhomes · phase-2-task-02 · round 2
> Report do primary lưu (guard chặn reviewer ghi `.context/review-reports/**` trong worktree).

- **Review level:** STRICT
- **Reason:** thêm parallel route slot `@banner` (có catch-all `[...rest]`) dưới `[locale]/layout.tsx` — gốc của mọi trang public: ảnh hưởng khớp route, 404 (`experimental.globalNotFound`), ISR, shell dùng chung (`PublicDocument` → `PublicShell`); UI public mới (form GET tới `/cho-thue`, `/du-an`; `<script>` inline).
- **Blast radius:** mọi route `src/app/(frontend)/[locale]/**`; `global-not-found.tsx`, `[locale]/not-found.tsx`; `PublicDocument.tsx`, `PublicShell.tsx` (prop `banner` tuỳ chọn); `loadHomeDocs` thêm 2 truy vấn song song (chip dự án, `listProvinces`) khi có hero + bật ô tìm kiếm; client `AnnouncementBar`, `HeroSearch`, `HeroSlider`; docs design-spec S01.1a/1b, DESIGN.md. Không đổi schema/spec/BACKLOG/progress.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (0 error, 2 warning cũ) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run src/components src/lib src/i18n src/app` | PASS 1718/1718 |
| build/trình duyệt | reviewer không chạy (primary) |

## Đóng finding round 1
| Finding r1 | Sửa r2 | Trạng thái |
|---|---|---|
| MAJOR 1 vị trí thanh | thanh lên trên cùng, trong luồng, trước header nổi (slot `@banner/page.tsx` cho `/`, `/en`; `[...rest]`/`default.tsx` trả `null`; `PublicShell` render `{banner}` sau SkipLink, trước Header; header `sticky top-0`; hero vẫn chỉ `-mt-(--header-offset)`; test `PublicShell.test.tsx:57-65`) | CLOSED (về code) |
| MINOR 2 đích nút cuộn | `HeroSlider.tsx:132-144` cuộn tới `[data-hero-search]` với `scroll-mt-(--header-offset)` | CLOSED |
| MINOR 3 tab Dự án | `HeroSearch.tsx:100-129` form GET `/du-an` chỉ `province`, `status` (tham số sẵn có), `OptionSelect progressive` | CLOSED |
| MINOR 4 khoá localStorage | `announcement-hash.ts:2` theo locale | CLOSED |
| MINOR 5 Home/End | `HeroSearch.tsx:48-61` | CLOSED |
| MINOR 6 chú thích | S01.1b | CLOSED |
| MINOR 7 script khi render client | `AnnouncementBar.tsx:56,88` `useSyncExternalStore` (server `true`, client `false`) → script chỉ ở HTML server + lần hydrate đầu | CLOSED |

## Phân tích parallel route (Next 16.4.2, đọc source)
`normalizeCatchAllRoutes` gắn `@banner/[...rest]` vào mọi route dưới `/[locale]/` trừ `/[locale]`, và tạo route `/[locale]/[...rest]` (slot `children` không page/default) — bị `strictRouteMatching` (mặc định `true`) cắt bỏ → URL không khớp vẫn về `global-not-found.tsx`. **Không** thêm `[locale]/default.tsx`. Route khác `/` render `NoBanner` (tĩnh, không truy vấn). Điều hướng client `/` → `/du-an` bỏ thanh. Reviewer **không xác nhận được** từ source rằng các route còn ISR (residual #2).

## Responsive gate (tính CSS)
Không cuộn ngang (thanh full width `max-w-container`, chữ `text-balance`; card `max-w-4xl`; chip cuộn trong `ul`); mobile-first; grid form dự án `1fr 1fr auto` + `min-w-0`; chạm ≥ 44px; hero `h-svh`; reduced-motion OK; overlap md+: card đè 96px, điều khiển `md:bottom-28`.

## Skill gates
aislop skip · oxlint skip (ESLint + tsc PASS) · ocr skip · AI-readable OK (1 chỉ báo: hàm `HeroSearch` ~115 dòng JSX) · ai-friendly-web N/A · blitzstrike skip (rà tay: script chỉ nội suy `JSON.stringify(storageKey)`, không XSS; repo không có CSP chặn inline).

## Findings (reviewer)
Không CRITICAL, không MAJOR.
- **[MINOR] 1** `src/app/(frontend)/[locale]/layout.tsx:83-85` JSX trả về chưa format.
- **[MINOR] 2** `src/lib/home/home-queries.ts:418` `listProvinces` nạp cả document tỉnh (chỉ cần `slug`, `name`, `shortName`).
- **[MINOR] 3** `AnnouncementBar.tsx:31-34` listener `storage` ẩn thanh ở tab khác → dịch layout không do người dùng ở tab đó (không đáng kể).
- **[MINOR] 4** `HeroSlider.tsx:152-153` màn ngắn (~1024×600) với `min-h-[560px]` còn ~248–288px cho tiêu đề/CTA → có thể bị cắt; kiểm trình duyệt.

## Residual risk (reviewer giao primary)
1. 404 đầy đủ `global-not-found` cho `/en/khong-ton-tai`, `/vi/du-an/a/b`, `/wp-login.php`.
2. **Bảng route `next build`: các route phải còn ISR (revalidate 60), không thành ƒ.**
3. Điều hướng client, tải cứng `/du-an` không có thanh, không flash khi đã đóng, header dính dưới thanh, 375/768/1280.
4. Nếu thêm `loading.tsx` ở `[locale]`, script inline sẽ không chạy.

## Verdict reviewer: PASS (về code)

---

## Bổ sung của primary — bằng chứng build (đóng residual #2): **FAIL thực tế**
`next build` ở worktree sạch `build-p2t02r2` (HEAD `1070257` + diff r2) so với `build-p2t02` (diff r1, chưa có slot): các route chuyển từ ● (SSG/ISR) sang ƒ (dynamic):
`/[locale]/chinh-sach-bao-mat`, `/[locale]/cho-thue`, `/[locale]/dieu-khoan-su-dung`, `/[locale]/du-an`, `/[locale]/lien-he`, `/[locale]/tin-bds`, `/[locale]/tin-tuc`, `/[locale]/tuyen-dung` (+ các trang cùng loại). Hồi quy hiệu năng/ISR (NFR-01) do slot catch-all `@banner/[...rest]`.
→ Không đóng task. Builder round 3: bỏ slot `@banner`, layout đọc thanh thông báo từ global `homepage` đã cache + client wrapper chỉ render ở đường dẫn trang chủ (`usePathname`), giữ các route tĩnh; primary build lại và so bảng route.
