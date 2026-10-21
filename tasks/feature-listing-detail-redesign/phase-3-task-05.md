# feature-listing-detail-redesign · phase-3-task-05 — Script điền dữ liệu cũ (phần Tin BĐS)

- Nguồn: BL-052 change doc "Chế độ chạy" — trích từ tiêu đề/nội dung tin, chỉ điền ô trống, DB dev, báo cáo admin soát.
- Spec: 1.46.0 khối BL-052 mục "Điền dữ liệu cũ (script, dev only)".
- Plan: phase 3 wave B (song song P3-T02, P3-T04).
- Phụ thuộc: P3-T01, P1-T07 (script khung + guard).

## Classification / Risk
- Type: **ADDITIVE**.
- Risk: **HIGH** — bulk update (dev only).
- Expected review level: **STRICT**.
- Blast radius: script `backfill-listing-fields` (thêm collection `property-posts`), test, `docs/reports/`.

## Scope
1. `pnpm backfill:listing-fields --collection property-posts [--apply]` (mặc định chạy cả hai collection khi không truyền `--collection`). Guard / dry-run / chỉ điền ô trống / idempotent như P1-T07.
2. Trích từ `title` + `excerpt` + `content` (rich text → text), VI: `areaM2` ("85m2", "85 m²", "dt 85m"), `bedrooms` ("3PN", "3 phòng ngủ"), `bathrooms` ("2WC", "2 phòng tắm/vệ sinh"), `houseDirection` ("hướng Đông Nam" → SE…), `frontageM` ("mặt tiền 5m", "MT 5m"), `floors` ("4 tầng", "1 trệt 3 lầu" → 4), `propertyType` (từ khoá như P1-T07), `address` (dòng "Địa chỉ: …" nếu có). **Bỏ qua tin voucher/ưu đãi** (có `offer.endAt`/`voucherCode`). Giá trị mơ hồ (nhiều số khác nhau) → không điền, ghi "cần soát".
3. Báo cáo gộp cùng file ngày (`docs/reports/backfill-listing-fields-<ngày>.md`, mục Tin BĐS).
4. Test bộ trích (mẫu chuỗi thật trong dữ liệu dev), test bỏ qua voucher, idempotent.
5. **Primary** chạy `--apply` trên DB dev chính sau merge.

## Acceptance
- [ ] Dry-run không ghi; `--apply` chỉ điền ô trống; chạy lại không đổi; voucher bỏ qua.
- [ ] Báo cáo có mục Tin BĐS.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.
