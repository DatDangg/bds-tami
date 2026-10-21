Agent: spec-validator

# Spec validation (pre-plan) — feature-page-hero-warm-scrim (BL-049, MODIFY) — round-1

- Mode: Spec validation (pre-plan)
- Change doc: `spec/changes/2026-10-21-page-hero-warm-scrim.md`
- Task: `tasks/feature-page-hero-warm-scrim/phase-1-task-01.md`
- Spec delta: `SPECIFICATIONS.md:9` (spec_version 1.40.0 → 1.41.0) + câu cuối `SPECIFICATIONS.md:25` "*Lớp phủ ảnh (BL-049):* …". Hunk `:19` và `:71` thuộc BL-046/047, đã bỏ qua.

## Verdict: PASS

0 ❌, 0 conflict HIGH, 1 ⚠️ (LOW, đã có từ trước, delta chỉ đổi rất nhỏ). Không có điều kiện FAIL nào.

## Ma trận coverage

| # | Requirement (change doc) | Nguồn | Spec delta / task | Status | Ghi chú |
|---|---|---|---|---|---|
| 1 | PageHero phủ scrim đen ánh nâu vàng, cả lớp phẳng lẫn gradient trái | change doc :17 | SPEC :25 "hero trang con: lớp phẳng + gradient trái"; task Scope 1 | ✅ | `PageHero.tsx:39,41` đều dùng `banner-scrim` nên đổi token là phủ cả hai lớp |
| 2 | Đổi chung token: PageBanner, CtaBanner (+ConsultBanner), chú thích AboutBlock, text-shadow `.crumb-glass` | change doc :23 | SPEC :25 liệt kê đủ 5 chỗ; task Blast radius / Scope 3 | ✅ | Grep `banner-scrim` trong `src/`: chỉ thấy `PageHero.tsx:39,41`, `PageBanner.tsx:34`, `CtaBanner.tsx:45`, `AboutBlock.tsx:24`, `globals.css:329` — đủ, không sót chỗ nào |
| 3 | Không đổi độ mờ, gradient, bố cục, ảnh | change doc :24 | SPEC :25 "giữ nguyên độ mờ, gradient, bố cục"; task Scope 3 (alpha 0.6, không sửa component, không đổi `--color-overlay`) | ✅ | |
| 4 | Chữ trắng (tiêu đề, mô tả, breadcrumb) ≥ 4.5:1 trên ảnh trắng tinh | change doc :18 | SPEC :25; bảng số đo trong task | ✅ | Đã tự tính lại, khớp (xem bên dưới) |
| 5 | Dòng tiêu đề vàng đọc rõ, có đo và ghi số | change doc :18 | SPEC :25 "≥ 4.5:1 ở phía chữ"; task 7.03 | ✅ (⚠️ LOW F-1) | |
| 6 | Màu đi qua token trong `globals.css`, có comment lý do | change doc :19 | task Scope 1 | ✅ | |
| 7 | Test hiện có PASS; cập nhật design-spec / DESIGN.md | change doc :20 | task Scope 2/4 + Verify | ✅ | Task còn thêm `skills/react-nodejs/design-tokens.md` (bảng token as-built), hợp lệ |
| 8 | Bump spec_version | quy trình (spec-publish) | SPEC :9 → 1.41.0 | ✅ | |

## Tự tính lại số đo (WCAG 2.x relative luminance, blend alpha 0.6 trên trắng 255, làm tròn từng kênh như `contrast.test.ts`)

| Scrim | nền phẳng | trắng / nền phẳng | breadcrumb (`#c9a15f` 13% trên nền phẳng) | vàng `#e0bf89` phía chữ (2 lớp) | vàng / nền phẳng 1 lớp |
|---|---|---|---|---|---|
| `rgb(10 12 16 / 0.6)` (cũ) | `#6c6d70` | 5.17 | 4.65 | 7.23 | 2.95 |
| `rgb(28 20 10 / 0.6)` (gợi ý) | `#77726c` | 4.76 | **4.35** | 6.42 | 2.72 |
| `rgb(20 13 2 / 0.6)` (chọn) | `#726e67` | **5.07** | **4.60** | **7.03** | 2.89 |

Mọi số trong bảng của task đều khớp tới 2 chữ số thập phân. Loại phương án gợi ý `28 20 10` là đúng (breadcrumb 4.35 < 4.5).

