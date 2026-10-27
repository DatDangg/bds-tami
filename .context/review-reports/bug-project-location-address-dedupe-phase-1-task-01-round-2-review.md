Agent: reviewer

# Review — bug-project-location-address-dedupe · phase-1-task-01 · round 2 (BL-081)

- Review level: **NORMAL**
- Reason: round 2 chỉ sửa 2 MINOR của r1 trong helper thuần `joinAddress` và 2 nơi gọi. Không đụng API/schema/auth. JSON-LD vẫn `string | null`.
- Blast radius: không đổi so với r1, gồm `src/lib/address/join-address.ts` → `ProjectLocation` (`/du-an/[slug]`), `rental-view.ts addressLine` (`/cho-thue/[slug]`) và JSON-LD `address` của `/du-an/[slug]`.

## Kiểm các sửa của r1
| MINOR r1 | Kết quả | Bằng chứng |
|---|---|---|
| 1. Phường trùng tên đường bị bỏ sai | **Đã đóng** | `join-address.ts:41,48`: dạng đầy đủ (có tiền tố) vẫn khớp theo ranh giới từ trên cả chuỗi; dạng bỏ tiền tố chỉ khớp khi `sameTokens` với **trọn** một đoạn address đã strip (tách theo dấu phẩy). Trace: "123 Lê Lợi" có đoạn `[123,le,loi]`, khác `[le,loi]`, nên phường được giữ. "P. Lê Lợi" có đoạn `[le,loi]`, khớp, nên bỏ. Test `join-address.test.ts:35-38` |
| 2. Lặp `areaLabel.split(",")` | **Đã đóng** | `joinAddress` nhận `string` và tự tách (`:42`). `ProjectLocation.tsx:65` và `page.tsx:141` truyền thẳng `areaLabel`. Test `:40-44` (chuỗi, null) |

## Hồi quy acceptance r1
- Ca Astor, không dấu/hoa thường, thiếu phần nào thêm phần đó, rỗng/undefined, ranh giới từ "Hà"/"Phường 1", "P. Phú Thượng"/"Phú Thượng" là một đoạn riêng: toàn bộ test cũ vẫn PASS, không đổi kỳ vọng.
- Rental `showExactAddress=false`: `rental-view.ts` không đổi trong r2, test `rental-view.test.ts:74-75` vẫn PASS.
- Diff r2 surgical: chỉ chạm helper và 2 call site, đúng phạm vi 2 MINOR.

## Verify commands + result
- `pnpm typecheck` → exit 0
- `pnpm vitest run src/lib/address src/lib/rentals src/components/projects` → 14 file / 147 test PASS (+2 so với r1)
- `pnpm eslint <7 file đổi/mới>` → exit 0
- `pnpm build` → exit 0

## Responsive Checklist Gate
- N/A: không đổi markup/CSS/layout, chỉ đổi nội dung chuỗi địa chỉ.

## Skill gates
- aislop: skip, không có trong allowlist verify command; đã soát tay, không có code thừa.
- oxlint (anti-slop): skip, không có trong allowlist; eslint sạch.
- ocr: skip, không chạy hoặc chưa cài.
- AI-readable: OK. Hàm nhỏ (`joinAddress` 15 dòng), tên rõ, JSDoc nêu WHY và giới hạn. 0 indicator.
- ai-friendly-web: N/A. blitzstrike: N/A.

## Findings
- **[MINOR]** (giới hạn có sẵn, đã ghi JSDoc) Dạng đầy đủ không có tiền tố, như tên tỉnh "Bình Định", vẫn khớp theo ranh giới từ trên cả chuỗi. Vì vậy "12 đường Bình Định" sẽ bỏ tỉnh Bình Định. Trường hợp hiếm, chỉ ảnh hưởng hiển thị, không chặn PASS.
- **[MINOR]** (từ r1, vẫn còn) Task file chưa tick checkbox Acceptance, trạng thái `in_progress`. Cập nhật ở close-out.

## Verdict
✅ **PASS**. Không có CRITICAL hoặc MAJOR. Cả 2 MINOR code của r1 đã đóng, có test. Repro vẫn PASS.
