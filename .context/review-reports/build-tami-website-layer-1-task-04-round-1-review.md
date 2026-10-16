Agent: reviewer

# Review — build-tami-website layer-1-task-04 (nền UI: tokens → Tailwind v4 + shadcn, font, Phosphor, chặn lucide) — round 1

- **Review level:** STRICT
- **Reason:** shared foundation — primitive (Button/Input/Select/Checkbox/Badge/Dialog/Sheet/Skeleton), `cn()` và globals.css được mọi màn frontend dùng; đụng a11y (focus trap, contrast AA).
- **Blast radius:** `src/app/(frontend)/globals.css` (mọi trang `[locale]`), `src/components/ui/*`, `src/lib/utils.ts` (`cn`), `src/lib/fonts.ts`, `src/components/icons.ts`, `eslint.config.mjs` (toàn repo), `vitest.config.ts` (project mới `ui`/jsdom), `package.json` + lockfile. Mở khoá layer-2-task-05/08/09, layer-5-task-05/06/07.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS (lockfile diff chỉ sắp xếp lại, không bump version cũ) |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS — 13 files / 140 tests |
| `pnpm build` | PASS (Next 16.4.2 Turbopack) |
| `pnpm audit --audit-level high` | exit 0 — 2 low, 1 moderate, 1 high (ignored, cấu hình có sẵn, không do task này) |

## Kiểm tra trọng tâm
- globals.css vs tokens §11: khớp 3 lớp (`@theme static` gốc TAMI → `:root, .theme-dark-block` biến shadcn → `@theme inline` chỉ tên chưa có ở lớp 1). Không vòng tham chiếu (`--color-primary`/`--color-border` không khai lại trong `@theme inline`). `.theme-dark-block` khớp spec. 4 màu đã sửa đúng (`#6b6b6b`, `#a07a3f`, `#8a5a0a`, `#857f79`). OK
- Contrast test (`src/lib/contrast.test.ts`) đọc giá trị thật từ globals.css, resolve `var()`, có cả khối tối. OK
- Font: `next/font/google`, subset `latin`+`vietnamese`, `display: swap`; CSS build có `font-display:swap` + unicode-range tiếng Việt. OK
- ESLint chặn `lucide-react` + subpath, có test chứng minh. OK
- CSS không rò sang admin: chunk `.next/static/chunks/3wgujmxf7314n.css` chỉ được tham chiếu bởi `/vi`, `/en` và `(frontend)/[locale]` manifest; không có ở route `/admin`. OK
- a11y primitive: focus-visible toàn cục dùng `--color-focus-ring`; không `outline-none` (chỉ `outline-hidden` ở SelectItem, thay bằng nền highlighted — chấp nhận); Dialog/Sheet có `closeLabel` bắt buộc, test focus trap + Esc + trả focus PASS; Checkbox vùng chạm 44px qua `after:-inset-3`. OK
- Dependency: radix-ui unified, phosphor, cva/clsx/tailwind-merge, tailwind v4 + postcss, testing-library ×3, jsdom — đều dùng, không thừa. OK

## Responsive Checklist Gate
Diff chỉ thêm primitive + CSS nền, không thêm route/layout/trang. Đánh giá phần primitive (CSS math, không có browser):
- Layout (không horizontal scroll): OK — Dialog `w-[calc(100%-2rem)] max-w-lg`, Sheet `w-3/4 max-w-sm`; không container px cố định. Grid: N/A.
- Typography rem/clamp: OK ở token (rem + `clamp()`); nhưng xem MAJOR-1 (class cỡ chữ bị twMerge loại).
- Media: N/A (không có ảnh/video).
- Touch target ≥44px: OK — Button md 44px, nút đóng `size-11`, SelectItem `min-h-11`, Checkbox 44px; Button sm 36px ghi "chỉ desktop" theo tokens §10 (nơi dùng phải tuân thủ). Nav/table: N/A.
- Viewport/A11y: OK — dùng `dvh` (không `100vh`), có `prefers-reduced-motion`, không che lỗi bằng `overflow:hidden`.