Số đo thêm cho các test hiện có (với `20 13 2`):
- `--color-on-dark-muted` / nền phẳng = 2.42, vẫn < 4.5. Test `contrast.test.ts:130-133` (kiểm "nhỏ hơn") vẫn PASS.
- `--color-focus-ring` / nền phẳng = 1.01, vẫn < 4.5. Trắng / nền phẳng = 5.07, vẫn ≥ 3. Test `:199-209` vẫn PASS.
- Chữ trắng trên nền 2 lớp = 12.32.

## Đối chiếu mâu thuẫn

| Nguồn | Kết quả |
|---|---|
| NFR-07 (`SPECIFICATIONS.md:213`, mục tiêu AA) | Không mâu thuẫn: mọi cặp chữ thường vẫn ≥ 4.5:1 |
| FR-ADM-20 (`SPECIFICATIONS.md:132`, "scrim đảm bảo chữ trắng đạt AA kể cả trên ảnh rất sáng") | Không mâu thuẫn: 5.07 ≥ 4.5 |
| Breadcrumb trên ảnh (`SPECIFICATIONS.md:24`) | Không mâu thuẫn: 4.60 ≥ 4.5 khi chỉ tính lớp phẳng (thực tế breadcrumb ở góc trái còn có gradient nên cao hơn). Lưu ý ngoài phạm vi: câu ":24" ghi "scrim đầu ảnh bằng token overlay sẵn có", còn as-built dùng `--color-banner-scrim`. Đây là cách diễn đạt có từ trước BL-049, delta không gây ra |
| `docs/DESIGN.md` (hàng PageHero, :278) | Nhất quán với delta (giá trị và số đo khớp) |
| `.context/design-spec.md` :125, :256 | Nhắc tới token theo tên, không ghi giá trị cũ, nên không lệch. :129 do task cập nhật |
| `src/lib/contrast.test.ts` | Các test BL-045/FR-ADM-20/CTA đọc token động nên tự kiểm giá trị mới. Test `:135-137` khoá `--color-overlay` (0.55), không bị ảnh hưởng vì task không đổi `--color-overlay` |
| `.crumb-glass` text-shadow (`globals.css:329`) | Dùng `var(--color-banner-scrim)` nên tự đổi theo. SPEC :24 nói AA "không tính bóng chữ", nên đổi màu bóng không ảnh hưởng ngưỡng |

## Findings

- **F-1 [⚠️ LOW, đã có từ trước, đây là rủi ro còn lại chứ không phải gap]** Câu "dòng tiêu đề vàng ≥ 4.5:1 ở phía chữ" (7.03) tính với gradient trái ở alpha đầy đủ 0.6, tức đúng ở mép trái. Gradient là `from-banner-scrim to-transparent` trên toàn chiều rộng hero (`PageHero.tsx:41`), nên càng sang phải càng mỏng. Khi tính tuyến tính, vàng `#e0bf89` tụt dưới 4.5:1 từ khoảng 50% chiều rộng hero (token cũ: khoảng 53%) và dưới 3:1 từ khoảng 97%. Dòng vàng của `h1` là chữ lớn nên ngưỡng 3:1 vẫn đạt gần như toàn bộ chiều rộng. Eyebrow là chữ nhỏ nhưng ngắn và nằm sát mép trái. Cách đo này giống với test BL-045 `contrast.test.ts:228-231` có từ trước; BL-049 chỉ làm dịch ngưỡng khoảng 3 điểm phần trăm. Đề xuất (không bắt buộc): ghi "đo tại mép trái" trong task, hoặc reviewer chụp kiểm thêm hero trên ảnh sáng ở 390px.
- **F-2 [Quy trình, để primary nắm]** Working tree đã có implementation của BL-049 trước bước pre-plan validation: `globals.css:30-31` đã là `rgb(20 13 2 / 0.6)`, `contrast.test.ts:235` đã có test "ngả ấm", `docs/DESIGN.md:278` và `skills/react-nodejs/design-tokens.md:57,350` cũng đã cập nhật. Report này chỉ validate spec; việc review code thuộc reviewer ở bước loop.
- Ngoài phạm vi: SPEC :25 vẫn ghi "chiều cao cố định" song song với đoạn as-built "chiều cao tối thiểu" (BL-045). Đây là chuyện có từ trước, không liên quan BL-049.

## Gaps
- [MISSING]: không có
- [PARTIAL]: không có

## Tool / verify
- `git diff -U0 SPECIFICATIONS.md`
- `node -e` tính tương phản WCAG (tỉ lệ + ngưỡng gradient), kết quả như các bảng ở trên.
- Không chạy vitest vì pre-plan validation không yêu cầu.
