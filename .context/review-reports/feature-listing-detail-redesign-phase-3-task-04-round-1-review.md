Agent: reviewer

# Review — feature-listing-detail-redesign · phase-3-task-04 · round 1

Chi tiết Tin BĐS `/tin-bds/[slug]` theo khung chi tiết BL-052. Worktree `D:\prj\bds\.claude\worktrees\agent-ad1fa201ce0555c06` (branch `worktree-agent-ad1fa201ce0555c06`, base 1f51ecd), code chưa commit.

- **Review level:** STRICT
- **Reason:** trang công khai; BR-06 (mã voucher hết hạn không được lộ); form lead (`source=property_post`, Turnstile); JSON-LD Article/Breadcrumb; dùng chung detail kit (`src/components/detail/*`).
- **Blast radius:** `src/components/posts/{PostDetail,PostContactBox,RelatedPosts}.tsx`, `src/lib/posts/post-detail-sections.ts`, mới `src/lib/posts/post-detail-specs.ts`, route `tin-bds/[slug]/page.tsx`, i18n `page.postDetail.v2` (vi/en). Chỉ trang chi tiết Tin BĐS. Detail kit chỉ được dùng, không bị sửa. `src/payload-types.ts` chỉ đổi EOL (bỏ qua).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, exit 0) |
| `pnpm lint` | PASS: 0 lỗi, 2 cảnh báo có sẵn trong `tools/task-dashboard/server.mjs` (ngoài diff) |
| `pnpm test` (full) | 3820/3822. 2 test fail vì timeout khi chạy cả bộ đang tải nặng: `src/lib/lint-rules.test.ts` (34.9s) và `src/lib/health/probes.test.ts`. Hai file này không liên quan tới diff |
| `pnpm vitest run` 2 file trên + `src/components/posts` + `src/lib/posts` + `tin-bds` route | PASS 10 files / 74 tests |
| `pnpm build` | skip: theo chỉ dẫn của primary, builder báo PASS. Reviewer không tự chạy lại |

## BR-06 / bảo mật (kiểm riêng)
- `toPostOfferView` (post-view.ts:152) gán `voucherCode: ended ? null : code`, nên mã bị bỏ ngay ở server, trước khi bất kỳ component nào render. `OfferBox` chỉ render mã và `CopyVoucherButton` (client) khi `voucherCode` khác null. OK.
- Ranh giới client: `DetailHeroMosaic` ("use client") chỉ nhận images/title/breadcrumb/badges/address/summary/actions. `HeroOfferBadge` chỉ nhận `badge` ({kind}), không nhận mã. `doc` đầy đủ chỉ đi tới các Server Component (`PostDetail`/`PostOverview`). `PostContactBox` chỉ nhận `postId`. Không có prop nào chở mã voucher sang client. Test `PostDetail.test.tsx:184` và `page.test.tsx:155` đều kiểm `innerHTML not.toContain("TAMI500")` với ưu đãi hết hạn. OK.
- JSON-LD: `buildArticleJsonLd` vẫn nhận các field như cũ (headline/url/description/ảnh/ngày/publisher), không có offer/voucher. BreadcrumbList giữ nguyên. OK.
- Target liên quan: `findRelatedTargets` dùng `findPublicList` (chỉ lấy bản ghi công khai, file P3-T02 không đổi). `PostOverview` chỉ hiện `title` + `href` của target. OK.
- Form lead: `DetailContactAside` dùng `LeadFormSlot` (`#lead-form`) → `LeadForm source="property_post" sourceId={postId}` + `turnstileSiteKey` + hotline, cùng cơ chế chống spam như trước. Trang chỉ có một form (banner/sticky CTA cuộn tới `#lead-form`). OK.
- File P3-T02/P3-T05: `git diff --name-only 1f51ecd` trên post-queries/post-listing/post-view/PostCard/OfferStatusBadge/scripts không có kết quả, tức là không sửa. OK.
- `#content`: grep `#content` trong `src` không thấy link nội bộ nào. Neo cũ không còn: link ngoài có `#content` sẽ về đầu trang, chấp nhận được.

