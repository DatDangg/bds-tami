Agent: reviewer

# Review — build-tami-website layer-1-task-04 — round 2

- **Review level:** STRICT
- **Reason:** nền UI dùng chung: `cn()`, globals.css và các primitive (Button/Dialog/Sheet/…) được mọi màn frontend dùng; round 1 có 2 MAJOR ở shared code.
- **Blast radius:** `src/lib/utils.ts` (`cn` + `FONT_SIZE_TOKENS`), `src/app/(frontend)/globals.css` (keyframes dialog, token `--text-button-sm`), `src/components/ui/button.tsx`, `sheet.tsx`, `dialog.tsx`; follow-up ghi ở `tasks/tami-website/layer-3-task-03.md`.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS — 14 file / 144 test (log APIError 400 là output có chủ đích của test integration access, test vẫn pass) |
| `pnpm build` | PASS (/vi, /en SSG; /admin, /api dynamic) |

## Kiểm lại các finding round 1
- **MAJOR-1 (cn xoá class cỡ chữ): ĐÃ SỬA.** `utils.ts:23-25` dùng `extendTailwindMerge` thêm nhóm `font-size` với `text: FONT_SIZE_TOKENS`. Test `utils.test.ts` chứng minh: cỡ + màu được giữ cả hai (`text-button text-primary-foreground`), cỡ sau thắng cỡ trước (kể cả `text-lg`), màu sau thắng màu trước. Test cũng đối chiếu danh sách token với `--text-*` trong globals.css (bỏ biến phụ `--x--line-height`/`--letter-spacing`), nên token thêm sau này mà quên khai sẽ làm test fail. Line-height/letter-spacing: trong build, `.text-button` dùng `var(--tw-leading, …)` / `var(--tw-tracking, …)`. Xung đột `font-size → leading` vẫn theo mặc định của tailwind-merge (cỡ chữ đứng sau sẽ ghi đè `leading-*` đứng trước), đúng ngữ nghĩa Tailwind, không bị ảnh hưởng sai. `button.test.tsx:10` giờ có assert `text-button`; size sm (`text-button-sm`) thay `text-button` đúng cách.
- **MAJOR-2 (keyframes dialog cộng dồn translate): ĐÃ SỬA.** Nguồn `globals.css:125-136` và CSS đã build (`.next/static/chunks/2skm595uw1jqb.css`): `@keyframes dialog-in{0%{opacity:0;transform:translateY(8px)}` / `dialog-out{to{opacity:0;transform:translateY(8px)}`. Animation chỉ chạy phần chênh, còn `translate` -50%/-50% giữ dialog ở giữa.
- **MINOR-1: ĐÃ SỬA.** `button.tsx:20` dùng `text-button-sm` (token `--text-button-sm: 0.8125rem`, kèm line-height và letter-spacing), không còn giá trị tuỳ ý `text-[...]`.
- **MINOR-2: ĐÃ SỬA.** `sheet.tsx:47-48` đã bỏ `h-dvh`; top/bottom giữ `max-h-dvh` (hợp lý).
- **Residual font/mạng:** đã ghi follow-up vào `tasks/tami-website/layer-3-task-03.md`. OK

## Responsive Checklist Gate (chỉ phần thay đổi ở round 2)
- Layout: OK — không đổi container/grid; Sheet trái/phải dùng `inset-y-0` (không còn `h-dvh`).
- Typography: OK — `--text-button-sm` dùng rem.
- Media: N/A.
- Touch target: OK — không đổi chiều cao (sm 36px chỉ desktop theo tokens §10; md 44px).
- Viewport/A11y: OK — `max-h-dvh`/`100dvh`, giữ khối `prefers-reduced-motion`.
Chưa đo trên browser thật, chỉ kiểm bằng CSS math và CSS đã build.

## Skill gates
- aislop: skip — chỉ được chạy verify command trong profile.
- oxlint: skip, oxlint not configured trong verify commands; ESLint PASS.
- ocr: skip, ocr not installed.
- AI-readable: OK — diff nhỏ, comment ở `utils.ts` giải thích lý do (WHY); 0 indicator.
- ai-friendly-web: N/A (task nền nội bộ).
- blitzstrike: N/A (không đụng auth/API/input).

## Findings
**[MINOR-1] Nguồn token chưa có tên `--text-button-sm`** — `skills/react-nodejs/design-tokens.md:149`
Bảng tokens chỉ ghi "`--text-button` … sm `0.8125rem`" trong cùng một dòng, không có tên token riêng. Giá trị khớp (0.8125rem), nhưng globals.css (header ghi "Nguồn sự thật: design-tokens.md §11") khai thêm một tên token mà nguồn chưa có. Fix (doc): thêm dòng `--text-button-sm` (0.8125rem / lh 1 / 0.08em) vào §2.1 và bảng mapping §11 khi close-out (Doc Impact).

## Verdict
✅ PASS — MAJOR-1 và MAJOR-2 đã sửa, có test và CSS build làm bằng chứng; MINOR round 1 đã xử lý; không thấy regression. Còn 1 MINOR về doc, không chặn PASS.
