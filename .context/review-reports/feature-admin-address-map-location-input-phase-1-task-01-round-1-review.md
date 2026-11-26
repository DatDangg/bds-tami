Agent: reviewer

# Review — feature-admin-address-map-location-input · phase-1-task-01 · round 1 (BL-131 T01)

- Review level: **NORMAL**
- Reason: chỉ đổi vị trí 2 field trong cấu hình admin của một collection, cùng test. Không đụng auth/schema/API shape/shared helper. Chọn NORMAL thay vì FAST vì đây là collection config mà backfill và các trang công khai đọc dữ liệu từ đó, nên cần xác nhận đường dẫn dữ liệu không đổi.
- Blast radius: form admin Tin BĐS (tab "Thông tin tin đăng"); dữ liệu `property_posts.address` / `location` (đường dẫn không đổi); backfill `src/lib/backfill/property-posts.ts` + `property-post-extract.ts` (đọc `doc.address`, không phụ thuộc vị trí); `payload-types.ts` không đổi (cùng tên/kiểu field).
- Scope: chỉ `git diff -- src/collections/PropertyPosts.ts src/collections/property-posts-specs.test.ts`. Các file bẩn khác trong cây làm việc nằm ngoài scope.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/collections src/lib/backfill` | PASS: 19 files, 180 tests |
| `pnpm typecheck` (`tsc --noEmit`) | PASS (không có lỗi) |
| `pnpm exec eslint src/collections/PropertyPosts.ts src/collections/property-posts-specs.test.ts` | PASS (exit 0, không cảnh báo) |

## Kiểm theo yêu cầu
- **Đường dẫn dữ liệu:** `addressField` / `locationField` nằm trực tiếp trong `fields` của tab "Thông tin tin đăng". Tab này **không có `name`** (PropertyPosts.ts:118-120). `specsSection` cũng là collapsible không tên. Vì vậy cả trước và sau thay đổi, hai field đều ở cấp gốc dữ liệu: `address`, `location`. Test xác nhận qua `findLayoutField`, hàm này bỏ qua tab có tên (form-layout.ts:31), nên field chỉ được tìm thấy khi thực sự ở cấp gốc.
- **Migration:** không cần. Tên, kiểu (`text` / `point`) và cột DB giữ nguyên; chỉ đổi vị trí hiển thị trong admin.
- **Backfill:** `property-posts.ts:30,83,98` và `property-post-extract.ts:211-224` chỉ đọc/ghi `doc.address` theo tên field, không tham chiếu `specsSection` hay vị trí của field. `location` không được backfill trích xuất.
- **Thứ tự:** PropertyPosts.ts:125-131 có thứ tự province+ward row → address → location → relatedProject+relatedRental row, đúng acceptance. `label` và `admin.description` giữ nguyên. JSDoc của `specsSection` đã cập nhật.
- **Test:** `SPEC_FIELDS` đã bỏ address/location, nên test thứ tự khối thông số vẫn kiểm đúng 8 trường. Test mới có ý nghĩa thật:
  - (a) address/location không nằm trong collapsible;
  - (b) chúng nằm ngay sau hàng Tỉnh/Phường và trước hàng Dự án/Tin cho thuê liên quan;
  - (c) chúng ở cấp gốc, đúng kiểu, không có `access` riêng.

  Nếu đặt sai vị trí, (b) sẽ fail. Nếu bọc vào group/tab có tên, (c) sẽ fail.
- Validate toạ độ / component: thuộc T02/T03, không đòi ở task này.

## Responsive Checklist Gate
N/A. Diff chỉ đổi thứ tự field trong cấu hình Payload admin, không có CSS/component/route mới. Theo brief, UI được kiểm chung ở T03.

## Skill gates
- aislop: skip. Diff rất nhỏ (2 file, chỉ di chuyển field + test); không chạy được vì lệnh không nằm trong danh sách verify được allow.
- oxlint (anti-slop): skip, oxlint not configured. Đã chạy eslint trên 2 file đổi: PASS.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK. Tên rõ (`addressField`, `locationField`), JSDoc nêu lý do (WHY), không có magic number hay indirection thêm. 0 indicator đáng kể.
- ai-friendly-web: N/A (form admin nội bộ).
- blitzstrike: N/A (không phải STRICT, không đụng auth/input công khai).

## Findings
- [MINOR] `src/collections/property-posts-specs.test.ts:64`: biểu thức `topLevel` dồn trong một dòng (ternary lồng + flatten + join) nên khó đọc. Đề xuất tách thành helper nhỏ `layoutKey(field)`. Không chặn PASS.

Không có CRITICAL/MAJOR.

## Residual risk
- Chưa kiểm hiển thị thực tế trên trình duyệt (theo brief, dồn sang T03). Chỉ có rủi ro trình bày; không có rủi ro dữ liệu.

## Verdict
✅ **PASS**
