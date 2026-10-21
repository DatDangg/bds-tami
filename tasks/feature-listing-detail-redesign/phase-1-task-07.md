# feature-listing-detail-redesign · phase-1-task-07 — Script điền dữ liệu cũ (phần Dự án) `pnpm backfill:listing-fields`

- Nguồn: BL-052 change doc "Chế độ chạy": trích từ nội dung có sẵn, chỉ điền ô trống, chạy DB dev, báo cáo cho admin soát; staging/prod chỉ khi user bảo.
- Spec: 1.46.0 khối BL-052 mục "Điền dữ liệu cũ (script, dev only)".
- Plan: phase 1 wave B (sau P1-T01). Phần Tin BĐS thêm ở P3-T05 (thiết kế script để mở rộng theo collection).
- Phụ thuộc: P1-T01.

## Classification / Risk
- Type: **ADDITIVE** (script).
- Risk: **HIGH** — bulk update dữ liệu (chỉ dev), phải có guard môi trường.
- Expected review level: **STRICT**.
- Blast radius: `scripts/backfill-listing-fields.ts` (hoặc theo vị trí script seed hiện có, vd `src/scripts/*` — xem `package.json` các lệnh `seed:*`), `package.json`, `docs/reports/`.

## Scope
1. Lệnh `pnpm backfill:listing-fields [--apply] [--collection projects]`: mặc định **dry-run** (không ghi), `--apply` ghi qua Payload Local API (không SQL trực tiếp, `overrideAccess` + context bỏ dịch tự động/revalidate nếu cần — theo mẫu seed sẵn có).
2. Guard: từ chối khi `NODE_ENV=production` hoặc host/tên DB không phải DB dev cục bộ (theo guard của các seed sẵn có — bài học BL-045 T08: guard phải chặn cả staging, không chỉ production); không publish/đổi trạng thái tin.
3. **Chỉ điền ô trống** (mảng rỗng / null), không ghi đè giá trị admin đã nhập; idempotent (chạy lại không đổi gì).
4. Trích Dự án (VI là nguồn; EN chỉ điền chữ localized khi có cách hợp lý, không thì để trống và ghi báo cáo):
   - `productTypes`: từ khoá trong tên, danh mục, `summary`, `overview` (rich text → text), `priceTable[].unitType` (vd "căn hộ", "chung cư" → apartment; "liền kề", "nhà phố" → townhouse; "biệt thự" → villa; "shophouse"; "đất nền"; "nghỉ dưỡng"/"resort"; "condotel"; "văn phòng"/"officetel" → office).
   - `featuredAmenities`: từ khoá trong overview / `amenities[].name` / `nearbyAmenities` (nhóm education → near_school, healthcare → near_hospital, shopping → near_mall, transport + "metro" → near_metro; "view sông/hồ" → water_view; "hồ bơi"/"gym"/"spa" → pool_gym_spa; "công viên" → green_park).
   - `products`: mẫu "<số> <loại> (… m²)" trong overview (vd "96 biệt thự đơn lập (200–360 m²)"); không chắc → không điền, chỉ ghi gợi ý trong báo cáo.
5. Báo cáo Markdown `docs/reports/backfill-listing-fields-<YYYY-MM-DD>.md`: tổng quan (số tin quét / điền / bỏ qua), bảng tin · trường · giá trị điền · đoạn nguồn (cắt ngắn) · độ tin cậy; mục "cần admin soát". Dry-run cũng xuất báo cáo (ghi rõ chế độ).
6. Test đơn vị cho bộ trích (từ khoá → giá trị, không điền ô đã có, idempotent) + test guard.
7. Chạy thật trên DB worktree (dữ liệu dev sao chép / seed) để kiểm; **primary** chạy `--apply` trên DB dev chính sau khi merge (không chạy staging/prod).

## Acceptance
- [ ] Dry-run không ghi DB (test); `--apply` chỉ điền ô trống; chạy lại không đổi.
- [ ] Guard chặn production/staging (test).
- [ ] Báo cáo sinh đúng định dạng; không chứa dữ liệu nhạy cảm (chỉ tên tin + trường + đoạn nội dung công khai).
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.
