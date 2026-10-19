Agent: reviewer

# Review: feature-public-ui-market-vinhomes · phase-2-task-03 · round 2
> Report do primary lưu (guard chặn reviewer ghi `.context/review-reports/**` trong worktree).

- **Review level:** STRICT
- **Reason:** file message VI/EN dùng chung mọi trang (round 1 làm hỏng footer), hook slider + `SliderArrow` dùng chung, prop tuỳ chọn mới của `PostCard`, class toàn cục `.glass-panel`.
- **Blast radius:** trang chủ (`ProjectsSlider`, `FeaturedOffers` → `OffersSlider`, `ProjectSlideView.salesStatus/stats`); `PostCard.imageSizes` (tuỳ chọn); `.glass-panel`; message: bỏ 2 khoá `page.home.projects.explore`, `page.home.offers.viewAll`, khôi phục `layout.footer.columns.explore` (footer như HEAD). Không đổi route/layout/loader/schema.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (0 error, 2 warning cũ) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run src/components src/lib src/i18n src/app` | PASS 1732/1732 (+3 test guard mới) |
| `next build` (primary, worktree sạch `build-p2t03r2`) | PASS, bảng route giống bản gốc (ROUTES_SAME) |
| Trình duyệt (primary, 375px) | khung kính thẻ dự án (top 464) không chạm badge (đáy 266) trên thẻ 281×364; không cuộn ngang |

## Đóng finding round 1
| # | Finding | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | [MAJOR] xoá `layout.footer.columns.explore` còn dùng | CLOSED | `vi.json:48` "Khám phá", `en.json:48` "Explore"; diff message so HEAD chỉ còn 1 hunk dưới `page.home.*`; test guard `src/i18n/load-shell-keys.test.ts` PASS 2 locale |
| 2 | [MINOR] vòng focus bị cắt | CLOSED | link thẻ dự án `outline-offset-[-4px]`; `OffersSlider.tsx:26` `-mx-2 px-2 py-2` + `scroll-padding-inline:0.5rem` |
| 3 | [MINOR] test mũi tên | CLOSED | `OffersSlider.test.tsx:37-43` stub `clientWidth = 1000`, assert ±900 |
| 4 | [MINOR] tên truy cập dài | CLOSED | `aria-labelledby` id tiêu đề; test tên đúng "Dự án 1" |
| 5 | [MINOR] chú thích cũ | CLOSED | "design-spec S01 khối 3"; PostCard "Server hoặc Client Component" |

Rà khoá i18n toàn repo: chỉ bỏ đúng 2 khoá, không còn tham chiếu (`FeaturedProjects.tsx:23` `t("viewAll")` thuộc `page.home.projects` vẫn còn; `JobDetail.tsx:76` namespace khác); 2 locale đối xứng; không log MISSING_MESSAGE. Test guard đủ cho mục đích (có case kiểm regex còn bắt khoá); bỏ sót khoá template literal (`nav.items.${key}`, `footer.links.${key}`) — chấp nhận, ngoài phạm vi.

## Responsive gate (tính CSS)
Không cuộn ngang trang; min-width; slide Ưu đãi 80% / `calc((100%-1rem)/2)` / `calc((100%-3rem)/3)`; slide dự án 82% < sm, 464px từ sm; chữ token; `aspect-[464/600]`, `sizes` khớp, lazy, không CLS; chạm 44px; reduced-motion/transparency OK; `overflow-hidden` chỉ để bo ảnh.

## Skill gates
aislop skip · oxlint skip (ESLint 0 error) · ocr skip · AI-readable OK (0 chỉ báo) · ai-friendly-web N/A · blitzstrike N/A.

## Findings
Không CRITICAL, không MAJOR.
- **[MINOR]** `src/components/home/OffersSlider.test.tsx:36-45` gán `Element.prototype.scrollBy` không khôi phục; `vi.restoreAllMocks()` gọi inline → nên `vi.spyOn` + `afterEach` (chỉ ảnh hưởng trong file).
- **[MINOR]** `src/i18n/load-shell-keys.test.ts:10` regex bỏ qua khoá template literal → đề xuất task riêng: test đối xứng khoá VI/EN + mọi khoá dùng tồn tại.

## Residual risk
Kính mờ thật trên ảnh, vuốt scroll-snap thật, CLS/LCP, vòng focus khi render thật.

## Verdict: PASS
