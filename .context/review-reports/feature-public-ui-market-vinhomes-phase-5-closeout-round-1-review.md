Agent: reviewer

> Ghi bởi primary (change-request) — guard chặn reviewer ghi vào worktree. Nội dung theo báo cáo reviewer.

# Review: feature-public-ui-market-vinhomes · Phase 5 close-out · round 1

## Review level
**NORMAL** — diff nhỏ (10 file, +113/−8), chỉ UI + docs trang chi tiết dự án công khai; không auth/schema/migration/API. Listener `click` trên `document` của `LegalPolicy` phạm vi hẹp (F1).

## Blast radius
- `project-detail-view.ts`: `numberOrNull` chỉ dùng cho 4 trường `priceTable` (:207–210).
- `LegalPolicy.tsx`: listener click trên `document` khi mount (chỉ trang chi tiết dự án).
- `NearbyTabs.tsx`: panel focus được (a11y).
- `ProjectDetail.tsx` (comment), `docs/ERD.md`, `.context/design-spec.md` S03.
- Tests: `LazyMap.test.tsx`, `project-detail.test.tsx`, `project-market-blocks.test.tsx`, `project-detail-view.test.ts`.

## Verify
| Command | Result |
|---|---|
| `pnpm lint` | 0 error (2 warning ngoài diff) |
| `pnpm typecheck` | PASS |
| `pnpm test src/components/projects src/lib/projects src/components/media` | 14 files / 176 tests PASS |
| `pnpm build` (production, primary) | PASS |
| Full test (builder) | 289 files / 3055 PASS |

## Kiểm
- Listener `LegalPolicy`: thoát sớm nếu hash không thuộc `anchorIds` (hiện chỉ `documents`, `ProjectDetail.tsx:72`) → `#lead-form`, mục menu neo, `tel:`, link ngoài không bị `preventDefault`; gỡ cả `hashchange` + `click` khi cleanup; effect phụ thuộc `[blocks]` ổn định; SSR an toàn (chỉ dùng trong effect, `prefersReducedMotion` có guard); reduced motion → `behavior: "auto"` (có test); chỉ cuộn cho anchor phụ, 1 frame sau `setOpenIds`.
- `numberOrNull > 0`: 0/âm = chưa nhập → "Liên hệ"/"—"; test bằng nhau, chỉ "đến", 0; ERD giữ `min: 0` ở validate — không mâu thuẫn.
- `NearbyTabs` `tabIndex={0}` chỉ khi có tablist (`hasTabs`), có test.
- Docs: S03 "3b" → "4b", vị trí 10b / 11 (aside cuối cột chính sau Hỏi đáp ở < lg) khớp code; ERD trỏ S03. Đóng spec-validation §4 + MINOR-1..5 P5-T02.

## Responsive gate
Không đổi layout/CSS; tab panel không đổi bố cục, sửa neo cải thiện mobile; reduced motion tôn trọng. N/A/OK.

## Skill gates
aislop/oxlint/ocr skip; AI-readable OK; ai-friendly-web/blitzstrike N/A.

## Findings
- **[MINOR] F1** `LegalPolicy.tsx:96-102` `onAnchorClick` chặn cả Ctrl/Cmd-click (không mở tab mới) và dùng `replaceState` (không tạo mục lịch sử). Fix: `if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;`. **Primary đã thêm guard trước commit** (lint/typecheck/`pnpm test src/components/projects` 73 PASS); giữ `replaceState`.
- **[MINOR] F2** `project-detail.test.tsx:426,451,452` `Element.prototype.scrollIntoView` gán đè không khôi phục; `matchMedia` stub — *(primary: `afterEach` cấp file đã `vi.unstubAllGlobals()` nên `matchMedia` được gỡ; còn `scrollIntoView` prototype — vô hại, residual)*.
- **[MINOR] F3** `project-detail.test.tsx:441,463` reset hash về `#` thay vì xoá — vệ sinh test.
- **[MINOR] F4** `LazyMap.test.tsx:193` test thêm ngoài phạm vi round — vô hại, giữ.

## Residual risk
Không có trình duyệt ở reviewer — 375/768/1280 chưa xem trực quan cho thay đổi hành vi neo.

## Verdict
**PASS**
