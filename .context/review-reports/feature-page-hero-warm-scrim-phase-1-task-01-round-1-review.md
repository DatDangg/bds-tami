Agent: reviewer

# Review — feature-page-hero-warm-scrim · phase-1-task-01 · round 1 (BL-049, MODIFY)

- **Review level:** NORMAL
- **Reason:** Chỉ đổi giá trị một token màu dùng chung (`--color-banner-scrim`), không đổi schema/API/auth/bố cục. Có test tương phản tự động đọc token động. Token dùng chung nhưng chỉ ảnh hưởng thị giác, không ảnh hưởng logic hay data, nên không cần STRICT.
- **Blast radius:** `grep banner-scrim src` cho ra 6 chỗ dùng trong 5 vị trí, đúng như task liệt kê: `PageHero.tsx:39` (lớp phẳng) + `:41` (gradient `from-banner-scrim`), `PageBanner.tsx:34`, `CtaBanner.tsx:45` (gồm cả ConsultBanner), `AboutBlock.tsx:24` (chú thích ảnh), `globals.css:329` (`text-shadow` của `.crumb-glass`). Không component nào hardcode màu scrim. Không đụng `--color-overlay`, độ mờ, gradient hay bố cục.
- **Scope:** chỉ review các hunk BL-049. Các hunk BL-046/BL-047 trong cùng file (`--header-offset`, design-spec 83–86/240, SPECIFICATIONS 19/71) đã bỏ qua theo chỉ định.

## Verify commands + result
- `pnpm vitest run src/lib/contrast.test.ts src/components/layout/PageHero.test.tsx src/components/layout/PageBanner.test.tsx src/components/layout/CtaBanner.test.tsx src/components/projects/ProjectListPage.test.tsx src/components/rentals/RentalListPage.test.tsx` → **6 files / 123 tests PASS**
- `pnpm typecheck` (`tsc --noEmit`) → **PASS** (không có lỗi)
- Tự tính lại tương phản WCAG bằng node, cùng cách blend với test (ảnh trắng tinh, alpha 0.6):

| Scrim | nền phẳng | chữ trắng | breadcrumb `.crumb-glass` (primary-deep 13%) | vàng `#e0bf89` phía chữ (2 lớp) | vàng trên 1 lớp |
|---|---|---|---|---|---|
| cũ `10 12 16` | `#6c6d70` | 5.17 | 4.65 | 7.23 | 2.95 |
| mới `20 13 2` | `#726e67` | **5.07** | **4.60** | **7.03** | 2.89 |

  Tất cả khớp với task, DESIGN.md, design-spec.md và design-tokens.md.
- Không kiểm tra trực quan: không khởi động server, cũng không xác nhận dev server có đang chạy.

## Acceptance
- [x] Đã đổi token `--color-banner-scrim` sang `rgb(20 13 2 / 0.6)` (`globals.css:31`). Comment ở `:30` liệt kê đủ và đúng 5 vị trí dùng, ghi rõ BL-049, alpha giữ 0.6, ≥ 4.5:1, có tham chiếu contrast.test.
- [x] Component không hardcode màu scrim. Không đổi `--color-overlay`, độ mờ, gradient hay bố cục.
- [x] Chữ trắng 5.07, breadcrumb 4.60, vàng phía chữ 7.03: các test đọc token động (`contrast.test.ts:127,191,225,230`) đều PASS. Test mới BL-049 (`:234-241`) khóa hướng ấm (R > G > B) và alpha 0.6, nên có ý nghĩa như một test chống regression khi ai đó trả token về màu đen lạnh.
- [x] Test PageHero/PageBanner/CtaBanner/ProjectList/RentalList PASS.
- [x] Đã cập nhật doc as-built (DESIGN.md hàng PageHero, design-spec §~129, design-tokens.md bảng + khối `@theme`). SPECIFICATIONS 1.41.0 có thêm câu "Lớp phủ ảnh (BL-049)".

## Responsive Checklist Gate
Diff có đụng CSS nhưng chỉ đổi **giá trị màu** của một custom property. Không có selector, media query, kích thước hay bố cục mới.
- Layout (horizontal scroll / mobile-first / grid / container): **N/A**, không đổi bố cục.
- Typography/Spacing: **N/A**, không đổi cỡ chữ hay khoảng cách.
- Media (max-width / aspect-ratio / srcset): **N/A**, không đổi markup ảnh.
- Touch/Interaction (44px, nav, table): **N/A**.
- Viewport/A11y: **OK**. Tương phản AA ở trường hợp xấu nhất (ảnh trắng) vẫn ≥ 4.5:1 cho chữ trắng/breadcrumb, đã tự tính lại ở trên. Không dùng `overflow:hidden`/`100vh`.

## Skill gates
- aislop: **skip**. Diff là 2 dòng CSS + 1 khối test 8 dòng + doc, không có code logic mới. Không chạy CLI vì nằm ngoài danh sách verify được allow.
- oxlint (anti-slop): **skip**, không chạy trong round này. Builder báo `pnpm lint` 0 error. File TS duy nhất bị đổi là test, dùng `!` non-null giống pattern có sẵn ở `:201,:213`.
- ocr (open-code-review): **skip, ocr not installed / không cấu hình**.
- AI-readable: **OK**. 0 indicator: tên test rõ, không có magic number mới (0.6 chính là alpha được khóa), comment nói WHY (lý do màu + ngưỡng AA), doc đã cập nhật.
- ai-friendly-web: **N/A**, chỉ đổi màu token, không đổi route/crawl.
- blitzstrike: **N/A**, không phải task STRICT/security.

## Findings
- **[MINOR]** `src/lib/contrast.test.ts:236`: regex `rgb(r g b / a)` cùng phép parse giờ lặp lại lần thứ 4 (`:184, :201, :213, :236`). Fix đề xuất (task riêng, không chặn): tách helper `parseScrim()` dùng chung. Builder giữ đúng scope "không sửa test khác" nên chấp nhận được.
- **[MINOR]** `SPECIFICATIONS.md:25`, câu BL-049: "dòng tiêu đề vàng vẫn đạt ≥ 4.5:1 ở phía chữ" chỉ đúng ở mép trái, nơi gradient đậm nhất. Spec-validation đã ghi nhận đây là residual F-1 (vàng < 4.5:1 từ khoảng 50% bề rộng, `h1` là chữ lớn với ngưỡng 3:1). Đề xuất thêm "(mép trái)" khi spec được sửa lần tới. Không chặn.
- **[MINOR]** `skills/react-nodejs/design-tokens.md:56`: mô tả `--color-overlay` vẫn ghi "scrim trên ảnh hero", nay đã lỗi thời vì hero dùng `--color-banner-scrim`. Dòng này có từ trước, nằm ngoài diff, nên đề xuất sửa ở task riêng.

Không có CRITICAL/MAJOR.

## Residual risk
- Chưa xem trực quan tông nâu vàng trên ảnh thật. Số đo chỉ cover trường hợp ảnh trắng tinh.
- F-1 (spec-validation): vàng phía phải hero < 4.5:1 từ khoảng 50% bề rộng, tức ngưỡng chỉ dịch khoảng 3 điểm % so với token cũ.
- Không chạy `pnpm lint`/oxlint trong round này, đang dựa vào báo cáo của Builder.

## Verdict
**PASS**
