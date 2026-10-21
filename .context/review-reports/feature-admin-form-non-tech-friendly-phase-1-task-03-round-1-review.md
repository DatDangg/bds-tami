Agent: reviewer

# Review — feature-admin-form-non-tech-friendly · phase-1-task-03 · round 1 (BL-042 #11 Form Lead)

- **Review level:** STRICT
- **Reason:** Lead chứa PII (BR-32 field access phone/email; ipHash/userAgent), component dùng chung form state, link/href sinh từ dữ liệu khách nhập (XSS/URL injection surface).
- **Blast radius:** `src/collections/Leads.ts` (bố cục tabs/row/collapsible, admin.components), `src/components/admin/LeadFormDisplay.tsx`, `src/components/admin/LeadContactButtons.tsx`, `src/lib/admin/lead-contact.ts`, `src/components/admin/styles/_forms.scss`, `src/app/(payload)/admin/importMap.js`, `src/payload-types.ts` (chỉ đổi thứ tự). Không đụng endpoint, hook, job, export, migration.

## Verify commands + result
- `pnpm vitest run src/lib/admin src/collections src/components/admin src/fields src/lib/leads src/hooks/leads src/endpoints src/jobs src/lib/retention` → **78 files / 663 tests PASS**
- `pnpm typecheck` → **PASS** (tsc --noEmit, 0 lỗi)
- `pnpm lint` → **0 error**, 2 warning cũ ở `tools/task-dashboard/server.mjs` (ngoài scope)

## Kiểm tra trọng tâm
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Field access giữ nguyên | OK | Diff `Leads.ts` không đổi một object `access:` nào; phone/email vẫn `customerFieldAccess`, `ipHash` denyAll + `hidden`, `userAgent` adminOnlyRead + `hidden`, các mốc vẫn `systemFieldAccess`. |
| Đường dẫn dữ liệu / schema | OK | `collapsible` + `row` không tên, tab không tên → path giữ nguyên; diff `payload-types.ts` chỉ dời `consentAt`/`consentVersion` (Lead + LeadsSelect), không đổi kiểu/required; không có file migration mới. |
| Field null (`LeadHiddenField`) và form state | OK | Payload v3 dựng form state ở server (`buildFormState`) theo field config, không phụ thuộc component có render hay không → giá trị vẫn nằm trong state và được gửi lên khi lưu; trường vẫn readOnly + update theo `systemFieldAccess` như cũ. `consentAt`/`consentVersion` (required) KHÔNG dùng field null, vẫn render readOnly trong `row`. |
| Lệch D3 (Field null thay `admin.hidden`) | OK, chấp nhận | `hideTechnicalListFields` (`src/lib/admin/list-filter.ts`) coi `admin.hidden === true` là ẩn cột + lọc → dùng `hidden` sẽ mất cột/lọc `lastActivityAt` của BL-039. Task D3 cho phép rõ phương án này. `activitySummary` (ui, không Cell) tự bị ẩn khỏi cột/lọc. |
| Link an toàn | OK | `describeLeadLink` chỉ trả `href` khi `new URL()` có protocol `http:`/`https:`, dùng `url.href` đã chuẩn hoá; `target=_blank rel="noopener noreferrer"`; React escape label. `tel:` lọc còn `[\d+]`; Zalo chỉ `/^0\d{8,10}$/` → không chèn được ký tự. |
| Không fetch thêm PII | OK | Mọi component đọc `useField`/`useFormFields`; không quyền đọc → không có giá trị → không nút (có test). |
| locale (G7) | OK | Nhãn chữ chỉ đọc, `required`/access/options giữ; giá trị vẫn trong form state. |
| Export / search / quick filter / cột BL-039 | OK | Tên trường không đổi; test hiện có PASS. |
| A11y | OK | Nút là `<a>` với nhãn chữ rõ ("Gọi"/"Zalo"/"Gửi email"); `min-height/min-width 44px` ở ≤767px; `focus-visible` outline. |

## Responsive Checklist Gate (diff đụng CSS admin)
- Layout — không cuộn ngang: OK (`flex-wrap: wrap`, `overflow-wrap: anywhere` cho URL dài; không có width cố định).
- Grid auto-fit / container không fixed px: N/A (không có grid, không có container mới).
- Typography rem: OK (`0.875rem`, `0.9375rem`); heading fluid: N/A.
- Spacing: OK (scale 4/8/16px, giống file hiện có).
- Media: N/A.
- Touch target ≥44px trên mobile: OK (`.tami-contact-action` và link chỉ đọc 44px ở `max-width: 767px`).
- Nav / table: N/A.
- 100vh / reduced-motion / overflow:hidden: N/A (không dùng, không có animation).
- Mobile-first: dùng `max-width: 767px` giống quy ước có sẵn trong `_forms.scss` (override CSS desktop-first của Payload admin) → OK theo quy ước repo.
- Residual: không có browser; kiểm bằng CSS math. Chưa kiểm tay ở 375/768/1280.

## Skill gates
- aislop: skip, chưa chạy (Bash chỉ cho phép verify command trong profile).
- oxlint (anti-slop): skip, oxlint not configured (lint = eslint, 0 error).
- ocr: skip, ocr not installed.
- AI-readable: OK — tên rõ, hàm ngắn (<50 dòng), file nhỏ, có hằng `URL_LABEL_MAX`, comment nói WHY. 0 indicator nặng (chỉ có một import ngược lib→components, xem MINOR-3).
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: skip (không có môi trường được phép).

## Findings
- **[MINOR-1] Chèn query vào mailto** — `src/lib/admin/lead-contact.ts` `mailtoHref`: regex `^[^\s@]+@[^\s@]+$` chấp nhận `?`/`&`/`=` (validate email của Payload cũng chấp nhận các ký tự này ở phần local). Vd email khách `x?subject=Hi&body=Hello@tami.vn` → `mailto:x?subject=…` (người nhận thành `x`, thêm sẵn subject/body). Tác động thấp (sale thấy trước khi gửi, không chạy script). Đề xuất: `mailto:${encodeURIComponent(local)}@${domain}` hoặc chặn `?&=#%`.
- **[MINOR-2] Zalo normalize với `+84 0…`** — `zaloNumber`: `+84 0956 789 012` → digits `840956789012` → `00956789012`, vẫn khớp `/^0\d{8,10}$/` nên ra link Zalo sai. Đề xuất: sau khi bỏ `84`, bỏ thêm số 0 thừa ở đầu (`0${digits.slice(2).replace(/^0/, "")}`) và thêm test.
- **[MINOR-3] Import ngược lib → components** — `src/lib/admin/lead-contact.ts:1` import `relativeTimeVi` từ `components/admin/dashboard/dashboard-format`. Vẫn chạy được; nên chuyển formatter sang `src/lib/admin` ở task sau.
- **[MINOR-4] Test access còn yếu** — `src/collections/leads-form.test.ts` "access không đổi" chỉ kiểm shape (`expect.any(Function)`), không kiểm đúng hàm. Đề xuất: so identity với `customerFieldAccess`/`systemFieldAccess`/`denyAll`/`adminOnlyRead` (export hoặc snapshot `.name`). Diff đã xác nhận access không đổi nên không chặn PASS.

Không có CRITICAL/MAJOR.

## Residual risk
- Chưa kiểm tay trên trình duyệt: Field null ở sidebar không để lại khoảng trống thừa; cách hiện của collapsible; lưu form sale/admin vẫn giữ giá trị các mốc (lập luận dựa trên cơ chế buildFormState của Payload v3, không có test e2e).

## Verdict: PASS
