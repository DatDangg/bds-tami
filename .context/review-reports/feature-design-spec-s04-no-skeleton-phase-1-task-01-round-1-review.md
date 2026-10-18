Agent: reviewer

# Review — feature-design-spec-s04-no-skeleton · phase-1-task-01 · round 1

- **Work item:** Change Request MODIFY BL-011 (doc-only, không có builder)
- **Review level:** NORMAL
- **Reason:** Scope hẹp, không đổi code/schema/API, nhưng sửa intent doc (design-spec) mà user đã duyệt và phát hành spec (version + test-scope dùng cho template test), nên cần soi kỹ hơn FAST. Không có risk đỏ (không auth/schema/shared code bị sửa) nên không cần STRICT.
- **Blast radius:** `.context/design-spec.md` (§3.2, S02, S04, S08, S10), `SPECIFICATIONS.md` (spec_version), `spec/CHANGELOG.md`, `spec/test-scope/current.json` (scopeVersion 4, template test đọc file này), `spec/updates/2026-10-19-design-spec-s04-no-skeleton.md`, `tasks/tami-website/layer-15-task-01.md` (follow-up bỏ). Runtime code: không đổi.

## 1. Spec delta
- **S04** (`.context/design-spec.md:353`): đúng câu user duyệt — "Đổi bộ lọc/trang/chip: giữ kết quả cũ, mờ 50% + `aria-busy="true"` … link đang chờ mờ nhẹ (`useLinkStatus`); không skeleton cấp route". Phần thêm "(không nhảy layout)" và "(`loading.tsx` gây soft-404, §3.2)" chỉ giữ lại câu cũ hoặc thêm lý do, không đổi nghĩa. Đã bỏ "Loading lần đầu: skeleton 6 thẻ". OK.
- **§3.2** (`:145`): bỏ "Dùng `loading.tsx` của route + `Suspense` cho lưới". Thay bằng quy tắc cấm `loading.tsx` cấp route và cả thư mục cha, đúng nguyên tắc `list-no-loading.test.ts` đã chặn. Skeleton chỉ còn cho `Suspense` cục bộ. OK.
- **S02 `/du-an` (`:304`), S08 `/tin-bds` (`:443`), S10 `/tin-tuc` (`:479`)**: cả 3 route có trong `LIST_PAGES` (`src/app/(frontend)/[locale]/list-no-loading.test.ts:11-20`: `du-an/page.tsx`, `tin-bds/page.tsx`, `tin-tuc/page.tsx`). Nên đây đúng là cùng một mâu thuẫn kỹ thuật, sửa theo cùng nguyên tắc là hợp lý. S12 `/tuyen-dung` cũng có trong LIST_PAGES nhưng design-spec chưa từng ghi skeleton cho nó, nên không phải sửa.
- **S03 (`:331`) / S07 (`:426`)** để làm gap: hợp lý. Trang chi tiết `[slug]` không thuộc `LIST_PAGES`, và chưa đo được soft-404 cho trang này nên không thể coi là cùng mâu thuẫn. Task file và spec/updates đã ghi gap, không hạ cấp intent. Đúng luật "CẤM sửa intent cho khớp code".
- `layer-15-task-01.md:151`: follow-up "Skeleton 6 thẻ /du-an (loading.tsx)" đã được gạch bỏ, có ghi lý do và trỏ tới BL-011. OK.

## 2. Evidence code (đã đối chiếu từng file:line)
- `Glob src/**/loading.tsx` → không có file nào. OK.
- `PendingRegion.tsx:45-53`: `PendingRegion` có `aria-busy` + `opacity-50` + `motion-reduce:transition-none`. `:55-70`: `PendingLink` + `useLinkStatus` → `opacity-60` + `cursor-progress`. `:72-77`: `FormPendingMarker` (`useFormStatus`). Khớp.
- `RentalListPage.tsx:126-132` (chip `PendingLink`), `:139-156` (`RentalPendingRegion`); `RentalListNavigation.tsx:30` (`ListPendingProvider`), `:42-47` (`RentalPendingRegion` với `forcePending`). Khớp.
- `Pagination.tsx:58,99` và `ActiveFilters.tsx:67-81` đều dùng `PendingLink`. Khớp.
- `CategoryListTemplate.tsx:68-78` (chip `PendingLink`) và `:97-111` (`ListPendingProvider` + `PendingRegion`) được dùng bởi `ProjectListPage.tsx:93`, `PostListPage.tsx:57`, `NewsListPage.tsx:57`, `JobListPage.tsx:118`. Khớp. Lưu ý: file thật nằm ở `src/components/templates/`, xem m1.
- Kết luận: code hiện tại khớp intent mới, không cần builder.

