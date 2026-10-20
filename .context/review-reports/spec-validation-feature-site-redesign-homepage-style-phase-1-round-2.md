Agent: spec-validator

# Phase review: feature-site-redesign-homepage-style (BL-045), phase 1, round 2

- Mode: **Phase review**, round 2. Kiểm lại các gap của round 1 (`.context/review-reports/spec-validation-feature-site-redesign-homepage-style-phase-1.md`).
- Nguồn: commit T09 `2c63564` (`git show --stat`), `git log 9e96cbf..HEAD`, review T09 (`feature-site-redesign-homepage-style-phase-1-task-09-round-1-review.md`), working tree chưa commit: `SPECIFICATIONS.md:23-36`, `spec/updates/2026-10-21-site-redesign-homepage-style.md`, `spec/CHANGELOG.md` dòng 1.35.0, `spec/test-scope/current.json`, `spec/changes/BACKLOG.md`, header task T00–T09, `.context/progress.json:1326-1509`.
- Verify tôi tự chạy: `pnpm typecheck` PASS (exit 0, working tree hiện tại). `pnpm build` tôi không chạy lại, vì dev server có thể đang giữ `.next`. Evidence build lấy từ trailer commit T09 ("pnpm build PASS") và báo cáo của dispatcher.

## Verdict: ✅ COMPLETE

GAP-1 và GAP-2 đã sửa code đúng câu chữ của spec và mockup, không đổi spec. GAP-3 (sổ sách) đã dọn trong working tree. GAP-4 đã đóng: có ảnh xem thật `/en` và build PASS sau T09. AB-1..AB-8 đều đã ghi as-built ở dạng *thêm câu*, giữ nguyên câu gốc, không hạ cấp business rule. Test-scope v45 khớp code thực tế. Không có gap MISSING hay PARTIAL. Còn vài điểm LOW cần xử lý ở bước commit close-out (mục "Việc close-out").

## Ma trận đóng gap round 1

| Gap r1 | Requirement | Evidence round 2 | Status |
|---|---|---|---|
| GAP-1 bài nổi bật trang danh mục Tin tức | `SPECIFICATIONS.md:29` "Tin tức (danh sách + danh mục): … bài nổi bật ngang" | `src/lib/news/news-listing.ts:30-38`: trong phạm vi `categoryIds` (danh mục + con) chạy 2 truy vấn limit 1, lấy `isFeatured` trước rồi đến bài mới nhất. `featured` chỉ có ở trang 1, bài đó bị `excludeIds` khỏi lưới ở mọi trang. Integration `news.test.ts:348-364`: trang 1 + trang 2 ra 14 bài không trùng, bài `isFeatured` của danh mục con thắng (review T09:19-20). Ảnh `site-redesign-t09-news-category-1440.png` | ✅ |
| GAP-1 (Tin BĐS) danh mục `/tin-bds` | `:29` "`/tin-bds` + danh mục theo cùng bố cục (… bài nổi bật ngang …)" | `src/lib/posts/post-listing.ts:38-50`: gọi `findFeaturedPost(..., categoryIds)`, bài nổi bật loại khỏi lưới (`:43`), `totalDocs` cộng 1. Quy tắc "chỉ `isFeatured` còn hạn, không fallback" giống `/tin-bds` gốc, đã ghi as-built ở `:29` | ✅ (residual: xem R-1) |
| GAP-2 lưới 4 cột ≥ xl | `:21` lưới "1 / 2 / 3 / 4 cột (≥ xl)" + mockup `.grid` auto-fill 260px | `NewsListBody.tsx:19` và `PostListBody.tsx:19` có `xl:grid-cols-4` + `data-grid-max-cols="4"`. Unit test khoá (diff T09: `news-components.test.tsx`, `post-components.test.tsx`, `*ListPage.test.tsx`) | ✅ |
| GAP-3 sổ sách | Header task, progress, test-scope, dòng trạng thái spec update | Header T00–T09 ghi `done` + verdict + report + SHA, đúng round (T02/T07/T08 là r2). Progress `:1343-1495` có 10 task `done`, SHA khớp `git log`. Test-scope `status: published`, có `commits[]` 10 SHA. `spec/updates/...:3` ghi "done — published". `progress.json:1335` note đã cập nhật | ✅ (còn L-2, L-3) |
| GAP-4 `/en` + build | Acceptance #5 (i18n), #7 (build PASS) | Có 6 ảnh `/en` (`site-redesign-t09-en-{projects,rentals,news,careers,contact,project-detail}-1440.png`). Reviewer T09 mở `en-project-detail`. `/en/news` rỗng vì DB dev không có bài EN, empty state đúng. Trailer `2c63564`: "pnpm build PASS"; test-scope `verify.residual` ghi build PASS sau T08 r2 và sau T09 | ✅ (residual R-2) |

## Ma trận as-built AB-1..AB-8 (giữ câu gốc, không hạ cấp)

