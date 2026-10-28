Agent: reviewer

# Review — bug-project-floorplan-tabs-clipped · phase-1-task-01 · round 1 (BL-096)

- **Review level:** STRICT
- **Reason:** sửa shared component `ListingTabsScroller` (consumer `ListingCategoryTabs` cho `/cho-thue`, `/du-an`, `/tin-bds` + danh mục con) + a11y bàn phím/focus của mẫu ARIA tabs.
- **Blast radius:** `src/components/listing/ListingTabsScroller.tsx` (2 prop tùy chọn, mặc định = hành vi cũ) → `ListingCategoryTabs` (không đổi call site); `src/components/projects/FloorPlans.tsx` (trang chi tiết dự án, khối Mặt bằng); i18n `page.projectDetail.floorPlans.previous/next` (VI/EN); `.context/design-spec.md` S03 khối 7 (as-built, 1 dòng). Không API/schema/auth/data.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, không lỗi) |
| `pnpm lint` | PASS (eslint ., không lỗi/cảnh báo) |
| `pnpm test -- src/components/projects src/components/listing` | PASS — 16 file, 189 test |
| `pnpm test` (full) | PASS — 4815 test |
| `pnpm build` | không chạy lại (builder báo PASS; diff chỉ client component + JSON i18n, typecheck PASS) — residual risk thấp |

## Requirements / Bug repro closure
- Repro gốc (task Repro): đo Playwright trước fix 768–1920 tablist 522–728 / scrollWidth 2550, không fade/nút — ảnh `bl096-before-*.png`.
- Repro Verification status `PASS` có evidence: ảnh `bl096-after-{1920,1440,1024,768,390}.png` (đã xem 1440/768/390: nút ‹ › làn ngoài, tab đầu chọn, tab mép phải nằm dưới fade + nút sau; 390 ô chọn, không tablist) + số đo trong task (nút 44×44, rect nút ∩ vùng cuộn = ∅, End/Home/←/→ tab chọn cách mép ≥ 146px hoặc sát mép khi ở cuối, nút giữ focus ở mép `aria-disabled`).
- Test mới "BL-096" FAIL trước fix: assertion đầu `tablist.className not.toContain("overflow-x-auto")` và `closest("[data-tabs-scroller]")` chắc chắn fail với code cũ (tablist có `overflow-x-auto`, không scroller) → không false-confidence.
- Consumer cũ: default `labelNamespace="page.listing.tabs"`, `currentSelector='[aria-current="page"]'` → `ListingCategoryTabs` không đổi markup/nhãn; `ListingTabsScroller.test.tsx` cũ PASS.
- ARIA tabs: tablist vẫn chứa đúng các `role=tab`; nút ‹ › nằm ngoài tablist (test khẳng định), `type=button` (SliderArrow); roving tabindex, ← → Home End, `aria-controls`/`aria-labelledby` không đổi. `selectTab` gọi `focus()` sau keydown → `:focus-visible` khớp → nudge ra ngoài fade; click chuột không `:focus-visible` → không dịch thanh lúc mousedown (logic sẵn có).
- < md: < 6 plans → scroller hiện, chỉ fade (lane `hidden md:flex`), vuốt; ≥ 6 → wrapper `hidden md:block` ẩn cả khung, ô chọn hiện. Khi mount ở < md (display:none) đo = không tràn; resize lên md → ResizeObserver trên frame đo lại → OK.
- i18n `useTranslations(labelNamespace)` dạng string: typecheck PASS (repo không typed-messages strict); key VI/EN có đủ.

## Responsive Checklist Gate (diff đụng UI)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không h-scroll trang | OK | task đo page h-scroll=false; ảnh 390/768/1440 không tràn; vùng cuộn `min-w-0 flex-1` + `overflow-x-auto` cô lập tràn |
| Mobile-first `min-width` | OK | `hidden md:block`, `md:flex` (Tailwind min-width) |
| Grid auto-fit / container không fixed px | N/A / OK | không grid mới; frame `w-full max-w-container` (token), tablist `w-max min-w-full` |
| Font rem / heading clamp | N/A | không đổi typography (tab giữ `text-small`) |
| Media | N/A | không đổi ảnh |
| Touch target ≥ 44px | OK | tab `min-h-11`; nút SliderArrow trong lane `w-12`, đo 44×44 (task evidence) |
| Nav mobile / table | N/A | — |
| 100vh | N/A | không dùng |
| prefers-reduced-motion | OK | `scrollBy` behavior `auto` khi reduced motion (sẵn có) |
| Không che lỗi bằng overflow:hidden | OK | dùng overflow-x-auto có fade + nút, không hidden |

## Skill gates
- aislop: skip — không nằm trong verify commands được allow cho reviewer.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc*`); eslint PASS.
- ocr: skip, ocr not installed / không trong allowlist.
- AI-readable: OK — 2 indicator nhỏ (indent JSX lệch, JSDoc component còn nói "danh mục"), < 3 → không FAIL.
- ai-friendly-web: N/A (không đổi route/crawl surface).
- blitzstrike: N/A (không auth/input/API).

## Findings
- **[MINOR]** `src/components/projects/FloorPlans.tsx:62-87` — thân `plans.map(...)` và `</div>` đóng tablist (dòng 87, 6 space) không được thụt lại theo cấp lồng mới (mở tablist ở 10 space, `ListingTabsScroller` ở 8). Không có prettier nên lint không bắt; khó đọc cặp thẻ. Fix: thụt khối 62-87 thêm 4 space (`</div>` dòng 87 về 10 space).
- **[MINOR]** `src/components/projects/project-detail.test.tsx:638-652` — `vi.spyOn` clientWidth/scrollWidth chỉ `restoreAllMocks()` ở cuối thân test; nếu một assertion fail giữa chừng, spy rò sang test sau (afterEach file-level dòng 102 không restore mock). Fix: chuyển restore vào `afterEach` của `describe("FloorPlans")` hoặc `try/finally`.
- **[MINOR]** `src/components/listing/ListingTabsScroller.tsx:28-32` — JSDoc vẫn mô tả "thanh tab danh mục … Tab `aria-current`", trong khi component giờ dùng chung (tab ARIA `aria-selected`, nhãn theo `labelNamespace`). Fix: thêm 1 câu "dùng lại cho FloorPlans (BL-096) qua `labelNamespace`/`currentSelector`".
- **[MINOR]** `src/components/projects/FloorPlans.tsx:61` — `useSelectOnMobile && "hidden md:flex"` trên tablist trùng với wrapper `hidden md:block` dòng 59 (builder giữ cho test cũ — chấp nhận, ghi chú để dọn sau).

Không có CRITICAL/MAJOR.

## Residual risk
- Không tự chạy lại script Playwright (ngoài allowlist verify); dựa vào ảnh after + số đo trong task. Ảnh 1440/768/390 khớp mô tả.
- `pnpm build` không chạy lại trong review.
- Đổi tab qua ô chọn/lightbox không cuộn tab vào vùng nhìn (task ghi không bắt buộc).

## Verdict
**PASS** — không CRITICAL/MAJOR; Repro Verification `PASS` có evidence kiểm chứng (ảnh + test FAIL-trước/PASS-sau); typecheck/lint/test PASS. 4 MINOR có thể dọn trong cùng commit nếu tiện.
