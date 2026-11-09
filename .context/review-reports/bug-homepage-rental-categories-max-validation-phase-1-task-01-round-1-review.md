Agent: reviewer

# Review: bug-homepage-rental-categories-max-validation · phase-1-task-01 · round 1 (BL-116)

- Review level: **NORMAL**
- Reason: chỉ sửa validate 1 field (`rentals.categories`) của global `homepage`; không đụng schema/DB/API contract/auth. Không phải shared service (hàm chỉ được dùng ở 1 field). Builder đã có test hồi quy.
- Blast radius: `src/globals/homepage/blocks.ts` `validateRentalCategories` (thêm `export`, thêm kiểm số lượng ở dòng 52) → chỉ ảnh hưởng admin form + API ghi global `homepage` field `rentals.categories`. Bên đọc (`src/lib/home/home-queries.ts`, `home-view-listings.ts`) chỉ dùng hằng `RENTAL_CATEGORIES_MAX`, không bị đổi. Test mới `src/globals/homepage/blocks.test.ts`. Chuỗi description `heroSearch.chipProjects` thuộc BL-115 — bỏ qua theo phạm vi.

## Verify commands + result
- `pnpm vitest run src/globals/homepage` → PASS (2 files, 12 tests).
- `pnpm typecheck` (`tsc --noEmit`) → PASS (không lỗi).
- `npx eslint src/globals/homepage/blocks.ts src/globals/homepage/blocks.test.ts` → exit 0, không cảnh báo.

## Kiểm theo yêu cầu
- **Thứ tự kiểm số lượng trước onChange/relationship — có bỏ sót kiểm mặc định?** Field định nghĩa `blocks.ts:131-138`: `hasMany`, `maxRows: 4`, `filterOptions`, KHÔNG `required`, KHÔNG `minRows`. Ở onChange, trước fix cũng đã bỏ qua toàn bộ `relationship()` (pre-existing); fix chỉ thêm kiểm số lượng, không bớt kiểm nào. Lúc lưu, `relationship(value, options)` vẫn chạy đầy đủ (required/minRows/maxRows/kiểu id) với mọi value ≤ 4; với > 4 thì trả sớm câu tiếng Việt — đúng là thứ maxRows sẽ báo, nên không mất ràng buộc. Không có kiểm mặc định nào thực sự bị bỏ sót.
- **Value dạng id / object:** field monomorphic (`relationTo: "categories"`) nên value là mảng id hoặc doc populated `{id,…}`; `Array.isArray(value) && value.length` đúng cho cả hai. Dạng polymorphic `{relationTo,value}` không áp dụng cho field này; nếu có thì phép đếm độ dài vẫn đúng.
- **null/undefined:** `Array.isArray` false → bỏ qua kiểm số lượng → onChange `true`; lúc lưu qua `relationship()` + `ids` rỗng → `true`. Không ném lỗi.
- Acceptance: onChange 5 → "Tối đa 4 danh mục." và `find` không gọi (test 1); lưu 5 → chặn tiếng Việt (test 2); 4 ở onChange/lưu scope rental → true (test 3,4); khác scope → câu scope (test 5). Đạt.

## Responsive Checklist Gate
N/A — diff không đụng UI route/component/CSS (chỉ hàm validate server/admin).

## Skill gates
- aislop: skip, không có trong verify commands được allow cho reviewer.
- oxlint (anti-slop): skip, oxlint not configured (repo dùng eslint — eslint PASS).
- ocr (open-code-review): skip, ocr not installed / không trong lệnh được allow.
- AI-readable: OK — tên rõ, hàm 20 dòng, dùng hằng `RENTAL_CATEGORIES_MAX` (không magic number), comment nêu WHY. 0 indicator.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: N/A (không STRICT).

## Bug repro closure
- Repro Verification status: PASS (mức unit). Evidence kiểm chứng được: test hồi quy onChange-5 trả `true` trước fix (logic cũ `return true` ở dòng onChange — xác nhận qua diff) và pass sau fix; tự chạy vitest PASS.
- Phần viền đỏ trên trình duyệt chưa kiểm tay — chấp nhận: Payload hiển thị lỗi tại field khi validate trả chuỗi ở onChange (cơ chế chuẩn); ghi Residual risk.

## Findings
- [MINOR] `src/globals/homepage/blocks.test.ts:11` — mock `options` cast `as unknown as ValidateOptions`; test lưu 4/khác scope phụ thuộc hành vi nội bộ của `relationship()` từ `payload/shared` với `req` giả (`collections: {}`). Hiện PASS; nếu Payload nâng cấp đổi `relationship()` cần đọc thêm field của `req` thì test có thể vỡ vì lý do mock chứ không phải logic. Không chặn.
- [MINOR] (ngoài diff, pre-existing) `src/globals/homepage/blocks.ts:138` description `"Tối đa 4. …"` hardcode số 4 thay vì `RENTAL_CATEGORIES_MAX` — đề xuất task riêng hoặc gộp khi chạm field này (BL-115 đang làm kiểu này cho chipProjects).

Không có CRITICAL/MAJOR.

## Residual risk
- Chưa xác minh viền đỏ/thông điệp trên admin UI thật (reviewer không chạy app).
- Test dùng mock `req`/`payload`, không DB thật.

## Verdict
✅ PASS
