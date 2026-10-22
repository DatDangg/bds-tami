# feature-listing-followups · phase-1-task-03 — Đo LCP bản build cho 6 trang danh sách / chi tiết (BL-052 residual)

- Nguồn: BL-055 · change doc `spec/changes/2026-10-22-listing-followups.md` (mục "Đo LCP thật (bản build)"; phase review BL-052 P-2 / Residual).
- Task **đo + ghi nhận**: không đổi code trừ khi phát hiện lỗi rõ ràng và nhỏ (≤ 1 dòng, có root cause) — lỗi lớn hơn → ghi vào Verification summary làm follow-up, KHÔNG tự sửa.
- **AUTO PROCEED**: không đo được trong môi trường → ghi Residual rõ ràng (lý do, đã thử gì), task vẫn đóng.

## Classification / Risk
- Type: **MODIFY** (đo lường, bằng chứng QA).
- Risk: **LOW** — không đổi code dự kiến.
- Expected review level: **FAST** (không đổi code) / NORMAL nếu có sửa.
- Blast radius: task file này (số đo); có thể `.context/review-reports/assets/bl055-*.png`.

## Cách đo (gợi ý — chọn cách làm được)
1. `pnpm build` rồi `pnpm start` (port 3000; cần `.env.local` DB dev có dữ liệu: Dự án 61, Tin BĐS 38, Cho thuê ~32 tin). Dev server (`next dev`) **không** dùng để đo LCP.
2. 6 trang (locale `vi`; thêm `/en` nếu còn thời gian): `/du-an`, `/du-an/<slug có ảnh bìa>`, `/cho-thue`, `/cho-thue/<slug>`, `/tin-bds`, `/tin-bds/<slug>`. Lấy slug thật từ DB (`payload.find` hoặc SQL `SELECT slug FROM ... WHERE status='published' LIMIT 1`).
3. Đo LCP bằng một trong: (a) Browser pane (tool `navigate` + `javascript_tool`: `new Promise(r => new PerformanceObserver(l => r(l.getEntries().at(-1))).observe({type:"largest-contentful-paint", buffered:true}))` → `startTime`, `element`, `url`), đo ở 1440 và 390 (mobile preset), mỗi trang ≥ 2 lần lấy lần tốt hơn (lần đầu là cold cache ISR); (b) `npx lighthouse <url> --only-categories=performance --output=json --chrome-flags="--headless"` nếu có Chrome; (c) Playwright nếu có trong repo. Ghi rõ cách đo + điều kiện (local, không throttle).
4. Ngưỡng tham chiếu: LCP ≤ 2.5s tốt (Web Vitals). Ghi element LCP của từng trang (ảnh hero? `priority`/`fetchpriority` có chưa?) → nếu ảnh hero danh sách/chi tiết **chưa** có `priority` (Next `Image`) và LCP > 2.5s thì ghi follow-up cụ thể (file:line), không sửa trong task này trừ khi là 1 dòng rõ ràng.

## Scope
1. Đo theo § Cách đo; ghi bảng vào § Verification summary: trang · viewport · LCP (ms) · element · ghi chú.
2. Chụp 1 ảnh/trang ở 1440 (tuỳ chọn) vào `.context/review-reports/assets/bl055-p1t03-<trang>-1440.png`.
3. Không doc impact (`no doc impact`), trừ khi sửa code.
4. Verify: nếu không đổi code → ghi `skip, no code change`; có đổi → `pnpm typecheck` · `pnpm lint` (scope) · `pnpm test` · `pnpm build`.

## Acceptance
- [ ] Có số đo LCP cho 6 trang (ít nhất 1440; 390 nếu được) trên bản `pnpm build` + `pnpm start`, kèm element LCP và cách đo — hoặc Residual rõ ràng vì sao không đo được.
- [ ] Trang > 2.5s có ghi nguyên nhân + follow-up cụ thể (file:line).
- [ ] Không đổi code ngoài fix 1 dòng có root cause (nếu có).

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary
(builder điền)
