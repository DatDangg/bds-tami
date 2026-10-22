# Review — admin-form-ux-polish / phase-1-task-05 / round 4

> Agent: reviewer. Report persisted by primary (hook guard.mjs chặn reviewer Write do đường dẫn worktree lồng trong `.claude/worktrees/`).

- Review level: **NORMAL**
- Reason: Admin-only SEO tab UI (phương án B). Không đổi schema/`seo.*` path, không đụng `src/lib/seo/**`, không auth/tenant. Round 4 chỉ xác nhận fix MAJOR round 3 (Trang chủ SEO trống) + không hồi quy các finding đã đóng ở round 1–2.
- Blast radius: `src/fields/seo.ts` (group `seo` dùng chung cho 6 collection qua `content-defaults.ts` + global `Homepage.ts:288`), `src/collections/_shared/content-defaults.ts`, `src/components/admin/SeoPreview.tsx` + `SeoLengthCounter.tsx` (client, đọc form), `src/lib/admin/seo.ts`, `_forms.scss`, `importMap.js`, `tests/unit/admin-labels.test.ts`.

## Verify commands + result (tự chạy trong worktree)

- `pnpm exec eslint src tests` — **PASS** (exit 0, 0 error).
- `pnpm typecheck` (= `tsc --noEmit`) — **PASS** (exit 0).
- `pnpm exec vitest run --project unit --project ui` — **PASS**, 344 files / **3341/3341** tests.
- `pnpm build` — không chạy lại; builder báo PASS, không có lý do nghi ngờ.
- `pnpm lint` (= `eslint .`) fail do lỗi pre-existing ngoài `src/tests` — **chấp nhận**, đồng nhất chuẩn round 1–3.
- Integration + ảnh admin 1440/390 — **BLOCKED** (Postgres 5433 down), không coi là lỗi code.

## Đối chiếu finding round 3 (MAJOR: Trang chủ SEO trống)

| Kiểm tra | Kết quả | Bằng chứng |
|---|---|---|
| Fallback đúng nguồn `page.home.title/description` như `app/(frontend)/[locale]/page.tsx:19-25` | **OK** | `src/lib/admin/seo.ts:129-132` `homepageSeoFallback(locale)` đọc `vi.json`/`en.json` → `page.home.{title,description}`; `SeoPreview.tsx:43,58,60` chỉ áp khi `globalSlug` (chỉ `Homepage.ts:288` dùng `seoField()` ngoài `content-defaults`, nên an toàn). |
| Test parity có thật (gọi `buildPageMetadata`) | **OK** | `src/lib/admin/seo.test.ts:249-272` gọi `buildPageMetadata` thật với đúng input page.tsx (seo trống, `hasEnglish:true`, paths vi/en) + `createTranslator` namespace `page.home`; assert preview == `truncateForGoogle(metadata.title/description)` **và** giá trị cụ thể `"<title> | Tami Land"` / description nguyên văn. Component test `SeoPreview.test.tsx:102-120` kiểm vi + en + `/en`. |
| Không hồi quy round 1–2 | **OK** | Tên website: `buildSeoTitle` (`seo.ts:135-139`) y `buildTitle` `metadata.ts:68-71`. Mô tả theo route: `SEO_DESCRIPTION_SOURCE` + `seo.ts:181` y `metadata.ts:113`. Canonical http(s)/URL trang: `seo.ts:182`. URL EN chỉ khi `hasEnglish === true`: `seo.ts:114`, `SeoPreview.tsx:51`; test `seo.test.ts:185-190`, `SeoPreview.test.tsx:68-82`. |
| Đường dẫn dữ liệu `seo.*` không đổi | **OK** | `seo.test.ts:21-24` `dataPaths` == `[metaTitle, metaDescription, ogImage, noindex, canonical]`; collapsible không tên. |
| Nhãn không lộ thuật ngữ dev (BL-040) | **OK** | `seo.test.ts:43-52`; `admin-labels.test.ts` quét tab có nhãn → group `label:false` hợp lệ. |

## Responsive Checklist Gate (CSS tĩnh, không có trình duyệt)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Layout / không tràn ngang | OK (static) | `.tami-seo-preview__{title,url,description}` có `overflow-wrap:anywhere`; card không fixed width/grid (`_forms.scss:169-212`). |
| Mobile-first / grid / container | OK | Không grid; chỉ 1 rule `max-width:640px` giảm padding, không ảnh hưởng tràn. |
| Typography / spacing | OK | Font-size `rem`; spacing 2–16px. |
| Media | N/A | Không ảnh. |
| Touch / interaction | N/A | Không control mới; collapsible chuẩn Payload. |
| Viewport / a11y | OK (static) | Không `100vh`/animation; `<section aria-label>`, counter `aria-live="polite"`. |

Residual: chưa có ảnh 1440/390 thật (BLOCKED DB); không mục nào FAIL.

## Skill gates

- `aislop`: skip — CLI unavailable (round 1–3 đã ghi; không chạy lại theo Tool Loop Guard).
- `oxlint`: skip, oxlint not configured.
- `ocr`: skip, ocr not installed.
- AI-readable: **OK** — `seo.ts` 187 dòng, `SeoPreview.tsx` 75 dòng, hàm ≤ 50 dòng; tên rõ, comment WHY trỏ về `metadata.ts`/`page.tsx`; hằng có tên. Không đổi luồng chính.
- AI-friendly-web: N/A — admin nội bộ.
- Blitzstrike: N/A — không endpoint mới; chỉ GET `site-settings` đã có.

## Findings

Không có CRITICAL/MAJOR.

### [MINOR] Placeholder ô SEO là chuỗi tĩnh, không hiện giá trị fallback động
- `src/fields/seo.ts:42,52`. Payload chỉ nhận placeholder tĩnh trong config; giá trị thật đã hiện trong khung xem trước ngay phía trên ô (`beforeInput`). **Chấp nhận** — ghi Decision log của task; placeholder động cần custom Field component (over-engineer).

### [MINOR] `importMap.js:48-50` thứ tự import không nhóm theo file
- File sinh bởi Payload, không sửa tay. Không hành động.

## Residual risk

- Chưa có evidence trình duyệt (ảnh 1440/390, collapsible "Nâng cao", render trong tab) do Postgres down; parity được chứng minh bằng test gọi `buildPageMetadata` thật. Đề xuất chụp ảnh before/after khi DB khả dụng, đính vào task trước close-out phase.
- `window.location.origin` làm gốc URL preview; admin chạy khác domain site thì chữ URL xem trước lệch — ngoài acceptance.

## Verdict

✅ **PASS** — finding MAJOR round 3 đã fix đúng nguồn và có test parity thật; không hồi quy round 1–2; verify PASS trong worktree.