## 3. Spec publish
- `SPECIFICATIONS.md:9` spec_version 1.4.0 → 1.4.1. `spec/CHANGELOG.md` có dòng 1.4.1 PATCH, trỏ đúng delta, ghi "scope v4". `spec/test-scope/current.json` có specVersion "1.4.1", scopeVersion 4, JSON parse được. Ba file nhất quán.
- Chọn PATCH là hợp lý: chỉ làm rõ intent, không thêm requirement.

## Verify commands + result
- `pnpm vitest run "src/app/(frontend)/[locale]/list-no-loading.test.ts" src/components/layout/PendingRegion.test.tsx src/components/layout/PendingRegionSources.test.tsx src/components/rentals/RentalFilters.test.tsx` → **4 files passed, 35 tests passed**.
- `node -e JSON.parse(spec/test-scope/current.json)` → `json ok`.
- Lint/typecheck/build: skip (doc-only, không đổi TS/JS).

## Responsive Checklist Gate
N/A — diff không đụng route/component/CSS, chỉ sửa intent doc. Hành vi UI đã build ở L10-T04 và đã review ở đó.

## Skill gates
- aislop: N/A — không có code thay đổi.
- oxlint (anti-slop): N/A — diff không đụng TS/JS.
- ocr (open-code-review): N/A — không có code thay đổi.
- AI-readable: OK — doc rõ ràng, chỉ có 0–1 indicator (đường dẫn sai ở m1), dưới ngưỡng FAIL.
- ai-friendly-web: N/A — không phải thay đổi public-facing mới.
- blitzstrike: N/A — không phải STRICT.

## Findings
- **[MINOR] m1 — sai đường dẫn file.** `spec/test-scope/current.json` (`changed.filesNote`) và `spec/updates/2026-10-19-design-spec-s04-no-skeleton.md:15` ghi `src/components/layout/CategoryListTemplate.tsx`. File thật là `src/components/templates/CategoryListTemplate.tsx`. Task file `:22` chỉ ghi tên file, không có thư mục. Cách sửa: đổi đường dẫn thành `src/components/templates/CategoryListTemplate.tsx` ở cả hai chỗ.
- **[MINOR] m2 — test-scope bỏ viewport 768.** `spec/test-scope/current.json` `viewports` từ `[375,768,1280]` thành `[375,1280]`. Trạng thái chờ không phụ thuộc breakpoint nên không sai, nhưng lệch với breakpoint chuẩn 375/768/1280. Cách sửa: giữ lại 768, hoặc ghi lý do bỏ.
- **[MINOR] m3 — change doc chưa archive.** Task file, spec/updates và test-scope đều trỏ `spec/changes/archive/2026-10-19-design-spec-s04-no-skeleton.md`, nhưng trên đĩa file vẫn ở `spec/changes/2026-10-19-design-spec-s04-no-skeleton.md` (untracked). Cách sửa: khi close-out, nhớ chuyển file vào `archive/` trước commit để đường dẫn không bị gãy.
- Ngoài scope: comment `PendingRegion.tsx:9` trỏ "design-spec §3.5", trong khi quy tắc giờ nằm ở §3.2 và S04. Code có từ trước, đề xuất sửa trong task riêng.

## Residual risk
- Chưa đo HTTP 404 thật cho `?page` vượt số trang (cần chạy app). Rủi ro thấp vì đã có test chặn `loading.tsx` và L9-T08 đã đo.
- Gap S03/S07 (skeleton trang chi tiết) còn mở, chờ user chốt.

## Verdict
**PASS** — không có CRITICAL hay MAJOR. Ba MINOR nên sửa ở bước close-out, nhất là m1 và m3.
