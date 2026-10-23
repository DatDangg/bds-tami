Agent: reviewer

# Review — feature-consult-popup-30s · phase-1-task-01 · round 1

- Review level: **STRICT**
- Reason: thêm giá trị vào enum DB `enum_leads_source` + migration; API contract `POST /api/public/leads` nhận `source: "popup"`; khung trang dùng chung `PublicShell` (mọi trang công khai VI/EN + 404); form công khai (Turnstile / consent / rate limit / dedupe).
- Blast radius: bảng `leads` (enum `source`), `leadInputSchema` (zod), endpoint lead công khai, `createOrMergeLead` / dedupe / auto-assign, select + lọc + xuất Excel nguồn lead ở admin (`LEAD_SOURCES`, `SOURCE_LABELS`), mọi trang công khai (island `ConsultPopup` trong `PublicShell`), i18n `form.consultPopup`, `payload-types.ts`, docs `API_SPEC.md` §3.1 / `ERD.md`.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, 0 lỗi) |
| `pnpm test src/components/leads src/endpoints/public/leads.test.ts src/lib/leads tests/integration/leads-migration.test.ts` | PASS — 11 file / 162 test |
| `pnpm test` (toàn bộ) | PASS — 427 file / 4469 test |
| `pnpm lint` | FAIL nhưng **ngoài scope**: 4 error `no-explicit-any` ở `.local-seed/seed-sample-project-blocks.ts` + 2 warning `tools/task-dashboard/server.mjs`. Không có problem nào ở file thuộc task (đã xác minh trên output lint đầy đủ). |
| `git diff --no-index` snapshot `20261022_172224…json` → `20261023_020647_leads_source_popup.json` | Chỉ khác: thêm `"popup"` vào `public.enum_leads_source` + `id`. Không drift. |
| `pnpm build` | Không chạy lại — tin evidence builder (route `[locale]` vẫn `●`). Kiểm bằng code: `ConsultPopup` chỉ dùng `usePathname`, `PublicShell` chỉ đọc `process.env.TURNSTILE_SITE_KEY` (giống trang Liên hệ), không `headers()`/`cookies()`/`useSearchParams` → không làm layout dynamic. |

## Kiểm theo trọng tâm
- Migration: `ALTER TYPE "public"."enum_leads_source" ADD VALUE IF NOT EXISTS 'popup'`, down no-op có comment lý do (theo tiền lệ), đăng ký `migrations/index.ts`. Additive. OK.
- `popup` không lách kiểm tra: `hasSourceRecord()` thay mọi so sánh `=== "contact"`; zod transform xoá `sourceId` khi `popup`; `isPublicSource` bỏ tra; dedupe theo (SĐT, `popup`) không điều kiện bản ghi; `assign.ts` chỉ giao rental/property_post → `popup` không tự giao. Consent/Turnstile/rate limit giữ nguyên pipeline. OK.
- Phiên 30s: mốc `startedAt` ghi lần đầu (kể cả ở /lien-he), remaining tính lại mỗi đổi pathname, cờ `shown` ghi trước khi mở, storage get/set lỗi → không hiện. Cleanup timer + listener ở effect cleanup. OK.
- Trang Liên hệ: routing `localePrefix: "as-needed"`, `/lien-he` ↔ `/contact` (`src/i18n/routing.ts:39,49`) → `/lien-he`, `/en/contact` (+ slash cuối) đúng path thật. OK.
- Admin: `PublicShell` chỉ ở frontend. OK.
- a11y: Radix Dialog (focus trap, Esc, overlay), `DialogTitle` làm nhãn, nút × `aria-label` i18n, 44×44px; trả focus tự xử lý ở `onCloseAutoFocus`. OK.
- z-index: dialog `--z-modal: 60` > `--z-cookie: 45` > `--z-floating: 40`. OK.
- i18n vi/en đủ 3 key; dark mode dùng token (`bg-surface`, `text-text`, `bg-overlay`). OK.
- Field id trong `LeadForm` dùng `useId` → không trùng id khi trang có form lead khác + popup. OK.
- Docs as-built `API_SPEC.md` §3.1 + `ERD.md` khớp code. OK.

## Responsive Checklist Gate (diff đụng UI: `ConsultPopup` + `PublicShell`)
Không có browser trong quyền reviewer → xác minh bằng CSS math + ảnh builder.
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | `DialogContent` `w-[calc(100%-2rem)] max-w-md`, fixed + translate giữa; 390 → 358px; builder đo `scrollWidth = 390` |
| Mobile-first / container không fixed px | OK | `max-w-md` (rem), `p-5 md:p-6` (min-width) |
| Grid auto-fit/minmax | N/A | không có grid cột mới |
| Typography rem/token | OK | `text-h3`, `text-small` token; không px |
| Media | N/A | không có ảnh/video mới |
| Touch target ≥ 44px | OK | nút × `size-11` (44px); input/nút submit tái dùng `LeadForm compact` có sẵn |
| Nav mobile / table | N/A | không đổi |
| Viewport (không 100vh) | OK | `max-h-[calc(100dvh-2rem)] overflow-y-auto` → cuộn được khi form cao hơn màn |
| prefers-reduced-motion | OK | animation dialog có sẵn; `globals.css` có 2 khối `prefers-reduced-motion` (không đổi trong diff) |
| Không che lỗi bằng overflow:hidden | OK | dùng `overflow-y-auto`, không `overflow:hidden` |