| ID | Vị trí ghi | Câu gốc còn giữ? | Hạ cấp business rule? |
|---|---|---|---|
| AB-1 hero `min-h` | `SPECIFICATIONS.md:25` (cuối đoạn) | Có ("chiều cao cố định (không CLS)") | Không. Mục tiêu không CLS vẫn giữ nhờ chữ SSR; chỉ ghi rõ cách hiện thực |
| AB-2 `/tin-bds` bỏ "Có N kết quả" | `:29` + F4 `:110` đã đánh dấu "(bố cục thay bởi BL-045)" | Có | Không. Đây là bố cục theo mockup Tin tức |
| AB-3 bỏ neo `#description` | `:28` | Có | Không |
| AB-4 breadcrumb Bài viết thêm tiêu đề | `:30` | Có | Không. JSON-LD không đổi |
| AB-5 `/du-an` in-memory ≤ 1000, sort cần JS | `:26` | Có (p95 ≤ 500ms giữ, thêm điều kiện "trong giới hạn đó") | Thu hẹp phạm vi NFR một cách minh bạch: có log cảnh báo khi chạm trần, có `openQuestions` trong test-scope. Chấp nhận như r1 đề xuất |
| AB-6 ConsultBanner cặp tiêu đề/mô tả | `:35` | Có | Không |
| AB-7 CTA chi tiết cho thuê / Tin BĐS → `#lead-form` + `tel:` | `:35` | Có | Không. Đây là mở rộng, không bớt |
| AB-8 lưới ≤ 3 thẻ, phân trang `--color-primary`, breadcrumb 44px | `:28`, `:26`, `:24` | Có | Không |
| T09 (featured danh mục + 4 cột) | `:29` | Có | Không. Code sửa theo spec |

Intent docs (BRD / PRD / USER_FLOW) không đổi (`spec/updates/...:8,67`). CHANGELOG 1.35.0 liệt kê đủ 10 SHA và AB-1..8. Lý do không bump PATCH và giữ số scope v45 được nêu rõ, hợp lệ vì v45 chưa từng commit.

## Test-scope v45 ↔ thực tế

| Điểm kiểm | Kết quả |
|---|---|
| `commits[]` 10 SHA + round | Khớp `git log 9e96cbf..HEAD` và progress |
| `impact.direct` Tin tức / Tin BĐS (`current.json:312-313`) | Khớp code T09: Tin tức có fallback, Tin BĐS không có fallback, lưới 4 cột |
| `uiTestCases` BL045-09 (featured danh mục + trang 2 không trùng), BL045-15 (`/en`), BL045-16 (AB-6/7) | Có, expected khớp spec `:29`, `:35` |
| `apiTests` careersPerks 1 mục → 400, 7 → 400 | Khớp `src/globals/site-settings/page-heroes.ts:57-58` (`minRows: 2`, `maxRows: 6`) |
| "grep Heart = 0" | Đúng: Grep `Heart` trong `src` → 0 file |
| `verify.result` / `residual` | Khớp review T09 + trailer commit |
| `outOfScope` "Sửa dở chưa commit ngoài BL-045" | Đúng tinh thần. Cần giữ khi commit, xem L-1 |

## Gaps

Không có [MISSING] hay [PARTIAL].

### Residual risk (không chặn)
- **R-1:** Chưa có integration test `loadPostListing({ page: 1|2, categoryIds })` để kiểm bài nổi bật bị loại khỏi lưới danh mục và `totalDocs` +1. Cũng chưa có ảnh danh mục `/tin-bds` có bài nổi bật (MINOR-2 review T09; ảnh posts-category là danh mục rỗng). Logic giống hệt nhánh gốc đã có test, nên rủi ro thấp. Nên bổ sung ở follow-up.
- **R-2:** Build cuối dựa trên evidence của dispatcher, tôi không chạy lại. `pnpm typecheck` trên working tree tôi tự chạy: PASS.
- **R-3:** `/en/news` có bài nổi bật chưa được xem thật (DB dev không có bài EN). Query không phụ thuộc locale và đi qua `findPublicList`.

### Việc close-out (LOW, xử lý trước hoặc ngay khi commit close-out)
- **L-1 (phạm vi commit):** Working tree có các thay đổi **ngoài BL-045**: `next.config.ts` (`allowedDevOrigins`), `scripts/sync-claude.mjs`, `.claude/agents/*.md`, `.claude/launch.json`. **Không gộp** chúng vào commit close-out BL-045. Ngược lại, toàn bộ spec delta 1.35.0 **chưa từng được commit**: `spec/changes/2026-10-21-site-redesign-homepage-style.md` và `spec/updates/2026-10-21-...md` đang untracked, `SPECIFICATIONS.md`, `spec/CHANGELOG.md`, `spec/test-scope/current.json` + `spec/test-scope/archive/test-scope-1.34.1-44.json` và dòng BL-045 trong BACKLOG đều chưa commit. Commit close-out phải gồm đủ các file này, cộng task files và `progress.json`.
- **L-2:** Dòng BL-045 trong `spec/changes/BACKLOG.md` vẫn ghi "in_progress … 9 task … chờ implement qua `/resume`". Khi đóng feature cần đổi sang `done`, ghi 10 task + SHA + scope v45, và archive change doc (progress `:1335` đã liệt kê việc này).
- **L-3:** `progress.json:1335` note còn câu "GAP-4 pnpm build cuối còn residual", lệch với test-scope `verify.residual` (build PASS sau T09). Cần cập nhật note khi đặt feature `status: done` sau round 2 này.
- **L-4 (tuỳ chọn):** MINOR-1 T09: docstring `news-queries.ts:49` (`featuredOnly`) chưa nhắc trang danh mục. MINOR-4: truy vấn featured không có `select`. Không ảnh hưởng spec.

## Kết luận
Phase 1 BL-045 **build đúng và đủ** so với spec 1.35.0 (khối BL-045 + as-built). Có thể đóng feature: đặt `status: done`, commit close-out với đúng phạm vi ở L-1, cập nhật BACKLOG, archive change doc. Không cần round 3.