## Requirements coverage
- Khung `DetailPageShell` + `DetailHeroMosaic` (ảnh bìa + gallery bỏ trùng, chip danh mục + badge ưu đãi, h1, địa chỉ/khu vực, tóm tắt, chia sẻ): OK.
- Thanh thông số theo loại tin. `isVoucherPost` khớp định nghĩa spec (SPEC dòng 48: có `offer.endAt`/`voucherCode` và không có `priceVnd` lẫn `areaM2`). "Giá nếu có" lấy từ `priceNote`. Ô trống thì bỏ: OK.
- Tab Tổng quan · Ưu đãi · Vị trí · Hình ảnh · Tin liên quan, tab chỉ hiện khi khối có dữ liệu: OK. Dải Điểm mạnh dùng cờ `propertyPosts`: OK. ConsultBanner `#lead-form` + `tel:`: OK.
- a11y: 1 h1 nằm trong hero (có test). Badge "Đã kết thúc" trên hero tối dùng `variant="dark"` + viền sáng thay cho `muted` vốn mất tương phản (theo đọc code, chưa đo contrast thật). EN có đủ key `v2`.

## Responsive Checklist Gate (diff đụng UI; kiểm bằng đọc code/CSS, không có browser)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll / container không fixed px | OK | Chỉ ghép các component kit có sẵn (Shell/Hero/SpecBar/InfoGrid/SimilarCarousel). Không thêm width px |
| Mobile-first / grid | OK | Không thêm grid mới. Lưới thông số/thông tin do kit lo |
| Typography rem / scale | OK | Chip dùng token `text-xsmall`, không có `px` font |
| Media | OK | Ảnh qua `DetailHeroMosaic`/`DetailGalleryGrid`/`PostCard` (sizes có sẵn). Bản đồ dùng `LazyMap` |
| Touch target ≥44px | OK | Nút Gọi ngay `min-h-11` (kit). Chip hero không tương tác. Nút chia sẻ là kit có sẵn |
| Nav/tab mobile | OK | Tab dính của `DetailPageShell`. Sticky CTA đáy < lg giữ `ProjectStickyCta` |
| 100vh / reduced-motion / overflow hidden | OK | Diff không thêm `100vh`/animation/`overflow-hidden` |

## Skill gates
- aislop: skip, `aislop` chưa cài (`which aislop` không có).
- oxlint (anti-slop): skip, repo chưa cấu hình oxlint (không có `.oxlintrc*`). ESLint PASS.
- ocr: skip, `ocr` chưa cài.
- AI-readable: OK. `PostDetail.tsx` 266 dòng (≤300). Các hàm nhỏ, tên rõ. Comment có giải thích lý do (WHY), dù vài docblock khá dài. `ICON_SIZE` có tên hằng. Không chạm ngưỡng 3 indicator.
- ai-friendly-web: N/A cho task này (không đổi robots/sitemap/llms).
- blitzstrike: skip, chưa cài/không có môi trường được phép.

## Findings
- **[MINOR]** Key i18n cũ có thể không còn dùng: `page.postDetail.eyebrow.*`, `page.postDetail.overview.*`, `page.posts.subNav.*`, `page.posts.sections.content` (grep `*.tsx` không thấy chỗ gọi). Fix: dọn ở task cleanup (vd P3-T06) sau khi xác nhận không test/route nào khác dùng. Theo quy ước song song, không xoá trong task này.
- **[MINOR]** `src/components/posts/PostDetail.tsx` (PostOverview, nhánh không có `content`): tin cũ không có nội dung sẽ hiện `excerpt` hai lần (tóm tắt ở hero và đoạn trong Tổng quan). Fix gợi ý: chỉ fallback excerpt khi hero không hiện summary, hoặc để nguyên nếu design chấp nhận. Cần primary/design quyết.
- **[MINOR]** `isVoucherPost` (`src/lib/posts/post-detail-specs.ts:50`) có thể trùng logic phân loại voucher của thẻ danh sách P3-T02 (song song). Fix: khi merge wave B, gom về một helper dùng chung để tránh hai định nghĩa lệch nhau.
- **[MINOR]** Mã `"5 m"` của mặt tiền ghép chuỗi đơn vị cứng (`post-detail-specs.ts:66`). EN vẫn đúng ("m"), nhưng không qua i18n/formatter như `formatArea`. Có thể để nguyên.

Không có CRITICAL/MAJOR.

## Residual risk
- Không render trên browser ở 375/768/1280 và 1440/390. Responsive và contrast badge trên hero mới chỉ kiểm bằng đọc code.
- `pnpm build` không chạy lại (dựa vào báo cáo PASS của builder).
- 2 test bị timeout khi chạy full suite chỉ PASS khi chạy riêng file. Flakiness do môi trường, không do diff.

## Verdict
**PASS**
