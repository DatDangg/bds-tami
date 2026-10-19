Agent: reviewer

> Ghi bởi primary (change-request) — guard chặn reviewer ghi vào worktree. Nội dung theo báo cáo reviewer.

# Review: feature-public-ui-market-vinhomes · phase-4-task-01 · round 1

## Review level
**NORMAL** — đổi bố cục/hình ảnh trang chuyển đổi chính; hợp đồng lead giữ nguyên (`<LeadForm source="project" sourceId={doc.id}>` chỉ di chuyển); không API/schema/auth/service dùng chung. `ProjectSection`, `LegalPolicy`, `ProjectSubNav` chỉ dùng trong `src/components/projects/`.

## Blast radius
- `/du-an/[slug]`, `/en/projects/[slug]`: `ProjectDetail`, `ProjectHero`, `ProjectSubNav`, `ProjectSection` (Tổng quan, Vị trí, Tiện ích, Mặt bằng, Tài liệu, Thư viện), `LegalPolicy`, `ProjectAmenities`, `ProjectLocation`.
- Đích cuộn của `ProjectStickyCta` và nút hero "Nhận tư vấn" (`#lead-form`).
- Docs: design-spec S03, DESIGN.md.

## Verify
- `pnpm lint`: PASS 0 error (2 warning ngoài diff).
- `pnpm typecheck`: PASS.
- `pnpm test src/components/projects src/components/leads`: 6 files / 68 tests PASS.
- Full test/build: builder 284 files / 3007 PASS, build PASS.
- Primary kiểm trình duyệt dev :3001 1280×900: thẻ sticky top 176px cao 705px, cột chính 770px không bị che, 1 `#lead-form`, aria-current đúng, không cuộn ngang.

## Responsive gate (375/768/1024/1280, đọc CSS)
Không cuộn ngang OK · mobile-first, lg `1fr`+22rem / xl `1fr`+24rem OK · token OK · hero `priority` sizes 100vw, gallery lazy OK · link subnav `min-h-11` OK · pill cuộn ngang OK · `100dvh` chỉ trong `max-h` ≥ lg OK · reduced motion OK · overflow chỉ hero bo góc + thẻ `overflow-y-auto` (G4) OK · **Đích neo < lg không bị thanh dính che: FAIL (M-1)**.

## Skill gates
aislop/oxlint/ocr skip; AI-readable OK (1 chỉ dấu m-4); ai-friendly-web/blitzstrike N/A.

## Findings
### [MAJOR] M-1 Mobile: pill subnav che đầu thẻ tư vấn khi nhảy tới `#lead-form`
`src/components/projects/ProjectDetail.tsx:81-82` (`CONSULT_CARD_CLASS`), :151 — code cũ truyền `scroll-mt-[calc(var(--header-offset)+3.5rem)]` cho `LeadFormSlot`, class mới bỏ → về mặc định `LeadFormSlot.tsx:25` (header + 1rem). < lg pill dính top 80px cao ~54px (đáy ~134px), thẻ cuộn tới 96px → tiêu đề "Nhận thông tin dự án" (~120px) bị che ~14px. Đường chuyển đổi chính, hồi quy, vi phạm "không che nội dung"; test chỉ kiểm scroll-mt của section. Fix: thêm `scroll-mt-[calc(var(--header-offset)+4.5rem)]` vào `CONSULT_CARD_CLASS` + test.
### [MINOR] m-1 `LegalPolicy.tsx:37` neo Pháp lý/Chính sách còn `+3.5rem` (các section khác `+4.5rem`) → đổi + thêm id vào vòng test scroll-mt.
### [MINOR] m-2 design-spec S03 (~360–366) tự mâu thuẫn: mục 11 còn form split cũ; mục 4–8 còn nền section → viết lại mục 11 thành thẻ Tư vấn 1:1 ở aside (< lg dưới Tài liệu), bỏ chú thích nền. `SPECIFICATIONS.md` không mô tả bố cục từng section → không mâu thuẫn.
### [MINOR] m-3 `ProjectDetail.tsx:150` `aside` chưa có nhãn → `aria-labelledby` tiêu đề thẻ.
### [MINOR] m-4 Comment cũ: `ProjectSection.tsx:23` "nền theo nhịp xen kẽ"; `ProjectSubNav.tsx:271` khe 16px vs design-spec 18px.
### [MINOR] m-5 Ở đúng 1024px cột chính ~568px: Location 7/5 (bản đồ ~310px), Gallery `lg:p-10` → cân nhắc chia ở `xl:`, `lg:p-6`.

## Điểm kiểm theo brief
id trùng OK · focus trong thẻ cuộn nội bộ OK (rủi ro màn thấp, G4) · `pointer-events-none` wrapper OK (`ul` `pointer-events-auto`) · observer `-176px` OK cả 64/72px · `100dvh` rủi ro thấp · hydration không state mới · lead `source="project"` + `sourceId` không đổi · `ProjectStickyCta` chỉ mobile, ẩn khi thẻ trong tầm nhìn.

## Residual risk
Chưa kiểm trình duyệt 375/768/1024; Gallery/FloorPlans trong cột lg hẹp; cuộn nội bộ thẻ trên màn thấp.

## Verdict
**FAIL** — sửa M-1 + test; gộp m-1, m-2 cùng round.
