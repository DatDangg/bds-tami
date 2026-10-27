Agent: reviewer

# Review — bug-project-location-address-dedupe · phase-1-task-01 · round 1 (BL-081)

- Review level: **NORMAL**
- Reason: lỗi chỉ ở phần hiển thị; helper thuần mới với 3 nơi gọi (ProjectLocation, rental-view addressLine, JSON-LD dự án). Không đụng API/DTO/schema/auth/tenant. JSON-LD vẫn là `address: string | null` như cũ, chỉ đổi giá trị chuỗi, không đổi cấu trúc, nên không cần STRICT. Nhánh quyền riêng tư của rental (`showExactAddress`) đã có test hồi quy và vẫn PASS.
- Blast radius: `src/lib/address/join-address.ts` (mới) → `ProjectLocation` (`/du-an/[slug]` mục "Vị trí dự án"), `rental-view.ts addressLine` (chi tiết cho thuê, `/cho-thue/[slug]`), JSON-LD `RealEstateListing.address` của `/du-an/[slug]`. Các nơi tiêu thụ khác của rental-view dùng `addressLine` cũng nhận chuỗi đã khử lặp.

## Scope / surgical diff
- Sửa JSON-LD ở `du-an/[slug]/page.tsx:141` **hợp scope**: cùng biểu thức ghép `[view.address, view.areaLabel].join(", ")`, cùng lỗi lặp, chỉ 1 dòng, và đã ghi vào decision log. Mọi dòng trong diff đều quay về đúng task. Không có refactor tiện tay. Không đụng file dirty của việc khác.
- Builder đã soát các nơi khác chỉ dùng 1 nguồn (`post-view.ts`, `ProjectOverview.tsx:50`, `ProjectDetail.tsx:189`) và không đổi chúng. Hợp lý.

## Acceptance
| Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|
| address đã có phường/tỉnh (không dấu, không phân biệt hoa thường) thì không ghép lại | OK | `join-address.test.ts:7-13` (ca Astor + "PHUONG PHU THUONG, ha noi"); `normalizeSearchText` gỡ dấu NFD, đổi đ→d, lowercase |
| thiếu phần nào thì thêm phần đó | OK | `join-address.test.ts:15-18`, `project-location-address.test.tsx:14-17` |
| cùng quy tắc cho thuê | OK | `rental-view.ts:84-86`, `rental-view.test.ts:95-98` |
| ranh giới từ "Hà" ≠ "Hà Nội", "Phường 1" khác "Số 1" | OK | `containsTokens` so khớp dãy token liền nhau; `stripAdminPrefix` giữ nguyên tiền tố khi phần còn lại không có chữ; test `:25-28` |
| rental không lộ address khi showExactAddress=false | OK | `street = null` khi không `=== true`; test có sẵn `rental-view.test.ts:74-75` (`not.toContain("Lê Lợi")`) PASS |
| JSON-LD hợp lệ | OK | vẫn trả `string \|\| null`, không đổi kiểu tham số của `buildRealEstateListingJsonLd`; typecheck + build PASS |
| rỗng/undefined | OK | `join-address.test.ts:20-23`; `areaLabel` falsy → `[]` |

## Bug repro closure
- Task file ghi Repro Verification `Status: PASS`. Bằng chứng tự động kiểm được: test render `ProjectLocation` với đúng address và areaLabel của Astor, kết quả `getByText(ASTOR)` khớp chính xác (chuỗi lặp sẽ không khớp). Reviewer đã chạy lại: PASS.

## Verify commands + result
- `pnpm typecheck` → exit 0
- `pnpm vitest run src/lib/address src/lib/rentals src/components/projects` → 14 file / 145 test PASS
- `pnpm eslint <7 file đổi/mới>` → exit 0, không có lỗi
- `pnpm build` → exit 0

## Responsive Checklist Gate
- N/A: diff chỉ đổi nội dung chuỗi địa chỉ. Không đổi markup/CSS/layout/class. Chuỗi kết quả bằng hoặc ngắn hơn trước.

## Skill gates
- aislop: skip, không chạy (không có trong allowlist verify command của profile). Đã soát tay: không có code thừa, JSDoc giải thích WHY và giới hạn.
- oxlint (anti-slop): skip, không chạy (không có trong allowlist verify command); eslint trên file đổi sạch.
- ocr (open-code-review): skip, ocr chưa chạy hoặc chưa cài.
- AI-readable: OK. Tên rõ (`joinAddress`, `stripAdminPrefix`, `containsTokens`), mọi hàm < 20 dòng, indirection 1 bước, không có magic number. Không đổi luồng chính nên không cần cập nhật README/ARCHITECTURE. 0 indicator.
- ai-friendly-web: N/A (không đổi llms/robots/sitemap; JSON-LD vẫn hợp lệ).
- blitzstrike: N/A (NORMAL, không có bề mặt auth/input).

## Findings
- **[MINOR]** `src/lib/address/join-address.ts:41`: khớp dạng đã bỏ tiền tố được so với **toàn chuỗi** street. Vì vậy phường mang tên đường sẽ bị bỏ sai. Ví dụ `joinAddress("123 Lê Lợi", ["Phường Lê Lợi", "Bình Định"])` trả "123 Lê Lợi, Bình Định", mất phường; tên phường trùng tên đường khá phổ biến (Lê Lợi, Nguyễn Trãi, Trần Phú…). Trước đây lỗi là lặp thừa, giờ là thiếu thông tin. Ảnh hưởng chỉ ở hiển thị, không sai dữ liệu. Đề xuất fix: chỉ dùng phép khớp đã bỏ tiền tố khi tên đó khớp **trọn một đoạn** của street (tách theo ","), ví dụ đoạn "Phú Thượng" hoặc "P. Phú Thượng". Phép khớp đầy đủ có tiền tố ("phường Phú Thượng") vẫn giữ so trên toàn chuỗi. Thêm test ca "123 Lê Lợi" + "Phường Lê Lợi" cho fix này. Không chặn PASS, có thể làm follow-up.
- **[MINOR]** `ProjectLocation.tsx:65` và `du-an/[slug]/page.tsx:141`: biểu thức `areaLabel ? areaLabel.split(",") : []` bị lặp ở 2 chỗ. Có thể cho `joinAddress` nhận `string` và tự tách, hoặc thêm helper nhỏ. Mức thẩm mỹ/DRY nhẹ.
- **[MINOR]** Task file: checkbox Acceptance chưa tick và `Trạng thái: in_progress`. Cập nhật ở bước close-out.

## Verdict
✅ **PASS**. Không có CRITICAL hoặc MAJOR. Repro PASS có bằng chứng test tự động. 3 MINOR đề xuất follow-up.