## Skill gates
- aislop: skip — `aislop` không nằm trong verify commands được allow cho reviewer.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc.json`). ESLint trên file task: 0 problem.
- ocr (open-code-review): skip, ocr not installed / không trong allowlist.
- AI-readable: OK — tên rõ (`hasSourceRecord`, `isTypingInForm`, `whenFormFocusLeft`), hàm < 50 dòng, `ConsultPopup.tsx` 131 dòng, hằng số đặt tên (`POPUP_DELAY_MS`), comment nêu WHY. 0 indicator.
- ai-friendly-web: N/A (không đổi SEO/robots/sitemap).
- blitzstrike: skip — không có môi trường pentest được phép; surface API không đổi ngoài thêm giá trị enum đã đi qua zod.

## Findings

### [MAJOR] M1 — Điều kiện "hết hoãn" sai: popup mở khi focus rời Ô NHẬP chứ không phải rời FORM → có thể nuốt cú bấm "Gửi" của form khác
- `src/components/leads/ConsultPopup.tsx:18,58-61,64-71`
- Spec F9 BL-066 + acceptance task: "focus đang ở trong một form khác (ô nhập trong `<form>`) → **hoãn tới khi focus rời form**". Code dùng chung `isTypingInForm()` (chỉ khớp `input, textarea, select, [contenteditable]`) cho cả điều kiện bắt đầu hoãn **và** điều kiện kết thúc. Khi khách đã gõ xong ô SĐT và bấm nút Gửi (hoặc Tab sang nút / iframe Turnstile) của form đó: `focusout` → `setTimeout 0` → `activeElement` là `<button>`/`<iframe>` (không khớp selector) → `show()` → modal mở ngay giữa mousedown và mouseup; overlay Radix chặn pointer nên click Gửi bị nuốt, khách phải đóng popup rồi bấm lại. Trên Safari/macOS bấm nút không nhận focus → `activeElement = body` → cùng hậu quả. Đây đúng tình huống spec muốn tránh (không chen vào khi khách đang điền form khác), và hay xảy ra ở trang chi tiết dự án/tin có `LeadForm`.
- Test hiện có (`ConsultPopup.test.tsx:160-170`) chỉ blur ra ngoài form nên không bắt được.
- Fix đề xuất: tách điều kiện kết thúc: khi đang hoãn, chỉ mở khi `document.activeElement` **không nằm trong form đã hoãn** (lưu `form = active.closest("form")` lúc bắt đầu hoãn; recheck `!form.contains(document.activeElement)`); cân nhắc thêm nghe `submit` của form đó (hoãn thêm, hoặc mở sau khi submit xong). Thêm test: focus input → Tab/focus sang nút submit cùng form → popup **chưa** mở; focus ra ngoài form → mở.

### [MINOR] m1 — Popup có thể mở chồng lên modal khác đang mở (Lightbox, Sheet menu mobile)
- `src/components/leads/ConsultPopup.tsx:98-107`
- Tới mốc 30s khi khách đang xem Lightbox ảnh hoặc menu mobile (Radix modal), popup mở chồng → hai focus trap lồng nhau. Không nằm trong acceptance; đề xuất hoãn khi đã có `[role=dialog][data-state=open]` (cùng cơ chế hoãn như M1). Không chặn PASS.

### [MINOR] m2 — Doc impact `docs/DESIGN.md`
- Builder đã gợi ý; nếu `DESIGN.md` có mục khung trang / island `PublicShell` thì close-out cần thêm `ConsultPopup`, nếu không ghi `no doc impact` cho DESIGN. Không chặn PASS.

## Residual risk
- Không kiểm được UI thật trong browser (390/768/1440, dark mode) — dựa CSS math + ảnh `.context/review-reports/assets/bl066-popup-1440.jpg` của builder.
- `pnpm build` không chạy lại; kết luận SSG/ISR dựa trên phân tích code + evidence builder.
- `TURNSTILE_SITE_KEY` được nướng vào HTML tĩnh lúc build (giống trang Liên hệ) → môi trường build phải có biến này.
- sessionStorage là theo tab: mở tab mới gõ URL tay trong lúc tab cũ còn mở sẽ là phiên mới (đúng lựa chọn user "phiên trình duyệt = sessionStorage").

## Verdict
**FAIL** — 1 MAJOR (M1). Sửa M1 + thêm test tương ứng rồi review round 2.
