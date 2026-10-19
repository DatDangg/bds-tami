Agent: reviewer

> Ghi bởi primary (change-request) — guard chặn reviewer ghi vào worktree. Nội dung theo báo cáo reviewer.

# Review: feature-public-ui-market-vinhomes · phase-4-task-01 · round 2

## Review level
**NORMAL** — như round 1; hợp đồng lead không đổi (`source="project"`, `sourceId`); code dùng chung chỉ thêm prop tuỳ chọn cho `LeadFormSlot`.

## Blast radius
- `/du-an/[slug]`, `/en/projects/[slug]`: `ProjectDetail`, `ProjectHero`, `ProjectSubNav`, `ProjectSection`, `LegalPolicy`, `ProjectAmenities`, `ProjectLocation`.
- `src/components/forms/LeadFormSlot.tsx` thêm prop tuỳ chọn `headingId`; caller khác (`ApplyFormSlot`, `NewsListPage`, `lien-he/page.tsx`, `SaleContactBox`, `PostDetail`) không truyền → `headingId ?? generatedHeadingId`, DOM không đổi → tương thích ngược.
- `src/app/(payload)/admin/importMap.js` chỉ khác line ending (không commit).

## Verify
| Command | Result |
|---|---|
| `pnpm lint` | PASS 0 error (2 warning ngoài diff) |
| `pnpm typecheck` | PASS |
| `pnpm test src/components/projects src/components/forms src/components/leads` | PASS 9 files / 110 tests |
| Full test / build | builder 3007 PASS, build PASS |
| Trình duyệt (primary, dev :3001) | 375: sau khi nhảy `#lead-form` pill đáy 134px, thẻ top 152px (không che); 1024: không cuộn ngang |

## Đóng finding round 1
- M-1 đóng — `CONSULT_CARD_CLASS` có `scroll-mt-[calc(var(--header-offset)+4.5rem)]`, `cn` ghi đè `+1rem` của slot; test `project-detail.test.tsx:139`; trình duyệt 152 > 134.
- m-1 đóng — `LegalPolicy.tsx:37` `+4.5rem`; vòng test gồm `legal`, `sales-policy`.
- m-2 đóng — design-spec S03 mục 11 = thẻ "Tư vấn 1:1" trong `aside`; mục 4–9 bỏ nền; đoạn "Bố cục" + hàng 1024 khớp code; DESIGN.md cập nhật.
- m-3 đóng — `aside aria-labelledby={CONSULT_HEADING_ID}` = id truyền vào `LeadFormSlot headingId`; test khớp.
- m-4 đóng — comment `ProjectSection`, `ProjectSubNav` (54px + 18px = 176px = `OBSERVER_MARGIN`).
- m-5 đóng — `ProjectLocation` chia `xl:grid-cols-12`; thẻ tối `p-6 xl:p-10`; LegalPolicy 2 cột ở xl, Amenities 3 cột ở lg.

## Responsive gate (375/768/1024/1280)
Không cuộn ngang OK · mobile-first OK · không container px cố định OK · token OK · ảnh OK · link 44px OK · pill cuộn ngang OK · `100dvh` chỉ `lg:max-h` OK · reduced motion OK · overflow OK · đích neo < lg không bị che OK. **PASS**

## Skill gates
aislop/oxlint/ocr skip; AI-readable OK; ai-friendly-web/blitzstrike N/A.

## Findings
- [MINOR] m-6 `ProjectDetail.tsx:137-142` (thực tế :26-33) — 2 JSDoc liền nhau, khối mô tả `CONSULT_CARD_CLASS` gắn nhầm vào `CONSULT_HEADING_ID`. **Primary đã đổi thứ tự trước commit.**

## Residual risk
Gallery/FloorPlans trong cột lg hẹp (~568px) chỉ kiểm không cuộn ngang; cuộn nội bộ thẻ trên màn thấp chưa thử; 768/1280 đọc CSS.

## Verdict
**PASS**