## Skill gates
- aislop: skip — reviewer chỉ được chạy verify command trong profile.
- oxlint (anti-slop): skip — không nằm trong verify command được allow; ESLint PASS.
- ocr: skip, ocr not installed/not allowed.
- AI-readable: OK — file nhỏ, tên rõ, comment nêu WHY; 0–1 indicator.
- ai-friendly-web: N/A (task nền nội bộ, chưa có trang public mới).
- blitzstrike: N/A (không đụng auth/API/input server).

## Findings

**[MAJOR-1] `cn()` dùng `twMerge` mặc định → class cỡ chữ token bị xoá âm thầm** — `src/lib/utils.ts:5`
tailwind-merge v3 mặc định chỉ hiểu cỡ chữ dạng t-shirt (`xs|sm|…|xl`); `text-button`, `text-h3`, `text-small`, `text-xsmall`, `text-body` bị xếp vào nhóm *text-color* nên khi đi sau là `text-primary-foreground`/`text-text`/… class cỡ chữ đứng trước bị loại. Ảnh hưởng: `button.tsx:8` (`text-button` + màu variant ở dòng 12–17 → mất cỡ 0.875rem + letter-spacing 0.08em), `badge.tsx:7` (`text-xsmall` vs `text-badge-foreground`/`text-text`…), `dialog.tsx:20,33` & `sheet.tsx:21,34` (`text-h3 text-text`, `text-small text-text-secondary`), `input.tsx:11`, `select.tsx:21` (`text-body text-text`). Test Button không kiểm `text-button` nên không phát hiện (false-confidence). Kết luận dựa trên cấu hình mặc định tailwind-merge v3 (`color: [isAny]`, `text: [isTshirtSize]`); reviewer không được chạy node để in class thực tế.
Fix: `extendTailwindMerge({ extend: { classGroups: { "font-size": [{ text: ["display","watermark","h1","h2","h3","h4","lead","body","small","xsmall","eyebrow","button","price"] }] } } })` trong `utils.ts`; thêm test `cn("text-button text-primary-foreground")` giữ cả hai và assert Button có `text-button`.

**[MAJOR-2] Animation Dialog lệch vị trí (cộng dồn translate)** — `src/app/(frontend)/globals.css:122-133` + `src/components/ui/dialog.tsx:55`
Tailwind v4 `-translate-x-1/2 -translate-y-1/2` dùng thuộc tính `translate` (build CSS: `.-translate-x-1\/2{…translate:var(--tw-translate-x) var(--tw-translate-y)}`), còn keyframes `dialog-in/out` animate `transform: translate(-50%, calc(-50% + 8px))`. `translate` và `transform` cộng dồn → khi mở/đóng, dialog bắt đầu/kết thúc ở (-100%, -100%+8px), nhảy chéo lên trái nửa kích thước rồi giật về giữa. Ảnh hưởng mọi dialog toàn site.
Fix: keyframes chỉ dịch phần chênh: `from { opacity: 0; transform: translateY(8px); }` / `to { opacity: 0; transform: translateY(8px); }`.

**[MINOR-1]** `src/components/ui/button.tsx:20` — size `sm` dùng `text-[0.8125rem]` ngoài thang token (§10 quy định chữ `--text-button`). Bỏ hoặc thêm token.
**[MINOR-2]** `src/components/ui/sheet.tsx:47-48` — `h-dvh` thừa khi đã `inset-y-0`; bỏ để khỏi phụ thuộc `dvh`.

## Residual risk
- `next/font/google` tải font lúc build → CI/Docker build không có mạng (hoặc Google Fonts bị chặn) sẽ fail. Cân nhắc `next/font/local` hoặc đảm bảo runner có egress; ghi vào task devops.
- MAJOR-1 kết luận bằng phân tích cấu hình thư viện, chưa chạy runtime; fix kèm test sẽ khẳng định.
- Responsive chưa đo trên browser thật (không có môi trường).
- Audit: 1 high đang bị ignore từ trước — cần theo dõi ngoài task này.

## Verdict
❌ FAIL — 2 MAJOR (MAJOR-1, MAJOR-2). Trả builder fix + thêm test, rồi review round 2.
